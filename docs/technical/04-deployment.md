# Deployment — GitHub Pages

The site deploys automatically to **GitHub Pages** whenever code is pushed to `main`. No manual step required.

## How it works

Two GitHub Actions workflows live in `.github/workflows/`:

### 1. `validate.yml` — on every Pull Request touching `restaurants/**`
- Runs `npm run validate:configs` (Zod-check all configs)
- Runs `npm run check:contrast` (WCAG contrast)
- If either fails, the PR is blocked. This is the safety net for business edits.

### 2. `deploy.yml` — on every push to `main`
1. `npm ci` (clean install)
2. `npm run validate:configs`
3. `npm run build` → `dist/`
4. Upload the artifact
5. Deploy via GitHub Pages

## Triggering a deploy

Because a static site can't be edited "in production," **any change goes through git**:

```powershell
git add .
git commit -m "feat: update bella italia prices"
git push origin main      # ← deploy happens automatically
```

The site is live moments later at the Pages URL (e.g. `https://<your-org>.github.io/menuproject/`).

## The zero-code restaurant edit flow

For business users who shouldn't touch code, the safest path is:

1. Edit `restaurants/<slug>/config.json` **on a branch** (or in the GitHub web UI — it can edit directly and open a PR).
2. Open a Pull Request → `validate.yml` checks the config automatically.
3. Merge the PR → deploy fires.

> The web UI even offers "… → Create pull request" for raw file edits, so a business user never needs a local dev environment.

## First-time GitHub Pages setup (already done if the site is live)

1. Repo **Settings → Pages** → Source: **GitHub Actions**.
2. Ensure `Actions` permissions allow Pages (`Settings → Actions → General → Workflow permissions: Read and write`).
3. The `deploy.yml` workflow does the rest.

## If the build fails in CI

The most common cause is an invalid `config.json`. Reproduce locally:

```powershell
npm run validate:configs
npm run build
```

`validate.yml` runs the exact same checks, so a green local run means the PR is safe to merge.

## Previewing the production build

```powershell
npm run build
npm run preview      # serves dist/ at http://localhost:4321
```

`preview` is your chance to verify the exact artifact CI will ship — including the LoadingScreen, View Transitions, and islands — before you push.

## Environment variables & secrets
None required. The build is fully static. If you later add a feature that needs a build-time secret (e.g. a QR tile map key), add it under **repo Settings → Secrets and variables → Actions**.

## Rollback
Push a revert commit for the last change — the deploy re-runs automatically:

```powershell
git revert HEAD
git push origin main
```