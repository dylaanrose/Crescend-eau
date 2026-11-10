// En-tête : lien actif, compactage au défilement, menu mobile.
export function initHeader() {
  const header = document.querySelector('.hdr');
  if (!header) return;

  // Lien actif : <body data-page="…"> correspond au data-nav du lien.
  const page = document.body.dataset.page;
  header.querySelectorAll('[data-nav="' + page + '"]').forEach((link) => {
    link.classList.add('is-active');
    if (link.classList.contains('cr-nav__link')) link.setAttribute('aria-current', 'page');
  });

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
}
