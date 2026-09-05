/**
 * check-contrast.mjs — WCAG contrast validation for every restaurant palette.
 * Checks: primary-on-secondary, secondary-on-primary, and accent legibility.
 * Blocking (exit 1) on body-text failures; warns on large-text-only ratios.
 */
import fs from "node:fs/promises";
import path from "node:path";

function getLuminance(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  [r, g, b] = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrast(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const lightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (lightest + 0.05) / (darkest + 0.05);
}

const HEX = /^#[0-9A-Fa-f]{6}$/;

async function checkContrast() {
  const base = path.join(process.cwd(), "restaurants");
  let dirs;
  try {
    dirs = await fs.readdir(base, { withFileTypes: true });
  } catch {
    console.error("Cannot read restaurants/ directory.");
    process.exit(1);
  }

  let hasErrors = false;

  for (const dir of dirs) {
    if (!dir.isDirectory() || dir.name === "_template") continue;

    const configPath = path.join(base, dir.name, "config.json");
    try {
      const config = JSON.parse(await fs.readFile(configPath, "utf-8"));
      const theme = config.theme || {};

      if (!theme.primaryColor || !theme.secondaryColor) {
        console.error("X " + dir.name + ": missing primaryColor/secondaryColor");
        hasErrors = true;
        continue;
      }
      if (!HEX.test(theme.primaryColor) || !HEX.test(theme.secondaryColor)) {
        console.error("X " + dir.name + ": theme colors must be 6-digit hex");
        hasErrors = true;
        continue;
      }

      // Body text: primary ink on secondary background (and inverse)
      const ratio = getContrast(theme.primaryColor, theme.secondaryColor);
      const inverseRatio = ratio; // symmetric formula

      if (ratio < 4.5) {
        console.error(
          "X " +
          dir.name +
          ": contrast primary(" + theme.primaryColor + ") vs secondary(" +
          theme.secondaryColor + ") is " + ratio.toFixed(2) +
          " — WCAG body text requires >= 4.5"
        );
        hasErrors = true;
      } else if (ratio < 7) {
        console.log(
          "~ " + dir.name + ": contrast " + ratio.toFixed(2) +
          " (AA pass; below AAA 7.0)"
        );
      } else {
        console.log("OK " + dir.name + ": contrast " + ratio.toFixed(2));
      }

      // Accent: warn (not block) if accent is too close to both surfaces
      if (theme.accentColor && HEX.test(theme.accentColor)) {
        const accOnSecondary = getContrast(theme.accentColor, theme.secondaryColor);
        const accOnPrimary = getContrast(theme.accentColor, theme.primaryColor);
        if (accOnSecondary < 3 && accOnPrimary < 3) {
          console.warn(
            "! " + dir.name + ": accent " + theme.accentColor +
            " has < 3:1 contrast against BOTH surfaces — prices/CTAs may be illegible"
          );
        }
      }
    } catch (err) {
      console.error("X " + dir.name + ": cannot parse config.json");
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error("\nContrast check FAILED.");
    process.exit(1);
  }
  console.log("\nContrast check passed for all restaurants.");
}

checkContrast();