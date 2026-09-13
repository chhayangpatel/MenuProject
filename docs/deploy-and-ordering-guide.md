# Deploy + Ordering Guide (Cloudflare / GitHub Pages)

## 1. Build & deploy (automatic on push to main)

Your repo is linked to Cloudflare Pages (`digitalmenus`). Push to `main` triggers the build.

```bash
npm ci
npm run build        # Astro static → dist/
# Auto-deploy via GitHub → Cloudflare Pages connection
```

If deploying manually to Cloudflare Pages:
```bash
npm run deploy:pages # wrangler pages deploy dist --project-name digitalmenus
```

GitHub Pages fallback (`astro.config.mjs` sets `base=/MenuProject`): build and push to `gh-pages` branch.

---

## 2. Required env / secrets

**Client (build vars / .env)** — baked into bundle, safe to expose:
- `VITE_SUPABASE_URL` (e.g., `https://klxmgbohodpofqjhbloq.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` (anon public key from Supabase API page)
- `VITE_WORKER_URL` (`https://menu-admin.your-subdomain.workers.dev` for prod; `http://localhost:8787` for dev)

Set these in **Cloudflare dashboard → Pages → digitalmenus → Settings → Build → Variables** (or `.env` locally).

**Worker secrets** — only in `wrangler secret put`, NEVER in `.env` or repo:
```bash
wrangler secret put GITHUB_TOKEN        # repo scope
wrangler secret put ADMIN_PASSWORD_HASH # SHA-256 of admin password
wrangler secret put JWT_SECRET          # random HMAC secret
wrangler secret put SUPABASE_SERVICE_ROLE_KEY  # <-- the key from Supabase Secret keys
wrangler secret put REPO_OWNER
wrangler secret put REPO_NAME
```

Also in `worker/wrangler.toml` [vars] (non-secret):
```toml
ALLOWED_ORIGIN = "https://chhayangpatel.github.io,https://digitalmenus.pages.dev"
SUPABASE_URL = "https://klxmgbohodpofqjhbloq.supabase.co"
```

---

## 3. New ordering feature — Supabase setup

Apply migrations in order (Supabase Dashboard → SQL Editor):
1. `supabase/migrations/001_ordering_tables.sql` — `menu_snapshots`, `orders`, `staff`, `place_order()` RPC, RLS policies
2. `supabase/migrations/002_retention_cron.sql` — 90-day purge via `pg_cron`
3. `supabase/migrations/003_master_admin.sql` — master admin role (`role = 'admin'`)

Enable `pg_cron` extension first: Dashboard → Database → Extensions → `pg_cron`.

Seed test data (optional): `supabase/seed.sql` (run after 001).

---

## 4. Enabling ordering for a restaurant

In `restaurants/<slug>/config.json`:
```json
"settings": { "enableOrdering": true, "currency": "USD", ... }
```

Then **save via Admin panel** — the Worker calls `syncMenuSnapshot()` which writes the `menu_snapshots` row (price truth for the RPC).

**Without this step, `place_order()` raises "not accepting orders"** even if `enableOrdering` is true.

---

## 5. Staff account setup

1. Supabase Dashboard → Authentication → Users → Add user (email must have real TLD, not `.test`)
2. Insert staff row in SQL Editor:
```sql
insert into staff (id, restaurant_slug, name, role)
values ('<auth-user-uuid>', 'bella-italia', 'Maria', 'server');
```
3. Staff signs in at `/admin/orders` — dashboard resolves restaurant from `staff` RLS (never trusts `?slug=`).

---

## 6. Table QR codes

Generate per table (table number fills from URL `?t=7`):
```bash
npx qrcode -o table-7.svg "https://digitalmenus.pages.dev/r/bella-italia/?t=7"
```

---

## 7. Security model (quick reference)

- Diners: `getAnonClient()`, `persistSession: false` (prevents staff session collision). Only `place_order()` RPC granted to `anon`; never reads tables directly.
- Prices / availability: computed server-side from `menu_snapshots`; static page can be stale, but total is always accurate.
- Staff: `getSupabaseClient()`, RLS `staff_can_see_own_restaurant_orders` scopes to their row.
- Master admin: `role = 'admin'` sees/updates all restaurants (`master_admin_*` policies).
- 90-day retention: `pg_cron` deletes old orders automatically; keeps free tier well under 500k rows.
