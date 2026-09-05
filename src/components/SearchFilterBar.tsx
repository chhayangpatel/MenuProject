import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

interface Props {
  enabled: boolean;
  enableDietaryFilters?: boolean;
}

const TAG_LABELS: Record<string, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  "gluten-free": "Gluten-Free",
  "dairy-free": "Dairy-Free",
  "nut-free": "Nut-Free",
  halal: "Halal",
  kosher: "Kosher",
  organic: "Organic",
  "house-made": "House-Made",
  seasonal: "Seasonal",
  spicy: "Spicy",
};

export default function SearchFilterBar({
  enabled,
  enableDietaryFilters = true,
}: Props) {
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [totalItems, setTotalItems] = useState(0);
  const [visibleItems, setVisibleItems] = useState(0);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    const items = (window as any).__RESTAURANT_ITEMS__ || [];
    const tagSet = new Set<string>();
    items.forEach((item: any) => {
      (item.tags || []).forEach((tag: string) => tagSet.add(tag));
      if ((item.spicyLevel || 0) > 0) tagSet.add("spicy");
    });
    setAvailableTags(Array.from(tagSet).sort());
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const items = document.querySelectorAll<HTMLElement>("[data-item-id]");
    setTotalItems(items.length);

    const storeItems = (window as any).__RESTAURANT_ITEMS__ || [];
    const q = query.trim().toLowerCase();
    let visible = 0;

    items.forEach((el) => {
      const id = el.getAttribute("data-item-id");
      const storeItem = storeItems.find((i: any) => i.id === id);
      const itemTags: string[] = storeItem?.tags || [];
      const isSpicy = (storeItem?.spicyLevel || 0) > 0;

      const name = (el.querySelector("h3")?.textContent || "").toLowerCase();
      const desc = (el.querySelector("p")?.textContent || "").toLowerCase();
      const matchesSearch = !q || name.includes(q) || desc.includes(q);

      const matchesTags =
        activeTags.size === 0 ||
        Array.from(activeTags).every((tag) => {
          if (tag === "spicy") return isSpicy;
          return itemTags.includes(tag);
        });

      const show = matchesSearch && matchesTags;
      el.hidden = !show;
      if (show) visible++;
    });

    setVisibleItems(visible);

    // Hide empty categories only while filtering
    const isFiltering = q.length > 0 || activeTags.size > 0;
    document
      .querySelectorAll<HTMLElement>('section[id^="category-"]')
      .forEach((cat) => {
        const anyVisible = Array.from(
          cat.querySelectorAll<HTMLElement>("[data-item-id]")
        ).some((el) => !el.hidden);
        cat.hidden = isFiltering && !anyVisible;
      });
  }, [query, activeTags, enabled]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  if (!enabled) return null;

  return (
    <div className="mr-search">
      {/* Search input */}
      <div className="mr-search-field">
        <span className="mr-search-icon" aria-hidden="true">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="Search menu…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search menu"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="mr-search-clear"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dietary filter chips */}
      {enableDietaryFilters && availableTags.length > 0 && (
        <div className="mr-search-chips" role="group" aria-label="Dietary filters">
          {availableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              data-active={activeTags.has(tag) || undefined}
              onClick={() => toggleTag(tag)}
            >
              {TAG_LABELS[tag] || tag}
            </button>
          ))}
        </div>
      )}

      {/* Result count */}
      {(query || activeTags.size > 0) && (
        <p className="mr-search-count">
          Showing <b>{visibleItems}</b> of {totalItems}
          {visibleItems === 0 && (
            <span className="mr-search-none">
              — nothing matches. Try a different search or clear the filters.
            </span>
          )}
        </p>
      )}
    </div>
  );
}