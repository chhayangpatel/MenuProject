# Cloudflare Setup — Pages Site + Admin Worker

The project deploys to **two places simultaneously**:

| Target | What | URL | Trigger |
|---|---|---|---|
| GitHub Pages | The static menu site | `https://chhayangpatel.github.io/MenuProject/` | push to `main` (`.github/workflows/deploy.yml`) |
| Cloudflare Pages | The same static site, served from the root | `https://digitalmenus.pages.dev/` | push to `main` (Cloudflare Pages CI) |
| Cloudflare Workers | `menu-admin` API worker | `https://menu-admin.chhayang-jenkins.workers.dev` | manual (`cd worker && npx wrangler deploy`) |

Both site deployments share the same `dist/` build output. GitHub Pages serves it under `/MenuProject`; Cloudflare Pages serves it under `/`. The build auto-detects which one is running (see [Build configuration](#build-configuration)).

> **Status (verified):** both deployments are live — GitHub Pages at the `/MenuProject` path and Cloudflare Pages at `https://digitalmenus.pages.dev` with root-relative assets and the admin panel wired to the production worker.

---

## 1. Cloudflare resources

| Resource | Name | Where configured |
|---|---|---|
| Pages project | `digitalmenus` | Cloudflare dashboard → Workers & Pages → `digitalmenus` |
| Worker | `menu-admin` | `worker/wrangler.toml` + dashboard secrets |
| API token | custom token with Pages Edit | https://dash.cloudflare.com/profile/api-tokens |

Account ID: `12241568cc83ebb1b0769d580a8fa9f2`

### How the `pages.dev` URL is assigned

The `pages.dev` subdomain is **not** always just the project name. When a Pages project is created, Cloudflare assigns `<project-name>.pages.dev` **if that subdomain is still globally available**; otherwise it appends a short random suffix (e.g. `menuproject-1mg.pages.dev` — an earlier project of ours, now retired). The suffix, when assigned:

- is chosen by Cloudflare at **project creation time** and cannot be chosen or changed,
- is permanent for the life of the project,
- does not affect custom domains — attaching `menus.yourdomain.com` later gives a clean URL.

`digitalmenus.pages.dev` was available, so the project got the clean name. An older project `menuproject` (served at `menuproject-1mg.pages.dev`) exists from initial setup and can be deleted in the dashboard.

---

## 2. Config files in the repo

### Root `wrangler.toml` (Pages project)

```toml
name = "digitalmenus"
compatibility_date = "2025-01-01"
pages_build_output_dir = "./dist"
```

- This file is the source of truth for the Pages project name and build output.
- **Do NOT add an `[assets]` binding named `ASSETS`** — it conflicts with the reserved Pages binding.
- **Do NOT add a `main` entry-point** — this is a static site, not a Worker.

### `worker/wrangler.toml` (Admin worker)

```toml
name = "menu-admin"
main = "src/index.ts"
compatibility_date = "2025-01-01"
keep_vars = true

[vars]
ALLOWED_ORIGIN = "https://chhayangpatel.github.io,https://digitalmenus.pages.dev"
```

- `ALLOWED_ORIGIN` is a comma-separated CORS allowlist. **When you add a new deployment origin (e.g. a custom domain), add it here and redeploy the worker.**
- Secrets are set via `wrangler secret put` (never in the file): `GITHUB_TOKEN`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET`, plus `REPO_OWNER` / `REPO_NAME` if not declared as vars.

### `package.json` scripts

| Script | Command |
|---|---|
| `npm run deploy:pages` | `wrangler pages deploy dist --project-name digitalmenus` |
| Worker deploy | `cd worker && npx wrangler deploy` |

Local **production** deploy (build with the Cloudflare environment, then publish to `main`). `VITE_WORKER_URL` must be passed explicitly — local `.env` points at `localhost:8787` for dev, and a Cloudflare build without the variable fails loudly by design:

```powershell
$env:CI = '1'
$env:VITE_WORKER_URL = 'https://menu-admin.chhayang-jenkins.workers.dev'
npm run build
npx wrangler pages deploy dist --project-name digitalmenus --branch main
```

---

## 3. Build configuration (auto-detection)

`astro.config.mjs` detects the build environment automatically:

| Environment | `base` | `site` | Set by |
|---|---|---|---|
| Local dev / GitHub Pages | `/MenuProject` | `https://chhayangpatel.github.io/MenuProject/` | defaults |
| Cloudflare build (classic Pages or unified Workers Builds) | `/` | `CF_PAGES_URL` or `https://digitalmenus.pages.dev/` | auto-detected |
| Any explicit override | `SITE_BASE` | `SITE_URL` | env var (highest priority) |

**How detection works:** classic Pages CI sets `CF_PAGES=1`/`CF_PAGES_URL`, but the newer unified **Workers Builds** system sets neither. Both run with `CI=true` and without `GITHUB_ACTIONS=true` (which only GitHub Actions sets), so `astro.config.mjs` treats `CI && !GITHUB_ACTIONS` as a Cloudflare build. No `SITE_BASE`/`SITE_URL` variables are needed in the dashboard.

> **Caution:** do not set `SITE_BASE`/`SITE_URL` as **local Windows user environment variables** — they silently override the defaults in every local build and make it impossible to verify the GitHub Pages output locally. Keep them only in CI dashboards if ever needed.

### Required environment variables on the Pages project

Dashboard → Workers & Pages → `digitalmenus` → **Settings → Build → Variables** (build variables — available to the build command):

| Variable | Value | Purpose |
|---|---|---|
| `VITE_WORKER_URL` | `https://menu-admin.chhayang-jenkins.workers.dev` | Baked into the client bundle so the admin panel can reach the API. **Must be a Build variable**, not a runtime binding — the site is static, runtime variables do nothing. If missing, the build fails with an explicit error. |
| `CLOUDFLARE_API_TOKEN` | token with `Cloudflare Pages → Edit` | Only needed because a custom deploy command is used (see §5). Delete it if you switch to an empty deploy command. |

**Do NOT set** `SITE_BASE` / `SITE_URL` here — auto-detection (above) handles them, and stale values silently override it.

### Variables & secrets on the Worker `menu-admin`

**Plain var** — declared in `worker/wrangler.toml` (source of truth; no dashboard action needed):
| Variable | Value |
|---|---|
| `ALLOWED_ORIGIN` | `https://chhayangpatel.github.io,https://digitalmenus.pages.dev` |

**Secrets** — set once via `npx wrangler secret put <NAME>` (run inside `worker/`); never in files or plain dashboard vars:
| Secret | What it is |
|---|---|
| `GITHUB_TOKEN` | GitHub PAT with `repo` scope — the worker commits config changes to the repo |
| `ADMIN_PASSWORD_HASH` | SHA-256 hex of the admin password |
| `JWT_SECRET` | Random string for HMAC token signing |

**Optional** (only if not provided another way — check the worker's dashboard Variables & Secrets):
| Variable | Purpose |
|---|---|
| `REPO_OWNER` | GitHub username the worker commits to (`chhayangpatel`) |
| `REPO_NAME` | Repo name (`MenuProject`) |

---

## 4. Pages build & deploy settings

Dashboard → Workers & Pages → `digitalmenus` → **Settings → Build**:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Deploy command | `npx wrangler pages deploy dist --project-name digitalmenus --branch main` |

> **Warning:** never use `npx wrangler deploy` (without `pages`) here. That is the **Workers** command and fails on a Pages project with
> `✘ [ERROR] Missing entry-point to Worker script or to assets directory`.
>
> Alternative: leave the Deploy command **empty** — Pages then auto-deploys `pages_build_output_dir` with its own internal auth and no API token is needed.

> **Important — `--branch main`:** inside the Pages CI build, wrangler may publish the deployment as a **preview** (e.g. `https://head.digitalmenus.pages.dev`) instead of production. Passing `--branch main` explicitly makes it the production deployment served at `https://digitalmenus.pages.dev`.

---

## 5. API token

The custom deploy command runs `wrangler pages deploy` inside the build machine, which authenticates via `CLOUDFLARE_API_TOKEN` (set in the Pages project's build variables). That token **must** include:

| Permission | Scope |
|---|---|
| `Account → Cloudflare Pages → Edit` | required for Pages deploys |
| `Account → Workers Scripts → Edit` | optional — include if the same token also deploys Workers |

If the token lacks Pages permissions, deploys fail with:

```
✘ [ERROR] A request to the Cloudflare API (/accounts/…/pages/projects/digitalmenus) failed.
  Authentication error [code: 10000]
```

Create/update tokens at https://dash.cloudflare.com/profile/api-tokens.

---

## 6. First-time setup (already done — reference only)

1. **Create the Pages project** (one-time; `wrangler pages deploy` fails with "The Pages project … does not exist" until this exists):
   ```powershell
   npx wrangler pages project create digitalmenus --production-branch main
   ```
2. **Deploy the worker** and set its secrets:
   ```powershell
   cd worker
   npx wrangler secret put GITHUB_TOKEN
   npx wrangler secret put ADMIN_PASSWORD_HASH
   npx wrangler secret put JWT_SECRET
   npx wrangler deploy
   ```
3. Set `VITE_WORKER_URL` on the Pages project (see §3).
4. Push to `main` — both site deployments fire automatically.

---

## 7. Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `Missing entry-point to Worker script or to assets directory` | Used `wrangler deploy` (Workers command) on the Pages project | Deploy command must be `npx wrangler pages deploy …` (or empty) |
| `Authentication error [code: 10000]` on `/pages/projects/…` | `CLOUDFLARE_API_TOKEN` lacks `Cloudflare Pages → Edit` | Fix token permissions (§5) |
| `The Pages project "digitalmenus" does not exist` | Project was never created in the account | Create it (§6 step 1) |
| Site served at `head.digitalmenus.pages.dev`, production 404 | Deploy published as a preview branch instead of production | Add `--branch main` to the deploy command (§4) |
| Site loads but CSS/JS 404s, URLs contain `/MenuProject/` | Build ran with the GitHub Pages base path | Should no longer happen (auto-detection, §3); verify no stale `SITE_BASE` variable is set |
| Admin panel calls `localhost:8787` | Build baked the dev URL in (missing `VITE_WORKER_URL` build variable) | Add the variable (§3); the build now fails loudly if it's missing |
| Admin panel can't reach API / CORS errors | New origin not in worker's `ALLOWED_ORIGIN` | Add origin to `worker/wrangler.toml` and redeploy worker |

---

## 8. Deployment checklist for a custom domain (future)

When pointing a restaurant's custom domain at the Pages project:

1. Add the domain in the Pages project → **Custom domains**.
2. Add the new origin to `ALLOWED_ORIGIN` in `worker/wrangler.toml` → redeploy worker.
3. Optionally set `SITE_URL` to the new domain if it should own canonical URLs/sitemap.
4. Push to `main` to rebuild both deployments.