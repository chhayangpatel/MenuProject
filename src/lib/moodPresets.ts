export type MoodPresetName = 'fine-dining' | 'modern-minimal' | 'rustic-traditional' | 'playful-casual' | 'bold-street';

export interface MoodPreset {
  name: MoodPresetName;
  fontHeading: string;
  fontBody: string;
  radius: string;
  motif: string; // SVG string for section dividers
  spacing: string; // e.g., 'compact', 'generous'
  texture?: string; // Optional CSS for a background texture
}

export const moodPresets: Record<MoodPresetName, MoodPreset> = {
  'fine-dining': {
    name: 'fine-dining',
    fontHeading: '"Playfair Display", serif',
    fontBody: '"Inter", sans-serif',
    radius: '0px',
    spacing: 'generous',
    motif: `<svg width="100" height="2" viewBox="0 0 100 2" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1H100" stroke="currentColor" stroke-width="0.5"/></svg>`,
    texture: 'url("/textures/linen.png")', // Assumes we have a texture in public/textures/
  },
  'modern-minimal': {
    name: 'modern-minimal',
    fontHeading: '"Space Grotesk", sans-serif',
    fontBody: '"Inter", sans-serif',
    radius: '0.25rem', // sm
    spacing: 'compact',
    motif: `<svg width="50" height="4" viewBox="0 0 50 4" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="25" cy="2" r="2" fill="currentColor"/></svg>`,
  },
  'rustic-traditional': {
    name: 'rustic-traditional',
    fontHeading: '"Fraunces", serif',
    fontBody: '"Crimson Pro", serif',
    radius: '0.375rem', // md
    spacing: 'generous',
    motif: `<svg width="40" height="12" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0C20 0 10 12 0 12C10 12 20 0 20 0ZM20 0C20 0 30 12 40 12C30 12 20 0 20 0Z" fill="currentColor"/></svg>`,
    texture: 'url("/textures/paper.png")',
  },
  'playful-casual': {
    name: 'playful-casual',
    fontHeading: '"Poppins", sans-serif',
    fontBody: '"Outfit", sans-serif',
    radius: '9999px', // full
    spacing: 'compact',
    motif: `<svg width="60" height="10" viewBox="0 0 60 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 5C10 -5 20 15 30 5C40 -5 50 15 60 5" stroke="currentColor" stroke-width="2" fill="none"/></svg>`,
  },
  'bold-street': {
    name: 'bold-street',
    fontHeading: '"Archivo Black", sans-serif',
    fontBody: '"DM Sans", sans-serif',
    radius: '0px',
    spacing: 'compact',
    motif: `<svg width="80" height="10" viewBox="0 0 80 10" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="2" width="20" height="6" fill="currentColor" transform="skewX(-20)"/><rect x="30" y="2" width="20" height="6" fill="currentColor" transform="skewX(-20)"/><rect x="60" y="2" width="20" height="6" fill="currentColor" transform="skewX(-20)"/></svg>`,
    texture: 'url("/textures/halftone.png")',
  },
};
