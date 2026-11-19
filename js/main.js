// Point d’entrée unique, chargé par toutes les pages.
// Chaque module ne fait rien si la page ne contient pas les éléments qu’il pilote.
import { initHeader } from './header.js';
import { initCounters } from './counters.js';
import { initBeforeAfter } from './before-after.js';
import { initFilters } from './filters.js';
import { initForms } from './forms.js';
import { initDevis } from './devis.js';
import { initZone } from './zone.js';
import { initScrolly } from './scrolly.js';
import { initConsent } from './consent.js';

initScrolly(); // en premier : la hauteur du hero de l’accueil en dépend
initHeader();
initCounters();
initBeforeAfter();
initFilters();
initZone();
initForms(); // avant initDevis : prérempli les champs que le devis relit
initDevis();
initConsent();
