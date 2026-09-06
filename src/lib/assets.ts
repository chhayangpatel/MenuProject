import type { Restaurant } from '../schemas/restaurant.schema';
import { basePath } from './base';

export type AssetType = 'logo' | 'cover' | 'menu';

/**
 * Resolve asset URL for a restaurant.
 * Supports both external URLs (http/https) and local asset paths.
 *
 * @param restaurant - Restaurant config object
 * @param path - The path from config (e.g., restaurant.logo, item.image)
 * @param type - Asset type for fallback handling
 * @returns Resolved URL string
 */
export function resolveAsset(
  restaurant: Restaurant,
  path: string | undefined | null,
  type: AssetType = 'menu'
): string {
  if (!path) return '';

  // External URL - use as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Already resolved (e.g., starts with /r/ or /)
  if (path.startsWith('/r/') || path.startsWith('/')) {
    return path;
  }

  // Local asset - prefix with restaurant asset path
  return basePath(`/r/${restaurant.slug}/assets/${path}`);
}

/**
 * Resolve logo URL - logos should typically be local for brand consistency
 */
export function resolveLogo(restaurant: Restaurant): string {
  return resolveAsset(restaurant, restaurant.logo, 'logo');
}

/**
 * Resolve cover image URL - covers can be external (Unsplash) or local
 */
export function resolveCover(restaurant: Restaurant): string {
  return resolveAsset(restaurant, restaurant.coverImage, 'cover');
}

/**
 * Resolve menu item image URL
 */
export function resolveMenuItemImage(restaurant: Restaurant, imagePath: string | undefined | null): string {
  return resolveAsset(restaurant, imagePath, 'menu');
}

/**
 * Resolve category hero image URL
 */
export function resolveCategoryHeroImage(restaurant: Restaurant, imagePath: string | undefined | null): string {
  return resolveAsset(restaurant, imagePath, 'menu');
}