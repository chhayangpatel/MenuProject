/**
 * validate-configs.mjs — the CI hard gate for restaurant content.
 *
 * Checks (per docs/technical/06-scaling-architecture.md + review DA-1..4):
 *  1. Required fields + formats (slug regex, hex colors, email/url)
 *  2. Referenced assets exist (logo, favicon, cover, item images, category heroes)
 *  3. Asset size guardrails (per-file ≤ 400KB, per-restaurant ≤ 25MB)
 *  4. Duplicate slugs across restaurants; slug === folder name
 *  5. Duplicate item IDs across categories (flat lookup correctness)
 *  6. Template/moodPreset values are known
 *  7. Hours day keys are real day names
 *  8. Menu structure sanity (categories non-empty, prices non-negative)
 *
 * Exit code 1 with a per-restaurant error list on any failure.
 */
import fs from "node:fs/promises";
import path from "node:path";

const VALID_TEMPLATES = new Set([
  "editorial-classic",
  "modern-minimal",
  "bold-street",
  "warm-rustic",
  "vibrant-playful",
]);
const VALID_MOODS = new Set([
  "fine-dining",
  "modern-minimal",
  "rustic-traditional",
  "playful-casual",
  "bold-street",
]);
const VALID_DAYS = new Set([
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
]);
const HEX = /^#[0-9A-Fa-f]{6}$/;
const SLUG = /^[a-z0-9-]+$/;
const MAX_FILE_BYTES = 400 * 1024; // 400KB per asset (pre-optimization)
const MAX_RESTAURANT_ASSETS_BYTES = 25 * 1024 * 1024; // 25MB total

async function validate() {
  const base = path.join(process.cwd(), "restaurants");
  let dirs;
  try {
    dirs = await fs.readdir(base, { withFileTypes: true });
  } catch {
    console.error("❌ Cannot read restaurants/ directory.");
    process.exit(1);
  }

  const slugs = new Set();
  let hasErrors = false;
  let count = 0;

  for (const dir of dirs) {
    if (!dir.isDirectory() || dir.name === "_template") continue;
    count++;

    const errors = [];
    const restaurantDir = path.join(base, dir.name);
    const assetsDir = path.join(restaurantDir, "assets");

    const add = (msg) => errors.push(msg);

    // ── Load config ────────────────────────────────────────────────────
    let config;
    try {
      config = JSON.parse(
        await fs.readFile(path.join(restaurantDir, "config.json"), "utf-8")
      );
    } catch (err) {
      console.error(`❌ ${dir.name}: cannot parse config.json — ${err.message}`);
      hasErrors = true;
      continue;
    }

    // ── Identity ───────────────────────────────────────────────────────
    if (!config.name) add("missing 'name'");
    if (!config.slug) add("missing 'slug'");
    else {
      if (!SLUG.test(config.slug)) add(`slug "${config.slug}" must match ^[a-z0-9-]+$`);
      if (config.slug !== dir.name) add(`slug "${config.slug}" must match folder name "${dir.name}"`);
      if (slugs.has(config.slug)) add(`duplicate slug "${config.slug}"`);
      slugs.add(config.slug);
    }
    if (!config.logo) add("missing 'logo'");

    // ── Theme ──────────────────────────────────────────────────────────
    const theme = config.theme || {};
    for (const key of ["primaryColor", "secondaryColor"]) {
      if (!theme[key]) add(`theme.${key} is required`);
      else if (!HEX.test(theme[key])) add(`theme.${key} "${theme[key]}" is not a hex color`);
    }
    if (theme.accentColor && !HEX.test(theme.accentColor)) {
      add(`theme.accentColor "${theme.accentColor}" is not a hex color`);
    }
    if (config.template && !VALID_TEMPLATES.has(config.template)) {
      add(`template "${config.template}" is not a known template`);
    }
    if (config.moodPreset && !VALID_MOODS.has(config.moodPreset)) {
      add(`moodPreset "${config.moodPreset}" is not a known preset`);
    }

    // ── Contact sanity ─────────────────────────────────────────────────
    if (config.contact?.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(config.contact.email)) {
      add(`contact.email "${config.contact.email}" is not a valid email`);
    }
    for (const [k, v] of Object.entries(config.contact?.socials || {})) {
      if (!/^https?:\/\//.test(v)) add(`contact.socials.${k} must be an http(s) URL`);
    }

    // ── Hours day keys ─────────────────────────────────────────────────
    const regular = config.hours?.regular || config.hours; // support flat format
    if (regular && typeof regular === "object") {
      const badDays = Object.keys(regular).filter(
        (k) => !VALID_DAYS.has(k.toLowerCase())
      );
      if (badDays.length) add(`hours keys not day names: ${badDays.join(", ")}`);
    }

    // ── Assets: existence + size guardrails ───────────────────────────
    let assetsTotal = 0;
    const checkAsset = async (relPath, label) => {
      if (!relPath) return;
      if (/^https?:\/\//.test(relPath)) return; // external URL — skip
      const p = path.join(assetsDir, relPath);
      try {
        const stat = await fs.stat(p);
        assetsTotal += stat.size;
        if (stat.size > MAX_FILE_BYTES) {
          add(
            `${label} "${relPath}" is ${(stat.size / 1024).toFixed(0)}KB — exceeds the 400KB upload guardrail; compress before committing`
          );
        }
      } catch {
        add(`${label} "${relPath}" does not exist in assets/`);
      }
    };
    await checkAsset(config.logo, "logo");
    if (config.favicon) await checkAsset(config.favicon, "favicon");
    if (config.coverImage) await checkAsset(config.coverImage, "coverImage");

    // ── Menu structure ─────────────────────────────────────────────────
    if (!Array.isArray(config.menu) || config.menu.length === 0) {
      add("menu must be a non-empty array of categories");
    } else {
      const itemIds = new Map();
      for (const cat of config.menu) {
        if (!cat.id || !cat.name) add(`category missing id/name`);
        if (!Array.isArray(cat.items) || cat.items.length === 0) {
          add(`category "${cat.name || cat.id}" has no items`);
          continue;
        }
        if (cat.heroImage) await checkAsset(cat.heroImage, `category "${cat.name}" heroImage`);
        for (const item of cat.items) {
          if (!item.id || !item.name) add(`item missing id/name in "${cat.name}"`);
          if (typeof item.price !== "number" || item.price < 0) {
            add(`item "${item.name || item.id}" price must be a non-negative number`);
          }
          if (item.id) {
            if (itemIds.has(item.id)) {
              add(
                `duplicate item id "${item.id}" in "${cat.name}" (first used in "${itemIds.get(item.id)}")`
              );
            } else {
              itemIds.set(item.id, cat.name);
            }
          }
          if (item.image) await checkAsset(item.image, `item "${item.name}" image`);
          for (const g of item.gallery || []) await checkAsset(g, `item "${item.name}" gallery`);
        }
      }
    }

    // ── Total asset weight ─────────────────────────────────────────────
    try {
      const walk = async (dir) => {
        for (const e of await fs.readdir(dir, { withFileTypes: true })) {
          const p = path.join(dir, e.name);
          if (e.isDirectory()) await walk(p);
          else assetsTotal += (await fs.stat(p)).size;
        }
      };
      await walk(assetsDir);
      if (assetsTotal > MAX_RESTAURANT_ASSETS_BYTES) {
        add(
          `assets total ${(assetsTotal / 1024 / 1024).toFixed(1)}MB exceeds the 25MB per-restaurant guardrail`
        );
      }
    } catch {
      if (!config.logo) add("assets/ folder missing");
    }

    if (errors.length) {
      hasErrors = true;
      console.error(`❌ ${dir.name}:`);
      errors.forEach((e) => console.error(`   • ${e}`));
    } else {
      console.log(`✅ ${dir.name} is valid.`);
    }
  }

  if (hasErrors) {
    console.error(`\nValidation failed. Fix the errors above before merging.`);
    process.exit(1);
  }
  console.log(`\nAll ${count} restaurant config(s) valid. ✨`);
}

validate().catch((err) => {
  console.error(err);
  process.exit(1);
});