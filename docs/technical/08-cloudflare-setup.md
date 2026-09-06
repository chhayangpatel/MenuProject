# Cloudflare Setup — Pages Site + Admin Worker

The project deploys to **two places simultaneously**:

| Target | What | URL | Trigger |
|---|---|---|---|
| GitHub Pages | The static menu site | `https://chhayangpatel.github.io/MenuProject/` | push to `main` (`.github/workflows/deploy.yml`) |
| Cloudflare Pages | The same static site, served from the root | `https://menuproject-1mg.pages.dev/` | push to `main` (Cloudflare Pages CI) |
| Cloudflare Workers | `menu-admin` API worker | `https://menu-admin.chhayang-jenkins.workers.dev` | manual (`npm run deploy:worker` or `cd worker && npx wrangler deploy`) |

Both site deployments share the same `dist/` build output. GitHub Pages serves it under `/MenuProject`; Cloudflare Pages serves it under `/`. The build auto-detects which one is running (see [Build configuration](#build-configuration)).

---

## 1. Cloudflare resources

| Resource | Name | Where configured |
|---|---|---|
| Pages project | `menuproject` | Cloudflare dashboard → Workers & Pages → `menuproject` |
| Worker | `menu-admin` | `worker/wrangler.toml` + dashboard secrets |
| API token | `pages-deploy-token` (custom token) | https://dash.cloudflare.com/profile/api-tokens |

Account ID: `12241568cc83ebb1b0769d580a8fa9f2`

---

## 2. Config files in the repo

### Root `wrangler.toml` (Pages project)

```toml
name = "menuproject"
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
ALLOWED_ORIGIN = "https://chhayangpatel.github.io,https://menuproject-1mg.pages.dev"
```

- `ALLOWED_ORIGIN` is a comma-separated CORS allowlist. **When you add a new deployment origin (e.g. a custom domain), add it here and redeploy the worker.**
- Secrets are set via `wrangler secret put` (never in the file): `GITHUB_TOKEN`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET`, plus `REPO_OWNER` / `REPO_NAME` if not declared as vars.

### `package.json` scripts

| Script | Command |
|---|---|
| `npm run deploy:pages` | `wrangler pages deploy dist --project-name menuproject` |
| Worker deploy | `cd worker && npx wrangler deploy` |

---

## 3. Build configuration (auto-detection)

`astro.config.mjs` detects the build environment automatically:

| Environment | `base` | `site` | Set by |
|---|---|---|---|
| Local dev / GitHub Pages | `/MenuProject` | `https://chhayangpatel.github.io/MenuProject/` | defaults |
| Cloudflare Pages (`CF_PAGES=1`) | `/` | `CF_PAGES_URL` (e.g. `https://menuproject-1mg.pages.dev`) | Cloudflare build system |
| Any explicit override | `SITE_BASE` | `SITE_URL` | env var (highest priority) |

Because Cloudflare sets `CF_PAGES=1` and `CF_PAGES_URL` for us, **no `SITE_BASE`/`SITE_URL` variables need to be configured in the dashboard**.

### Required environment variables on the Pages project

Dashboard → Workers & Pages → `menuproject` → **Settings → Variables and Secrets** (Production):

| Variable | Value | Purpose |
|---|---|---|
| `VITE_WORKER_URL` | `https://menu-admin.chhayang-jenkins.workers.dev` | Baked into the client bundle so the admin panel can reach the API |

---

## 4. Pages build & deploy settings

Dashboard → Workers & Pages → `menuproject` → **Settings → Build**:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Deploy command | `npx wrangler pages deploy dist --project-name menuproject` |

> **Warning:** never use `npx wrangler deploy` (without `pages`) here. That is the **Workers** command and fails on a Pages project with
> `✘ [ERROR] Missing entry-point to Worker script or to assets directory`.
>
> Alternative: leave the Deploy command **empty** — Pages then auto-deploys `pages_build_output_dir` with its own internal auth and no API token is needed.

---

## 5. API token

The custom deploy command runs `wrangler pages deploy` inside the build machine, which authenticates via `CLOUDFLARE_API_TOKEN` (set in the Pages project's build variables). That token **must** include:

| Permission | Scope |
|---|---|
| `Account → Cloudflare Pages → Edit` | required for Pages deploys |
| `Account → Workers Scripts → Edit` | optional — include if the same token also deploys Workers |

If the token lacks Pages permissions, deploys fail with:

```
✘ [ERROR] A request to the Cloudflare API (/accounts/…/pages/projects/menuproject) failed.
  Authentication error [code: 10000]
```

Create/update tokens at https://dash.cloudflare.com/profile/api-tokens.

---

## 6. First-time setup (already done — reference only)

1. **Create the Pages project** (one-time; `wrangler pages deploy` fails with "The Pages project … does not exist" until this exists):
   ```powershell
   npx wrangler pages project create menuproject --production-branch main
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
| `The Pages project "menuproject" does not exist` | Project was never created in the account | Create it (§6 step 1) |
| Site loads but CSS/JS 404s, URLs contain `/MenuProject/` | Build ran with the GitHub Pages base path | Should no longer happen (auto-detection, §3); verify `CF_PAGES` is present and no stale `SITE_BASE` variable is set |
| Admin panel can't reach API / CORS errors | New origin not in worker's `ALLOWED_ORIGIN` | Add origin to `worker/wrangler.toml` and redeploy worker |

---

## 8. Deployment checklist for a custom domain (future)

When pointing a restaurant's custom domain at the Pages project:

1. Add the domain in the Pages project → **Custom domains**.
2. Add the new origin to `ALLOWED_ORIGIN` in `worker/wrangler.toml` → redeploy worker.
3. Optionally set `SITE_URL` to the new domain if it should own canonical URLs/sitemap.
4. Push to `main` to rebuild both deployments.