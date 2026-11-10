// Composants partagés : remplace chaque <div data-include="partials/x.html"> par le contenu du fichier.
// ponytail: inclusion côté navigateur (fetch), donc pas d’en-tête sans JavaScript ni en file://.
// Passer à une inclusion au build ou côté serveur si le référencement sans JS devient un enjeu.
export async function loadPartials() {
  const slots = [...document.querySelectorAll('[data-include]')];
  await Promise.all(slots.map(async (slot) => {
    const file = slot.dataset.include;
    try {
      const response = await fetch(file);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      slot.outerHTML = await response.text();
    } catch (error) {
      console.error('Inclusion impossible : ' + file, error);
    }
  }));
}
