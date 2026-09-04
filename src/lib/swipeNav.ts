/**
 * Mobile swipe navigation between menu categories.
 * Horizontal swipes navigate between category sections.
 */
export function initSwipeNav() {
  const sections = document.querySelectorAll<HTMLElement>('section[id^="category-"]');
  if (sections.length < 2) return;

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let startX = 0;
  let startY = 0;
  let startTime = 0;

  document.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTime = Date.now();
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    const dt = Date.now() - startTime;

    // Require minimum swipe distance and speed, and horizontal direction
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) || dt > 500) return;

    const currentIndex = Array.from(sections).findIndex(s => {
      const rect = s.getBoundingClientRect();
      return rect.top <= 100 && rect.bottom > 100;
    });

    if (currentIndex === -1) return;

    if (dx < 0 && currentIndex < sections.length - 1) {
      // Swipe left → next category
      sections[currentIndex + 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (dx > 0 && currentIndex > 0) {
      // Swipe right → previous category
      sections[currentIndex - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, { passive: true });
}
