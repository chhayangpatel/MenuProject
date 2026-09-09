# Design: Per-Table Ordering with Staff Dashboard

**Owner:** Claude Code  
**Status:** Draft v1  
**Written:** 2026-09-08  
**Related PRs:** #pending  

---

## 1. Context

The MenuProject is an Astro static-site (GitHub Pages / Cloudflare Pages) serving multi-tenant restaurant menus. A Cloudflare Worker currently handles admin authentication and proxies restaurant config files to/from GitHub. Supabase credentials exist but are unused.

This spec adds:
- Diner-per-table ordering (via QR code)
- Staff-visible live order queue dashboard
- Price integrity via database, not client trust

---

## 2. Architectural Overview

```
┌────────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Diner (table QR)  │────▶│ Supabase RPC  │────▶│   PostgreSQL    │
│  Browser (anon)    │     │ place_order() │     │   orders        │
└────────────────────┘     └─────────────────┘     └────────┬────────┘
                                                           │
                                                           │ 10k rows/day → 90-day purge mandatory
                                          ┌────────────────┴────────────────┐
                                          │                               │
                                          ▼                               ▼
                           ┌───────────────────────┐    ┌───────────────────────┐
                           │ Restaurants Dashboard │    │     — Archive         │
                           │ (poll every few sec)  │    │       — Purge         │
                           └───────────────────────┘    └───────────────────────┘
```

### Key Decision: Supabase + Sync Worker

- Workers stay focused on admin auth + GitHub file management (their current purpose)
- Orders and snapshots use the same Supabase DB
- Menu snapshot sync happens as part of the existing admin save flow (no new API surface)

---

## 3. Data Model

### Tables

```sql
-- Menu snapshots per restaurant (sync target for prices)
CREATE TABLE menu_snapshots (
  restaurant_slug text PRIMARY KEY,
  updated_at timestamp with time zone DEFAULT now(),
  -- Denormalized for O(1) price lookup by item_id
  items jsonb NOT NULL  -- [{"id":"bruschetta","price":8.5},...]
);

-- Orders (row budget: high volume)
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_slug text NOT NULL REFERENCES menu_snapshots(restaurant_slug),
  table_number text NOT NULL,
  items jsonb NOT NULL,      -- [{"item_id":"bruschetta","qty":2},...]
  total_price numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'new', -- new | preparing | ready | served
  created_at timestamp with time zone DEFAULT now()
);

-- Staff profiles. Identity lives in Supabase Auth (auth.users);
-- this table maps an authenticated user to the restaurant(s) they serve.
CREATE TABLE staff (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_slug text NOT NULL REFERENCES menu_snapshots(restaurant_slug),
  name text NOT NULL,
  role text NOT NULL DEFAULT 'server' -- server | kitchen | manager
);
```

### Row Budget & Retention Policy

Order items are stored in a single `jsonb` column on each `orders` row — **one database row per order, not per line item**. This keeps the row footprint tiny.

| Entity            | Avg/day | 30 days | 90 days |
|-------------------|---------|---------|---------|
| orders (10 restaurants × 30 orders/day) | ~300 rows | 9k | 27k |
| menu_snapshots    | 1/day   | 30      | 90      |
| staff              | ~0.5/day | 15     | 45      |

**Supabase free-tier limit: 500,000 rows per table** ([platform limits](https://supabase.com/docs/reference/platform-limits)).

**Strategy:** A 90-day retention job (`DELETE FROM orders WHERE created_at < now() - interval '90 days'`) runs daily via Supabase Edge Function cron. At 27k rows / 90 days this is ~5% of the 500k cap, leaving generous headroom even if a restaurant scales to peak volume. Retention also keeps dashboard queries fast and room-aware.

---

## 4. Security Model

### Authentication

| Actor | Method | Token |
|-------|--------|-------|
| Diner | Anonymous | `SUPABASE_ANON_KEY` in client |
| Staff | Email + password via Supabase Auth (separate from admin) | JWT from `supabase.auth.signIn()`; RLS policy reads `request.jwt()->> 'email'` to map to `staff` table |
| Admin | JWT via existing worker | Admin-only dashboard (future) |

### Row Level Security (RLS)

```sql
-- Orders isolation: a staff user sees only their own restaurant's orders.
-- auth.uid() is the JWT 'sub' claim from Supabase Auth; the staff table maps
-- that user to one or more restaurant_slugs.
create policy "staff_can_see_own_restaurant_orders"
  on orders for select using (
    restaurant_slug in (
      select restaurant_slug from staff where id = auth.uid()
    )
  );

create policy "staff_can_update_own_restaurant_orders"
  on orders for update using (
    restaurant_slug in (
      select restaurant_slug from staff where id = auth.uid()
    )
  );

-- Anonymous diners have no SELECT/UPDATE/INSERT/DELETE rights on orders or
-- menu_snapshots. They can ONLY invoke the SECURITY DEFINER RPC (see §6).
-- menu_snapshots is not directly readable by clients at all; the staff
-- dashboard reads orders, not snapshots.
```

Anonymous diners cannot `SELECT`, `INSERT`, `UPDATE`, or `DELETE` directly; they can only call the `place_order()` RPC. Because the RPC is `SECURITY DEFINER`, it reads `menu_snapshots` and validates prices with the function owner (postgres) rights, regardless of caller RLS, then inserts the order. Callers never receive menu snapshot data back — only the created order row (and that response shape is fixed by the function signature, not arbitrary RLS reads).

---

## 5. Order Lifecycle

| Stage   | Trigger                     | Action                                   |
|---------|-----------------------------|------------------------------------------|
| new     | `place_order()` succeeds    | Row created with status='new'            |
| preparing | Staff clicks "Mark Preparing" | UPDATE status='preparing'               |
| ready     | Staff clicks "Mark Ready"   | UPDATE status='ready'                   |
| served  | Staff clicks "Mark Served"  | UPDATE status='served'                  |
| archived| Cron job (90-day retention)| DELETE                                |

---

## 6. API + Client Integration

### Supabase RPC: `place_order(table_number, items, restaurant_slug)`

Pseudo-implementation:

```js
const { data, error } = await supabase.rpc('place_order', {
  p_table: '7',
  p_items: [{ item_id: 'bruschetta', qty: 2 }],
  p_restaurant: 'bella-italia'
});
```

Server-side PostgreSQL function:

```sql
create or replace function place_order(
  p_table text,
  p_items jsonb,
  p_restaurant text
) returns orders as $$
declare
  base_menu jsonb := (select items from menu_snapshots where restaurant_slug = p_restaurant);
  total numeric := 0;
  out_order orders;
begin
  for item in select jsonb_array_elements(p_items) as itm loop
    -- price lookup & validation
    declare
      menu_item jsonb := base_menu->0->?('id', (item->>'item_id'));
    begin
      if menu_item is null then
        raise exception 'Invalid item %', item->>'item_id';
      end if;
      total := total + (menu_item->>'price')::numeric * (item->>'qty')::int;
    end;
  end loop;

  insert into orders (restaurant_slug, table_number, items, total_price)
  values (p_restaurant, p_table, p_items, total)
  returning * into out_order;

  return out_order;
end;
$$ language plpgsql security definer;
```

The `security definer` context makes `menu_snapshots` visible regardless of caller RLS, but the RETURN ROWTYPE restricts what the RPC can output.

### Diner Frontend

- Add `addItem(item_id, qty)` + `placeOrder(tableNumber)` to menu page
- Use Supabase-js `@supabase/supabase-js` with anon key
- Disable ordering when `available: false` in config

### Staff Dashboard Frontend

- Poll `orders` where `restaurant_slug = 'current'` (filter in RLS context)
- 2–3 second interval (well within free tier 500K request/day limit)
- Bulk actions: select multiple orders → "Mark Ready"

---

## 7. Sync Flow: Menu Snapshots

The existing admin save endpoint (`POST /restaurants/save`) updates `restaurants/<slug>/config.json` via GitHub API. We add a step:

1. After successful save → Worker calls Supabase Edge Function `sync_menu_snapshot`
2. Edge Function fetches the saved config from GitHub (or receives it from Worker body) and upserts into `menu_snapshots`
3. Runs on every config change → price integrity always fresh

This keeps the single source of truth (GitHub) and pushes updates to the order system automatically.

---

## 8. Tables & Facilities (Free Tier Focus)

| Facility    | Implementation                              | Row cost per order |
|-------------|---------------------------------------------|-------------------|
| Tables      | Diner enters table number on order screen   | 1 int/row         |
| Dashboard   | Staff login (localhost password)            | No extra rows     |
| QR per table| Single QR per table links to `/r/<slug>/o`  | URL param `?t=7`  |

If multi-table is needed later, extend `table_number` to include named tables.

---

## 9. UI Flow

### Diner Flow (per restaurant page)

1. Open menu (read-only, `showPrices: true`)
2. Tap an item → opens bottom sheet `ItemDetailSheet.tsx`
3. “Add to Order” button increments counter
4. Order badge (top right) shows item count + running total
5. Sticky “Place Order” bar at bottom
6. Success toast: “Order sent to Table 7 — thank you!”

### Staff Dashboard (new route: `/admin/orders`)

- Protected by staff login (future: extend worker auth)
- Filter: `New | Preparing | Ready | Served | All`
- Card per order: table, items, total, status button
- Empty state illustration when no orders

---

## 10. Testing Strategy

| Test Type | Scope | Notes |
|-----------|-------|-------|
| Unit | `place_order()` RPC | Mock `menu_snapshots` lookup |
| Integration | Client → RPC → DB | Use Supabase test project |
| E2E (Cypress/Puppeteer) | Order submit → dashboard update | Poll loop verification |

---

## 11. Rollout Plan

1. Create `menu_snapshots`, `orders`, `staff` tables in Supabase
2. Deploy `place_order()` RPC + enable RLS
3. Add client code for order placement (menu page)
4. Build staff dashboard (next iteration)
5. Add 90-day retention purge Edge Function
6. Update README: “Adding tables & ordering”

---

## 12. Open Questions (pre-implementation)

1. Should the diner’s table number be pre-assigned (QR per table) or entered?  
   **Answer:** Entered at order time (cheaper, less friction).

2. Should the system reject orders when > X concurrent items?  
   **Answer:** No — Supabase free tier row budget is the limit; if needed, implement in RPC.

3. Need staff login auth?  
   **Answer:** Yes — via Supabase Auth (email + password) + a `staff` table keyed by `auth.users.id` → `restaurant_slug`. The existing Worker admin JWT stays for platform-owner config management; staff use the separate Supabase Auth flow for the order queue. This gives staff login, invite, and password-reset for free via Supabase.

---

## 13. Migration Notes

No data migration needed — this is new functionality.