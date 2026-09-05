import type { MoodPresetName } from '../moodPresets';

export type TemplateId =
  | 'editorial-classic'
  | 'modern-minimal'
  | 'bold-street'
  | 'warm-rustic'
  | 'vibrant-playful'
  | 'dark-luxe'
  | 'seaside-coastal'
  | 'zen-garden'
  | 'retro-diner'
  | 'artisan-craft';

export type LayoutType = 'editorial' | 'minimal' | 'bento' | 'story' | 'carousel' | 'cinematic' | 'airy' | 'zen' | 'retro' | 'artisan';

export type TemplateEffect =
  | 'scramble'
  | 'kenburns'
  | 'typewriter'
  | 'numeral-fill'
  | 'blob-morph'
  | 'marquee'
  | 'spotlight'
  | 'shimmer'
  | 'wave-drift'
  | 'salt-mist'
  | 'ink-wash'
  | 'bamboo-sway'
  | 'neon-flicker'
  | 'jukebox-bounce'
  | 'paper-grain'
  | 'ink-bleed';

export interface MotionConfig {
  intensity: number;
  entryDuration: number;
  staggerDelay: number;
  easings: {
    outExpo: string;
    spring: string;
    fluid: string;
    snap: string;
  };
  parallaxDepth: number;
  reducedMotionFallback: 'instant' | 'fade';
}

export interface TypographyScale {
  hero: string;
  section: string;
  body: string;
  caption: string;
  micro: string;
  leadingHeading: string;
  leadingBody: string;
  trackingHeading: string;
  trackingWide: string;
  trackingMicro: string;
}

export interface TemplateColorDefaults {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontHeading?: string;
  fontBody?: string;
  borderRadius?: string;
}

export interface TemplateComponents {
  Hero: string;
  Header: string;
  CategoryNav: string;
  CategoryHero: string;
  MenuCard: string;
  FeaturedCarousel: string;
  Footer: string;
}

export interface Template {
  id: TemplateId;
  name: string;
  description: string;
  layout: LayoutType;
  defaultMoodPreset: MoodPresetName;
  prefix: string;
  fonts: string;
  effects: TemplateEffect[];
  components: TemplateComponents;
  motion: MotionConfig;
  typography: TypographyScale;
  colorDefaults: TemplateColorDefaults;
}

const EASINGS = {
  outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  fluid: 'cubic-bezier(0.32, 0.72, 0, 1)',
  snap: 'cubic-bezier(0.76, 0, 0.24, 1)',
};

const TYPOGRAPHY_BASE = {
  hero: 'clamp(2.4rem, 7vw, 4.5rem)',
  section: 'clamp(1.5rem, 4vw, 2rem)',
  body: '1rem',
  caption: '0.8125rem',
  micro: '0.6875rem',
  leadingHeading: '1.05',
  leadingBody: '1.75',
  trackingHeading: '-0.02em',
  trackingWide: '0.04em',
  trackingMicro: '0.08em',
};

export const templates: Record<TemplateId, Template> = {
  'editorial-classic': {
    id: 'editorial-classic',
    name: 'Editorial Classic',
    description: 'Fine dining, heritage establishments, multi-course tasting menus. Serif display, generous whitespace, gold accents, slow cinematic scroll.',
    layout: 'editorial',
    defaultMoodPreset: 'fine-dining',
    prefix: 'ec',
    fonts: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap',
    effects: ['kenburns'],
    components: {
      Hero: 'editorial-classic/Hero',
      Header: 'editorial-classic/Header',
      CategoryNav: 'editorial-classic/CategoryNav',
      CategoryHero: 'editorial-classic/CategoryHero',
      MenuCard: 'editorial-classic/MenuCard',
      FeaturedCarousel: 'editorial-classic/FeaturedCarousel',
      Footer: 'editorial-classic/Footer',
    },
    motion: {
      intensity: 4,
      entryDuration: 1200,
      staggerDelay: 120,
      easings: EASINGS,
      parallaxDepth: 0.3,
      reducedMotionFallback: 'instant',
    },
    typography: {
      ...TYPOGRAPHY_BASE,
      hero: 'clamp(3rem, 8vw, 5.5rem)',
      leadingHeading: '1.05',
      leadingBody: '1.8',
    },
    colorDefaults: {
      primaryColor: '#1A1612',
      secondaryColor: '#FDFBF7',
      accentColor: '#C9A227',
      fontHeading: '"PP Editorial New", "Playfair Display", serif',
      fontBody: '"Plus Jakarta Sans", sans-serif',
      borderRadius: 'lg',
    },
  },
  'modern-minimal': {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Coffee shops, bakeries, plant-forward, aesthetic-first brands. Geometric sans, airy grid, subtle motion, card-forward.',
    layout: 'minimal',
    defaultMoodPreset: 'modern-minimal',
    prefix: 'mm',
    fonts: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap',
    effects: ['numeral-fill'],
    components: {
      Hero: 'modern-minimal/Hero',
      Header: 'modern-minimal/Header',
      CategoryNav: 'modern-minimal/CategoryNav',
      CategoryHero: 'modern-minimal/CategoryHero',
      MenuCard: 'modern-minimal/MenuCard',
      FeaturedCarousel: 'modern-minimal/FeaturedCarousel',
      Footer: 'modern-minimal/Footer',
    },
    motion: {
      intensity: 3,
      entryDuration: 800,
      staggerDelay: 80,
      easings: EASINGS,
      parallaxDepth: 0,
      reducedMotionFallback: 'fade',
    },
    typography: {
      ...TYPOGRAPHY_BASE,
      hero: 'clamp(2.5rem, 6vw, 4rem)',
      leadingHeading: '1.02',
      leadingBody: '1.7',
    },
    colorDefaults: {
      primaryColor: '#1A1A1A',
      secondaryColor: '#FAFAF8',
      accentColor: '#4A7C59',
      fontHeading: '"Space Grotesk", sans-serif',
      fontBody: '"Plus Jakarta Sans", sans-serif',
      borderRadius: 'xl',
    },
  },
  'bold-street': {
    id: 'bold-street',
    name: 'Bold Street',
    description: 'Burgers, tacos, street food, high-volume, social-first. Display sans, high contrast, glitch/kinetic motion, bento grid.',
    layout: 'bento',
    defaultMoodPreset: 'bold-street',
    prefix: 'bs',
    fonts: 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@400;500;600;700&display=swap',
    effects: ['scramble', 'marquee'],
    components: {
      Hero: 'bold-street/Hero',
      Header: 'bold-street/Header',
      CategoryNav: 'bold-street/CategoryNav',
      CategoryHero: 'bold-street/CategoryHero',
      MenuCard: 'bold-street/MenuCard',
      FeaturedCarousel: 'bold-street/FeaturedCarousel',
      Footer: 'bold-street/Footer',
    },
    motion: {
      intensity: 8,
      entryDuration: 600,
      staggerDelay: 60,
      easings: EASINGS,
      parallaxDepth: 0.5,
      reducedMotionFallback: 'instant',
    },
    typography: {
      ...TYPOGRAPHY_BASE,
      hero: 'clamp(2rem, 5vw, 3.5rem)',
      leadingHeading: '1.0',
      leadingBody: '1.6',
    },
    colorDefaults: {
      primaryColor: '#0A0A0A',
      secondaryColor: '#FFFFFF',
      accentColor: '#FF1744',
      fontHeading: '"Archivo Black", sans-serif',
      fontBody: '"DM Sans", sans-serif',
      borderRadius: 'none',
    },
  },
  'warm-rustic': {
    id: 'warm-rustic',
    name: 'Warm Rustic',
    description: 'Farm-to-table, BBQ, comfort food, heritage, storytelling. Editorial serif + warm sans, paper textures, hand-drawn motifs.',
    layout: 'story',
    defaultMoodPreset: 'rustic-traditional',
    prefix: 'wr',
    fonts: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700;9..144,800;9..144,900&family=Crimson+Pro:wght@300;400;500;600;700&display=swap',
    effects: ['typewriter'],
    components: {
      Hero: 'warm-rustic/Hero',
      Header: 'warm-rustic/Header',
      CategoryNav: 'warm-rustic/CategoryNav',
      CategoryHero: 'warm-rustic/CategoryHero',
      MenuCard: 'warm-rustic/MenuCard',
      FeaturedCarousel: 'warm-rustic/FeaturedCarousel',
      Footer: 'warm-rustic/Footer',
    },
    motion: {
      intensity: 4,
      entryDuration: 1500,
      staggerDelay: 150,
      easings: EASINGS,
      parallaxDepth: 0.2,
      reducedMotionFallback: 'instant',
    },
    typography: {
      ...TYPOGRAPHY_BASE,
      hero: 'clamp(2.5rem, 6vw, 4rem)',
      leadingHeading: '1.08',
      leadingBody: '1.85',
    },
    colorDefaults: {
      primaryColor: '#2D1B10',
      secondaryColor: '#FEF9F0',
      accentColor: '#C45A2A',
      fontHeading: '"Fraunces", serif',
      fontBody: '"Crimson Pro", serif',
      borderRadius: 'lg',
    },
  },
  'vibrant-playful': {
    id: 'vibrant-playful',
    name: 'Vibrant Playful',
    description: 'Dessert, ice cream, brunch, bubble tea, family-friendly. Rounded display, pastel/neon palette, spring physics, illustrated.',
    layout: 'carousel',
    defaultMoodPreset: 'playful-casual',
    prefix: 'vp',
    fonts: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap',
    effects: ['blob-morph'],
    components: {
      Hero: 'vibrant-playful/Hero',
      Header: 'vibrant-playful/Header',
      CategoryNav: 'vibrant-playful/CategoryNav',
      CategoryHero: 'vibrant-playful/CategoryHero',
      MenuCard: 'vibrant-playful/MenuCard',
      FeaturedCarousel: 'vibrant-playful/FeaturedCarousel',
      Footer: 'vibrant-playful/Footer',
    },
    motion: {
      intensity: 7,
      entryDuration: 500,
      staggerDelay: 50,
      easings: EASINGS,
      parallaxDepth: 0.4,
      reducedMotionFallback: 'fade',
    },
    typography: {
      ...TYPOGRAPHY_BASE,
      hero: 'clamp(2.5rem, 7vw, 4.5rem)',
      leadingHeading: '1.02',
      leadingBody: '1.7',
    },
    colorDefaults: {
      primaryColor: '#1A1A2E',
      secondaryColor: '#FFFDF5',
      accentColor: '#FF8A65',
      fontHeading: '"Outfit", sans-serif',
      fontBody: '"Outfit", sans-serif',
      borderRadius: 'full',
    },
  },
  'dark-luxe': {
    id: 'dark-luxe',
    name: 'Dark Luxe',
    description: 'High-end steakhouse, cocktail bar, Michelin-star restaurant. Dark mode only, dramatic lighting, gold/bronze accents, cinematic typography.',
    layout: 'cinematic',
    defaultMoodPreset: 'fine-dining',
    prefix: 'dl',
    fonts: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap',
    effects: ['spotlight', 'shimmer'],
    components: {
      Hero: 'dark-luxe/Hero',
      Header: 'dark-luxe/Header',
      CategoryNav: 'dark-luxe/CategoryNav',
      CategoryHero: 'dark-luxe/CategoryHero',
      MenuCard: 'dark-luxe/MenuCard',
      FeaturedCarousel: 'dark-luxe/FeaturedCarousel',
      Footer: 'dark-luxe/Footer',
    },
    motion: {
      intensity: 6,
      entryDuration: 1000,
      staggerDelay: 100,
      easings: EASINGS,
      parallaxDepth: 0.4,
      reducedMotionFallback: 'fade',
    },
    typography: {
      ...TYPOGRAPHY_BASE,
      hero: 'clamp(3rem, 7vw, 5rem)',
    },
    colorDefaults: {
      primaryColor: '#0A0A0A',
      secondaryColor: '#111111',
      accentColor: '#D4AF37',
      fontHeading: '"Cormorant Garamond", "Playfair Display", serif',
      fontBody: '"Inter", sans-serif',
      borderRadius: 'sm',
    },
  },
  'seaside-coastal': {
    id: 'seaside-coastal',
    name: 'Seaside Coastal',
    description: 'Seafood restaurant, beach club, coastal dining. Airy, ocean-inspired palette, wave motifs, relaxed elegance.',
    layout: 'airy',
    defaultMoodPreset: 'modern-minimal',
    prefix: 'sc',
    fonts: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap',
    effects: ['wave-drift', 'salt-mist'],
    components: {
      Hero: 'seaside-coastal/Hero',
      Header: 'seaside-coastal/Header',
      CategoryNav: 'seaside-coastal/CategoryNav',
      CategoryHero: 'seaside-coastal/CategoryHero',
      MenuCard: 'seaside-coastal/MenuCard',
      FeaturedCarousel: 'seaside-coastal/FeaturedCarousel',
      Footer: 'seaside-coastal/Footer',
    },
    motion: {
      intensity: 3,
      entryDuration: 1200,
      staggerDelay: 120,
      easings: EASINGS,
      parallaxDepth: 0.2,
      reducedMotionFallback: 'fade',
    },
    typography: {
      ...TYPOGRAPHY_BASE,
      hero: 'clamp(2.5rem, 6vw, 4rem)',
    },
    colorDefaults: {
      primaryColor: '#1B3A4B',
      secondaryColor: '#F0F7F9',
      accentColor: '#00A896',
      fontHeading: '"DM Serif Display", serif',
      fontBody: '"DM Sans", sans-serif',
      borderRadius: 'xl',
    },
  },
  'zen-garden': {
    id: 'zen-garden',
    name: 'Zen Garden',
    description: 'Japanese omakase, sushi bar, tea house. Minimalist, asymmetric balance, negative space, meditative experience.',
    layout: 'zen',
    defaultMoodPreset: 'fine-dining',
    prefix: 'zg',
    fonts: 'https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400;500;600;700&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap',
    effects: ['ink-wash', 'bamboo-sway'],
    components: {
      Hero: 'zen-garden/Hero',
      Header: 'zen-garden/Header',
      CategoryNav: 'zen-garden/CategoryNav',
      CategoryHero: 'zen-garden/CategoryHero',
      MenuCard: 'zen-garden/MenuCard',
      FeaturedCarousel: 'zen-garden/FeaturedCarousel',
      Footer: 'zen-garden/Footer',
    },
    motion: {
      intensity: 2,
      entryDuration: 1500,
      staggerDelay: 150,
      easings: EASINGS,
      parallaxDepth: 0.1,
      reducedMotionFallback: 'instant',
    },
    typography: {
      ...TYPOGRAPHY_BASE,
      hero: 'clamp(2rem, 5vw, 3.5rem)',
    },
    colorDefaults: {
      primaryColor: '#1C1C1C',
      secondaryColor: '#FAFAF7',
      accentColor: '#8B7355',
      fontHeading: '"Noto Serif JP", serif',
      fontBody: '"Noto Sans JP", sans-serif',
      borderRadius: 'none',
    },
  },
  'retro-diner': {
    id: 'retro-diner',
    name: 'Retro Diner',
    description: 'Classic American diner, milkshake bar, 1950s nostalgia. Bold colors, neon accents, playful typography, checkered patterns.',
    layout: 'retro',
    defaultMoodPreset: 'bold-street',
    prefix: 'rd',
    fonts: 'https://fonts.googleapis.com/css2?family=Righteous&family=Quicksand:wght@400;500;600;700&display=swap',
    effects: ['neon-flicker', 'jukebox-bounce'],
    components: {
      Hero: 'retro-diner/Hero',
      Header: 'retro-diner/Header',
      CategoryNav: 'retro-diner/CategoryNav',
      CategoryHero: 'retro-diner/CategoryHero',
      MenuCard: 'retro-diner/MenuCard',
      FeaturedCarousel: 'retro-diner/FeaturedCarousel',
      Footer: 'retro-diner/Footer',
    },
    motion: {
      intensity: 9,
      entryDuration: 400,
      staggerDelay: 40,
      easings: EASINGS,
      parallaxDepth: 0.6,
      reducedMotionFallback: 'instant',
    },
    typography: {
      ...TYPOGRAPHY_BASE,
      hero: 'clamp(2.5rem, 7vw, 4.5rem)',
    },
    colorDefaults: {
      primaryColor: '#1A1A2E',
      secondaryColor: '#FFF8E7',
      accentColor: '#FF6B6B',
      fontHeading: '"Righteous", "Fredoka One", cursive',
      fontBody: '"Quicksand", sans-serif',
      borderRadius: 'full',
    },
  },
  'artisan-craft': {
    id: 'artisan-craft',
    name: 'Artisan Craft',
    description: 'Craft brewery, wine bar, artisanal food. Hand-drawn elements, craft paper textures, warm earthy tones, storytelling focus.',
    layout: 'artisan',
    defaultMoodPreset: 'rustic-traditional',
    prefix: 'ac',
    fonts: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap',
    effects: ['paper-grain', 'ink-bleed'],
    components: {
      Hero: 'artisan-craft/Hero',
      Header: 'artisan-craft/Header',
      CategoryNav: 'artisan-craft/CategoryNav',
      CategoryHero: 'artisan-craft/CategoryHero',
      MenuCard: 'artisan-craft/MenuCard',
      FeaturedCarousel: 'artisan-craft/FeaturedCarousel',
      Footer: 'artisan-craft/Footer',
    },
    motion: {
      intensity: 4,
      entryDuration: 1000,
      staggerDelay: 100,
      easings: EASINGS,
      parallaxDepth: 0.2,
      reducedMotionFallback: 'fade',
    },
    typography: {
      ...TYPOGRAPHY_BASE,
      hero: 'clamp(2.5rem, 6vw, 4rem)',
    },
    colorDefaults: {
      primaryColor: '#3E2723',
      secondaryColor: '#F5F0E8',
      accentColor: '#8D6E63',
      fontHeading: '"Lora", serif',
      fontBody: '"Source Sans 3", sans-serif',
      borderRadius: 'md',
    },
  },
};

export const moodPresetToTemplate: Record<MoodPresetName, TemplateId> = {
  'fine-dining': 'editorial-classic',
  'modern-minimal': 'modern-minimal',
  'rustic-traditional': 'warm-rustic',
  'playful-casual': 'vibrant-playful',
  'bold-street': 'bold-street',
};

export function getTemplate(templateId?: string | null, moodPreset?: MoodPresetName): Template {
  if (templateId && templateId in templates) {
    return templates[templateId as TemplateId];
  }
  if (moodPreset && moodPresetToTemplate[moodPreset]) {
    return templates[moodPresetToTemplate[moodPreset]];
  }
  return templates['editorial-classic'];
}

export function getTemplateIds(): TemplateId[] {
  return Object.keys(templates) as TemplateId[];
}

export function getTemplateNames(): Record<TemplateId, string> {
  const names: Partial<Record<TemplateId, string>> = {};
  for (const [id, template] of Object.entries(templates)) {
    names[id as TemplateId] = template.name;
  }
  return names as Record<TemplateId, string>;
}