// Point d’entrée unique, chargé par toutes les pages.
// Chaque module ne fait rien si la page ne contient pas les éléments qu’il pilote.
import { loadPartials } from './include.js';
import { initHeader } from './header.js';
import { initCounters } from './counters.js';
import { initBeforeAfter } from './before-after.js';
import { initFilters } from './filters.js';
import { initDevis } from './devis.js';

await loadPartials(); // l’en-tête et le pied de page doivent être en place avant initHeader()

initHeader();
initCounters();
initBeforeAfter();
initFilters();
initDevis();

// Formulaires de contact et de devis rapide : aucun envoi tant qu’aucun service n’est branché.
document.querySelectorAll('form[data-no-submit]').forEach((form) => {
  form.addEventListener('submit', (event) => event.preventDefault());
});
