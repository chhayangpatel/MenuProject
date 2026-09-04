/**
 * Magnetic button physics.
 * Buttons subtly follow the cursor when nearby, creating a magnetic pull effect.
 */
export function initMagnetic() {
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transition = 'transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)';
      btn.style.transform = '';
      setTimeout(() => {
        btn.style.transition = '';
      }, 500);
    });
  });
}
