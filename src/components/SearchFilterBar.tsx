import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface Props {
  enabled: boolean;
}

export default function SearchFilterBar({ enabled }: Props) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!enabled) return;
    
    // Quick client-side filter
    const items = document.querySelectorAll('[data-item-id]');
    
    items.forEach(el => {
      const name = el.querySelector('h3')?.textContent?.toLowerCase() || '';
      const desc = el.querySelector('p')?.textContent?.toLowerCase() || '';
      const q = query.toLowerCase();
      
      if (name.includes(q) || desc.includes(q)) {
        (el as HTMLElement).style.display = '';
      } else {
        (el as HTMLElement).style.display = 'none';
      }
    });
    
    // Hide categories that have no visible items
    const categories = document.querySelectorAll('section[id^="category-"]');
    categories.forEach(cat => {
      const visibleItems = cat.querySelectorAll('[data-item-id]:not([style*="display: none"])');
      if (visibleItems.length === 0 && query.length > 0) {
        (cat as HTMLElement).style.display = 'none';
      } else {
        (cat as HTMLElement).style.display = '';
      }
    });
    
  }, [query, enabled]);

  if (!enabled) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      <div className="relative max-w-md mx-auto">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-primary)]/50">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="Search menu..." 
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-[var(--color-primary)]/20 rounded-full bg-[var(--color-secondary)] text-[var(--color-primary)] placeholder-[var(--color-primary)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent font-body shadow-inner transition-all"
        />
      </div>
    </div>
  );
}
