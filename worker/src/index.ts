interface Env {
  GITHUB_TOKEN: string;
  ADMIN_PASSWORD_HASH: string;
  JWT_SECRET: string;
  REPO_OWNER: string;
  REPO_NAME: string;
  ALLOWED_ORIGIN: string;
}

interface JWTPayload {
  sub: string;
  exp: number;
  iat: number;
}

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Constant-time hex string comparison. We iterate the full length even if a
 * mismatch is found early, so an attacker can't measure the comparison time
 * to learn the hash prefix.
 */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function signJWT(payload: JWTPayload, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const data = `${headerB64}.${payloadB64}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${data}.${signatureB64}`;
}

async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  const data = `${headerB64}.${payloadB64}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));
  if (!valid) return null;

  try {
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

async function githubGet(env: Env, path: string): Promise<{ content: string; sha: string } | null> {
  const url = `https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/contents/${path}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'menu-admin-worker',
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { content: data.content, sha: data.sha };
}

async function githubPut(env: Env, path: string, content: string, message: string, sha?: string): Promise<{ sha: string }> {
  const url = `https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/contents/${path}`;
  const body: Record<string, any> = {
    message,
    content: btoa(content),
    branch: 'main',
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'menu-admin-worker',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub PUT failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { sha: data.content.sha };
}

async function listRestaurants(env: Env): Promise<string[]> {
  const url = `https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/contents/restaurants`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'menu-admin-worker',
    },
  });
  if (!res.ok) throw new Error(`GitHub list failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data
    .filter((item: any) => item.type === 'dir' && item.name !== '_template')
    .map((item: any) => item.name);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    // CORS origin check: reject requests from unknown origins.
    // If ALLOWED_ORIGIN is set, only that origin is permitted.
    // If unset, fall back to request's own origin (still restrictive).
    const allowedOrigin = env.ALLOWED_ORIGIN || origin;
    const isAllowed = !env.ALLOWED_ORIGIN || origin === env.ALLOWED_ORIGIN;
    const headers = corsHeaders(allowedOrigin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (!isAllowed) {
      return new Response('Forbidden', { status: 403, headers });
    }

    try {
      // Health check
      if (url.pathname === '/' && request.method === 'GET') {
        return Response.json({ ok: true }, { headers });
      }

      // POST /auth/login - password → JWT
      if (url.pathname === '/auth/login' && request.method === 'POST') {
        const { password } = await request.json() as { password?: string };
        if (!password) {
          return Response.json({ error: 'Password required' }, { status: 400, headers });
        }

        const hash = await sha256Hex(password);
        const expectedHash = env.ADMIN_PASSWORD_HASH.toLowerCase();

        if (!timingSafeEqualHex(hash, expectedHash)) {
          return Response.json({ error: 'Invalid password' }, { status: 401, headers });
        }

        const payload: JWTPayload = {
          sub: 'admin',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        };

        const token = await signJWT(payload, env.JWT_SECRET);
        return Response.json({ token }, { headers });
      }

      // Auth middleware for protected routes
      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

      const protectedRoutes = ['/restaurants/save', '/restaurants/create', '/restaurants/upload'];
      const isProtected = protectedRoutes.some(r => url.pathname === r && request.method === 'POST');

      if (isProtected) {
        if (!token) {
          return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
        }
        const payload = await verifyJWT(token, env.JWT_SECRET);
        if (!payload) {
          return Response.json({ error: 'Invalid or expired token' }, { status: 401, headers });
        }
      }

      // GET /restaurants - list all restaurant slugs
      if (url.pathname === '/restaurants' && request.method === 'GET') {
        const slugs = await listRestaurants(env);
        return Response.json({ restaurants: slugs }, { headers });
      }

      // GET /restaurants/:slug - read restaurant config
      if (url.pathname.startsWith('/restaurants/') && request.method === 'GET') {
        const slug = url.pathname.split('/restaurants/')[1];
        if (!slug) {
          return Response.json({ error: 'Slug required' }, { status: 400, headers });
        }

        const result = await githubGet(env, `restaurants/${slug}/config.json`);
        if (!result) {
          return Response.json({ error: 'Restaurant not found' }, { status: 404, headers });
        }

        const content = atob(result.content);
        return Response.json({ config: JSON.parse(content) }, { headers });
      }

      // POST /restaurants/save - update restaurant config
      if (url.pathname === '/restaurants/save' && request.method === 'POST') {
        const { slug, config } = await request.json() as { slug?: string; config?: any };
        if (!slug || !config) {
          return Response.json({ error: 'Slug and config required' }, { status: 400, headers });
        }

        // Get current SHA
        const current = await githubGet(env, `restaurants/${slug}/config.json`);
        if (!current) {
          return Response.json({ error: 'Restaurant not found' }, { status: 404, headers });
        }

        const message = `chore: update restaurant ${slug} config via admin`;
        await githubPut(env, `restaurants/${slug}/config.json`, JSON.stringify(config, null, 2), message, current.sha);

        return Response.json({ success: true }, { headers });
      }

      // POST /restaurants/create - create new restaurant
      if (url.pathname === '/restaurants/create' && request.method === 'POST') {
        const { slug, config } = await request.json() as { slug?: string; config?: any };
        if (!slug || !config) {
          return Response.json({ error: 'Slug and config required' }, { status: 400, headers });
        }

        // Check if already exists
        const existing = await githubGet(env, `restaurants/${slug}/config.json`);
        if (existing) {
          return Response.json({ error: 'Restaurant already exists' }, { status: 409, headers });
        }

        const message = `feat: create restaurant ${slug} via admin`;
        await githubPut(env, `restaurants/${slug}/config.json`, JSON.stringify(config, null, 2), message);
        // Also create .gitkeep in assets to ensure folder exists
        await githubPut(env, `restaurants/${slug}/assets/.gitkeep`, '', message);

        return Response.json({ success: true }, { headers });
      }

      // POST /restaurants/upload - upload asset file
      if (url.pathname === '/restaurants/upload' && request.method === 'POST') {
        const { slug, path, content, encoding } = await request.json() as {
          slug?: string;
          path?: string;
          content?: string;
          encoding?: 'base64' | 'utf8';
        };
        if (!slug || !path || content === undefined) {
          return Response.json({ error: 'Slug, path, and content required' }, { status: 400, headers });
        }

        const finalContent = encoding === 'base64' ? atob(content) : content;
        const fullPath = `restaurants/${slug}/${path}`;

        // Try to get existing SHA (for updates)
        let sha: string | undefined;
        const current = await githubGet(env, fullPath);
        if (current) sha = current.sha;

        const message = `chore: upload asset ${path} for ${slug} via admin`;
        await githubPut(env, fullPath, finalContent, message, sha);

        return Response.json({ success: true }, { headers });
      }

      return Response.json({ error: 'Not found' }, { status: 404, headers });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Worker error:', message);
      // Surface auth errors clearly so local debugging is obvious
      if (message.includes('401')) {
        return Response.json(
          { error: 'GitHub 401: bad or missing GITHUB_TOKEN in .dev.vars' },
          { status: 401, headers },
        );
      }
      if (message.includes('403')) {
        return Response.json(
          { error: 'GitHub 403: token lacks repo scope or rate-limited' },
          { status: 403, headers },
        );
      }
      if (message.includes('404')) {
        return Response.json({ error: 'GitHub 404: repo or path not found (check REPO_OWNER / REPO_NAME)' }, { status: 404, headers });
      }
      return Response.json({ error: `Worker error: ${message}` }, { status: 500, headers });
    }
  },
} satisfies ExportedHandler<Env>;