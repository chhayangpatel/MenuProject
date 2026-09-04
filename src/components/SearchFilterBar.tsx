import { useState, useEffect } from 'react';
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

  // Extract unique tags from menu items (SSR-safe)
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    const items = (window as any).__RESTAURANT_ITEMS__ || [];
    const tagSet = new Set<string>();
    items.forEach((item: any) => {
      (item.tags || []).forEach((tag: string) => tagSet.add(tag));
      if ((item.spicyLevel || 0) > 0) tagSet.add('spicy');
    });
    setAvailableTags(Array.from(tagSet).sort());
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
