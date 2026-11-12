// Chiffres clés : montent jusqu’à leur valeur quand le bandeau .stats entre à l’écran.
// Ils partent de 60 % de la valeur : un « 0 agents » affiché même un instant serait faux.
// Sans JavaScript ou en mouvement réduit, les valeurs finales écrites dans le HTML restent affichées.
const DURATION = 1600; // ms

export function initCounters() {
  const zone = document.querySelector('.stats');
  if (!zone) return;
  const numbers = [...zone.querySelectorAll('[data-count-to]')];
  if (!numbers.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const run = () => {
    const start = performance.now();
    const frame = (now) => {
      const progress = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - progress, 3);
      numbers.forEach((el) => { el.textContent = Math.round(el.dataset.countTo * (0.6 + 0.4 * eased)); });
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    run();
  }, { threshold: 0.4 });
  observer.observe(zone);
}
