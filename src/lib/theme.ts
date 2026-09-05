import type { Theme } from '../schemas/restaurant.schema';
import type { Template } from './templates/registry';

/**
 * Resolve the final palette for a restaurant, honoring precedence:
 *   restaurant config > template colorDefaults
 * Fonts are template-owned identity (NOT restaurant-configurable) per
 * docs/design/01-design-system.md §2.1 — restaurant font* fields are legacy
 * and ignored by template rendering.
 */
export function resolvePalette(theme: Theme, template: Template) {
  const d = template.colorDefaults;
  return {
    primary: theme.primaryColor || d.primaryColor || '#1A1612',
    secondary: theme.secondaryColor || d.secondaryColor || '#FDFBF7',
    accent: theme.accentColor || d.accentColor || '#C9A227',
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace('#', '');
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
}

/** Relative luminance (WCAG) */
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Pick black or white as the accessible text color over the accent */
export function onAccent(accent: string): string {
  return contrastRatio('#FFFFFF', accent) >= 3 ? '#FFFFFF' : '#111111';
}

/**
 * Build the <style> block injected into the page head.
 *
 * Emits:
 *  - --brand-* tokens (restaurant config, validated)
 *  - --{template.prefix}-* token OVERRIDES so restaurant brand colors flow
 *    through the template's own components (fixes hardcoded-template-palette)
 *  - --mr-* motion tokens from the template registry (motion is template-owned)
 *  - derived semantic tokens (surface, ink scales, on-accent)
 */
export function getThemeStyles(theme: Theme, template: Template): string {
  const { primary, secondary, accent } = resolvePalette(theme, template);
  const p = template.prefix;
  const m = template.motion;

  const css = [
    ':root {',
    `  /* Brand tokens (restaurant config — precedence over template defaults) */`,
    `  --brand-primary: ${primary};`,
    `  --brand-secondary: ${secondary};`,
    `  --brand-accent: ${accent};`,
    '',
    `  /* Bridge: template components read their own prefix tokens */`,
    `  --${p}-primary: ${primary};`,
    `  --${p}-secondary: ${secondary};`,
    `  --${p}-accent: ${accent};`,
    '',
    `  /* Motion tokens (template-owned, from registry) */`,
    `  --mr-entry-duration: ${m.entryDuration}ms;`,
    `  --mr-stagger: ${m.staggerDelay}ms;`,
    `  --mr-motion-scale: ${(m.intensity / 5).toFixed(2)};`,
    `  --mr-ease-out-expo: ${m.easings.outExpo};`,
    `  --mr-ease-spring: ${m.easings.spring};`,
    `  --mr-ease-fluid: ${m.easings.fluid};`,
    `  --mr-ease-snap: ${m.easings.snap};`,
    `  --${p}-duration-enter: ${m.entryDuration}ms;`,
    `  --${p}-stagger-delay: ${m.staggerDelay}ms;`,
    '',
    `  /* Semantic derived tokens */`,
    `  --mr-on-accent: ${onAccent(accent)};`,
    `  --mr-surface-border: color-mix(in srgb, ${primary} 12%, transparent);`,
    `  --mr-ink-60: color-mix(in srgb, ${primary} 60%, transparent);`,
    `  --mr-ink-40: color-mix(in srgb, ${primary} 40%, transparent);`,
    '',
    `  /* Legacy aliases (shared page code) */`,
    `  --color-primary: ${primary};`,
    `  --color-secondary: ${secondary};`,
    `  --color-accent: ${accent};`,
    '}',
  ].join('\n');

  return ['<style>', css, '</style>'].join('\n');
}