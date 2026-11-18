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
js/zone.js          carte de la zone d’intervention : fiches des villes
js/scrolly.js       hero immersif de l’accueil : séquence d’images pilotée par le défilement
tools/sync-partials.mjs  recopie l’en-tête et le pied de page dans toutes les pages
tools/check.mjs     vérifie les règles du projet sur toutes les pages
tools/shots.mjs     captures d’écran de contrôle (Chrome sans interface)
tools/images.mjs    prépare les images : versions WebP d’une photo, séquence du hero
assets/img/         images, logo ; avant-apres/ pour les comparateurs ; hero/ pour la séquence de l’accueil
assets/fonts/       Montserrat et DM Sans (variables)
PRODUCT.md          à qui s’adresse le site, sa personnalité et ses principes de design
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
  sur cette page. L’accueil présente chaque rubrique par un aperçu court (un comparateur, une mosaïque, quatre
  étapes en une ligne) et y renvoie, sans en recopier le contenu.
- **Un langage par dossier.** Le HTML ne contient ni attribut `style`, ni bloc `<style>`, ni script en ligne.
  Tout style va dans `css/`, tout comportement dans `js/`. Les textes (libellés, messages d’erreur) restent dans le HTML.
- **Un composant se modifie à un seul endroit.** Un bouton est toujours `class="cr-btn cr-btn--…"` :
  changer `.cr-btn` dans `css/components.css` change tous les boutons du site.
- **Aucune valeur inventée.** Les couleurs, tailles et rayons viennent de `css/tokens.css` (`var(--…)`).
- Les mentions `[à confirmer]` et `[exemple]` signalent un contenu à valider avec l’entreprise : ne pas les retirer sans validation.
- Le site doit rester correct à 390 px de large (points de rupture : 1100, 960 et 720 px).
- **Tout mouvement est facultatif.** Le site reste complet en mouvement réduit et sans JavaScript.

## Vérifier avant de publier

```bash
node tools/check.mjs                 # règles du projet : aucun style ni script dans le HTML, classes connues, typographie
node tools/shots.mjs                 # captures de toutes les pages en 390 et 1440 px, dans .captures/
node tools/shots.mjs --reduit        # les mêmes en mouvement réduit
node tools/shots.mjs --sans-js       # les mêmes sans JavaScript
```

`tools/shots.mjs` signale aussi les erreurs de console et tout débordement horizontal. Il lui faut Google Chrome.

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
  contient des cases avec leur propre `name`. Aucun JavaScript à écrire. Champ envoyé aujourd’hui :
  `depannage_multiservices`, seulement si sa prestation est cochée.
- **Ajouter un champ contrôlé** : lui donner un `name`, `required` et/ou `pattern`, et placer à côté
  `<p class="field__err" data-err="son-name" hidden>message</p>`. Aucun JavaScript à écrire.

## Carte de la zone d’intervention

Sur `secteurs.html`. Une ville tient en deux éléments, reliés par le même identifiant `ville-<nom>` :

- son bouton sur la carte (`.map__pt map__pt--<nom>`), avec `popovertarget="ville-<nom>"` ;
- sa fiche, `<div class="box map__card" id="ville-<nom>" popover>`, où se trouvent tous ses textes.

La carte est graduée en kilomètres autour de la base (au centre, sans nom de village) : la position d’un point se règle dans
`css/pages.css` avec ses écarts réels, `.map__pt--<nom> { --dx: …; --dy: … }` (km vers l’est et vers le sud). Les deux
cercles (10 et 20 km) sont `.map__ring--10` et `.map__ring--20`. Sans JavaScript, les fiches s’ouvrent au centre de l’écran.

## Hero de l’accueil

Le hero fait défiler une séquence d’images au rythme de la page (`js/scrolly.js`, styles `.scrolly` dans `css/site.css`).

- La section porte le nombre d’images et leur dossier : `data-frames` et `data-src` (ordinateur),
  `data-frames-sm` et `data-src-sm` (mobile, images recadrées et deux fois moins nombreuses).
- Sa hauteur de défilement est le token `--scrolly-len` ; les seuils où le texte change sont en tête de `js/scrolly.js`.
- En mouvement réduit, sans JavaScript ou sur un écran de moins de 600 px de haut, le hero est une image fixe :
  la balise `<picture>` choisit alors l’image d’arrivée (`hero-apres`) au lieu de l’image de départ (`hero-avant`).
- Pour refaire la séquence à partir d’une autre vidéo :

```bash
node tools/images.mjs sequence video.mp4 hero/d --fin 112
node tools/images.mjs sequence video.mp4 hero/m --fin 112 --pas 2 --recadrage 600:720
```

## Images

Toutes les images du site sont générées (lieux et matières, sans personne ni logo) et servent d’illustration.
Elles sont en WebP, en plusieurs largeurs, avec `srcset`, `width`, `height` et `loading="lazy"`.

- **Remplacer une image par une vraie photo** : `node tools/images.mjs photo ma-photo.jpg <nom>` réécrit
  `assets/img/<nom>-800.webp`, `-1600.webp`… sans toucher au code (garder le même nom et le même cadrage).
- **Comparateurs avant / après** : `assets/img/avant-apres/<chantier>-avant-*.webp` et `<chantier>-apres-*.webp`,
  deux images au même cadrage. Ce sont des illustrations de démonstration, marquées « exemple » sur le site :
  à remplacer par deux photos du chantier prises du même point.
- **Logo** : `assets/img/logo-crescendeau.webp` et `logo-symbole.png` sont détourés à partir de `Logo.webp`.
  À remplacer par les fichiers vectoriels de l’entreprise s’ils existent.

## Sources

- Maquette : <https://claude.ai/artifact/SJ3DGpDh929hmCUEJKaN4a>
- Design system : <https://claude.ai/artifact/MfNU9L1Eu6qbxj9HcUZnCX>
