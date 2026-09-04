import fs from 'node:fs/promises';
import path from 'node:path';
import { RestaurantSchema, type Restaurant } from '../schemas/restaurant.schema';

export async function loadAllRestaurants(): Promise<Restaurant[]> {
  const restaurantsDir = path.join(process.cwd(), 'restaurants');
  let entries;
  
  try {
    entries = await fs.readdir(restaurantsDir, { withFileTypes: true });
  } catch (error) {
    console.warn('Could not read restaurants directory. Returning empty array.');
    return [];
  }

  const restaurants: Restaurant[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === '_template') continue;

    const configPath = path.join(restaurantsDir, entry.name, 'config.json');
    try {
      const configRaw = await fs.readFile(configPath, 'utf-8');
      const configJson = JSON.parse(configRaw);
      
      const parsed = RestaurantSchema.safeParse(configJson);
      
      if (!parsed.success) {
        console.error('Validation failed for restaurant "' + entry.name + '":');
        console.error(parsed.error.format());
        throw new Error('Invalid config in ' + entry.name);
      }
      
      restaurants.push(parsed.data);
    } catch (error) {
      console.error('Failed to load restaurant config for "' + entry.name + '":', error);
      // Depending on strictness, we might want to throw here to break the build
    }
  }

  return restaurants;
}
