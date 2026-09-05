/**
 * Template component map — the ONLY place template components are imported.
 * Astro statically analyzes this object literal, so per-template code
 * splitting / tree-shaking is preserved.
 *
 * Adding a template: one import block + one entry here. Nothing else changes.
 * See docs/design/02-template-authoring-guide.md §3.
 */
import type { TemplateId } from "./registry";

// ── editorial-classic ──────────────────────────────────────────────────────
import EditorialHero from "./editorial-classic/Hero.astro";
import EditorialHeader from "./editorial-classic/Header.astro";
import EditorialCategoryNav from "./editorial-classic/CategoryNav.astro";
import EditorialCategoryHero from "./editorial-classic/CategoryHero.astro";
import EditorialMenuCard from "./editorial-classic/MenuCard.astro";
import EditorialFeaturedCarousel from "./editorial-classic/FeaturedCarousel.astro";
import EditorialFooter from "./editorial-classic/Footer.astro";

// ── modern-minimal ─────────────────────────────────────────────────────────
import MinimalHero from "./modern-minimal/Hero.astro";
import MinimalHeader from "./modern-minimal/Header.astro";
import MinimalCategoryNav from "./modern-minimal/CategoryNav.astro";
import MinimalCategoryHero from "./modern-minimal/CategoryHero.astro";
import MinimalMenuCard from "./modern-minimal/MenuCard.astro";
import MinimalFeaturedCarousel from "./modern-minimal/FeaturedCarousel.astro";
import MinimalFooter from "./modern-minimal/Footer.astro";

// ── bold-street ────────────────────────────────────────────────────────────
import BoldHero from "./bold-street/Hero.astro";
import BoldHeader from "./bold-street/Header.astro";
import BoldCategoryNav from "./bold-street/CategoryNav.astro";
import BoldCategoryHero from "./bold-street/CategoryHero.astro";
import BoldMenuCard from "./bold-street/MenuCard.astro";
import BoldFeaturedCarousel from "./bold-street/FeaturedCarousel.astro";
import BoldFooter from "./bold-street/Footer.astro";

// ── warm-rustic ────────────────────────────────────────────────────────────
import RusticHero from "./warm-rustic/Hero.astro";
import RusticHeader from "./warm-rustic/Header.astro";
import RusticCategoryNav from "./warm-rustic/CategoryNav.astro";
import RusticCategoryHero from "./warm-rustic/CategoryHero.astro";
import RusticMenuCard from "./warm-rustic/MenuCard.astro";
import RusticFeaturedCarousel from "./warm-rustic/FeaturedCarousel.astro";
import RusticFooter from "./warm-rustic/Footer.astro";

// ── vibrant-playful ────────────────────────────────────────────────────────
import PlayfulHero from "./vibrant-playful/Hero.astro";
import PlayfulHeader from "./vibrant-playful/Header.astro";
import PlayfulCategoryNav from "./vibrant-playful/CategoryNav.astro";
import PlayfulCategoryHero from "./vibrant-playful/CategoryHero.astro";
import PlayfulMenuCard from "./vibrant-playful/MenuCard.astro";
import PlayfulFeaturedCarousel from "./vibrant-playful/FeaturedCarousel.astro";
import PlayfulFooter from "./vibrant-playful/Footer.astro";

import DarkLuxeHero from "./dark-luxe/Hero.astro";
import DarkLuxeHeader from "./dark-luxe/Header.astro";
import DarkLuxeCategoryNav from "./dark-luxe/CategoryNav.astro";
import DarkLuxeCategoryHero from "./dark-luxe/CategoryHero.astro";
import DarkLuxeMenuCard from "./dark-luxe/MenuCard.astro";
import DarkLuxeFeaturedCarousel from "./dark-luxe/FeaturedCarousel.astro";
import DarkLuxeFooter from "./dark-luxe/Footer.astro";
import SeasideCoastalHero from "./seaside-coastal/Hero.astro";
import SeasideCoastalHeader from "./seaside-coastal/Header.astro";
import SeasideCoastalCategoryNav from "./seaside-coastal/CategoryNav.astro";
import SeasideCoastalCategoryHero from "./seaside-coastal/CategoryHero.astro";
import SeasideCoastalMenuCard from "./seaside-coastal/MenuCard.astro";
import SeasideCoastalFeaturedCarousel from "./seaside-coastal/FeaturedCarousel.astro";
import SeasideCoastalFooter from "./seaside-coastal/Footer.astro";
import ZenGardenHero from "./zen-garden/Hero.astro";
import ZenGardenHeader from "./zen-garden/Header.astro";
import ZenGardenCategoryNav from "./zen-garden/CategoryNav.astro";
import ZenGardenCategoryHero from "./zen-garden/CategoryHero.astro";
import ZenGardenMenuCard from "./zen-garden/MenuCard.astro";
import ZenGardenFeaturedCarousel from "./zen-garden/FeaturedCarousel.astro";
import ZenGardenFooter from "./zen-garden/Footer.astro";
import RetroDinerHero from "./retro-diner/Hero.astro";
import RetroDinerHeader from "./retro-diner/Header.astro";
import RetroDinerCategoryNav from "./retro-diner/CategoryNav.astro";
import RetroDinerCategoryHero from "./retro-diner/CategoryHero.astro";
import RetroDinerMenuCard from "./retro-diner/MenuCard.astro";
import RetroDinerFeaturedCarousel from "./retro-diner/FeaturedCarousel.astro";
import RetroDinerFooter from "./retro-diner/Footer.astro";
import ArtisanCraftHero from "./artisan-craft/Hero.astro";
import ArtisanCraftHeader from "./artisan-craft/Header.astro";
import ArtisanCraftCategoryNav from "./artisan-craft/CategoryNav.astro";
import ArtisanCraftCategoryHero from "./artisan-craft/CategoryHero.astro";
import ArtisanCraftMenuCard from "./artisan-craft/MenuCard.astro";
import ArtisanCraftFeaturedCarousel from "./artisan-craft/FeaturedCarousel.astro";
import ArtisanCraftFooter from "./artisan-craft/Footer.astro";

interface TemplateComponentSet {
    Hero: typeof EditorialHero;
    Header: typeof EditorialHeader;
    CategoryNav: typeof EditorialCategoryNav;
    CategoryHero: typeof EditorialCategoryHero;
    MenuCard: typeof EditorialMenuCard;
    FeaturedCarousel: typeof EditorialFeaturedCarousel;
    Footer: typeof EditorialFooter;
}

export const templateComponents: Record<
    TemplateId,
    TemplateComponentSet
> = {
    "editorial-classic": {
        Hero: EditorialHero,
        Header: EditorialHeader,
        CategoryNav: EditorialCategoryNav,
        CategoryHero: EditorialCategoryHero,
        MenuCard: EditorialMenuCard,
        FeaturedCarousel: EditorialFeaturedCarousel,
        Footer: EditorialFooter,
    },
    "modern-minimal": {
        Hero: MinimalHero,
        Header: MinimalHeader,
        CategoryNav: MinimalCategoryNav,
        CategoryHero: MinimalCategoryHero,
        MenuCard: MinimalMenuCard,
        FeaturedCarousel: MinimalFeaturedCarousel,
        Footer: MinimalFooter,
    },
    "bold-street": {
        Hero: BoldHero,
        Header: BoldHeader,
        CategoryNav: BoldCategoryNav,
        CategoryHero: BoldCategoryHero,
        MenuCard: BoldMenuCard,
        FeaturedCarousel: BoldFeaturedCarousel,
        Footer: BoldFooter,
    },
    "warm-rustic": {
        Hero: RusticHero,
        Header: RusticHeader,
        CategoryNav: RusticCategoryNav,
        CategoryHero: RusticCategoryHero,
        MenuCard: RusticMenuCard,
        FeaturedCarousel: RusticFeaturedCarousel,
        Footer: RusticFooter,
    },
    "vibrant-playful": {
        Hero: PlayfulHero,
        Header: PlayfulHeader,
        CategoryNav: PlayfulCategoryNav,
        CategoryHero: PlayfulCategoryHero,
        MenuCard: PlayfulMenuCard,
        FeaturedCarousel: PlayfulFeaturedCarousel,
        Footer: PlayfulFooter,
    },
    "dark-luxe": {
        Hero: DarkLuxeHero,
        Header: DarkLuxeHeader,
        CategoryNav: DarkLuxeCategoryNav,
        CategoryHero: DarkLuxeCategoryHero,
        MenuCard: DarkLuxeMenuCard,
        FeaturedCarousel: DarkLuxeFeaturedCarousel,
        Footer: DarkLuxeFooter,
    },
    "seaside-coastal": {
        Hero: SeasideCoastalHero,
        Header: SeasideCoastalHeader,
        CategoryNav: SeasideCoastalCategoryNav,
        CategoryHero: SeasideCoastalCategoryHero,
        MenuCard: SeasideCoastalMenuCard,
        FeaturedCarousel: SeasideCoastalFeaturedCarousel,
        Footer: SeasideCoastalFooter,
    },
    "zen-garden": {
        Hero: ZenGardenHero,
        Header: ZenGardenHeader,
        CategoryNav: ZenGardenCategoryNav,
        CategoryHero: ZenGardenCategoryHero,
        MenuCard: ZenGardenMenuCard,
        FeaturedCarousel: ZenGardenFeaturedCarousel,
        Footer: ZenGardenFooter,
    },
    "retro-diner": {
        Hero: RetroDinerHero,
        Header: RetroDinerHeader,
        CategoryNav: RetroDinerCategoryNav,
        CategoryHero: RetroDinerCategoryHero,
        MenuCard: RetroDinerMenuCard,
        FeaturedCarousel: RetroDinerFeaturedCarousel,
        Footer: RetroDinerFooter,
    },
    "artisan-craft": {
        Hero: ArtisanCraftHero,
        Header: ArtisanCraftHeader,
        CategoryNav: ArtisanCraftCategoryNav,
        CategoryHero: ArtisanCraftCategoryHero,
        MenuCard: ArtisanCraftMenuCard,
        FeaturedCarousel: ArtisanCraftFeaturedCarousel,
        Footer: ArtisanCraftFooter,
    },
};
