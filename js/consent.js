// Consentement aux cookies (RGPD, article 82 de la loi Informatique et Libertés, recommandations de la CNIL).
// Les textes sont dans partials/cookies.html (recopié dans chaque page). Ce module ne fait que :
//   – afficher le bandeau tant qu’aucun choix valable n’est enregistré ;
//   – mémoriser le choix (stockage local, 6 mois) puis relire / rouvrir le panneau ;
//   – activer, et seulement avec le consentement de leur catégorie, les ressources mises en attente dans le HTML.
//
// Mettre un outil en attente dans une page (rien ne se charge ni ne s’exécute avant le consentement) :
//   <script type="text/plain" data-consent-category="mesure" src="https://…"></script>
//   <iframe data-consent-category="medias" data-src="https://…" title="…"></iframe>
// Catégories : « mesure » (mesure d’audience) et « medias » (contenus externes). « necessaires » ne demande rien.
const KEY = 'cr-consent';
const VALIDITY = 6 * 30 * 24 * 60 * 60 * 1000; // 6 mois : durée de validité du choix recommandée par la CNIL
const CATEGORIES = ['mesure', 'medias'];

const read = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return saved && Date.now() - saved.date < VALIDITY ? saved : null;
  } catch { return null; }
};
const write = (choice) => {
  try { localStorage.setItem(KEY, JSON.stringify({ ...choice, date: Date.now() })); } catch { /* stockage refusé : le bandeau reviendra */ }
};

// Active les ressources en attente dont la catégorie est acceptée.
function activate(choice) {
  document.querySelectorAll('script[type="text/plain"][data-consent-category]').forEach((held) => {
    if (!choice[held.dataset.consentCategory]) return;
    const script = document.createElement('script');
    for (const { name, value } of held.attributes) if (name !== 'type') script.setAttribute(name, value);
    script.textContent = held.textContent;
    held.replaceWith(script);
  });
  document.querySelectorAll('iframe[data-consent-category][data-src]').forEach((frame) => {
    if (choice[frame.dataset.consentCategory]) frame.src = frame.dataset.src;
  });
}

export function initConsent() {
  const box = document.getElementById('consent');
  if (!box) return;
  const view = (name) => box.querySelector('[data-consent-view="' + name + '"]');
  const form = view('panel');
  const show = (name) => {
    view('banner').hidden = name !== 'banner';
    form.hidden = name !== 'panel';
    box.hidden = false;
    if (name === 'panel') form.querySelector('input[name]').focus();
  };

  const saved = read();
  if (saved) activate(saved); else show('banner');

  const choose = (choice) => {
    const before = read();
    write(choice);
    box.hidden = true;
    // Un consentement retiré ne peut pas décharger ce qui tourne déjà : la page est rechargée.
    if (before && CATEGORIES.some((name) => before[name] && !choice[name])) location.reload();
    else activate(choice);
  };
  const all = (value) => Object.fromEntries(CATEGORIES.map((name) => [name, value]));

  box.addEventListener('click', (event) => {
    const action = event.target.closest('[data-consent]')?.dataset.consent;
    if (action === 'accept') choose(all(true));
    if (action === 'reject') choose(all(false));
    if (action === 'customize') show('panel');
    if (action === 'back') read() ? (box.hidden = true) : show('banner');
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    choose(Object.fromEntries(CATEGORIES.map((name) => [name, form.elements[name].checked])));
  });
  box.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && read()) box.hidden = true;
  });

  // « Gérer mes cookies » (pied de page, page de la politique de cookies) : rouvre le panneau avec le choix en cours.
  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-consent-open]')) return;
    const current = read() || all(false);
    CATEGORIES.forEach((name) => { form.elements[name].checked = !!current[name]; });
    show('panel');
  });
}
