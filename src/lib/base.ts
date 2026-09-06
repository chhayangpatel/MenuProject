// Base path for subdirectory deployments (e.g. GitHub Pages /MenuProject).
// Derived from Astro's `base` config via import.meta.env.BASE_URL so it
// always matches astro.config.mjs. On Cloudflare Pages (root deployment,
// SITE_BASE=/) this resolves to '' and paths stay root-relative.
// Trailing slash is stripped: '/MenuProject/' -> '/MenuProject', '/' -> ''.
export const BASE_PATH = (import.meta.env.BASE_URL || '/MenuProject').replace(/\/+$/, '');

// Helper to prepend base path to internal routes
export function basePath(path: string): string {
  // If path already starts with base, return as-is
  if (BASE_PATH && path.startsWith(BASE_PATH)) return path;
  // If it's an absolute path starting with /, prepend base
  if (path.startsWith('/')) return BASE_PATH + path;
  // Otherwise prepend with /
  return BASE_PATH + '/' + path;
}