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
    '}',
    '</style>',
  ].join('\n');
}
