// En-tête : compactage au défilement et menu mobile.
// Le lien de la page courante est posé en dur dans le HTML par tools/sync-partials.mjs.
export function initHeader() {
  const header = document.querySelector('.hdr-sticky .hdr'); // le vrai en-tête, pas les exemplaires de composants.html
  if (!header) return;

  // Compactage : s’enclenche après 96 px, se relâche sous 8 px (évite le clignotement).
  let compact = false;
  const onScroll = () => {
    const next = compact ? window.scrollY > 8 : window.scrollY > 96;
    if (next === compact) return;
    compact = next;
    header.classList.toggle('is-compact', compact);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Menu mobile
  const burger = header.querySelector('.hdr__burger');
  const setOpen = (open) => {
    header.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? burger.dataset.labelClose : burger.dataset.labelOpen);
  };
  burger.addEventListener('click', () => setOpen(!header.classList.contains('is-open')));
  header.querySelector('.hdr__panel').addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false); // lien d’ancre vers la page courante
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !header.classList.contains('is-open')) return;
    setOpen(false);
    burger.focus();
  });
  // État de la maquette « menu ouvert » : index.html?menu=ouvert
  if (new URLSearchParams(window.location.search).get('menu') === 'ouvert') setOpen(true);
}
