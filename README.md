# Crescend’eau — site vitrine

Site statique en HTML, CSS et JavaScript, sans framework ni étape de build.
Il reprend la maquette V2 et le design system Crescend’eau.

## Voir le site en local

```bash
python3 -m http.server 8000
```

Puis ouvrir <http://localhost:8000>. Un serveur est nécessaire : les scripts sont des modules
JavaScript, que le navigateur refuse de charger en ouvrant les fichiers directement (`file://`).

## Organisation

```
*.html              une page par écran (voir « Pages »)
partials/           composants partagés : header.html et footer.html (source unique)
css/tokens.css      couleurs, espacements, rayons, typographie, polices (design system)
css/components.css  composants du design system, classes cr-* (boutons, titres, cartes…)
css/site.css        mise en page du site (en-tête, sections, formulaires, responsive)
css/pages.css       correctifs, réglages ponctuels et utilitaires u-*
js/main.js          point d’entrée unique ; charge les modules ci-dessous
js/config.js        réglages : adresse d’envoi des formulaires
js/forms.js         formulaires : validation, pièce jointe, envoi
js/devis.js         devis en 3 étapes
js/header.js        en-tête compact au défilement, menu mobile
js/counters.js      chiffres clés animés
js/before-after.js  comparateur avant / après
js/filters.js       filtres par secteur
js/zone.js          carte de la zone d’intervention : fiches des villes, code postal
tools/sync-partials.mjs  recopie l’en-tête et le pied de page dans toutes les pages
assets/img/         images, logo ; avant-apres/ pour les comparateurs
assets/fonts/       Montserrat et DM Sans (variables)
```

## Pages

- **Maquette** : `index`, `prestations`, `prestation-bureaux`, `methode`, `realisations`, `entreprise`, `contact`, `devis`.
- **Secteurs** : `secteurs.html` réunit les sections « Secteurs » et « Zone d’intervention » de la maquette, qui se
  trouvaient sur l’accueil. L’onglet Secteurs y mène.
- **Référence interne** : `composants.html` (planche « Composants et états » de la maquette). Elle montre chaque
  composant dans tous ses états et liste, en bas de page, l’adresse de chaque écran de la maquette. Non indexée.
- **Hors maquette**, composées avec les composants existants : `mentions-legales`, `politique-confidentialite`,
  `cookies`, `plan-du-site`, `nous-rejoindre`, `espace-client`, `nos-valeurs`. Leurs contenus sont à valider.

## Règles du projet

- **Une rubrique, une page.** Chaque onglet du menu mène à sa propre page, et le contenu d’une rubrique ne vit que
  sur cette page. L’accueil n’en reprend aucune : il renvoie vers chacune par une tuile.
- **Un langage par dossier.** Le HTML ne contient ni attribut `style`, ni bloc `<style>`, ni script en ligne.
  Tout style va dans `css/`, tout comportement dans `js/`. Les textes (libellés, messages d’erreur) restent dans le HTML.
- **Un composant se modifie à un seul endroit.** Un bouton est toujours `class="cr-btn cr-btn--…"` :
  changer `.cr-btn` dans `css/components.css` change tous les boutons du site.
- **Aucune valeur inventée.** Les couleurs, tailles et rayons viennent de `css/tokens.css` (`var(--…)`).
- Les mentions `[à confirmer]` et `[exemple]` signalent un contenu à valider avec l’entreprise : ne pas les retirer sans validation.
- Le site doit rester correct à 390 px de large (points de rupture : 1100, 960 et 720 px).

## Modifier l’en-tête ou le pied de page

Modifier **uniquement** `partials/header.html` ou `partials/footer.html`, puis lancer :

```bash
node tools/sync-partials.mjs
```

La commande recopie le composant dans toutes les pages, entre les repères `<!-- partial:header -->` et
`<!-- /partial:header -->`, et marque le lien de la page courante. Ne modifiez jamais ce bloc dans une page :
il est réécrit à chaque passage. `node tools/sync-partials.mjs --check` vérifie que tout est à jour sans rien écrire.

## Ajouter une page

Copier une page existante, adapter le `<title>`, le contenu de `<main>` et `<body data-page="…">`
(valeur du `data-nav` du lien à surligner dans `partials/header.html`, ou un nom libre), puis lancer la commande ci-dessus.

## Formulaires

Quatre formulaires : devis rapide (accueil), contact, devis en 3 étapes, candidature.

- **Brancher l’envoi** : renseigner `FORM_ENDPOINT` dans `js/config.js`. Chaque formulaire y est envoyé en `POST`
  `multipart/form-data` ; toute réponse 2xx vaut succès. Champs : ceux du formulaire (`nom`, `email`, `telephone`…),
  plus `formulaire` (lequel) et `numero` (numéro de demande `CR-AAMM-NNNN`). Les cases à cocher multiples
  arrivent en une seule valeur séparée par des virgules ; la pièce jointe dans `piece_jointe`.
- **Tant que `FORM_ENDPOINT` est vide**, le site est en mode démonstration : les formulaires se valident
  mais n’envoient rien, et l’affichent clairement.
- **À vérifier côté hébergeur** : la pièce jointe peut atteindre 10 Mo, plus que la limite par défaut de
  beaucoup d’hébergements. Le numéro de demande est tiré au hasard dans le navigateur : le serveur devra l’attribuer.
- **Sous-services du devis** : une prestation peut ouvrir un bloc de sous-services. Dans `devis.html`, sa case porte
  `aria-controls="identifiant"` et le bloc est un `<fieldset class="qgroup subs" id="identifiant" disabled>` qui
  contient des cases avec leur propre `name`. Aucun JavaScript à écrire. Champs envoyés aujourd’hui :
  `services_complementaires` et `depannage_multiservices`, seulement si leur prestation est cochée.
- **Ajouter un champ contrôlé** : lui donner un `name`, `required` et/ou `pattern`, et placer à côté
  `<p class="field__err" data-err="son-name" hidden>message</p>`. Aucun JavaScript à écrire.

## Carte de la zone d’intervention

Sur `secteurs.html`. Une ville tient en trois éléments, reliés par le même identifiant `ville-<nom>` :

- son bouton dans la liste (`.cities`) et son bouton sur la carte (`.map__pt map__pt--<nom>`), tous deux avec
  `popovertarget="ville-<nom>"` ;
- sa fiche, `<div class="box map__card" id="ville-<nom>" popover>`, où se trouvent tous ses textes.

La position du point se règle dans `css/pages.css` (`.map__pt--<nom> { left: …%; top: …% }`). « Vérifier mon adresse »
accepte les départements listés dans `data-zone="67 68"`. Sans JavaScript, les fiches s’ouvrent au centre de l’écran
et le code postal est transmis au devis.

## Images

- **Comparateurs avant / après** : `assets/img/avant-apres/<chantier>-avant.jpg` et `<chantier>-apres.jpg`.
  Pour passer aux vraies photos, remplacer ces fichiers (même lieu, même cadrage), sans toucher au code.
  Les « avant » actuels sont simulés à partir des « après ».
- **Logo** : `assets/img/logo-crescendeau.png` et `logo-symbole.png` sont des extraits basse définition de la maquette,
  à remplacer par les fichiers vectoriels de l’entreprise.
- Les autres photos sont des visuels d’ambiance de la maquette, à remplacer par des photos de chantier.

## Sources

- Maquette : <https://claude.ai/artifact/SJ3DGpDh929hmCUEJKaN4a>
- Design system : <https://claude.ai/artifact/MfNU9L1Eu6qbxj9HcUZnCX>
