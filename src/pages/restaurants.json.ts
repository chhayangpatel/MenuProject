---
// Static JSON of all restaurants (slug + display name). Built once at build
// time so client islands (e.g. the master order queue) can map order slugs
// to restaurant names without a worker round-trip.
import { loadAllRestaurants } from '../lib/loadRestaurants';

export async function GET() {
  const restaurants = await loadAllRestaurants();
  return new Response(
    JSON.stringify(
      restaurants.map((r) => ({ slug: r.slug, name: r.name.trim() })),
    ),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
  );
}
