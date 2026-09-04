import fs from 'node:fs/promises';
import path from 'node:path';

const svgLogo = '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#ddd"/><text x="100" y="100" font-family="sans-serif" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="#555">Logo</text></svg>';
const svgCover = '<svg width="1200" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="600" fill="#eee"/><text x="600" y="300" font-family="sans-serif" font-size="48" text-anchor="middle" dominant-baseline="middle" fill="#999">Cover Image</text></svg>';
const svgItem = '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="#f5f5f5"/><text x="200" y="150" font-family="sans-serif" font-size="32" text-anchor="middle" dominant-baseline="middle" fill="#bbb">Photo</text></svg>';

const restaurants = [
  { slug: '_template', items: ['example-item'] },
  { slug: 'bella-italia', items: ['bruschetta', 'carbonara'] },
  { slug: 'neon-burger', items: ['burger', 'chicken'] },
];

async function setup() {
  const base = path.join(process.cwd(), 'restaurants');
  
  for (const r of restaurants) {
    const assetsDir = path.join(base, r.slug, 'assets');
    const menuDir = path.join(assetsDir, 'menu');
    
    await fs.mkdir(menuDir, { recursive: true });
    
    await fs.writeFile(path.join(assetsDir, 'logo.svg'), svgLogo);
    await fs.writeFile(path.join(assetsDir, 'cover.svg'), svgCover);
    
    for (const item of r.items) {
      await fs.writeFile(path.join(menuDir, item + '.svg'), svgItem);
    }
  }
  console.log('Dummy assets created successfully.');
}

setup().catch(console.error);
