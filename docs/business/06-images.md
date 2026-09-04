# Images & Logos

All restaurant images live in `restaurants/<slug>/assets/`.

```
restaurants/<slug>/
├── config.json
└── assets/
    ├── logo.svg              ← your logo (shown in header & directory)
    ├── cover.svg             ← hero/cover image (top of the page, required for best look)
    └── menu/
        ├── latte.svg         ← item photos (referenced as "menu/latte.svg" in items)
        └── drinks-banner.svg ← category banner (referenced as heroImage)
```

## File formats

| Format | Use for | Notes |
|---|---|---|
| **SVG** | Logos, icons, simple illustrations | Crisp at any size, tiny file size — recommended for logos |
| **PNG** | Photos with transparency, logos with shadows | Good quality, larger files |
| **JPG / JPEG** | Real photos (menu items, covers) | Smallest for photos — preferred for item photos |
| **WEBP** | Modern photos, smaller still | Supported in all current browsers |

> Tip: for **item photos and banners**, SVG is usually the wrong choice unless it's an illustration. Use JPG/WEBP for real food photography.

## Sizes & recommendations

| Image | Suggested size | Why |
|---|---|---|
| `logo` | Square, 128–512px | Shown small (32px) in header, medium in directory cards |
| `cover` | 1600×900 (16:9) | Full hero backdrop |
| Item photo | 240×240 or larger, square-ish | Cards clip to ~88px thumbnails + detail sheet |
| Category banner | 1600 wide, any height ≤ 800 | Full-bleed section background |

## How to reference files in `config.json`

Paths are **relative to `assets/`**:

```jsonc
// logo at assets/logo.svg
"logo": "logo.svg"

// cover at assets/cover.jpg
"coverImage": "cover.jpg"

// an item photo at assets/menu/latte.jpg
"image": "menu/latte.jpg"

// a category banner at assets/drinks-banner.jpg
"heroImage": "drinks-banner.jpg"
```

## After adding images

1. Add/overwrite the file in the right `assets/` folder
2. Make sure the `config.json` path matches the filename **exactly** (case-sensitive)
3. In dev mode, refresh the page — new images appear (you may need a hard refresh: **Ctrl+Shift+R**)

## Missing images

- If an item has no `image`, the card simply shows text — nothing breaks.
- If you reference a file that doesn't exist, the image area shows a blank/gray box. Check the filename spelling.

## Optimizing for a fast site

- Compress photos (tinypng.com or similar) before adding — big photos slow the site.
- Keep logos as SVG — they're tiny.
- Don't use gigantic 5000px photos where a 1600px one works.