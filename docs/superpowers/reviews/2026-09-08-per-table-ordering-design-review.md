# Design Review: Per-Table Ordering Spec (2026-09-08)

**Reviewer:** Claude
**Scope:** `docs/superpowers/specs/2026-09-08-per-table-ordering-design.md` + `docs/superpowers/plans/2026-09-08-per-table-ordering-implementation.md`
**Verdict:** Sound overall architecture, but **keep the single shared `orders` table** (per-restaurant isolation via RLS, not separate tables), fix a handful of **security/parity bugs**, and make **three free-tier simplifications** that remove two Edge Functions entirely.

---

## 1. The Big Question: Per-Restaurant Separation

Your instinct — "per restaurant, everything separate for easy management" — is right about *isolation*, but the spec already gets isolation the cheap way. There are three possible interpretations; here's how each plays out on the free tier:

### Option A — One shared `orders` table, `restaurant_slug` column + RLS (the spec's approach) ✅ **Recommended**

- Isolation is enforced by RLS policies (`restaurant_slug in (select ... from staff where id = auth.uid())`). Staff physically cannot read another restaurant's orders, even with a hand-crafted query.
- "Easy management" comes from indexes + filtered queries, not table-per-tenant. A single `idx_orders_restaurant_status` makes "show me Bella Italia's new orders" an index-only lookup.
- **One row budget, one purge job, one migration** — the simplest free-tier footprint.

### Option B — Per-restaurant tables (`orders_bella_italia`, `orders_neon_burger`, …) ❌

- No capacity benefit: the free-tier constraint is **per-project database size**, not per-table. Ten small tables consume exactly the same bytes as one big table.
- Every new restaurant requires a DDL migration + new RLS policies + new purge jobs. The admin "create restaurant" flow would need DB provisioning — a new failure mode for zero gain.
- Breaks the row-count math, the purge function, and the dashboard query design all at once.
- Dynamic identifiers in table names are a classic multi-tenant anti-pattern (can't parameterize, can't index uniformly, ORM/PostgREST friction).

### Option C — Separate Supabase *projects* per restaurant ❌ (for now)

- This is the only variant that actually adds capacity: each free project gets its own 500MB DB + egress quota. Legitimate escape hatch **if** a single tenant outgrows the pool.
- But it multiplies management cost: N sets of keys, N auth user pools (staff accounts can't span projects), N dashboards, no cross-restaurant view for you as the platform owner.
- **Recommendation:** design the client so the Supabase URL/key are per-restaurant config values (already almost true — `getSupabaseClient(slug)`), so migrating one heavyweight tenant to its own project later is a config change, not a rewrite. Keep one project until a tenant actually hits limits.

**Bottom line:** the spec's data model is correct. "Per restaurant separation" is achieved with RLS + indexes, and the spec should state this explicitly as a design principle (§3) so future contributors don't "simplify" into option B.

---

## 2. Free-Tier Corrections & Simplifications (the big wins)

### 2.1 The row-limit premise is outdated — the real limit is **database size (500MB)**

Supabase retired hard per-table row caps; the free tier is constrained by **500MB database size** (plus 5GB egress, 50k MAU). The spec's §3 math (500k rows/table) is based on an old limit. This *helps* you:

- One order row ≈ 300–500 bytes (uuid + slug + small jsonb + numeric + timestamps). Even 500k orders ≈ ~200MB. At 300 orders/day, you're years from the limit; the 90-day purge makes it mathematically impossible to hit.
- **Keep the 90-day purge anyway** — it's cheap insurance and keeps the dashboard fast — but the spec can stop treating row count as a hard cliff.

### 2.2 Replace the purge Edge Function + external cron with **`pg_cron`** ✂️

The plan (Task 3) deploys an Edge Function *whose only job is a DELETE*, then needs an external scheduler to invoke it. Supabase has `pg_cron` built in and enabled in one line:

```sql
-- 003_retention_cron.sql
select cron.schedule(
  'purge-old-orders',          -- job name
  '0 3 * * *',                 -- daily 03:00 UTC
  $$delete from orders where created_at < now() - interval '90 days'$$
);
```

- Zero invocations, zero cold starts, zero code to deploy, no service-role key on a network-callable endpoint.
- One less thing to break silently. **Delete Task 3 entirely; ship one migration.**

### 2.3 Replace the `sync-menu-snapshot` Edge Function with a direct PostgREST call ✂️

Task 2's flow is Worker → Edge Function → Supabase DB — a network hop through a function that just does an upsert the Worker can do directly via PostgREST:

```ts
// In worker /restaurants/save, after githubPut succeeds:
const items = config.menu.flatMap((cat) =>
  (cat.items ?? []).map((i) => ({ id: i.id, price: i.price, available: i.available }))
);
await fetch(`${env.SUPABASE_URL}/rest/v1/menu_snapshots`, {
  method: 'POST', // PostgREST: POST with Prefer: resolution=merge-duplicates = upsert
  headers: {
    'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=minimal',
  },
  body: JSON.stringify({ restaurant_slug: slug, items, updated_at: new Date().toISOString() }),
}).catch(() => null); // still fire-and-forget
```

- Deletes an entire Edge Function, its deploy step, and its invocation cost (free tier: 500K function invocations/month — why spend them on an upsert?).
- Fewer secrets in fewer places (Edge Function no longer needs the service-role key; the Worker already has it).
- Also fixes a latent bug in the plan's Edge Function: it imports `@supabase/supabase-js` at runtime via `await import(...)` — that npm import doesn't resolve on Deno deploy without an esm.sh URL. Moot after this change.

### 2.4 Polling vs. Realtime — polling is fine, but document the choice

3-second polling from a handful of staff devices ≈ ~30–60k requests/day — well within limits. Supabase Realtime (postgres_changes) would give push updates for free and *less* load, but adds connection management and reconnection edge cases. **Verdict: ship polling (v1), note Realtime as the upgrade path.** One tweak: make the poll *adaptive* — back off to 10s when the queue is empty, drop to 3s when there are `new` orders. Saves egress and battery for near-zero code.

---

## 3. Correctness & Security Bugs (must-fix before implementation)

### 3.1 🔴 `place_order()` is not executable by diners — missing grant

RLS blocks table access, but Postgres grants `EXECUTE` on functions to `public` **by default** — the migration must override that explicitly so the security posture never depends on defaults:

```sql
revoke execute on function place_order(text, jsonb, text) from public, anon, authenticated;
grant execute on function place_order(text, jsonb, text) to anon;
```

Without this line the feature either doesn't work for diners or works for staff-only by accident. Add to migration 001.

### 3.2 🔴 Snapshot omits `available` — sold-out items remain orderable

`restaurant.schema.ts` gives every item `available: boolean` (and the spec §9 says "Disable ordering when `available: false`"), but the snapshot only stores `{id, price}`. If the diner page is a static build, a stale build could also show stale availability. Fix:

- Snapshot shape → `{id, price, available}` (see §2.3 code above).
- `place_order()` raises `'Item % is unavailable'` when `available` is false. Server-side enforcement matters because the *client* is the stale/trusted-less side.

### 3.3 🔴 Variants & modifiers are priced in the schema but not in the order pipeline

The config schema has `variants` (size price modifiers) and `modifiers` (add-ons), and `combos` with `comboPrice` — yet `place_order()` prices only the base item. Two options:

- **v1 (recommended):** snapshot stores variants too (`{id, price, available, variants:[{id, priceModifier}]}`), RPC accepts optional `variant_id`/`modifier_ids` per line, and the diner UI only surfaces them when the snapshot includes them.
- Or explicitly **out of scope**: the RPC should then *reject* any payload containing variant/modifier fields, so a crafted request can't smuggle a $50 "modifier" that was never priced.

Silent acceptance of unpriced fields is a price-integrity hole; pick one of the two.

### 3.4 🟠 Input validation in the RPC is missing

Anonymous endpoint = spam target. Add inside `place_order()` before the loop:

```sql
if p_items is null or jsonb_typeof(p_items) <> 'array'
   or jsonb_array_length(p_items) = 0
   or jsonb_array_length(p_items) > 50 then
  raise exception 'items must be a non-empty array of at most 50 lines';
end if;
```

And per line: `qty between 1 and 20`, `item_id` length ≤ 100. A per-(restaurant,table) rate check (e.g., reject if >10 orders from same table in last 2 minutes) is a cheap second layer against QR-prank floods.

### 3.5 🟠 UPDATE policy needs `with check` + status constraint

- The update policy has `using (...)` but no `with check`. For status-only updates on rows you already can see it's equivalent today, but be explicit: add `with check (same subquery)`.
- Add `alter table orders add constraint orders_status_check check (status in ('new','preparing','ready','served'));` — free integrity, protects the dashboard filter UI from typos.
- Consider a trigger or CHECK-based state machine (`new→preparing→ready→served`, monotonic). Cheap, prevents accidental status regression from a double-tap.

### 3.6 🟠 Missing indexes (dashboard + purge performance)

```sql
create index idx_orders_restaurant_status on orders (restaurant_slug, status, created_at desc);
create index idx_orders_created_at on orders (created_at);
```

Without the first, every dashboard poll is a sequential scan once orders grow; without the second, the daily purge scans the whole table.

### 3.7 🟡 Spec's pseudo-code vs. plan's SQL disagree

The spec §6 pseudo-implementation has a broken price lookup (`base_menu->0->?('id', ...)` — invalid) and no `set search_path`. The plan's Task 1 Step 2 version is correct (proper loop + `set search_path = public`). **Update the spec to match the plan** — specs get read first, and a copy-paste of the spec's version would be a security-definer function without a pinned search path (a known privilege-escalation footgun).

### 3.8 🟡 Snapshot sync is fire-and-forget → silent price drift

`.catch(() => null)` means a failed sync leaves orders being priced against the *old* menu while diners see the *new* one. Mitigations (pick ≥1):

- Worker returns `snapshotSynced: false` in the save response so the admin UI shows a "prices not synced, retry" warning (with a manual re-sync button).
- Store the price basis with the order: add `menu_snapshot_at timestamptz` (or snapshot `updated_at`) to each order row. Disputes ("I ordered at the old price!") become provable.
- Diner UX: client computes the expected total from the static config; if RPC's returned `total_price` differs by more than the snapshot tolerance, show "Prices were updated — here's your final total" instead of the client's number. The RPC already returns the order row; use it.

### 3.9 🟡 Dashboard page has no real auth gate

`/admin/orders.astro` renders `OrdersDashboard` with a hard-coded slug; RLS protects the *data*, but the page shell leaks to anyone with the URL, and the hard-coded slug is a footgun. Minimum v1: a small auth island — `supabase.auth.getSession()` on mount, redirect to a login form if absent, and derive `restaurantSlug` from the `staff` row after login (don't trust `?slug=`). The staff RLS policies make wrong-slug reads return empty, which is the correct failure mode.

### 3.10 🟡 `.env` exposure in plan Task 6

The plan hardcodes a real project URL + publishable key in the doc. Publishable keys are safe by design, but project URLs don't belong in committed docs — reference `.env.example` placeholders instead.

---

## 4. Smaller Notes

- **`getSupabaseClient(slug)` ignores its argument** (plan Task 4 Step 2) — fine for now (single project), but rename to `getSupabaseClient()` or keep the param and make it select per-tenant config later (this is the hook that makes Option C in §1 cheap).
- **Cart is a stub** — `p_items: []` placeholder in `PlaceOrderBar` means Tasks 4 and 5 can't be verified end-to-end without the cart state landed first. Reorder: cart state (small `useState<Map>` in a context/island) should be its own step *before* PlaceOrderBar.
- **`staff.restaurant_slug` single-valued** — fine for v1; when multi-store staff is needed, change to a `staff_restaurants` join table (composite PK). Note it in the spec so the migration isn't surprising.
- **Order id returned to diner** — show the last 4 chars as a "order code" in the success toast so staff and diner can match up ("Order #A3F2 ready for table 7").
- **`numeric(10,2)` + JS floats** — fine at these magnitudes, but compute the client-side *display* total the same way the DB does (sum of `price * qty`, rounded at the end) so displayed vs. charged never differ by a cent.
- **Realtime alternative noted** in §2.4 — no action needed in v1.

---

## 5. Revised Plan Summary (what changes vs. current plan)

| Current plan | Change | Why |
|---|---|---|
| Task 1: 3 tables + RPC | Keep, **add**: grants (3.1), `available` in snapshot/RPC (3.2), input caps (3.4), `with check` + status CHECK + indexes (3.5–3.6) | Correctness/security |
| Task 2: sync Edge Function + Worker hook | **Replace** with direct PostgREST upsert from Worker; delete `sync-menu-snapshot/` | One less Edge Function; fixes Deno import bug |
| Task 3: purge Edge Function + cron | **Replace** with single `pg_cron.schedule` migration; delete `purge-old-orders/` | Zero infra, zero invocations |
| Task 4: diner UI | Split cart state into its own step before `PlaceOrderBar`; wire variant/modifier policy (3.3) | Verifiability, price parity |
| Task 5: staff dashboard | Add real session gate + slug from `staff` row (3.9); adaptive poll interval (2.4) | Don't leak shell; sanity |
| Task 6: env vars | Replace hardcoded keys with `.env.example` placeholders (3.10) | Hygiene |
| New: spec update | Sync §3/§6 of spec to corrected SQL; state "single shared table + RLS = per-restaurant isolation" as a design principle; fix row-limit framing (2.1) | Docs match reality |

**Net infra delta:** 2 Edge Functions deleted, ~30 lines of SQL added, same feature set — strictly better for the free tier.