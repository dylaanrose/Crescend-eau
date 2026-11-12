// Filtres par secteur (prestations, réalisations).
// Boutons : .filter[data-filter] ; éléments filtrés : [data-sec="secteur1 secteur2"] ; compteur : [data-count].
// Un filtre peut être présélectionné par l’adresse : ?secteur=<data-filter>.
export function initFilters() {
  document.querySelectorAll('.filters').forEach((group) => {
    const section = group.closest('section');
    const items = [...section.querySelectorAll('[data-sec]')];
    const counter = section.querySelector('[data-count]');

    group.addEventListener('click', (event) => {
      const button = event.target.closest('.filter');
      if (!button) return;
      const filter = button.dataset.filter;

      group.querySelectorAll('.filter').forEach((other) => {
        other.setAttribute('aria-pressed', String(other === button));
      });

      let shown = 0;
      items.forEach((item) => {
        const match = filter === 'tous' || item.dataset.sec.split(' ').includes(filter);
        item.hidden = !match;
        if (match) shown += 1;
      });
      if (counter) counter.textContent = shown + ' ' + (shown > 1 ? counter.dataset.many : counter.dataset.one);
    });

    // Filtre demandé par l’adresse (prestations.html?secteur=industries, depuis la page Secteurs).
    const wanted = new URLSearchParams(window.location.search).get('secteur');
    const preset = [...group.querySelectorAll('.filter')].find((button) => button.dataset.filter === wanted);
    if (preset) preset.click();
  });
}
