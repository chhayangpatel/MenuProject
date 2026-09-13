# Per-Table Ordering

Diners scan a table QR code, add items to an order, and the kitchen/staff see the order live in a queue. **Order-only** — no payment collection.

## How it works

```
Diner                                Staff
──────                               ─────
Scan table QR → /r/<slug>/?t=7
Tap item → "Add to Order"
Cart badge → checkout sheet
"Place order" → place_order()
  (Supabase RPC: server-side          /admin/orders → staff sign-in
   price validation against           → live queue (3s polling)
   menu_snapshots)                    → new → preparing → ready → served
```

## Setup

1. **Supabase project** — create one at [supabase.com](https://supabase.com), then apply the migrations in order (SQL editor or `supabase db push`):
   - `supabase/migrations/001_ordering_tables.sql` — `menu_snapshots`, `orders`, `staff` tables, RLS policies, and the `place_order()` RPC (SECURITY DEFINER; prices are computed server-side, clients can never inject a total).
   - `supabase/migrations/002_retention_cron.sql` — 90-day retention purge via `pg_cron` (enable the extension first: Dashboard → Database → Extensions). Keeps the free tier comfortably under the 500k row limit.
2. **Create a menu snapshot + staff user** — the snapshot is created automatically the next time you save the restaurant in the admin panel (the Worker upserts prices into `menu_snapshots`). For staff:
   1. Add a user in Supabase Dashboard → Authentication → Users. (Email must use a valid TLD — Supabase Auth rejects reserved ones like `.test`.)
   2. Insert their staff row:
      ```sql
      insert into staff (id, restaurant_slug, name, role)
      values ('<auth-user-uuid>', 'bella-italia', 'Maria', 'server');
      ```
3. **Environment variables**
   - Client (safe, baked into the bundle): `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` — set in `.env` for dev, and as build variables in Cloudflare/GitHub CI.
   - Worker (secret): `wrangler secret put SUPABASE_SERVICE_ROLE_KEY` — enables menu-snapshot sync on every admin config save. `SUPABASE_URL` is already in `worker/wrangler.toml [vars]`.

## Enable ordering for a restaurant

Set in `restaurants/<slug>/config.json`:

```json
"settings": { "enableOrdering": true }
```

Orders can only be placed once a `menu_snapshots` row exists (created automatically on the next admin save).

## Tables & QR codes

The table number is pre-filled from the QR URL: `https://<site>/r/<slug>/?t=7` places the order at table 7. Generate a QR per table with:

```bash
npx qrcode -o table-7.svg "https://<site>/r/<slug>/?t=7"
```

## Staff queue

Route: `/admin/orders` (also linked as **Orders** on each admin dashboard card). Staff sign in with their Supabase Auth account; the dashboard resolves their restaurant from the `staff` row — the `?slug=` query param is never trusted. RLS ensures a restaurant only ever sees its own orders.

## Security model

- Anonymous diners have **no direct table access** — only the `place_order()` RPC (granted to `anon` only).
- Item prices, availability (sold-out), and the total are computed **server-side** from the latest snapshot; the diner page may be a stale static build, but pricing can't drift.
- Staff see/update only their own restaurant's orders (RLS).
- 90-day retention keeps row counts tiny (~27k/90 days), well inside the free tier.
