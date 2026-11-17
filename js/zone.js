// Zone d’intervention (secteurs.html) : fiches des villes sur la carte.
// Les fiches sont des éléments [popover] du HTML. Leur ouverture par les boutons [popovertarget], leur
// fermeture (Échap, clic ailleurs) et leur annonce aux lecteurs d’écran sont assurées par le navigateur :
// ce module ne fait que les placer sur la carte. Tous les textes sont dans secteurs.html.
export function initZone() {
  const map = document.querySelector('.map');
  if (map) initMap(map);
}

function initMap(map) {
  const zone = map.closest('section');
  const point = (id) => map.querySelector('[popovertarget="' + id + '"]');

  // Place la fiche sur le repère de sa ville (--x, --y : centre du point, en px dans la page).
  // Elle s’ouvre vers le haut dans la moitié basse de la carte, vers le bas sinon.
  const place = (card) => {
    const dot = point(card.id).querySelector('i').getBoundingClientRect();
    const frame = map.getBoundingClientRect();
    card.style.setProperty('--x', dot.left + dot.width / 2 + window.scrollX + 'px');
    card.style.setProperty('--y', dot.top + dot.height / 2 + window.scrollY + 'px');
    card.classList.toggle('is-above', dot.top - frame.top > frame.height / 2);
    card.classList.add('is-placed');
  };

  // Ces deux événements ne remontent pas dans la page : ils sont écoutés en phase de capture.
  zone.addEventListener('beforetoggle', (event) => {
    if (event.newState === 'open' && event.target.matches('.map__card')) place(event.target);
  }, true);
  zone.addEventListener('toggle', (event) => {
    const card = event.target;
    if (!card.matches('.map__card')) return;
    const open = event.newState === 'open';
    // La ville ouverte est marquée sur la carte et dans la liste.
    zone.querySelectorAll('[popovertarget="' + card.id + '"]:not([popovertargetaction])')
      .forEach((button) => button.classList.toggle('is-on', open));
    // Ville choisie dans la liste alors que la carte est hors de l’écran (mobile) : on y amène la fiche.
    if (open) {
      card.scrollIntoView({ block: 'nearest' });
      seen = inView(card);
    }
  }, true);
  window.addEventListener('resize', () => zone.querySelectorAll('.map__card:popover-open').forEach(place));

  // Une fiche ouverte suit la page qui défile. Elle se ferme dès qu’elle atteindrait l’en-tête collant,
  // la barre d’appel du mobile ou le bord de l’écran, au lieu de passer par-dessus.
  const header = document.querySelector('.hdr-sticky');
  const callbar = document.querySelector('.callbar');
  const inView = (card) => {
    const box = card.getBoundingClientRect();
    const top = header ? header.getBoundingClientRect().bottom : 0;
    const bottom = callbar && callbar.offsetHeight ? callbar.getBoundingClientRect().top : window.innerHeight;
    return box.top >= top && box.bottom <= bottom;
  };
  // « seen » : la fiche ouverte a déjà été entièrement visible. Sur un écran trop bas pour la contenir,
  // elle ne l’est jamais et reste donc ouverte, au lieu de se fermer aussitôt.
  let seen = false;
  window.addEventListener('scroll', () => {
    const card = zone.querySelector('.map__card:popover-open');
    if (!card) return;
    if (inView(card)) seen = true;
    else if (seen) card.hidePopover();
  }, { passive: true });

  // Survol ou focus d’une ville de la liste : son repère s’allume sur la carte.
  const hint = (on) => (event) => {
    const button = event.target.closest('.cities [popovertarget]');
    if (button) point(button.getAttribute('popovertarget')).classList.toggle('is-hint', on);
  };
  ['mouseover', 'focusin'].forEach((type) => zone.addEventListener(type, hint(true)));
  ['mouseout', 'focusout'].forEach((type) => zone.addEventListener(type, hint(false)));
}
