import type { Theme } from '../schemas/restaurant.schema';
import { moodPresets, type MoodPresetName } from './moodPresets';

export function getThemeStyles(theme: Theme, presetName: MoodPresetName): string {
  const preset = moodPresets[presetName] || moodPresets['fine-dining'];

  // Resolve border radius based on preset if not strictly overridden
  let radius = preset.radius;
  if (theme.borderRadius) {
    const radiusMap: Record<string, string> = {
      'none': '0px',
      'sm': '0.125rem',
      'md': '0.375rem',
      'lg': '0.5rem',
      'full': '9999px',
    };
    radius = radiusMap[theme.borderRadius] || radius;
  }

  const fontHeading = theme.fontHeading || preset.fontHeading.replace(/"/g, '');
  const fontBody = theme.fontBody || preset.fontBody.replace(/"/g, '');

  // Google Fonts URL
  const fonts = [fontHeading, fontBody].filter((v, i, a) => a.indexOf(v) === i);
  const googleFontsUrl = 'https://fonts.googleapis.com/css2?family=' +
    fonts.map(f => f.replace(/ /g, '+') + ':wght@400;500;600;700;800;900').join('&family=') +
    '&display=swap';

  return [
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link href="' + googleFontsUrl + '" rel="stylesheet">',
    '<style>',
    ':root {',
    '  --color-primary: ' + theme.primaryColor + ';',
    '  --color-secondary: ' + theme.secondaryColor + ';',
    '  --color-accent: ' + (theme.accentColor || '#D4AF37') + ';',
    '  --font-heading: "' + fontHeading + '", serif;',
    '  --font-body: "' + fontBody + '", sans-serif;',
    '  --radius: ' + radius + ';',
    '',
    '  /* Motion curves */',
    '  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);',
    '  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);',
    '  --ease-fluid: cubic-bezier(0.32, 0.72, 0, 1);',
    '  --ease-snap: cubic-bezier(0.76, 0, 0.24, 1);',
    '',
    '  /* Typography scale */',
    '  --text-hero: clamp(2.4rem, 7vw, 4.5rem);',
    '  --text-section: clamp(1.5rem, 4vw, 2rem);',
    '  --text-body: 1rem;',
    '  --text-caption: 0.8125rem;',
    '  --text-micro: 0.6875rem;',
    '  --leading-heading: 1.05;',
    '  --leading-body: 1.75;',
    '  --tracking-heading: -0.02em;',
    '  --tracking-wide: 0.04em;',
    '  --tracking-micro: 0.08em;',
    '}',
    '</style>',
  ].join('\n');
}
