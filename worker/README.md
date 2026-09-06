# MenuProject Admin Worker

Cloudflare Worker that acts as a secure write bridge between the admin UI and GitHub for the MenuProject restaurant menu platform.

## Quick Start

### 1. Install Wrangler
```bash
npm install -g wrangler
# or use npx
```

### 2. Generate Secrets
```bash
# Generate JWT secret (32+ chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate password hash (SHA-256)
node -e "console.log(require('crypto').createHash('sha256').update('your-password').digest('hex'))"
```

### 3. Configure Local Development
```bash
cd worker
cp .dev.vars.example .dev.vars  # then edit with your values
```

### 4. Run Locally
```bash
npx wrangler dev
# Worker runs at http://localhost:8787
```

### 5. Deploy to Cloudflare
```bash
npx wrangler deploy
# Then set secrets in Cloudflare dashboard:
# wrangler secret put GITHUB_TOKEN
# wrangler secret put ADMIN_PASSWORD_HASH
# wrangler secret put JWT_SECRET
# wrangler secret put REPO_OWNER
# wrangler secret put REPO_NAME
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | Health check |
| POST | `/auth/login` | No | Password → JWT |
| GET | `/restaurants` | No | List restaurant slugs |
| GET | `/restaurants/:slug` | No | Read restaurant config |
| POST | `/restaurants/save` | JWT | Update restaurant config |
| POST | `/restaurants/create` | JWT | Create new restaurant |
| POST | `/restaurants/upload` | JWT | Upload asset file |

## Architecture

```
Admin UI (browser)
    │  POST /auth/login { password }
    ▼
Worker validates hash → returns JWT (1hr)
    │
    │  Authorization: Bearer <jwt>
    ▼
Worker validates JWT → calls GitHub Contents API
    │
    │  PUT config.json / upload asset
    ▼
GitHub Repo (main branch)
    │
    │  → GitHub Actions CI → Build → GitHub Pages
    ▼
Public Menu Site
```

## Security

- GitHub PAT lives **only** in Cloudflare Worker secrets (never in browser bundle)
- Admin password hash stored in Worker secret, compared with timing-safe comparison
- JWT signed with HMAC-SHA256, 1-hour expiry, verified on every protected request
- CORS configured for admin origin

## Local Testing

```bash
# Test health
curl http://localhost:8787/

# Test login
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your-password"}'
# Returns: {"token":"..."}

# Test list restaurants
curl http://localhost:8787/restaurants

# Test get restaurant
curl http://localhost:8787/restaurants/bella-italia

# Test save (with token from login)
curl -X POST http://localhost:8787/restaurants/save \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"slug":"bella-italia","config":{...}}'
```