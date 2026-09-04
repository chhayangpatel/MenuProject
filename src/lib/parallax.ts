/**
 * Mouse-tracking parallax depth system.
 * Elements with data-parallax attribute move based on cursor position.
 * Depth value controls intensity (1 = normal, 2 = double, 0.5 = half).
 */
export function initParallax() {
  const layers = document.querySelectorAll<HTMLElement>('[data-parallax]');
  if (!layers.length) return;

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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
