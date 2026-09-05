// Search & filter functionality for directory page
export function initDirectorySearch() {
  const searchInput = document.getElementById('dir-search');
  const filterChips = document.querySelectorAll('.filter-chip');
  const cards = document.querySelectorAll('.rcard');
  const searchBar = document.getElementById('dir-search-bar');

  // Search
  let searchDebounce;
  searchInput?.addEventListener('input', function() {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(filterCards, 150);
  });

  // Filter chips
  filterChips.forEach(function(chip) {
    chip.addEventListener('click', function() {
      filterChips.forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');
      filterCards();
    });
  });

  function filterCards() {
    const query = searchInput?.value.toLowerCase() || '';
    const activeFilter = document.querySelector('.filter-chip.active')?.dataset.filter || 'all';

    let visible = 0;
    cards.forEach(function(card) {
      const name = card.querySelector('.rcard-name')?.textContent?.toLowerCase() || '';
      const tagline = card.querySelector('.rcard-tagline')?.textContent?.toLowerCase() || '';
      const cuisine = card.querySelector('.rcard-meta')?.textContent?.toLowerCase() || '';

      const matchesSearch = !query || name.includes(query) || tagline.includes(query);
      const filterValue = activeFilter === 'all' ? '' : activeFilter.replace('cuisine-', '').toLowerCase();
      const matchesFilter = activeFilter === 'all' || cuisine.includes(filterValue);

      if (matchesSearch && matchesFilter) {
        card.style.display = '';
        card.style.animation = 'cardIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both';
        visible++;
      } else {
        card.style.display = 'none';
      }
    });

    // Show/hide empty state
    const emptyState = document.querySelector('.dir-empty');
    if (emptyState) {
      emptyState.style.display = visible === 0 ? 'flex' : 'none';
    }
  }

  // Scroll effect on search bar
  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
      searchBar?.classList.add('scrolled');
    } else {
      searchBar?.classList.remove('scrolled');
    }
  }, { passive: true });
}