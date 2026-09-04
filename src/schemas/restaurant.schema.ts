import { z } from "zod";

export const MenuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  image: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  pairsWith: z.string().optional(),
  tags: z.array(z.enum([
    "vegetarian", "vegan", "gluten-free", "dairy-free", "nut-free",
    "halal", "kosher", "organic", "house-made", "seasonal"
  ])).default([]),
  spicyLevel: z.number().min(0).max(3).default(0),
  available: z.boolean().default(true),
  featured: z.boolean().default(false),
  // Variants (sizes)
  variants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    priceModifier: z.number(),
  })).optional(),
  // Modifiers (add-ons)
  modifiers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    group: z.string().optional(),
  })).optional(),
  // Nutrition data
  nutrition: z.object({
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional(),
  }).optional(),
  // Allergen data
  allergens: z.array(z.object({
    name: z.string(),
    severity: z.enum(["contains", "may-contain", "traces"]),
  })).optional(),
  // Ordering context hints
  prepTime: z.number().optional(),
  portionSize: z.string().optional(),
  popularity: z.enum(["most-ordered", "staff-favorite", "new", "trending"]).optional(),
});

export const MenuCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  items: z.array(MenuItemSchema).min(1),
  // Immersive category storytelling
  heroImage: z.string().optional(),
  heroQuote: z.string().optional(),
});

export const ThemeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontHeading: z.string().default("Playfair Display"),
  fontBody: z.string().default("Inter"),
  borderRadius: z.enum(["none", "sm", "md", "lg", "xl", "full"]).default("md"),
  mode: z.enum(["light", "dark"]).default("light"),
});

export const RestaurantSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  logo: z.string(),
  favicon: z.string().optional(),
  coverImage: z.string().optional(),
  // Restaurant-level metadata
  cuisine: z.array(z.string()).optional(),
  priceRange: z.enum(["$", "$$", "$$$", "$$$$"]).optional(),
  contact: z.object({
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    googleMapsUrl: z.string().url().optional(),
    socials: z.record(z.string().url()).optional(),
  }),
  hours: z.object({
    regular: z.record(z.string()).optional(),
    special: z.array(z.object({
      date: z.string(),
      hours: z.string(),
      label: z.string().optional(),
    })).optional(),
    notes: z.string().optional(),
  }).optional(),
  theme: ThemeSchema,
  moodPreset: z.enum([
    "fine-dining",
    "modern-minimal",
    "rustic-traditional",
    "playful-casual",
    "bold-street",
  ]).default("fine-dining"),
  story: z.object({
    heading: z.string().optional(),
    body: z.string(),
  }).optional(),
  hero: z.object({
    style: z.enum(["fullbleed", "split", "minimal"]).default("fullbleed"),
  }).optional(),
  settings: z.object({
    currency: z.string().default("USD"),
    currencySymbol: z.string().default("$"),
    language: z.string().default("en"),
    showPrices: z.boolean().default(true),
    enableSearch: z.boolean().default(true),
    enableDietaryFilters: z.boolean().default(true),
  }),
  menu: z.array(MenuCategorySchema).min(1),
  // Combos / meal deals
  combos: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    items: z.array(z.string()),
    comboPrice: z.number(),
    available: z.boolean().default(true),
  })).optional(),
  // Menu variants (e.g., lunch/dinner)
  menuVariants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    availableFrom: z.string().optional(),
    availableTo: z.string().optional(),
    availableDays: z.array(z.string()).optional(),
    categories: z.array(MenuCategorySchema),
  })).optional(),
});

export type Restaurant = z.infer<typeof RestaurantSchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;
export type MenuCategory = z.infer<typeof MenuCategorySchema>;
export type Theme = z.infer<typeof ThemeSchema>;
