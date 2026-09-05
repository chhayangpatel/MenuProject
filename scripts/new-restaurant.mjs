import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';

async function create() {
  const { values } = parseArgs({
    options: {
      name: { type: 'string' },
      slug: { type: 'string' }
    }
  });

  if (!values.name) {
    console.error("Usage: node new-restaurant.mjs --name 'Restaurant Name'");
    process.exit(1);
  }

  const name = values.name;
  const slug =
    values.slug ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const base = path.join(process.cwd(), 'restaurants');
  const templateDir = path.join(base, '_template');
  const targetDir = path.join(base, slug);

  try {
    await fs.access(templateDir);
    await fs.cp(templateDir, targetDir, { recursive: true });

    const configPath = path.join(targetDir, 'config.json');
    let config = await fs.readFile(configPath, 'utf-8');

    config = config.replace(/"slug": ".*?"/, `"slug": "${slug}"`);
    config = config.replace(/"name": ".*?"/, `"name": "${name}"`);

    await fs.writeFile(configPath, config);

    console.log('✅ Scaffolded ' + name + ' at restaurants/' + slug);
    console.log('Next steps:');
    console.log('  1. Edit restaurants/' + slug + '/config.json (menu, hours, contact)');
    console.log('  2. Add logo + photos to restaurants/' + slug + '/assets/');
    console.log('  3. npm run validate:configs && npm run check:contrast');
  } catch (err) {
    console.error('Error creating restaurant:', err);
    process.exit(1);
  }
}

create();