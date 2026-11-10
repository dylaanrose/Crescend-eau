# Crescend’eau — site vitrine

Site statique en HTML, CSS et JavaScript, sans framework ni étape de build.
Il reprend la maquette V2 et le design system Crescend’eau.

## Voir le site en local

```bash
python3 -m http.server 8000
```

Puis ouvrir <http://localhost:8000>. Un serveur est nécessaire : l’en-tête et le pied de page
sont chargés par `fetch`, ce qui ne fonctionne pas en ouvrant les fichiers directement (`file://`).

## Organisation

```
*.html            une page par écran (index, prestations, prestation-bureaux, methode,
                  realisations, entreprise, contact, devis)
partials/         composants partagés : header.html et footer.html (une seule copie pour tout le site)
css/tokens.css      couleurs, espacements, rayons, typographie, polices (design system)
css/components.css  composants du design system, classes cr-* (boutons, titres, cartes…)
css/site.css        mise en page du site (en-tête, sections, formulaires, responsive)
css/pages.css       réglages ponctuels et utilitaires u-* (anciens styles en ligne de la maquette)
js/main.js          point d’entrée unique ; charge les modules ci-dessous
js/include.js       insère partials/ dans les pages
js/header.js        lien actif, en-tête compact au défilement, menu mobile
js/counters.js      chiffres clés animés
js/before-after.js  comparateur avant / après
js/filters.js       filtres par secteur
js/devis.js         formulaire de devis en 3 étapes
assets/img/         images et logo
assets/fonts/       Montserrat et DM Sans (variables)
```

## Règles du projet

- **Un langage par dossier.** Le HTML ne contient ni attribut `style`, ni bloc `<style>`, ni script en ligne.
  Tout style va dans `css/`, tout comportement dans `js/`.
- **Un composant se modifie à un seul endroit.** Un bouton est toujours `class="cr-btn cr-btn--…"` :
  changer `.cr-btn` dans `css/components.css` change tous les boutons du site.
  L’en-tête et le pied de page se modifient dans `partials/`.
- **Aucune valeur inventée.** Les couleurs, tailles et rayons viennent de `css/tokens.css` (`var(--…)`).
- Les mentions `[à confirmer]` et `[exemple]` signalent un contenu à valider avec l’entreprise : ne pas les retirer sans validation.
- Le site doit rester correct à 390 px de large (points de rupture : 1100, 960 et 720 px).

## Ajouter une page

Copier une page existante, puis adapter le `<title>`, le contenu de `<main>` et
`<body data-page="…">` (valeur du `data-nav` du lien à surligner dans `partials/header.html`).

## Sources

- Maquette : <https://claude.ai/artifact/SJ3DGpDh929hmCUEJKaN4a>
- Design system : <https://claude.ai/artifact/MfNU9L1Eu6qbxj9HcUZnCX>
