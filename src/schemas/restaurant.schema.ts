import { z } from "zod";

export const MenuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  image: z.string().optional(), // relative path within assets/menu/
  gallery: z.array(z.string()).optional(), // extra photos shown in the detail sheet
  pairsWith: z.string().optional(), // e.g. "Try with our house Chianti"
  tags: z.array(z.enum(["vegetarian", "vegan", "gluten-free", "dairy-free", "nut-free"])).default([]),
  spicyLevel: z.number().min(0).max(3).default(0),
  available: z.boolean().default(true),
  featured: z.boolean().default(false),
});

export const MenuCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  items: z.array(MenuItemSchema).min(1),
});

export const ThemeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontHeading: z.string().default("Playfair Display"),
  fontBody: z.string().default("Inter"),
  borderRadius: z.enum(["none", "sm", "md", "lg", "full"]).default("md"),
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
  contact: z.object({
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    googleMapsUrl: z.string().url().optional(),
    socials: z.record(z.string().url()).optional(),
  }),
  hours: z.record(z.string()).optional(),
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
});

export type Restaurant = z.infer<typeof RestaurantSchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;
export type MenuCategory = z.infer<typeof MenuCategorySchema>;
export type Theme = z.infer<typeof ThemeSchema>;
