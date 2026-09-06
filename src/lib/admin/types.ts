export interface AdminConfig {
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    accentColor?: string;
  };
  settings?: {
    currency: string;
    currencySymbol: string;
    language: string;
    showPrices: boolean;
    enableSearch: boolean;
    enableDietaryFilters: boolean;
  };
}
