// Comparateur Avant / Après : le curseur (input range invisible posé sur l’image)
// pilote la variable CSS --pos, lue par css/pages.css.
const SWEEP = [50, 76, 30, 50]; // positions (en %) parcourues par le balayage d’invitation
const SWEEP_MS = 2400;

export function initBeforeAfter() {
  document.querySelectorAll('.cr-ba').forEach((figure) => {
    const range = figure.querySelector('.cr-ba__range');
    const sync = () => {
      figure.style.setProperty('--pos', range.value + '%');
      range.setAttribute('aria-valuetext', Math.round(range.value) + ' % de la photo « avant »');
    };
    range.addEventListener('input', sync);
    sync();
    if ('sweep' in figure.dataset) sweep(figure, range, sync);
  });
}

// La vague passe une fois quand le comparateur arrive à l’écran : on comprend qu’il se manipule.
// Rien en mouvement réduit, et le balayage s’arrête dès que la personne prend la main.
function sweep(figure, range, sync) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    let stopped = false;
    const stop = () => { stopped = true; };
    range.addEventListener('pointerdown', stop, { once: true });
    range.addEventListener('keydown', stop, { once: true });
    const start = performance.now();
    const frame = (now) => {
      if (stopped) return;
      const t = Math.min(1, (now - start) / SWEEP_MS) * (SWEEP.length - 1);
      const i = Math.min(SWEEP.length - 2, Math.floor(t));
      const local = t - i;
      const eased = local < 0.5 ? 2 * local * local : 1 - Math.pow(-2 * local + 2, 2) / 2;
      range.value = SWEEP[i] + (SWEEP[i + 1] - SWEEP[i]) * eased;
      sync();
      if (t < SWEEP.length - 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, { threshold: 0.6 });
  observer.observe(figure);
}
