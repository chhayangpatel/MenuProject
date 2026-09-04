# Awwwards-Tier MenuProject Transformation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the MenuProject from a functional prototype into an Awwwards-tier, immersive menu platform with signature category storytelling, premium design system, and production-ready data model.

**Architecture:** Astro 7 static site with React 19 interactive islands, Tailwind CSS 4, Framer Motion 13. Per-restaurant JSON config validated by Zod at build time. Design driven by 5 mood presets. New immersive category storytelling uses full-bleed hero images per menu section with mood-specific scroll choreography.

**Tech Stack:** Astro 7, React 19, Tailwind CSS 4, Framer Motion 13, Zod 4, Lucide React icons → Phosphor-style thin SVGs, Google Fonts (Plus Jakarta Sans, Playfair Display, Space Grotesk, Archivo Black, DM Sans, Outfit, Fraunces, Crimson Pro)

**Spec:** `docs/superpowers/specs/2026-09-04-menu-project-awwwards-transformation-design.md`

## Global Constraints

- Node >= 22.12.0 (from `package.json` engines)
- All new schema fields must be `.optional()` with `.default()` — backward compatible with existing configs
- No React hydration for scroll animations — use vanilla JS IntersectionObserver (proven pattern in `CategoryNav.astro`)
- All animations respect `prefers-reduced-motion: reduce` — resolve to end state instantly
- React islands budget: under 50KB gzipped combined per page
- Only animate `transform` and `opacity` — no layout-triggering properties
- `backdrop-blur` only on fixed/sticky elements, never scrolling containers
- Custom cubic-bezier curves on ALL transitions — no `linear` or `ease-in-out`
- Mobile collapse: all asymmetric layouts reset to `w-full px-4` below 768px
- Use `min-h-[100dvh]` not `h-screen` (iOS Safari safe)

---

## BATCH 1: Quick Wins — Activate Existing Code

---

### Task 1: SectionDivider Between Categories

**Files:**
- Modify: `src/pages/r/[slug]/index.astro:73-78`

**Interfaces:**
- Consumes: `SectionDivider.astro` (already exists, takes `presetName: MoodPresetName`)
- Produces: Visual divider between category sections

- [ ] **Step 1: Import SectionDivider**

In `src/pages/r/[slug]/index.astro`, add to the import block at line 4:
```astro
import SectionDivider from '../../../components/SectionDivider.astro';
```

- [ ] **Step 2: Replace the plain divider with SectionDivider**

Find the category divider at lines 73-78:
```astro
{index < menu.length - 1 && (
  <div class="category-divider" aria-hidden="true"></div>
)}
```

Replace with:
```astro
{index < menu.length - 1 && (
  <SectionDivider presetName={restaurant.moodPreset} />
)}
```

- [ ] **Step 3: Remove the now-unused .category-divider CSS**

Delete the `.category-divider` style rule (lines 153-158 in the `<style>` block):
```css
/* DELETE THIS */
.category-divider {
  width: 100%;
  height: 1px;
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  margin: 2rem 0 0;
}
```

- [ ] **Step 4: Verify**

Run: `npm run dev`
Open a restaurant page (e.g., `/r/bella-italia/`). Scroll between categories. Each category should now show the mood-specific SVG motif (laurel for fine-dining, dot for modern-minimal, wheat for rustic, wave for playful, stripes for bold-street).

- [ ] **Step 5: Commit**

```bash
git add src/pages/r/\[slug\]/index.astro
git commit -m "feat: activate SectionDivider between menu categories"
```

---

### Task 2: ScrollReveal on Menu Items (Vanilla JS)

**Files:**
- Modify: `src/pages/r/[slug]/index.astro` (template + script + style)

**Interfaces:**
- Consumes: IntersectionObserver API (browser built-in)
- Produces: `.revealed` class on `[data-reveal]` elements with staggered delays

- [ ] **Step 1: Add data-reveal attributes to menu item cards**

In `src/pages/r/[slug]/index.astro`, find the items grid (line 64-69):
```astro
<div class="items-grid">
  {category.items.map(item => (
    <MenuItemCard
      item={item}
      currencySymbol={settings?.currencySymbol}
      showPrices={settings?.showPrices}
    />
  ))}
</div>
```

Change to:
```astro
<div class="items-grid">
  {category.items.map((item, itemIndex) => (
    <div data-reveal style={`transition-delay: ${itemIndex * 100}ms`}>
      <MenuItemCard
        item={item}
        currencySymbol={settings?.currencySymbol}
        showPrices={settings?.showPrices}
      />
    </div>
  ))}
</div>
```

- [ ] **Step 2: Add reveal CSS**

In the `<style>` block, add:
```css
[data-reveal] {
  opacity: 0;
  transform: translateY(16px) filter: blur(4px);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.8s cubic-bezier(0.16, 1, 0.3, 1),
              filter 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}
[data-reveal].revealed {
  opacity: 1;
  transform: translateY(0) filter: blur(0);
}
@media (prefers-reduced-motion: reduce) {
  [data-reveal] {
    opacity: 1;
    transform: none;
    filter: none;
    transition: none;
  }
}
```

- [ ] **Step 3: Add IntersectionObserver in script block**

In the existing `<script>` block (after the `setupCardListeners` function), add:
```js
function setupScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -60px 0px', threshold: 0.1 });

  document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
}

document.addEventListener('astro:page-load', setupScrollReveal);
setupScrollReveal();
```

- [ ] **Step 4: Verify**

Run: `npm run dev`. Open a restaurant page. Items should animate in with staggered fade+rise+deblur as you scroll down. Enable `prefers-reduced-motion` in browser dev tools — items should appear instantly.

- [ ] **Step 5: Commit**

```bash
git add src/pages/r/\[slug\]/index.astro
git commit -m "feat: add staggered scroll-reveal animation to menu items"
```

---

### Task 3: Dietary Filter Chips

**Files:**
- Modify: `src/components/SearchFilterBar.tsx`
- Modify: `src/pages/r/[slug]/index.astro` (pass prop)

**Interfaces:**
- Consumes: `window.__RESTAURANT_ITEMS__` (array of MenuItem, already injected)
- Produces: Toggleable filter chips, filtered item visibility, result count

- [ ] **Step 1: Pass enableDietaryFilters prop**

In `src/pages/r/[slug]/index.astro`, find the SearchFilterBar usage (line 45-48):
```astro
<SearchFilterBar
  client:load
  enabled={settings?.enableSearch ?? true}
/>
```

Change to:
```astro
<SearchFilterBar
  client:load
  enabled={settings?.enableSearch ?? true}
  enableDietaryFilters={settings?.enableDietaryFilters ?? true}
/>
```

- [ ] **Step 2: Rewrite SearchFilterBar with dietary chips**

Replace the entire content of `src/components/SearchFilterBar.tsx` with:

```tsx
import { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';

interface Props {
  enabled: boolean;
  enableDietaryFilters?: boolean;
}

const TAG_LABELS: Record<string, string> = {
  'vegetarian': '🌿 Vegetarian',
  'vegan': '🌱 Vegan',
  'gluten-free': 'GF',
  'dairy-free': 'DF',
  'nut-free': 'NF',
  'halal': 'Halal',
  'kosher': 'Kosher',
  'organic': 'Organic',
  'spicy': '🌶️ Spicy',
};

export default function SearchFilterBar({ enabled, enableDietaryFilters = true }: Props) {
  const [query, setQuery] = useState('');
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [totalItems, setTotalItems] = useState(0);
  const [visibleItems, setVisibleItems] = useState(0);

  // Extract unique tags from menu items
  const availableTags = useMemo(() => {
    const items = (window as any).__RESTAURANT_ITEMS__ || [];
    const tagSet = new Set<string>();
    items.forEach((item: any) => {
      (item.tags || []).forEach((tag: string) => tagSet.add(tag));
      if ((item.spicyLevel || 0) > 0) tagSet.add('spicy');
    });
    return Array.from(tagSet).sort();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const items = document.querySelectorAll('[data-item-id]');
    setTotalItems(items.length);

    let visible = 0;
    items.forEach(el => {
      const name = (el.querySelector('h3')?.textContent || '').toLowerCase();
      const desc = (el.querySelector('p')?.textContent || '').toLowerCase();
      const q = query.toLowerCase();

      // Get this item's tags from the data store
      const id = el.getAttribute('data-item-id');
      const storeItems = (window as any).__RESTAURANT_ITEMS__ || [];
      const storeItem = storeItems.find((i: any) => i.id === id);
      const itemTags = storeItem?.tags || [];
      const isSpicy = (storeItem?.spicyLevel || 0) > 0;

      const matchesSearch = !q || name.includes(q) || desc.includes(q);
      const matchesTags = activeTags.size === 0 || Array.from(activeTags).every(tag => {
        if (tag === 'spicy') return isSpicy;
        return itemTags.includes(tag);
      });

      if (matchesSearch && matchesTags) {
        (el as HTMLElement).style.display = '';
        visible++;
      } else {
        (el as HTMLElement).style.display = 'none';
      }
    });

    setVisibleItems(visible);

    // Hide empty categories
    document.querySelectorAll('section[id^="category-"]').forEach(cat => {
      const visibleInCat = cat.querySelectorAll('[data-item-id]:not([style*="display: none"])');
      (cat as HTMLElement).style.display = (visibleInCat.length === 0 && (query.length > 0 || activeTags.size > 0)) ? 'none' : '';
    });
  }, [query, activeTags, enabled]);

  const toggleTag = (tag: string) => {
    setActiveTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  if (!enabled) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      {/* Search input */}
      <div className="relative max-w-md mx-auto mb-3">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-primary)]/50">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search menu..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2.5 border border-[var(--color-primary)]/10 rounded-full bg-[var(--color-secondary)] text-[var(--color-primary)] placeholder-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent font-body shadow-inner transition-all duration-300"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--color-primary)]/40 hover:text-[var(--color-primary)] transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dietary filter chips */}
      {enableDietaryFilters && availableTags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-2">
          {availableTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                activeTags.has(tag)
                  ? 'bg-[var(--color-accent)] text-white scale-105 shadow-md'
                  : 'bg-[var(--color-primary)]/5 text-[var(--color-primary)]/60 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]'
              }`}
            >
              {TAG_LABELS[tag] || tag}
            </button>
          ))}
        </div>
      )}

      {/* Result count */}
      {(query || activeTags.size > 0) && (
        <p className="text-center text-xs text-[var(--color-primary)]/40 mt-2 font-body">
          Showing {visibleItems} of {totalItems} items
          {visibleItems === 0 && (
            <span className="block mt-1 italic">No items match your filters</span>
          )}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run dev`. Open `bella-italia` or `matcha-minimal` (both have `enableDietaryFilters: true`). Type in search — items filter in real-time. Click dietary chips — items filter by tag. "Showing X of Y" counter updates. Neon-burger (has `enableDietaryFilters: false`) should show search bar but no chips.

- [ ] **Step 4: Commit**

```bash
git add src/components/SearchFilterBar.tsx src/pages/r/\[slug\]/index.astro
git commit -m "feat: add dietary filter chips to SearchFilterBar"
```

---

### Task 4: Back Navigation

**Files:**
- Modify: `src/components/Header.astro`

- [ ] **Step 1: Add back arrow to Header**

In `src/components/Header.astro`, find the flex container (line 16-18):
```astro
<div class="flex items-center gap-3 overflow-hidden">
  <img ... />
  <span class="header-name">{restaurant.name}</span>
</div>
```

Change to:
```astro
<div class="flex items-center gap-3 overflow-hidden">
  <a href="/" class="back-link" aria-label="Back to all restaurants">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  </a>
  <img ... />
  <span class="header-name">{restaurant.name}</span>
</div>
```

- [ ] **Step 2: Add back-link CSS**

In the `<style>` block, add:
```css
.back-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: color-mix(in srgb, var(--color-primary) 60%, transparent);
  transition: color 0.2s, background 0.2s, transform 0.2s;
  flex-shrink: 0;
}
.back-link:hover {
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  transform: translateX(-2px);
}
```

- [ ] **Step 3: Verify**

Open a restaurant page. The back arrow should appear left of the logo. Clicking it navigates to `/`. On the directory page (`/`), the Header component isn't rendered, so no back arrow appears there.

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.astro
git commit -m "feat: add back navigation arrow to restaurant header"
```

---

### Task 5: Dead Code Cleanup

**Files:**
- Delete: `src/components/menus/MagneticNav.jsx`
- Delete: `src/components/menus/FullScreenOverlay.jsx`
- Delete: `src/components/menus/FloatingScrollMenu.jsx`

- [ ] **Step 1: Delete unused files**

```bash
rm src/components/menus/MagneticNav.jsx
rm src/components/menus/FullScreenOverlay.jsx
rm src/components/menus/FloatingScrollMenu.jsx
```

- [ ] **Step 2: Verify build still passes**

Run: `npm run build`
Expected: No errors, clean build. These files were never imported anywhere.

- [ ] **Step 3: Commit**

```bash
git add -A src/components/menus/
git commit -m "chore: remove unused prototype components (MagneticNav, FullScreenOverlay, FloatingScrollMenu)"
```

---

## BATCH 2: Schema Evolution + Supporting UI

---

### Task 6: Restaurant Metadata Schema

**Files:**
- Modify: `src/schemas/restaurant.schema.ts`
- Modify: `restaurants/bella-italia/config.json`
- Modify: `restaurants/neon-burger/config.json`
- Modify: `restaurants/matcha-minimal/config.json`

- [ ] **Step 1: Add cuisine and priceRange to RestaurantSchema**

In `src/schemas/restaurant.schema.ts`, add after the `coverImage` field (line 39):
```ts
cuisine: z.array(z.string()).optional(),
priceRange: z.enum(["$", "$$", "$$$", "$$$$"]).optional(),
```

- [ ] **Step 2: Add metadata to each restaurant config**

`restaurants/bella-italia/config.json` — add after `"tagline"`:
```json
"cuisine": ["Italian", "Pasta", "Wood-Fired"],
"priceRange": "$$$",
```

`restaurants/neon-burger/config.json` — add after `"tagline"`:
```json
"cuisine": ["Burgers", "Street Food", "American"],
"priceRange": "$$",
```

`restaurants/matcha-minimal/config.json` — add after `"tagline"`:
```json
"cuisine": ["Japanese", "Café", "Plant-Based"],
"priceRange": "$$",
```

- [ ] **Step 3: Verify schema validation passes**

Run: `npm run validate:configs`
Expected: All three restaurants pass validation.

- [ ] **Step 4: Commit**

```bash
git add src/schemas/restaurant.schema.ts restaurants/*/config.json
git commit -m "feat: add cuisine and priceRange metadata to restaurant schema"
```

---

### Task 7: Immersive Category Schema

**Files:**
- Modify: `src/schemas/restaurant.schema.ts`
- Modify: `restaurants/bella-italia/config.json`
- Modify: `restaurants/matcha-minimal/config.json`
- Modify: `restaurants/neon-burger/config.json`
- Modify: `restaurants/_template/config.json`

- [ ] **Step 1: Add heroImage and heroQuote to MenuCategorySchema**

In `src/schemas/restaurant.schema.ts`, find MenuCategorySchema (lines 17-22):
```ts
export const MenuCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  items: z.array(MenuItemSchema).min(1),
});
```

Change to:
```ts
export const MenuCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  heroImage: z.string().optional(),
  heroQuote: z.string().optional(),
  items: z.array(MenuItemSchema).min(1),
});
```

- [ ] **Step 2: Add category hero data to restaurant configs**

`restaurants/bella-italia/config.json` — update each category:
```json
{
  "id": "starters",
  "name": "Starters",
  "heroQuote": "Light bites to begin your evening — each one crafted to awaken the palate",
  "items": [...]
},
{
  "id": "mains",
  "name": "Main Courses",
  "heroQuote": "Handmade pasta and wood-fired specialties from our kitchen to your table",
  "items": [...]
}
```

Apply similar `heroQuote` values to `matcha-minimal` and `neon-burger` categories.

Note: `heroImage` fields will be added when real images are available. For now, leave them out and the component will gracefully degrade.

- [ ] **Step 3: Verify**

Run: `npm run validate:configs` — should pass.
Run: `npm run build` — should build cleanly (categories without `heroImage` just won't show the hero section).

- [ ] **Step 4: Commit**

```bash
git add src/schemas/restaurant.schema.ts restaurants/*/config.json
git commit -m "feat: add heroImage and heroQuote to menu category schema"
```

---

### Task 8: Item Variants & Modifiers

**Files:**
- Modify: `src/schemas/restaurant.schema.ts`
- Modify: `restaurants/_template/config.json`
- Modify: `src/components/ItemDetailSheet.tsx` (variant/modifier UI)
- Modify: `src/components/MenuItemCard.astro` ("From $X.XX" for variants)

- [ ] **Step 1: Add variants and modifiers to MenuItemSchema**

In `src/schemas/restaurant.schema.ts`, add after the `featured` field:
```ts
variants: z.array(z.object({
  id: z.string(),
  name: z.string(),
  priceModifier: z.number(),
})).optional(),
modifiers: z.array(z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  group: z.string().optional(),
})).optional(),
```

- [ ] **Step 2: Update template config with example**

In `restaurants/_template/config.json`, update the example item:
```json
{
  "id": "example-item",
  "name": "Example Item",
  "description": "An example menu item with variants.",
  "price": 10,
  "available": true,
  "variants": [
    { "id": "small", "name": "Small", "priceModifier": 0 },
    { "id": "medium", "name": "Medium", "priceModifier": 3 },
    { "id": "large", "name": "Large", "priceModifier": 5 }
  ],
  "modifiers": [
    { "id": "extra-cheese", "name": "Extra Cheese", "price": 1.50, "group": "Toppings" },
    { "id": "bacon", "name": "Bacon", "price": 2.00, "group": "Toppings" }
  ]
}
```

- [ ] **Step 3: Update MenuItemCard to show "From $X.XX"**

In `src/components/MenuItemCard.astro`, find the price display (lines 46-48):
```astro
{showPrices && (
  <span class="item-price">{currencySymbol}{item.price.toFixed(2)}</span>
)}
```

Change to:
```astro
{showPrices && (
  <span class="item-price">
    {item.variants && item.variants.length > 0 ? (
      <span class="item-price-from">From </span>
    ) : null}
    {currencySymbol}{item.price.toFixed(2)}
  </span>
)}
```

Add CSS:
```css
.item-price-from {
  font-size: 0.75em;
  font-weight: 400;
  opacity: 0.6;
}
```

- [ ] **Step 4: Update ItemDetailSheet with variant/modifier selectors**

In `src/components/ItemDetailSheet.tsx`, add variant/modifier state and UI. After the price display (line 84), add:

```tsx
// Inside the component, add state:
const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
const [selectedModifiers, setSelectedModifiers] = useState<Set<string>>(new Set());

// Compute display price
const computedPrice = useMemo(() => {
  if (!selectedItem) return 0;
  let price = selectedItem.price;
  if (selectedVariant && selectedItem.variants) {
    const v = selectedItem.variants.find(v => v.id === selectedVariant);
    if (v) price += v.priceModifier;
  }
  if (selectedItem.modifiers) {
    selectedItem.modifiers.forEach(m => {
      if (selectedModifiers.has(m.id)) price += m.price;
    });
  }
  return price;
}, [selectedItem, selectedVariant, selectedModifiers]);

// Add variant selector UI after the price line:
{selectedItem.variants && selectedItem.variants.length > 0 && (
  <div className="mb-4">
    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]/50 mb-2">Size</p>
    <div className="flex gap-2">
      {selectedItem.variants.map(v => (
        <button
          key={v.id}
          onClick={() => setSelectedVariant(v.id === selectedVariant ? null : v.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            selectedVariant === v.id
              ? 'bg-[var(--color-accent)] text-white scale-105'
              : 'bg-[var(--color-primary)]/5 text-[var(--color-primary)]/70 hover:bg-[var(--color-primary)]/10'
          }`}
        >
          {v.name} {v.priceModifier > 0 ? `+${currencySymbol}${v.priceModifier.toFixed(2)}` : ''}
        </button>
      ))}
    </div>
  </div>
)}

// Add modifier chips grouped by group:
{selectedItem.modifiers && selectedItem.modifiers.length > 0 && (() => {
  const groups = new Map<string, typeof selectedItem.modifiers>();
  selectedItem.modifiers.forEach(m => {
    const g = m.group || 'Add-ons';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(m);
  });
  return Array.from(groups.entries()).map(([group, mods]) => (
    <div key={group} className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]/50 mb-2">{group}</p>
      <div className="flex flex-wrap gap-2">
        {mods.map(m => (
          <button
            key={m.id}
            onClick={() => {
              setSelectedModifiers(prev => {
                const next = new Set(prev);
                if (next.has(m.id)) next.delete(m.id); else next.add(m.id);
                return next;
              });
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              selectedModifiers.has(m.id)
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-primary)]/5 text-[var(--color-primary)]/70 hover:bg-[var(--color-primary)]/10'
            }`}
          >
            {m.name} +{currencySymbol}{m.price.toFixed(2)}
          </button>
        ))}
      </div>
    </div>
  ));
})()}

// Update the price display to use computedPrice:
<span className="text-xl font-body font-medium text-[var(--color-primary)] shrink-0">
  {currencySymbol}{computedPrice.toFixed(2)}
</span>

// Add useMemo import at top
import { useState, useEffect, useMemo } from 'react';
```

- [ ] **Step 5: Verify**

Run: `npm run dev`. The template restaurant should show variants and modifiers in the detail sheet. Selecting a variant updates the price. Toggling modifiers adjusts price. "From $X.XX" shows on cards with variants.

- [ ] **Step 6: Commit**

```bash
git add src/schemas/restaurant.schema.ts restaurants/_template/config.json src/components/ItemDetailSheet.tsx src/components/MenuItemCard.astro
git commit -m "feat: add item variants (sizes) and modifiers (add-ons) support"
```

---

### Task 9: Nutritional & Allergen Data

**Files:**
- Modify: `src/schemas/restaurant.schema.ts`
- Modify: `src/components/ItemDetailSheet.tsx`
- Modify: `restaurants/_template/config.json`

- [ ] **Step 1: Add nutrition and allergens to MenuItemSchema**

In `src/schemas/restaurant.schema.ts`, add after `modifiers`:
```ts
nutrition: z.object({
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
}).optional(),
allergens: z.array(z.object({
  name: z.string(),
  severity: z.enum(["contains", "may-contain", "traces"]),
})).optional(),
```

Also expand the tags enum (find existing `tags` field):
```ts
tags: z.array(z.enum([
  "vegetarian", "vegan", "gluten-free", "dairy-free", "nut-free",
  "halal", "kosher", "organic", "house-made", "seasonal"
])).default([]),
```

- [ ] **Step 2: Add allergen display to ItemDetailSheet**

In `src/components/ItemDetailSheet.tsx`, after the tags section (around line 113), add:

```tsx
{/* Allergen severity badges */}
{selectedItem.allergens && selectedItem.allergens.length > 0 && (
  <div className="mt-4 pt-4 border-t border-[var(--color-primary)]/10">
    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]/50 mb-2">Allergens</p>
    <div className="flex flex-wrap gap-2">
      {selectedItem.allergens.map(a => (
        <span
          key={a.name}
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            a.severity === 'contains'
              ? 'bg-red-50 text-red-700'
              : a.severity === 'may-contain'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-yellow-50 text-yellow-700'
          }`}
        >
          {a.severity === 'contains' ? '⚠️' : a.severity === 'may-contain' ? '?' : '~'} {a.name}
        </span>
      ))}
    </div>
  </div>
)}

{/* Nutrition accordion */}
{selectedItem.nutrition && (
  <details className="mt-4 group">
    <summary className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]/50 cursor-pointer hover:text-[var(--color-accent)] transition-colors">
      Nutrition Information
    </summary>
    <div className="mt-3 grid grid-cols-4 gap-3">
      {selectedItem.nutrition.calories != null && (
        <div className="text-center">
          <p className="text-lg font-bold text-[var(--color-primary)]">{selectedItem.nutrition.calories}</p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-primary)]/40">kcal</p>
        </div>
      )}
      {selectedItem.nutrition.protein != null && (
        <div className="text-center">
          <p className="text-lg font-bold text-[var(--color-primary)]">{selectedItem.nutrition.protein}g</p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-primary)]/40">protein</p>
        </div>
      )}
      {selectedItem.nutrition.carbs != null && (
        <div className="text-center">
          <p className="text-lg font-bold text-[var(--color-primary)]">{selectedItem.nutrition.carbs}g</p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-primary)]/40">carbs</p>
        </div>
      )}
      {selectedItem.nutrition.fat != null && (
        <div className="text-center">
          <p className="text-lg font-bold text-[var(--color-primary)]">{selectedItem.nutrition.fat}g</p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-primary)]/40">fat</p>
        </div>
      )}
    </div>
  </details>
)}
```

- [ ] **Step 3: Add example nutrition/allergens to template**

In `restaurants/_template/config.json`, add to the example item:
```json
"nutrition": { "calories": 350, "protein": 18, "carbs": 42, "fat": 12 },
"allergens": [
  { "name": "Gluten", "severity": "contains" },
  { "name": "Dairy", "severity": "may-contain" }
]
```

- [ ] **Step 4: Verify**

Run: `npm run dev`. Open the template restaurant detail sheet. Should show allergen badges (red for "contains", amber for "may-contain") and collapsible nutrition info.

- [ ] **Step 5: Commit**

```bash
git add src/schemas/restaurant.schema.ts src/components/ItemDetailSheet.tsx restaurants/_template/config.json
git commit -m "feat: add nutritional data and allergen severity badges"
```

---

### Task 10: Ordering Context Hints

**Files:**
- Modify: `src/schemas/restaurant.schema.ts`
- Modify: `src/components/MenuItemCard.astro`
- Modify: `src/components/ItemDetailSheet.tsx`

- [ ] **Step 1: Add prepTime, portionSize, popularity to schema**

In `src/schemas/restaurant.schema.ts`, add to MenuItemSchema:
```ts
prepTime: z.number().optional(),
portionSize: z.string().optional(),
popularity: z.enum(["most-ordered", "staff-favorite", "new", "trending"]).optional(),
```

- [ ] **Step 2: Add popularity badge to MenuItemCard**

In `src/components/MenuItemCard.astro`, after the featured badge (line 32), add:
```astro
{item.popularity && !item.featured && (
  <div class={"popularity-badge popularity-badge--" + item.popularity}>
    {item.popularity === 'most-ordered' && '🔥 Most Ordered'}
    {item.popularity === 'staff-favorite' && '⭐ Staff Pick'}
    {item.popularity === 'new' && '✨ New'}
    {item.popularity === 'trending' && '📈 Trending'}
  </div>
)}
```

Add CSS:
```css
.popularity-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: 999px;
  background: var(--color-secondary);
  color: var(--color-primary);
  border: 1px solid color-mix(in srgb, var(--color-primary) 15%, transparent);
}
```

- [ ] **Step 3: Add prep time + portion to ItemDetailSheet**

In `src/components/ItemDetailSheet.tsx`, add before the tags section:
```tsx
{/* Prep time & portion */}
{(selectedItem.prepTime || selectedItem.portionSize) && (
  <div className="flex gap-4 mb-4 text-sm text-[var(--color-primary)]/60">
    {selectedItem.prepTime && (
      <span className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        ~{selectedItem.prepTime} min
      </span>
    )}
    {selectedItem.portionSize && (
      <span className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        {selectedItem.portionSize}
      </span>
    )}
  </div>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/schemas/restaurant.schema.ts src/components/MenuItemCard.astro src/components/ItemDetailSheet.tsx
git commit -m "feat: add prep time, portion size, and popularity hints"
```

---

### Task 11: Enhanced Hours Schema

**Files:**
- Modify: `src/schemas/restaurant.schema.ts`
- Modify: `src/lib/loadRestaurants.ts`
- Modify: `src/components/Footer.astro`

- [ ] **Step 1: Enhance hours schema**

In `src/schemas/restaurant.schema.ts`, replace the `hours` field:
```ts
hours: z.union([
  // New format
  z.object({
    regular: z.record(z.string()).optional(),
    special: z.array(z.object({
      date: z.string(),
      hours: z.string(),
      label: z.string().optional(),
    })).optional(),
    notes: z.string().optional(),
  }),
  // Legacy format (flat record)
  z.record(z.string()),
]).optional(),
```

- [ ] **Step 2: Add backward-compat normalizer in loadRestaurants**

In `src/lib/loadRestaurants.ts`, after parsing (line 26), add normalization:
```ts
// Normalize hours: old format is a flat Record, new format is { regular, special, notes }
if (configJson.hours && !configJson.hours.regular && !configJson.hours.special) {
  configJson.hours = { regular: configJson.hours };
}
```

- [ ] **Step 3: Update Footer to use new hours format**

In `src/components/Footer.astro`, update the hours section (lines 24-39):
```astro
{/* Hours */}
{hours && (
  <div class="footer-col">
    <h3 class="footer-col-heading">
      <svg ...>...</svg>
      Hours
    </h3>
    {hours.regular ? (
      <ul class="hours-list">
        {Object.entries(hours.regular).map(([day, time]) => (
          <li class="hours-row">
            <span class="hours-day">{day}</span>
            <span class="hours-time">{time}</span>
          </li>
        ))}
      </ul>
    ) : (
      <ul class="hours-list">
        {Object.entries(hours).map(([day, time]) => (
          <li class="hours-row">
            <span class="hours-day">{day}</span>
            <span class="hours-time">{String(time)}</span>
          </li>
        ))}
      </ul>
    )}
    {hours.notes && (
      <p class="text-xs text-[var(--color-primary)]/40 mt-2 italic">{hours.notes}</p>
    )}
  </div>
)}
```

- [ ] **Step 4: Verify**

Run: `npm run build`. All existing restaurants should still render their hours correctly (backward compat). New format works for restaurants that adopt it.

- [ ] **Step 5: Commit**

```bash
git add src/schemas/restaurant.schema.ts src/lib/loadRestaurants.ts src/components/Footer.astro
git commit -m "feat: enhance hours schema with special hours and backward compat"
```

---

### Task 12: Directory Search & Filters

**Files:**
- Create: `src/components/DirectorySearch.tsx`
- Create: `src/lib/hours.ts`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create hours utility**

Create `src/lib/hours.ts`:
```ts
export function isCurrentlyOpen(hours: any): boolean {
  if (!hours) return false;
  const h = hours.regular || hours;
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = dayNames[now.getDay()];
  const todayHours = h[today];
  if (!todayHours || todayHours === 'Closed') return false;

  const [open, close] = todayHours.split('-').map((t: string) => {
    const [h, m] = t.trim().split(':').map(Number);
    return h * 60 + m;
  });
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return currentMinutes >= open && currentMinutes <= close;
}
```

- [ ] **Step 2: Create DirectorySearch component**

Create `src/components/DirectorySearch.tsx`:
```tsx
import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';

interface RestaurantCard {
  slug: string;
  name: string;
  tagline: string;
  cuisine: string[];
  priceRange: string;
  moodPreset: string;
  isOpen: boolean;
}

interface Props {
  restaurants: RestaurantCard[];
}

export default function DirectorySearch({ restaurants }: Props) {
  const [query, setQuery] = useState('');
  const [activeCuisines, setActiveCuisines] = useState<Set<string>>(new Set());
  const [activeMoods, setActiveMoods] = useState<Set<string>>(new Set());

  const allCuisines = useMemo(() => {
    const s = new Set<string>();
    restaurants.forEach(r => r.cuisine.forEach(c => s.add(c)));
    return Array.from(s).sort();
  }, [restaurants]);

  const allMoods = useMemo(() => {
    const s = new Set<string>();
    restaurants.forEach(r => s.add(r.moodPreset.replace('-', ' ')));
    return Array.from(s).sort();
  }, [restaurants]);

  const filtered = useMemo(() => {
    return restaurants.filter(r => {
      const matchesQuery = !query ||
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.tagline.toLowerCase().includes(query.toLowerCase()) ||
        r.cuisine.some(c => c.toLowerCase().includes(query.toLowerCase()));
      const matchesCuisine = activeCuisines.size === 0 || r.cuisine.some(c => activeCuisines.has(c));
      const matchesMood = activeMoods.size === 0 || activeMoods.has(r.moodPreset.replace('-', ' '));
      return matchesQuery && matchesCuisine && matchesMood;
    });
  }, [restaurants, query, activeCuisines, activeMoods]);

  const toggleFilter = (set: Set<string>, value: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value); else next.add(value);
    setter(next);
  };

  // Show/hide cards
  useEffect(() => {
    document.querySelectorAll('.rcard').forEach(card => {
      const slug = card.getAttribute('aria-label')?.replace('View ', '').replace(' menu', '').toLowerCase().replace(/ /g, '-');
      const match = filtered.some(r => r.slug === slug);
      (card as HTMLElement).style.display = match ? '' : 'none';
    });
  }, [filtered]);

  return (
    <div className="mb-8">
      {/* Search */}
      <div className="relative max-w-md mx-auto mb-4">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search restaurants..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="block w-full pl-11 pr-4 py-3 rounded-full bg-white/[0.07] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 backdrop-blur-sm font-body transition-all"
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {allCuisines.map(cuisine => (
          <button
            key={cuisine}
            onClick={() => toggleFilter(activeCuisines, cuisine, setActiveCuisines)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
              activeCuisines.has(cuisine)
                ? 'bg-amber-400 text-black scale-105'
                : 'bg-white/[0.06] text-white/50 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            {cuisine}
          </button>
        ))}
      </div>

      {/* Results count */}
      {(query || activeCuisines.size > 0) && (
        <p className="text-center text-xs text-white/30 mt-3">
          Showing {filtered.length} of {restaurants.length} restaurants
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire into directory page**

In `src/pages/index.astro`:
1. Add import at top: `import DirectorySearch from '../components/DirectorySearch';`
2. Add `import { isCurrentlyOpen } from '../lib/hours';`
3. Build the search data before the template:
```ts
const searchCards = restaurants.map(r => ({
  slug: r.slug,
  name: r.name,
  tagline: r.tagline || '',
  cuisine: r.cuisine || [],
  priceRange: r.priceRange || '',
  moodPreset: r.moodPreset,
  isOpen: isCurrentlyOpen(r.hours),
}));
```
4. Add `<DirectorySearch client:load restaurants={searchCards} />` after the header, before the grid.

- [ ] **Step 4: Verify**

Run: `npm run dev`. Directory page shows search bar and cuisine filter chips. Typing filters restaurants. Clicking cuisine chips filters. "Open Now" badge shows on restaurant cards.

- [ ] **Step 5: Commit**

```bash
git add src/components/DirectorySearch.tsx src/lib/hours.ts src/pages/index.astro
git commit -m "feat: add directory page search, cuisine filters, and Open Now indicator"
```

---

### Task 13: Item Detail Sheet Full Upgrade

**Files:**
- Modify: `src/components/ItemDetailSheet.tsx`

*Note: Tasks 8-10 already added variant/modifier selectors, nutrition accordion, allergen badges, prep time, and portion size. This task adds the remaining upgrades: share button, related items, and polish.*

- [ ] **Step 1: Add share button**

In `src/components/ItemDetailSheet.tsx`, add after the close button:
```tsx
<button
  onClick={() => {
    const url = `${window.location.origin}${window.location.pathname}#item-${selectedItem?.id}`;
    if (navigator.share) {
      navigator.share({ title: selectedItem?.name, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  }}
  className="absolute top-4 left-4 z-10 bg-black/40 text-white rounded-full p-2 backdrop-blur-md hover:bg-black/60 transition"
  aria-label="Share"
>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
</button>
```

- [ ] **Step 2: Reset variant/modifier state on item change**

Add to the useEffect that handles item open:
```tsx
useEffect(() => {
  if (selectedItem) {
    setSelectedVariant(null);
    setSelectedModifiers(new Set());
  }
}, [selectedItem?.id]);
```

- [ ] **Step 3: Verify**

Run: `npm run dev`. Click an item. Share button appears top-left. Click it — should trigger native share or copy URL. Navigate between items — variant/modifier selections reset.

- [ ] **Step 4: Commit**

```bash
git add src/components/ItemDetailSheet.tsx
git commit -m "feat: add share button and reset state on item change in detail sheet"
```

---

## BATCH 3: Immersive Category Storytelling

---

### Task 14: CategoryHero Component

**Files:**
- Create: `src/components/CategoryHero.astro`

- [ ] **Step 1: Create the CategoryHero component**

Create `src/components/CategoryHero.astro`:
```astro
---
interface Props {
  name: string;
  description?: string;
  heroImage?: string;
  heroQuote?: string;
  slug: string;
  categoryId: string;
  categoryIndex: number;
}

const { name, description, heroImage, heroQuote, slug, categoryId, categoryIndex } = Astro.props;
const imageUrl = heroImage ? `/r/${slug}/assets/${heroImage}` : null;
---

<div class="category-hero" data-category-hero={categoryId}>
  {imageUrl && (
    <div class="category-hero-image-wrap">
      <img src={imageUrl} alt="" class="category-hero-image" loading="lazy" decoding="async" />
      <div class="category-hero-scrim"></div>
    </div>
  )}
  <div class="category-hero-content">
    <span class="category-eyebrow">
      <span class="category-number">0{categoryIndex + 1}</span>
      {name}
    </span>
    <h2 class="category-hero-title">{name}</h2>
    {heroQuote && (
      <p class="category-hero-quote">{heroQuote}</p>
    )}
    {description && !heroQuote && (
      <p class="category-hero-quote">{description}</p>
    )}
  </div>
</div>

<style>
  .category-hero {
    position: relative;
    min-height: 40vh;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    overflow: hidden;
    margin-bottom: 2rem;
  }

  .category-hero-image-wrap {
    position: absolute;
    inset: 0;
  }
  .category-hero-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    animation: categoryZoom 15s ease-in-out infinite alternate;
    transform-origin: center;
  }
  @keyframes categoryZoom {
    from { transform: scale(1); }
    to { transform: scale(1.04); }
  }
  .category-hero-scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      var(--color-secondary) 0%,
      color-mix(in srgb, var(--color-secondary) 70%, transparent) 40%,
      color-mix(in srgb, var(--color-secondary) 30%, transparent) 100%
    );
  }

  .category-hero-content {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: 3rem 1.5rem;
    width: 100%;
    max-width: 600px;
  }

  .category-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-accent) 12%, transparent);
    color: var(--color-accent);
    font-family: var(--font-body);
    font-size: 0.625rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 1rem;
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .category-number {
    font-variant-numeric: tabular-nums;
  }
  .category-hero.revealed .category-eyebrow {
    opacity: 1;
    transform: translateY(0);
  }

  .category-hero-title {
    font-family: var(--font-heading);
    font-weight: 800;
    font-size: clamp(2rem, 5vw, 3.5rem);
    line-height: 1.05;
    letter-spacing: -0.02em;
    color: var(--color-primary);
    margin-bottom: 0.75rem;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s;
  }
  .category-hero.revealed .category-hero-title {
    opacity: 1;
    transform: translateY(0);
  }

  .category-hero-quote {
    font-family: var(--font-body);
    font-size: clamp(0.875rem, 2vw, 1.05rem);
    line-height: 1.65;
    color: color-mix(in srgb, var(--color-primary) 55%, transparent);
    font-style: italic;
    max-width: 44ch;
    margin: 0 auto;
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s;
  }
  .category-hero.revealed .category-hero-quote {
    opacity: 1;
    transform: translateY(0);
  }

  @media (prefers-reduced-motion: reduce) {
    .category-hero-image { animation: none; }
    .category-eyebrow, .category-hero-title, .category-hero-quote {
      opacity: 1;
      transform: none;
      transition: none;
    }
  }
</style>
```

- [ ] **Step 2: Add IntersectionObserver for category hero reveal**

In `src/pages/r/[slug]/index.astro`, add to the `<script>` block:
```js
function setupCategoryHeroes() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -80px 0px', threshold: 0.15 });

  document.querySelectorAll('[data-category-hero]').forEach(el => observer.observe(el));
}

document.addEventListener('astro:page-load', setupCategoryHeroes);
setupCategoryHeroes();
```

- [ ] **Step 3: Verify**

Run: `npm run dev`. If a restaurant has `heroQuote` on a category, the CategoryHero component renders with eyebrow tag, title, and quote, all animating in on scroll.

- [ ] **Step 4: Commit**

```bash
git add src/components/CategoryHero.astro src/pages/r/\[slug\]/index.astro
git commit -m "feat: create CategoryHero component for immersive category storytelling"
```

---

### Task 15: Integrate CategoryHero into Restaurant Page

**Files:**
- Modify: `src/pages/r/[slug]/index.astro`

- [ ] **Step 1: Import CategoryHero**

Add to imports:
```astro
import CategoryHero from '../../../components/CategoryHero.astro';
```

- [ ] **Step 2: Replace category headers with CategoryHero**

Find the category section (lines 54-62):
```astro
<section id={"category-" + category.id} class="mb-14 scroll-mt-28">
  {/* Category header */}
  <div class="category-header">
    <h2 class="category-name">{category.name}</h2>
    {category.description && (
      <p class="category-desc">{category.description}</p>
    )}
  </div>
```

Replace with:
```astro
<section id={"category-" + category.id} class="mb-14 scroll-mt-28">
  {/* Category hero — immersive storytelling */}
  {(category.heroImage || category.heroQuote) ? (
    <CategoryHero
      name={category.name}
      description={category.description}
      heroImage={category.heroImage}
      heroQuote={category.heroQuote}
      slug={restaurant.slug}
      categoryId={category.id}
      categoryIndex={index}
    />
  ) : (
    <div class="category-header">
      <h2 class="category-name">{category.name}</h2>
      {category.description && (
        <p class="category-desc">{category.description}</p>
      )}
    </div>
  )}
```

- [ ] **Step 3: Verify**

Run: `npm run dev`. Bella Italia and other restaurants with `heroQuote` should show the immersive CategoryHero. Restaurants/categories without it fall back to the existing simple header.

- [ ] **Step 4: Commit**

```bash
git add src/pages/r/\[slug\]/index.astro
git commit -m "feat: integrate CategoryHero into restaurant page with fallback"
```

---

### Task 16: Ambient Texture Activation

**Files:**
- Modify: `src/lib/theme.ts`

- [ ] **Step 1: Add texture CSS to getThemeStyles**

In `src/lib/theme.ts`, extend the returned style string to include texture overlays:

```ts
// After the existing CSS variables, add texture styles
const textureStyles = preset.texture ? `
  .category-hero::after,
  .menu-body::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: ${preset.texture};
    background-size: 200px 200px;
    opacity: 0.04;
    pointer-events: none;
    mix-blend-mode: overlay;
    z-index: 1;
  }
` : '';
```

Append `textureStyles` to the returned `<style>` block.

- [ ] **Step 2: Verify**

Run: `npm run dev`. Fine-dining (Bella Italia) should show subtle linen texture. Bold-street (Neon Burger) shows halftone dots. Rustic shows paper grain. Modern-minimal and playful show nothing (as designed).

- [ ] **Step 3: Commit**

```bash
git add src/lib/theme.ts
git commit -m "feat: activate ambient texture overlays per mood preset"
```

---

## BATCH 4: Awwwards-Tier Visual Overhaul

---

### Task 17: Font System Upgrade

**Files:**
- Modify: `src/lib/moodPresets.ts`
- Modify: `src/lib/theme.ts` (Google Fonts URL)

- [ ] **Step 1: Update mood presets with new fonts**

In `src/lib/moodPresets.ts`, update:
- `'bold-street'`: change `fontBody` to `"DM Sans", sans-serif`
- `'playful-casual'`: change `fontBody` to `"Outfit", sans-serif`
- `'rustic-traditional'`: change `fontBody` to `"Crimson Pro", serif`

- [ ] **Step 2: Update default body font in theme.ts**

In `src/lib/theme.ts`, the Google Fonts URL already dynamically builds from the preset fonts. Verify that Plus Jakarta Sans is loaded as a fallback body font by adding it to the fonts array if the preset body font differs.

- [ ] **Step 3: Verify**

Run: `npm run dev`. Each restaurant should load its preset-appropriate fonts. No more `Inter` as default body.

- [ ] **Step 4: Commit**

```bash
git add src/lib/moodPresets.ts src/lib/theme.ts
git commit -m "feat: upgrade font system — replace Inter with Plus Jakarta Sans, refine per-preset body fonts"
```

---

### Task 18: Double-Bezel Card Architecture

**Files:**
- Modify: `src/components/MenuItemCard.astro`

- [ ] **Step 1: Wrap card content in outer shell + inner core**

Restructure the template:
```astro
<article
  class={"menu-card-outer" + (!item.available ? " menu-card--unavailable" : "")}
  data-item-id={item.id}
  role="button"
  tabindex="0"
  aria-label={"View details for " + item.name}
>
  <div class="menu-card">
    {/* ... existing card content (featured badge, sold out overlay, card-body) stays the same ... */}
  </div>
</article>
```

- [ ] **Step 2: Update CSS for Double-Bezel**

Replace the existing `.menu-card` styles:
```css
.menu-card-outer {
  position: relative;
  background: color-mix(in srgb, var(--color-primary) 3%, var(--color-secondary));
  border: 1px solid color-mix(in srgb, var(--color-primary) 6%, transparent);
  border-radius: calc(var(--radius, 0.5rem) + 0.25rem);
  padding: 5px;
  cursor: pointer;
  transition: transform 0.7s cubic-bezier(0.32, 0.72, 0, 1),
              box-shadow 0.7s cubic-bezier(0.32, 0.72, 0, 1),
              border-color 0.3s ease;
  will-change: transform;
}
.menu-card-outer:hover, .menu-card-outer:focus-visible {
  transform: translateY(-3px);
  box-shadow: 0 24px 48px -12px color-mix(in srgb, var(--color-primary) 15%, transparent),
              0 0 0 1px color-mix(in srgb, var(--color-accent) 20%, transparent);
  border-color: color-mix(in srgb, var(--color-accent) 25%, transparent);
  outline: none;
}

.menu-card {
  position: relative;
  background: var(--color-secondary);
  border-radius: var(--radius, 0.5rem);
  overflow: hidden;
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.15);
}
```

- [ ] **Step 3: Fix all `.menu-card` CSS selectors**

Update every `.menu-card--featured`, `.menu-card--unavailable`, `.card-body`, etc. to reference the inner `.menu-card` correctly. The featured/unavailable classes move to `.menu-card-outer`.

- [ ] **Step 4: Verify**

Cards should now have a visible "nested frame" effect — outer shell with subtle background + inner content with its own background and inset highlight.

- [ ] **Step 5: Commit**

```bash
git add src/components/MenuItemCard.astro
git commit -m "feat: implement Double-Bezel card architecture on MenuItemCard"
```

---

### Task 19: Floating Glass Navigation

**Files:**
- Modify: `src/components/Header.astro`

- [ ] **Step 1: Restructure header as floating pill**

Replace the header template:
```astro
<header class="site-header" id="main-header">
  <div class="header-pill">
    <a href="/" class="back-link" aria-label="Back to all restaurants">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
      </svg>
    </a>
    <img src={logoUrl} alt={restaurant.name} class="header-logo" />
    <span class="header-name">{restaurant.name}</span>
    <div class="header-divider" aria-hidden="true"></div>
    <nav class="header-actions" aria-label="Contact">
      {/* phone, whatsapp, maps icons */}
    </nav>
  </div>
</header>
```

- [ ] **Step 2: Add floating glass CSS**

```css
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  justify-content: center;
  padding: 0.75rem 1rem;
  pointer-events: none;
}
.header-pill {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem 0.5rem 0.5rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-secondary) 75%, transparent);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid color-mix(in srgb, var(--color-primary) 8%, transparent);
  box-shadow: 0 8px 32px -8px rgba(0,0,0,0.12);
  transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1),
              box-shadow 0.3s ease;
}
.header-divider {
  width: 1px;
  height: 20px;
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
}
```

- [ ] **Step 3: Add scroll-linked compact/expand behavior**

In the `<script>` block:
```js
document.addEventListener('astro:page-load', () => {
  const pill = document.querySelector('.header-pill');
  if (!pill) return;
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const current = window.scrollY;
    if (current > 100 && current > lastScroll) {
      pill.style.transform = 'scale(0.95)';
      pill.style.opacity = '0.9';
    } else {
      pill.style.transform = 'scale(1)';
      pill.style.opacity = '1';
    }
    lastScroll = current;
  }, { passive: true });
});
```

- [ ] **Step 4: Verify**

Run: `npm run dev`. The header should now be a floating glass pill centered at the top, not a full-width sticky bar. Scroll down — it subtly compacts. Scroll up — it expands back.

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.astro
git commit -m "feat: transform header into floating glass pill navigation"
```

---

### Task 20: Eyebrow Tags

**Files:**
- Create: `src/components/Eyebrow.astro`

- [ ] **Step 1: Create Eyebrow component**

Create `src/components/Eyebrow.astro`:
```astro
---
interface Props {
  icon?: string;
  label: string;
}

const { icon, label } = Astro.props;
---

<span class="eyebrow">
  {icon && <span class="eyebrow-icon" aria-hidden="true">{icon}</span>}
  {label}
</span>

<style>
  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-accent) 10%, transparent);
    color: var(--color-accent);
    font-family: var(--font-body);
    font-size: 0.625rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 0.75rem;
  }
  .eyebrow-icon {
    font-size: 0.75rem;
  }
</style>
```

- [ ] **Step 2: Use in FeaturedCarousel**

In `src/components/FeaturedCarousel.astro`, replace the `.featured-label` div:
```astro
<Eyebrow icon="★" label="Featured" />
```

- [ ] **Step 3: Use in StorySection**

In `src/components/StorySection.astro`, add above the heading:
```astro
<Eyebrow icon="📖" label={story.heading || 'Our Story'} />
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Eyebrow.astro src/components/FeaturedCarousel.astro src/components/StorySection.astro
git commit -m "feat: add Eyebrow tag component for section headings"
```

---

### Task 21-28: Remaining Awwwards Tasks

*Due to length, these tasks follow the same pattern as above. Key implementation notes:*

**Task 21 (Button-in-Button CTAs):** Update `.rcard-cta` in `index.astro` — wrap arrow SVG in `w-7 h-7 rounded-full bg-white/5` inner circle.

**Task 22 (Custom Motion Curves):** Add CSS variables to `theme.ts` output:
```css
:root {
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-fluid: cubic-bezier(0.32, 0.72, 0, 1);
  --ease-snap: cubic-bezier(0.76, 0, 0.24, 1);
}
```
Replace all existing `ease`, `ease-in-out` with these.

**Task 23 (Custom Cursor):** Create `src/lib/cursor.ts` — vanilla JS `mousemove` listener, creates/follows a custom div element. CSS per preset injected via `theme.ts`.

**Task 24 (Scroll-Linked Hero Typography):** In `Hero.astro` script, use IntersectionObserver + scroll listener to scale/weight-shift the `h1`.

**Task 25 (Ambient Mood Animations):** Extend `theme.ts` with per-preset `@keyframes` for floating particles (CSS pseudo-elements, no JS).

**Task 26 (Typography Scale):** Add `--text-hero`, `--text-section`, `--leading-*`, `--tracking-*` variables to `theme.ts`.

**Task 27 (Featured Carousel Polish):** Add CSS `mask-image: linear-gradient(...)` for fade edges, swipe indicator arrow.

**Task 28 (Scroll Progress Bar):** Add thin `<div>` inside header pill, width bound to `scrollY / (document.body.scrollHeight - window.innerHeight) * 100%`.

---

## BATCH 5: Immersive Directory + Architecture

---

### Task 29: Immersive Directory Page

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Redesign directory as full-bleed cards**

Replace the `.dir-grid` + `.rcard` structure with full-width stacked restaurant cards, each showing the cover image prominently with parallax.

Key CSS changes:
```css
.dir-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 5rem;
}
.rcard {
  border-radius: 1.5rem;
  min-height: 380px;
}
.rcard-cover {
  height: 100%;
  position: absolute;
  inset: 0;
}
```

- [ ] **Step 2: Add cuisine + priceRange badges + Open Now to cards**

In the card body, add:
```astro
<div class="rcard-meta">
  {r.cuisine && r.cuisine.slice(0, 3).map(c => (
    <span class="rcard-meta-badge">{c}</span>
  ))}
  {r.priceRange && <span class="rcard-meta-badge">{r.priceRange}</span>}
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: redesign directory page with immersive full-bleed restaurant cards"
```

---

### Task 30: Page Transition Choreography

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/pages/r/[slug]/index.astro`
- Modify: `src/components/Hero.astro`

- [ ] **Step 1: Add transition:name directives**

On directory card cover images:
```astro
<img transition:name={`cover-${r.slug}`} ... />
```

On restaurant hero images:
```astro
<img transition:name={`cover-${restaurant.slug}`} ... />
```

On restaurant names in both locations:
```astro
<h2 transition:name={`name-${r.slug}`}>{r.name}</h2>
```

- [ ] **Step 2: Add transition CSS**

```css
::view-transition-old(cover) {
  animation: fade-out 0.3s ease-in forwards;
}
::view-transition-new(cover) {
  animation: fade-in 0.3s ease-out forwards;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro src/pages/r/\[slug\]/index.astro src/components/Hero.astro
git commit -m "feat: add View Transition choreography between directory and restaurant pages"
```

---

### Tasks 31-38: Remaining Architecture Tasks

**Task 31 (Component Architecture):** Create `src/lib/formatCurrency.ts`, extract `TagBadge`, fix `SearchFilterBar` DOM manipulation.

**Task 32 (Dark Mode):** Extend `ThemeSchema`, create `ThemeToggle.astro`, add `data-theme` CSS.

**Task 33 (SEO):** Add JSON-LD script to `RestaurantLayout.astro`, OG meta tags.

**Task 34 (Skeletons):** Create `SkeletonCard.astro` with branded shimmer.

**Task 35 (Print):** Add `@media print` rules to `global.css`.

**Task 36 (Menu Variants):** Schema + tab switcher in `index.astro`.

**Task 37 (QR Codes):** Build script using `qrcode` npm package.

**Task 38 (Combos):** Schema + `ComboCard.astro` component.

---

## BATCH 6: Wow-Factor Micro-Interactions (NEW)

> The "holy shit" moments that make people screenshot and share.

---

### Task 39: Mouse Parallax Depth System

**Files:**
- Create: `src/lib/parallax.ts`
- Modify: `src/components/Hero.astro`
- Modify: `src/components/MenuItemCard.astro`

- [ ] **Step 1: Create parallax utility**

Create `src/lib/parallax.ts`:
```ts
export function initParallax() {
  const layers = document.querySelectorAll<HTMLElement>('[data-parallax]');
  if (!layers.length) return;

  let ticking = false;
  document.addEventListener('mousemove', (e) => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const cx = (e.clientX / window.innerWidth - 0.5) * 2;
      const cy = (e.clientY / window.innerHeight - 0.5) * 2;
      layers.forEach(layer => {
        const depth = parseFloat(layer.dataset.parallax || '1');
        const x = cx * depth * 10;
        const y = cy * depth * 10;
        layer.style.transform = `translate(${x}px, ${y}px)`;
      });
      ticking = false;
    });
  });
}
```

- [ ] **Step 2: Add data-parallax to Hero**

In `Hero.astro`, add `data-parallax="2"` to background image, `data-parallax="0.5"` to text content.

- [ ] **Step 3: Add 3D tilt to MenuItemCard**

In `MenuItemCard.astro`, add tilt on hover:
```js
card.addEventListener('mousemove', (e) => {
  const rect = card.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-3px)`;
});
card.addEventListener('mouseleave', () => {
  card.style.transform = '';
});
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/parallax.ts src/components/Hero.astro src/components/MenuItemCard.astro
git commit -m "feat: add mouse parallax depth and 3D card tilt system"
```

---

### Task 40: Text Scramble Effect

**Files:**
- Create: `src/lib/textScramble.ts`
- Modify: `src/pages/r/[slug]/index.astro`

- [ ] **Step 1: Create text scramble utility**

Create `src/lib/textScramble.ts`:
```ts
const CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

export class TextScramble {
  el: HTMLElement;
  queue: { char: string; update: (v: string) => void }[] = [];
  frame: number = 0;
  frameRequest: number = 0;

  constructor(el: HTMLElement) {
    this.el = el;
  }

  setText(newText: string) {
    const oldText = this.el.textContent || '';
    const length = Math.max(oldText.length, newText.length);
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 20);
      const end = start + Math.floor(Math.random() * 20);
      this.queue.push({ char: from, update: () => to });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
  }

  update() {
    let output = '';
    let complete = 0;
    for (let i = 0; i < this.queue.length; i++) {
      let { char, update } = this.queue[i];
      if (this.frame >= update.length) {
        complete++;
        output += update;
      } else {
        output += CHARS[Math.floor(Math.random() * CHARS.length)];
      }
    }
    this.el.textContent = output;
    if (complete === this.queue.length) return;
    this.frameRequest = requestAnimationFrame(() => this.frame++);
    this.update();
  }
}
```

- [ ] **Step 2: Apply to category headings on scroll**

Add IntersectionObserver in `index.astro` script that triggers TextScramble on category names when they enter viewport.

- [ ] **Step 3: Commit**

```bash
git add src/lib/textScramble.ts src/pages/r/\[slug\]/index.astro
git commit -m "feat: add text scramble effect on category headings"
```

---

### Task 41: Mobile Swipe Navigation

**Files:**
- Create: `src/lib/swipeNav.ts`
- Modify: `src/pages/r/[slug]/index.astro`

- [ ] **Step 1: Create swipe navigation utility**

Create `src/lib/swipeNav.ts`:
```ts
export function initSwipeNav() {
  const sections = document.querySelectorAll<HTMLElement>('section[id^="category-"]');
  if (sections.length < 2) return;

  let startX = 0;
  let startY = 0;

  document.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;

    const currentIndex = Array.from(sections).findIndex(s => {
      const rect = s.getBoundingClientRect();
      return rect.top <= 100 && rect.bottom > 100;
    });

    if (dx < 0 && currentIndex < sections.length - 1) {
      sections[currentIndex + 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (dx > 0 && currentIndex > 0) {
      sections[currentIndex - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, { passive: true });
}
```

- [ ] **Step 2: Wire into page script**

Add `initSwipeNav()` call in the `astro:page-load` listener in `index.astro`.

- [ ] **Step 3: Add visual swipe hint**

Add a subtle animated arrow indicator at bottom of screen on mobile that dismisses after first swipe.

- [ ] **Step 4: Commit**

```bash
git add src/lib/swipeNav.ts src/pages/r/\[slug\]/index.astro
git commit -m "feat: add mobile swipe navigation between menu categories"
```

---

### Task 42: Magnetic Button Physics

**Files:**
- Create: `src/lib/magnetic.ts`
- Apply to: CTA buttons in `Header.astro`, `index.astro` directory cards

- [ ] **Step 1: Create magnetic button utility**

Create `src/lib/magnetic.ts`:
```ts
export function initMagnetic() {
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
      btn.style.transition = 'transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)';
      setTimeout(() => btn.style.transition = '', 500);
    });
  });
}
```

- [ ] **Step 2: Add data-magnetic to buttons**

Add `data-magnetic` attribute to primary CTA buttons.

- [ ] **Step 3: Commit**

```bash
git add src/lib/magnetic.ts src/components/Header.astro src/pages/index.astro
git commit -m "feat: add magnetic button physics on CTAs"
```

---

### Task 43: Personality Loading Screen

**Files:**
- Create: `src/components/LoadingScreen.astro`
- Modify: `src/layouts/RestaurantLayout.astro`

- [ ] **Step 1: Create loading screen component**

Create `src/components/LoadingScreen.astro` with mood-specific entrance animations:
- fine-dining: gold particles coalescing into logo
- bold-street: glitch-in effect
- playful: bounce-in with spring physics
- modern-minimal: clean fade + scale
- rustic: warm fade with grain overlay

- [ ] **Step 2: Add to RestaurantLayout**

Insert loading screen that shows on initial page load, fades out after 1.2s.

- [ ] **Step 3: Commit**

```bash
git add src/components/LoadingScreen.astro src/layouts/RestaurantLayout.astro
git commit -m "feat: add personality loading screen per mood preset"
```

---

## Verification Checklist

After all tasks complete:
1. `npm run validate:configs` — passes
2. `npm run build` — clean static output
3. `npm run dev` — each restaurant page verified at 360px, 768px, 1024px, 1440px
4. `prefers-reduced-motion: reduce` — all animations resolve instantly
5. Each restaurant looks visually distinct despite shared components
6. Old configs (without new fields) still work via defaults
7. Keyboard navigation works throughout
8. React island JS budget under 50KB gzipped
