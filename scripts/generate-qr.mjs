/**
 * generate-qr.mjs - build-time QR code generation per restaurant (Phase 2.2).
 * Writes dist/r/<slug>/qr.svg - an SVG QR code linking to the live menu.
 * Runs automatically after `astro build` via the `build` npm script.
 */
import fs from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";

async function main() {
    const dist = path.join(process.cwd(), "dist");
    const restaurantsDir = path.join(process.cwd(), "restaurants");

    let dirs;
    try {
        dirs = (await fs.readdir(restaurantsDir, { withFileTypes: true })).filter(
            (d) => d.isDirectory() && d.name !== "_template"
        );
    } catch {
        console.warn("generate-qr: no restaurants directory - skipping.");
        return;
    }

    const site =
        process.env.SITE_URL ||
        process.env.PUBLIC_SITE_URL ||
        "https://chhayangpatel.github.io/MenuProject/";
    const siteUrl = site.endsWith("/") ? site : site + "/";

    let count = 0;
    for (const dir of dirs) {
        let slug = dir.name;
        try {
            const config = JSON.parse(
                await fs.readFile(
                    path.join(restaurantsDir, dir.name, "config.json"),
                    "utf-8"
                )
            );
            slug = config.slug || dir.name;
        } catch {
            // skip silently - validate:configs reports config errors
            continue;
        }

        const menuUrl = new URL(`r/${slug}/`, siteUrl).href;
        const svg = await QRCode.toString(menuUrl, {
            type: "svg",
            margin: 1,
            width: 512,
            color: { dark: "#000000", light: "#ffffff" },
        });

        const outDir = path.join(dist, "r", slug);
        await fs.mkdir(outDir, { recursive: true });
        await fs.writeFile(path.join(outDir, "qr.svg"), svg, "utf-8");
        count++;
    }
    console.log(`Generated ${count} QR code(s) in dist/r/<slug>/qr.svg`);
}

main().catch((err) => {
    console.error("QR generation failed:", err);
    process.exit(1);
});