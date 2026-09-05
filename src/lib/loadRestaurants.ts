import fs from "node:fs/promises";
import path from "node:path";
import {
  RestaurantSchema,
  type Restaurant,
} from "../schemas/restaurant.schema";

const VALID_DAYS = new Set([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

/**
 * Loads and validates every restaurant config under restaurants/.
 *
 * Hardening (Phase 0.7):
 *  - Per-restaurant isolation: one bad config is reported loudly and skipped,
 *    never silently dropped, and never blocks other restaurants from building
 *    (CI runs validate:configs as the hard gate; the build stays resilient).
 *  - Item-ID uniqueness within a restaurant (the client detail sheet looks
 *    items up by flat ID — collisions would render the wrong item).
 *  - Hours day-key warnings for misspelled day names.
 *  - Aggregated, clearly-named error reporting.
 */
export async function loadAllRestaurants(): Promise<Restaurant[]> {
  const restaurantsDir = path.join(process.cwd(), "restaurants");
  let entries;

  try {
    entries = await fs.readdir(restaurantsDir, { withFileTypes: true });
  } catch {
    console.warn(
      "Could not read restaurants directory. Returning empty array."
    );
    return [];
  }

  const restaurants: Restaurant[] = [];
  const allErrors: string[] = [];
  const slugs = new Set<string>();

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "_template") continue;

    const configPath = path.join(restaurantsDir, entry.name, "config.json");
    try {
      const configRaw = await fs.readFile(configPath, "utf-8");
      let configJson = JSON.parse(configRaw);

      // Backward compatibility: migrate flat hours to new format
      if (
        configJson.hours &&
        !configJson.hours.regular &&
        typeof configJson.hours === "object"
      ) {
        const flatHours = configJson.hours;
        const isFlatFormat = Object.values(flatHours).some(
          (v) => typeof v === "string"
        );
        if (isFlatFormat) {
          configJson = { ...configJson, hours: { regular: flatHours } };
        }
      }

      const parsed = RestaurantSchema.safeParse(configJson);

      if (!parsed.success) {
        const detail = JSON.stringify(parsed.error.format()).slice(0, 800);
        allErrors.push(`❌ ${entry.name}: schema invalid — ${detail}`);
        continue; // isolate: skip this restaurant, keep others building
      }

      const restaurant = parsed.data;

      // Duplicate slugs across restaurants
      if (slugs.has(restaurant.slug)) {
        allErrors.push(
          `❌ ${entry.name}: duplicate slug "${restaurant.slug}" (collides with another restaurant folder)`
        );
        continue;
      }
      slugs.add(restaurant.slug);
      if (restaurant.slug !== entry.name) {
        allErrors.push(
          `❌ ${entry.name}: slug "${restaurant.slug}" must match folder name`
        );
        continue;
      }

      // Item-ID uniqueness across all categories (flat lookup by ID)
      const seenIds = new Map<string, string>();
      let hasDup = false;
      for (const category of restaurant.menu) {
        for (const item of category.items) {
          const existing = seenIds.get(item.id);
          if (existing) {
            allErrors.push(
              `❌ ${entry.name}: duplicate item id "${item.id}" in "${category.name}" (first used in "${existing}")`
            );
            hasDup = true;
          } else {
            seenIds.set(item.id, category.name);
          }
        }
      }
      if (hasDup) continue;

      // Hours day-key warnings (soft — not blocking)
      const regular = restaurant.hours?.regular;
      if (regular) {
        const badDays = Object.keys(regular).filter(
          (k) => !VALID_DAYS.has(k.toLowerCase())
        );
        if (badDays.length) {
          console.warn(
            `⚠️  ${entry.name}: hours keys not recognized as days: ${badDays.join(", ")} (expected monday..sunday)`
          );
        }
      }

      restaurants.push(restaurant);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      allErrors.push(`❌ ${entry.name}: ${message}`);
    }
  }

  if (allErrors.length) {
    console.error(
      `\n${allErrors.length} restaurant config error(s) found:\n` +
      allErrors.join("\n") +
      "\n"
    );
  }

  return restaurants;
}