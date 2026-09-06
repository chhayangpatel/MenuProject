import { getStoredToken, setStoredToken } from './token';

// VITE_WORKER_URL is baked in via vite.define in astro.config.mjs.
// Local dev: if unset, fall back to localhost:8787 (wrangler dev default).
// CI/prod: the repo variable provides it; missing would be a config error.
const WORKER_URL = (import.meta.env.VITE_WORKER_URL as string) || 'http://localhost:8787';

// Deduplicate concurrent refresh attempts — if several requests hit 401 at
// once, only one /auth/refresh call is made and all retries share the result.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAuthToken(): Promise<string | null> {
  const current = getStoredToken();
  if (!current) return null;
  try {
    const res = await fetch(`${WORKER_URL}/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${current}` },
    });
    if (!res.ok) return null;
    const data = await res.json() as { token: string };
    setStoredToken(data.token);
    return data.token;
  } catch {
    return null;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : `${WORKER_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Token expired mid-session: silently refresh once and retry the request
  // with the new token. If refresh fails (token fully expired), the original
  // 401 response is returned and the UI surfaces the error.
  if (res.status === 401 && !path.startsWith('/auth/')) {
    if (!refreshPromise) {
      refreshPromise = refreshAuthToken().finally(() => { refreshPromise = null; });
    }
    const newToken = await refreshPromise;
    if (newToken) {
      return fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    }
  }

  return res;
}

export async function getRestaurants(): Promise<string[]> {
  const res = await apiFetch('/restaurants');
  if (!res.ok) throw new Error(`Failed to load restaurants: ${res.status}`);
  const data = await res.json() as { restaurants: string[] };
  return data.restaurants;
}

export async function getRestaurantConfig(slug: string): Promise<any> {
  const res = await apiFetch(`/restaurants/${slug}`);
  if (!res.ok) throw new Error(`Failed to load restaurant: ${res.status}`);
  const data = await res.json() as { config: any };
  return data.config;
}

export async function saveRestaurant(slug: string, config: any, token: string): Promise<{ success: boolean }> {
  const res = await apiFetch('/restaurants/save', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ slug, config }),
  });
  if (!res.ok) throw new Error(`Failed to save: ${res.status}`);
  return res.json();
}

export async function createRestaurant(slug: string, config: any, token: string): Promise<{ success: boolean }> {
  const res = await apiFetch('/restaurants/create', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ slug, config }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error || `Failed to create restaurant: ${res.status}`);
  }
  return res.json();
}

export async function uploadRestaurantAsset(
  slug: string,
  path: string,
  content: string,
  token: string,
  encoding: 'base64' | 'utf8' = 'utf8',
): Promise<{ success: boolean }> {
  const res = await apiFetch('/restaurants/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ slug, path, content, encoding }),
  });
  if (!res.ok) throw new Error(`Failed to upload: ${res.status}`);
  return res.json();
}