// Base path for GitHub Pages subdirectory deployment
// This should match the `base` config in astro.config.mjs
export const BASE_PATH = '/MenuProject';

// Helper to prepend base path to internal routes
export function basePath(path: string): string {
  // If path already starts with base, return as-is
  if (path.startsWith(BASE_PATH)) return path;
  // If it's an absolute path starting with /, prepend base
  if (path.startsWith('/')) return BASE_PATH + path;
  // Otherwise prepend with /
  return BASE_PATH + '/' + path;
}
