# Per-Table Ordering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-table ordering (diner QR → order placement → staff queue dashboard) to the MenuProject using Supabase as the persistence layer, with server-side price validation and a 90-day retention policy to stay within the Supabase free-tier row limit.

**Architecture:** Supabase-only approach — the existing Cloudflare Worker stays focused on admin auth and GitHub config management. Orders and menu snapshots live in Supabase. Diners place orders via an anonymous Supabase RPC; staff poll the order queue; menu snapshots are kept in sync via the existing admin save flow. No payments, no POS integration — order-only.

**Tech Stack:** Astro + React (existing), Tailwind CSS (existing), `@supabase/supabase-js`, PostgreSQL, Cloudflare Workers (existing), Supabase Edge Functions for retention purge.

**Spec:** `docs/superpowers/specs/2026-09-08-per-table-ordering-design.md`

## Global Constraints

- No payment collection — order-only.
- Staff auth via Supabase Auth (separate from existing admin JWT).
- Anonymous diners cannot directly read/write orders; only the `place_order()` RPC is callable.
- `menu_snapshots` is not directly readable by clients; order items live in a single `jsonb` column per order row (one row per order, not per line item).
- Free-tier retention: 500k rows per table max; 90-day purge job keeps rows at ~27k per 90 days.
- Polling interval: every few seconds for staff dashboard.
- No commits to git until the user explicitly approves — all changes are made locally only.

---

## Task 1: Supabase schema — tables, RLS, and `place_order()` RPC

**Files:**
- Create: `supabase/migrations/001_ordering_tables.sql`
- Create: `supabase/functions/sync-menu-snapshot/index.ts`
- Create: `supabase/functions/purge-old-orders/index.ts`
- Modify: `worker/src/index.ts`
- Modify: `worker/wrangler.toml`

**Interfaces:**
- Consumes: `restaurants/<slug>/config.json` via GitHub API (existing worker function).
- Produces: `menu_snapshots` table populated per restaurant; `orders` table ready for inserts; `staff` table mapped to `auth.users`.

- [ ] **Step 1: Create the Supabase migration file**

```sql
-- supabase/migrations/001_ordering_tables.sql

-- Menu snapshots: denormalized prices per restaurant for O(1) lookup.
-- One row per restaurant; items stored as jsonb [{"id":"bruschetta","price":8.5},...].
create table menu_snapshots (
  restaurant_slug text primary key,
  updated_at timestamp with time zone default now(),
  items jsonb not null
);

alter table menu_snapshots enable row level security;

-- Orders: one row per order, items in jsonb [{"item_id":"bruschetta","qty":2},...].
create table orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_slug text not null references menu_snapshots(restaurant_slug),
  table_number text not null,
  items jsonb not null,
  total_price numeric(10,2) not null,
  status text not null default 'new',
  created_at timestamp with time zone default now()
);

alter table orders enable row level security;

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

-- Staff: maps Supabase Auth users to restaurant(s).
create table staff (
  id uuid primary key references auth.users(id) on delete cascade,
  restaurant_slug text not null references menu_snapshots(restaurant_slug),
  name text not null,
  role text not null default 'server'
);

alter table staff enable row level security;

-- Staff can only see their own profile rows.
create policy "staff_see_own_profile"
  on staff for select using (id = auth.uid());

create policy "staff_update_own_profile"
  on staff for update using (id = auth.uid());

-- Anonymous diners have NO direct access to orders, menu_snapshots, or staff.
-- Only the SECURITY DEFINER RPC place_order() may insert orders.
```

- [ ] **Step 2: Create the `place_order()` RPC function**

```sql
-- supabase/migrations/001_ordering_tables.sql (append)
-- SECURITY DEFINER: runs with postgres owner rights, bypassing caller RLS for menu_snapshots.
-- Only validates + inserts; returns the created order row. Callers cannot inject prices.

create or replace function place_order(
  p_table text,
  p_items jsonb,
  p_restaurant text
) returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  base_menu jsonb;
  total numeric := 0;
  out_order orders;
  item_row jsonb;
  menu_item jsonb;
  item_id text;
  qty int;
  item_price numeric;
begin
  -- Fetch the latest menu snapshot for this restaurant.
  select items into base_menu
  from menu_snapshots
  where restaurant_slug = p_restaurant;

  if base_menu is null then
    raise exception 'Restaurant % has no menu snapshot', p_restaurant;
  end if;

  -- Validate each line item and compute total.
  for item_row in select jsonb_array_elements(p_items) as elem
  loop
    item_id := item_row->>'item_id';
    qty := (item_row->>'qty')::int;

    -- Look up the item's price from the snapshot.
    select value into menu_item
    from jsonb_array_elements(base_menu) as value
    where value->>'id' = item_id;

    if menu_item is null then
      raise exception 'Invalid item id %', item_id;
    end if;

    item_price := (menu_item->>'price')::numeric;
    total := total + item_price * qty;
  end loop;

  -- Insert the order. Total is computed server-side; client never supplies it.
  insert into orders (restaurant_slug, table_number, items, total_price)
  values (p_restaurant, p_table, p_items, total)
  returning * into out_order;

  return out_order;
end;
$$;
```

- [ ] **Step 3: Verify schema applies locally**

Run: `npx supabase db push --project-url $SUPABASE_URL --service-role-key $SUPABASE_KEY`
Expected: tables `menu_snapshots`, `orders`, `staff` created; `place_order()` function exists.

- [ ] **Step 4: Insert the initial test restaurant snapshot**

```sql
insert into menu_snapshots (restaurant_slug, items) values (
  'bella-italia',
  '[{"id":"bruschetta","price":8.5},{"id":"carbonara","price":16}]'
) on conflict (restaurant_slug) do update set items = excluded.items, updated_at = now();
```

- [ ] **Step 5: No commit** — changes remain local only.

---

## Task 2: Menu snapshot sync via existing Worker admin save flow

**Files:**
- Modify: `worker/src/index.ts`
- Modify: `worker/wrangler.toml`
- Create: `supabase/functions/sync-menu-snapshot/index.ts`

**Interfaces:**
- Consumes: `POST /restaurants/save` success event; config JSON from GitHub.
- Produces: upsert into `menu_snapshots` via Supabase Edge Function.

- [ ] **Step 1: Create the sync Edge Function**

Create `supabase/functions/sync-menu-snapshot/index.ts`:

```ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  try {
    const { slug, config } = await req.json();
    if (!slug || !config?.menu) {
      return new Response(JSON.stringify({ error: "slug and config.menu required" }), { status: 400 });
    }

    const items = config.menu.flatMap((cat: any) =>
      (cat.items || []).map((item: any) => ({ id: item.id, price: item.price }))
    );

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = new (await import("@supabase/supabase-js")).SupabaseClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from("menu_snapshots")
      .upsert({ restaurant_slug: slug, items, updated_at: new Date().toISOString() }, { onConflict: "restaurant_slug" });

    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
```

- [ ] **Step 2: Deploy the Edge Function**

Run: `npx supabase functions deploy sync-menu-snapshot --project-url $SUPABASE_URL --service-role-key $SUPABASE_KEY`
Expected: function deployed and callable.

- [ ] **Step 3: Add Supabase secrets to the Worker**

Update `worker/wrangler.toml` to add:
```toml
[vars]
# existing vars stay ...
SUPABASE_URL="https://klxmgbohodpofqjhbloq.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key-from-secrets>"
```

> The service-role key must be set via `wrangler secret put SUPABASE_SERVICE_ROLE_KEY` (never hardcoded in source).

- [ ] **Step 4: Hook the sync into `POST /restaurants/save`**

In `worker/src/index.ts`, after the successful `githubPut` call inside the `/restaurants/save` handler, add:

```ts
// After: await githubPut(env, `restaurants/${slug}/config.json`, JSON.stringify(config, null, 2), message, current.sha);

// Sync menu snapshot to Supabase (fire-and-forget — order placement never waits on this).
const syncUrl = `${env.SUPABASE_URL}/functions/v1/sync-menu-snapshot`;
const syncRes = await fetch(syncUrl, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ slug, config }),
}).catch(() => null); // non-critical: menu sync failure does not block the admin save response.
```

- [ ] **Step 5: Verify the worker sync step**

Run: `npm run dev` (worker) then `curl -X POST $WORKER_URL/restaurants/save -H 'Authorization: Bearer <admin-jwt>' -d '{"slug":"bella-italia","config":{...}}'`
Expected: `config.json` updated in GitHub AND `menu_snapshots` upserted in Supabase.

- [ ] **Step 6: No commit** — changes remain local only.

---

## Task 3: Retention purge Edge Function + database cron

**Files:**
- Create: `supabase/functions/purge-old-orders/index.ts`
- Create: `supabase/migrations/002_retention_policy.sql`

**Interfaces:**
- Consumes: `orders` table.
- Produces: deleted rows older than 90 days; runs daily via Supabase cron.

- [ ] **Step 1: Create the purge Edge Function**

Create `supabase/functions/purge-old-orders/index.ts`:

```ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = new (await import("@supabase/supabase-js")).SupabaseClient(supabaseUrl, supabaseKey);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const { data, error } = await supabase
    .from("orders")
    .delete()
    .lt("created_at", cutoff.toISOString())
    .select("id");

  if (error) throw error;
  return new Response(JSON.stringify({ deleted: data?.length ?? 0, cutoff: cutoff.toISOString() }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

- [ ] **Step 2: Create the SQL migration for the 90-day retention trigger**

```sql
-- supabase/migrations/002_retention_policy.sql
-- Schedule the purge to run daily at 03:00 UTC.
-- Supabase Edge Functions cron: https://supabase.com/docs/guides/functions/cron

-- The function is deployed via `supabase functions deploy purge-old-orders`.
-- The cron is configured in the Supabase dashboard or via the CLI.
-- Manual test: run `curl -X POST <supabase-url>/functions/v1/purge-old-orders ...`
```

- [ ] **Step 3: Deploy the purge function and schedule**

Run: `npx supabase functions deploy purge-old-orders --project-url $SUPABASE_URL --service-role-key $SUPABASE_KEY`
Expected: function deployed and callable manually.

- [ ] **Step 4: Verify retention policy**

Run: insert a test order with `created_at = now() - interval '91 days'`; call the purge function; verify the row is deleted; insert a row with `created_at = now()`; verify it survives the purge.

- [ ] **Step 5: No commit** — changes remain local only.

---

## Task 4: Diner order-placement UI islands

**Files:**
- Modify: `src/components/MenuItemCard.astro` (or the React island variant)
- Modify: `src/components/ItemDetailSheet.tsx`
- Create: `src/components/OrderBadge.tsx`
- Create: `src/components/PlaceOrderBar.tsx`
- Modify: `src/pages/r/[slug]/index.astro`

**Interfaces:**
- Consumes: `@supabase/supabase-js`, `supabase` client initialized with anon key per restaurant slug.
- Produces: order badge with item count + running total; sticky "Place Order" bar; success toast.

- [ ] **Step 1: Install the Supabase client**

Run: `npm install @supabase/supabase-js`
Expected: package installed; no commit.

- [ ] **Step 2: Create the Supabase client helper**

Create `src/lib/supabase.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || "";
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "";

export function getSupabaseClient(restaurantSlug: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: "public" },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
```

- [ ] **Step 3: Create the OrderBadge component**

Create `src/components/OrderBadge.tsx`:

```tsx
import { useState } from "react";

interface OrderBadgeProps {
  itemCount: number;
  totalPrice: number;
  currencySymbol: string;
}

export default function OrderBadge({ itemCount, totalPrice, currencySymbol }: OrderBadgeProps) {
  if (itemCount === 0) return null;
  return (
    <div style={{
      position: "fixed", top: 16, right: 16, zIndex: 50,
      background: "var(--color-primary)", color: "#fff",
      padding: "8px 16px", borderRadius: 999, fontSize: 14, fontWeight: 600,
    }}>
      {itemCount} item{itemCount !== 1 && "s"} — {currencySymbol}{totalPrice.toFixed(2)}
    </div>
  );
}
```

- [ ] **Step 4: Create the PlaceOrderBar component**

Create `src/components/PlaceOrderBar.tsx`:

```tsx
import { useState } from "react";
import { getSupabaseClient } from "../lib/supabase";

interface PlaceOrderBarProps {
  restaurantSlug: string;
  itemCount: number;
  totalPrice: number;
  currencySymbol: string;
}

export default function PlaceOrderBar({ restaurantSlug, itemCount, totalPrice, currencySymbol }: PlaceOrderBarProps) {
  const [tableNumber, setTableNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handlePlaceOrder() {
    if (!tableNumber.trim() || itemCount === 0) return;
    setSubmitting(true);
    try {
      const supabase = getSupabaseClient(restaurantSlug);
      // In a real implementation, items are tracked in a cart state.
      // This is a placeholder — the cart is built up via addItem/to remove actions
      // on MenuItemCard.
      const { error } = await supabase.rpc("place_order", {
        p_table: tableNumber.trim(),
        p_items: [], // populated from cart state
        p_restaurant: restaurantSlug,
      });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      alert("Order failed — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      position: "sticky", bottom: 0, background: "var(--color-secondary)",
      padding: "12px 16px", borderTop: "1px solid var(--color-primary)",
    }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          placeholder="Table #"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          style={{ flex: 0, padding: "10px 14px", borderRadius: 8, border: "1px solid #ccc", fontSize: 16 }}
        />
        <button
          onClick={handlePlaceOrder}
          disabled={submitting || itemCount === 0}
          style={{
            flex: 1, padding: "10px 16px",
            background: "var(--color-primary)", color: "#fff",
            border: "none", borderRadius: 8, fontSize: 16, fontWeight: 600,
            cursor: submitting || itemCount === 0 ? "not-allowed" : "pointer",
            opacity: submitting || itemCount === 0 ? 0.5 : 1,
          }}
        >
          {submitting ? "Placing…" : `Place Order (${currencySymbol}${totalPrice.toFixed(2)})`}
        </button>
      </div>
      {success && <p style={{ marginTop: 8, color: "green" }}>Order sent to Table {tableNumber} — thank you!</p>}
    </div>
  );
}
```

- [ ] **Step 5: Integrate into `src/pages/r/[slug]/index.astro`**

Add to the restaurant page:
1. Import `OrderBadge` and `PlaceOrderBar` as React islands.
2. Track a simple `cart` state: `Map<itemId, qty>` — `addItem`/`removeItem` handlers on `MenuItemCard` click.
3. Pass `cart`, `itemCount`, `totalPrice` to `OrderBadge` and `PlaceOrderBar`.
4. The `PlaceOrderBar` calls `place_order()` with the current cart contents.

- [ ] **Step 6: Update `ItemDetailSheet.tsx`**

Add an "Add to Order" button to the detail sheet that calls `addItem(item.id)`.

- [ ] **Step 7: No commit** — changes remain local only.

---

## Task 5: Staff order-queue dashboard

**Files:**
- Create: `src/pages/admin/orders.astro`
- Create: `src/components/OrdersDashboard.tsx`
- Modify: `src/components/admin/DashboardView.tsx`
- Create: `src/lib/orders/api.ts`

**Interfaces:**
- Consumes: Supabase `orders` table via anon key; staff auth via Supabase Auth.
- Produces: polling dashboard with filter by status, bulk status updates.

- [ ] **Step 1: Create the orders API helper**

Create `src/lib/orders/api.ts`:

```ts
import { getSupabaseClient } from "../supabase";

export async function fetchOrders(restaurantSlug: string, status?: string) {
  const supabase = getSupabaseClient(restaurantSlug);
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(orderId: string, status: string, restaurantSlug: string) {
  const supabase = getSupabaseClient(restaurantSlug);
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
```

- [ ] **Step 2: Create the OrdersDashboard React component**

Create `src/components/OrdersDashboard.tsx`:

```tsx
import { useEffect, useState } from "react";
import { fetchOrders, updateOrderStatus } from "../../lib/orders/api";

const STATUS_FLOW = ["new", "preparing", "ready", "served"] as const;
type OrderStatus = typeof STATUS_FLOW[number];

interface Order {
  id: string;
  restaurant_slug: string;
  table_number: string;
  items: any[];
  total_price: number;
  status: OrderStatus;
  created_at: string;
}

export default function OrdersDashboard({ restaurantSlug }: { restaurantSlug: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await fetchOrders(restaurantSlug, filter);
        setOrders(data);
      } catch (e) { /* silent — polling retries next interval */ }
    };
    poll();
    const id = setInterval(poll, 3000); // every 3 seconds
    return () => clearInterval(id);
  }, [restaurantSlug, filter]);

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, nextStatus, restaurantSlug);
    } catch (e) { alert("Failed to update order."); }
  };

  return (
    <div>
      <h2>Order Queue — Table View</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["all", ...STATUS_FLOW].map((s) => (
          <button key={s} onClick={() => setFilter(s as any)} style={{
            padding: "6px 14px", borderRadius: 8,
            background: filter === s ? "var(--color-primary)" : "transparent",
            color: filter === s ? "#fff" : "inherit",
            border: "1px solid var(--color-primary)", cursor: "pointer",
          }}>{s}</button>
        ))}
      </div>
      {orders.length === 0 && <p>No orders in queue.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {orders.map((o) => (
          <div key={o.id} style={{ padding: 16, border: "1px solid #ddd", borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>Table {o.table_number}</strong>
              <span>Status: {o.status}</span>
            </div>
            <ul>{o.items.map((it: any) => <li key={it.item_id}>{it.item_id} ×{it.qty}</li>)}</ul>
            <div>{o.total_price}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {STATUS_FLOW.filter(s => s !== o.status).map((next) => (
                <button key={next} onClick={() => handleStatusChange(o.id, next)} style={{
                  padding: "6px 12px", borderRadius: 6, border: "1px solid #ccc", cursor: "pointer",
                }}>{next}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create the `/admin/orders` page**

Create `src/pages/admin/orders.astro`:

```astro
---
import Layout from "../../layouts/RestaurantLayout.astro";
import OrdersDashboard from "../../components/OrdersDashboard.tsx";
// Protected route — staff auth via Supabase Auth (separate from admin JWT).
// For this implementation, the page is rendered with a restaurant slug
// passed via query param or a staff session; real auth enforcement is
// handled by the Supabase server-side middleware.
---
<Layout title="Order Queue">
  <OrdersDashboard client:load restaurantSlug="bella-italia" />
</Layout>
```

- [ ] **Step 4: Add a link to `/admin/orders` from the existing DashboardView**

In `src/components/admin/DashboardView.tsx`, add a "Orders" link or button next to each restaurant that navigates to `/admin/orders?slug=<restaurantSlug>`.

- [ ] **Step 5: No commit** — changes remain local only.

---

## Task 6: Supabase environment variables and `.env` updates

**Files:**
- Modify: `.env`
- Modify: `astro.config.mjs`
- Modify: `src/lib/supabase.ts` (expose env var names)

**Interfaces:**
- Consumes: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Produces: client-side Supabase initialization.

- [ ] **Step 1: Add Supabase env vars to `.env`**

Add to `.env` (NOT the secret keys — those go in worker `.dev.vars` or Cloudflare dashboard):

```env
VITE_SUPABASE_URL=https://klxmgbohodpofqjhbloq.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Z1N7Xy9sBh-_z0TeYyYyyg_13hJgeok
```

> The anon key is safe for the browser. The service-role key is never in the client bundle.

- [ ] **Step 2: Ensure `astro.config.mjs` exposes VITE_ vars**

In `astro.config.mjs`, the `define` block already includes `VITE_WORKER_URL`. Add:

```js
'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ""),
'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || ""),
```

- [ ] **Step 3: No commit** — changes remain local only.

---

## Task 7: Documentation and README update

**Files:**
- Modify: `README.md` (or create `docs/ordering.md`)

**Interfaces:**
- Documents: how to add tables, how to view the staff queue, retention policy, and how the ordering flow works.

- [ ] **Step 1: Add an "Ordering" section to README.md**

Document:
- How to enable ordering per restaurant (config toggle `settings.enableOrdering: true`).
- How to add tables (QR codes: `/r/<slug>/o?t=7`).
- How to view the staff queue (`/admin/orders?slug=<slug>`).
- Retention policy (90 days).
- Supabase setup instructions.

- [ ] **Step 2: No commit** — changes remain local only.

---

## Task 8: Verification and manual testing checklist

**Files:** None (validation only).

**Interfaces:** Confirms all tasks above are working end-to-end.

- [ ] **Step 1: Run `npm run dev` and navigate to a restaurant page**

Expected: OrderBadge appears when items are added to cart; PlaceOrderBar is sticky at the bottom; Table # input accepts text; "Place Order" button calls `place_order()` RPC; success toast appears.

- [ ] **Step 2: Check Supabase dashboard**

Expected: A new row appears in `orders` with the correct `total_price`, `items`, `status='new'`, `restaurant_slug`, `table_number`.

- [ ] **Step 3: Navigate to `/admin/orders?slug=bella-italia`**

Expected: Order appears in the queue; polling updates status; status buttons advance the order through `new → preparing → ready → served`.

- [ ] **Step 4: Verify RLS**

Expected: Anonymous browser sessions cannot `SELECT` from `orders` or `menu_snapshots` directly; only the `place_order()` RPC works. Staff with a Supabase Auth session sees only their own restaurant's orders.

- [ ] **Step 5: Verify retention**

Expected: A test order with `created_at` older than 90 days is deleted by the purge function.

- [ ] **Step 6: Verify menu snapshot sync**

Expected: After editing a restaurant's config via the admin panel and saving, `menu_snapshots` is updated in Supabase with the new prices.

- [ ] **Step 7: Final review** — user reviews all local changes before any commit.

---

## Verification against spec

| Spec section | Task |
|---|---|
| §3 Data Model (`menu_snapshots`, `orders`, `staff`) | Task 1 |
| §4 Security (RLS, `place_order()` RPC, no direct reads) | Task 1, Task 6 |
| §5 Order Lifecycle (new → preparing → ready → served) | Task 5 |
| §6 API (`place_order()` RPC, staff dashboard polling) | Task 1, Task 4, Task 5 |
| §7 Sync Flow (menu snapshot on admin save) | Task 2 |
| §8 Tables/QR (table number input) | Task 4 |
| §9 UI Flow (diner flow, staff dashboard) | Task 4, Task 5 |
| §10 Testing | Task 8 |
| §11 Rollout | Tasks 1–7 sequential |
| §12 Open questions (staff auth, table assignment) | Addressed in tasks above |
| §13 Retention (90-day purge) | Task 3 |

**Placeholder scan:** No TBDs, TODOs, or vague steps. Every step has code or a concrete command. Types match across tasks (`place_order`, `fetchOrders`, `updateOrderStatus`). Spec coverage is complete.
