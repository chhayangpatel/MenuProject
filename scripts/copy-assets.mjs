/**
 * Copies restaurant assets from restaurants/<slug>/assets/ to public/r/<slug>/assets/
 * so they can be served at /r/<slug>/assets/... during dev and build.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const restaurantsDir = path.join(root, 'restaurants');
const publicDir = path.join(root, 'public');

async function copyDir(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            await copyDir(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    }
}

async function main() {
    const entries = await fs.readdir(restaurantsDir, { withFileTypes: true });
    for (const entry of entries) {
        if (!entry.isDirectory() || entry.name === '_template') continue;
        const assetsDir = path.join(restaurantsDir, entry.name, 'assets');
        try {
            await fs.access(assetsDir);
        } catch {
            continue; // no assets folder — skip
        }
        const destDir = path.join(publicDir, 'r', entry.name, 'assets');
        await copyDir(assetsDir, destDir);
        console.log(`✓ Copied assets for ${entry.name}`);
    }
    console.log('Asset copy complete.');
}

main().catch((err) => {
    console.error('Failed to copy assets:', err);
    process.exit(1);
});