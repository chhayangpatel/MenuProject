/**
 * Updates registry.ts, components.ts, and TemplateStyleManager.astro
 * to include the 5 new templates.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const NEW_TEMPLATES = [
    { id: 'dark-luxe', name: 'Dark Luxe', prefix: 'dl', layout: 'cinematic', effects: ['spotlight', 'shimmer'], intensity: 6, entryDuration: 1000, staggerDelay: 100, parallaxDepth: 0.4, fallback: 'fade', hero: 'clamp(3rem, 7vw, 5rem)', primary: '#0A0A0A', secondary: '#1A1A1A', accent: '#D4AF37', heading: '"Cormorant Garamond", "Playfair Display", serif', body: '"Inter", sans-serif', radius: 'sm', fonts: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap' },
    { id: 'seaside-coastal', name: 'Seaside Coastal', prefix: 'sc', layout: 'airy', effects: ['wave-drift', 'salt-mist'], intensity: 3, entryDuration: 1200, staggerDelay: 120, parallaxDepth: 0.2, fallback: 'fade', hero: 'clamp(2.5rem, 6vw, 4rem)', primary: '#1B3A4B', secondary: '#F0F7F9', accent: '#00A896', heading: '"DM Serif Display", serif', body: '"DM Sans", sans-serif', radius: 'xl', fonts: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap' },
    { id: 'zen-garden', name: 'Zen Garden', prefix: 'zg', layout: 'zen', effects: ['ink-wash', 'bamboo-sway'], intensity: 2, entryDuration: 1500, staggerDelay: 150, parallaxDepth: 0.1, fallback: 'instant', hero: 'clamp(2rem, 5vw, 3.5rem)', primary: '#1C1C1C', secondary: '#FAFAF7', accent: '#8B7355', heading: '"Noto Serif JP", serif', body: '"Noto Sans JP", sans-serif', radius: 'none', fonts: 'https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400;500;600;700&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap' },
    { id: 'retro-diner', name: 'Retro Diner', prefix: 'rd', layout: 'retro', effects: ['neon-flicker', 'jukebox-bounce'], intensity: 9, entryDuration: 400, staggerDelay: 40, parallaxDepth: 0.6, fallback: 'instant', hero: 'clamp(2.5rem, 7vw, 4.5rem)', primary: '#1A1A2E', secondary: '#FFF8E7', accent: '#FF6B6B', heading: '"Righteous", "Fredoka One", cursive', body: '"Quicksand", sans-serif', radius: 'full', fonts: 'https://fonts.googleapis.com/css2?family=Righteous&family=Quicksand:wght@400;500;600;700&display=swap' },
    { id: 'artisan-craft', name: 'Artisan Craft', prefix: 'ac', layout: 'artisan', effects: ['paper-grain', 'ink-bleed'], intensity: 4, entryDuration: 1000, staggerDelay: 100, parallaxDepth: 0.2, fallback: 'fade', hero: 'clamp(2.5rem, 6vw, 4rem)', primary: '#3E2723', secondary: '#F5F0E8', accent: '#8D6E63', heading: '"Lora", serif', body: '"Source Sans 3", sans-serif', radius: 'md', fonts: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap' },
];

async function updateRegistry() {
    const filePath = path.join(root, 'src', 'lib', 'templates', 'registry.ts');
    let content = await fs.readFile(filePath, 'utf-8');

    // Add to TemplateId type
    const typeLine = "  | 'vibrant-playful';";
    const newTypeLine = NEW_TEMPLATES.map(t => `  | '${t.id}'`).join('\n') + '\n' + typeLine;
    content = content.replace(typeLine, newTypeLine);

    // Add to LayoutType
    const layoutLine = "export type LayoutType = 'editorial' | 'minimal' | 'bento' | 'story' | 'carousel';";
    const newLayoutLine = "export type LayoutType = 'editorial' | 'minimal' | 'bento' | 'story' | 'carousel' | 'cinematic' | 'airy' | 'zen' | 'retro' | 'artisan';";
    content = content.replace(layoutLine, newLayoutLine);

    // Add to TemplateEffect
    const effectLine = "  | 'marquee';        // scrolling hype strip (bold-street)";
    const newEffectLine = NEW_TEMPLATES.flatMap(t => t.effects.map(e => `  | '${e}'`)).join('\n') + '\n' + effectLine;
    content = content.replace(effectLine, newEffectLine);

    // Add template entries before the closing of the templates object
    const closingBrace = "  'vibrant-playful': {\n    ...\n  },\n};";
    // Find the last entry and add after it
    const lastEntryEnd = content.indexOf("  'vibrant-playful': {\n    id: 'vibrant-playful',\n    name: 'Vibrant Playful',");
    const lastEntryClose = content.indexOf("  },\n};", lastEntryEnd);
    const insertPos = lastEntryClose + 4; // after "  },"

    const newEntries = NEW_TEMPLATES.map(t => `
  '${t.id}': {
    id: '${t.id}',
    name: '${t.name}',
    description: '${t.name} template.',
    layout: '${t.layout}',
    defaultMoodPreset: 'fine-dining',
    prefix: '${t.prefix}',
    fonts: '${t.fonts}',
    effects: ${JSON.stringify(t.effects)},
    components: {
      Hero: '${t.id}/Hero',
      Header: '${t.id}/Header',
      CategoryNav: '${t.id}/CategoryNav',
      CategoryHero: '${t.id}/CategoryHero',
      MenuCard: '${t.id}/MenuCard',
      FeaturedCarousel: '${t.id}/FeaturedCarousel',
      Footer: '${t.id}/Footer',
    },
    motion: {
      intensity: ${t.intensity},
      entryDuration: ${t.entryDuration},
      staggerDelay: ${t.staggerDelay},
      easings: EASINGS,
      parallaxDepth: ${t.parallaxDepth},
      reducedMotionFallback: '${t.fallback}',
    },
    typography: {
      ...TYPOGRAPHY_BASE,
      hero: '${t.hero}',
    },
    colorDefaults: {
      primaryColor: '${t.primary}',
      secondaryColor: '${t.secondary}',
      accentColor: '${t.accent}',
      fontHeading: '${t.heading}',
      fontBody: '${t.body}',
      borderRadius: '${t.radius}',
    },
  },`).join('\n');

    content = content.slice(0, insertPos) + '\n' + newEntries + '\n' + content.slice(insertPos);

    await fs.writeFile(filePath, content);
    console.log('✓ Updated registry.ts');
}

async function updateComponents() {
    const filePath = path.join(root, 'src', 'lib', 'templates', 'components.ts');
    let content = await fs.readFile(filePath, 'utf-8');

    // Add imports
    const lastImport = `import PlayfulFooter from "./vibrant-playful/Footer.astro";`;
    const newImports = NEW_TEMPLATES.map(t => {
        const cap = t.id.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('');
        return `import ${cap}Hero from "./${t.id}/Hero.astro";\nimport ${cap}Header from "./${t.id}/Header.astro";\nimport ${cap}CategoryNav from "./${t.id}/CategoryNav.astro";\nimport ${cap}CategoryHero from "./${t.id}/CategoryHero.astro";\nimport ${cap}MenuCard from "./${t.id}/MenuCard.astro";\nimport ${cap}FeaturedCarousel from "./${t.id}/FeaturedCarousel.astro";\nimport ${cap}Footer from "./${t.id}/Footer.astro";`;
    }).join('\n');
    content = content.replace(lastImport, lastImport + '\n\n' + newImports);

    // Add to templateComponents object
    const lastEntry = `    "vibrant-playful": {\n        Hero: PlayfulHero,\n        Header: PlayfulHeader,\n        CategoryNav: PlayfulCategoryNav,\n        CategoryHero: PlayfulCategoryHero,\n        MenuCard: PlayfulMenuCard,\n        FeaturedCarousel: PlayfulFeaturedCarousel,\n        Footer: PlayfulFooter,\n    },\n};`;

    const newEntries = NEW_TEMPLATES.map(t => {
        const cap = t.id.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('');
        return `    "${t.id}": {\n        Hero: ${cap}Hero,\n        Header: ${cap}Header,\n        CategoryNav: ${cap}CategoryNav,\n        CategoryHero: ${cap}CategoryHero,\n        MenuCard: ${cap}MenuCard,\n        FeaturedCarousel: ${cap}FeaturedCarousel,\n        Footer: ${cap}Footer,\n    },`;
    }).join('\n');

    content = content.replace(lastEntry, lastEntry.slice(0, -2) + '\n' + newEntries + '\n};');

    await fs.writeFile(filePath, content);
    console.log('✓ Updated components.ts');
}

async function updateStyleManager() {
    const filePath = path.join(root, 'src', 'components', 'TemplateStyleManager.astro');
    let content = await fs.readFile(filePath, 'utf-8');

    // Add CSS imports
    const lastImport = `import playfulCSS from "../lib/templates/vibrant-playful/styles.css?raw";`;
    const newImports = NEW_TEMPLATES.map(t => `import ${t.prefix}CSS from "../lib/templates/${t.id}/styles.css?raw";`).join('\n');
    content = content.replace(lastImport, lastImport + '\n' + newImports);

    // Add to cssByTemplate
    const lastEntry = `  "vibrant-playful": playfulCSS,\n};`;
    const newEntries = NEW_TEMPLATES.map(t => `  "${t.id}": ${t.prefix}CSS,`).join('\n');
    content = content.replace(lastEntry, lastEntry.slice(0, -2) + '\n' + newEntries + '\n};');

    await fs.writeFile(filePath, content);
    console.log('✓ Updated TemplateStyleManager.astro');
}

async function main() {
    await updateRegistry();
    await updateComponents();
    await updateStyleManager();
    console.log('\nAll registry files updated! Run `npm run build` to verify.');
}

main().catch((err) => {
    console.error('Failed:', err);
    process.exit(1);
});