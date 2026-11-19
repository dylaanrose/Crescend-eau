#!/usr/bin/env node
// Recopie partials/header.html, partials/footer.html et partials/cookies.html dans toutes les pages du site.
//
//   node tools/sync-partials.mjs          met les pages à jour
//   node tools/sync-partials.mjs --check  vérifie seulement (code de sortie 1 si une page n’est pas à jour)
//
// Dans une page, un composant partagé tient entre deux commentaires repères :
//   <!-- partial:header -->  …contenu recopié…  <!-- /partial:header -->
// Ne modifiez jamais ce contenu dans une page : il est réécrit à chaque passage.
//
// Options du repère d’ouverture (utilisées par composants.html) :
//   demo             exemplaire de démonstration : seul <header> est gardé, sans id, rendu inerte
//   compact          avec demo : en-tête dans son état compacté
//   actif=<data-nav> lien à marquer comme page courante (par défaut : le data-page du <body>)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const checkOnly = process.argv.includes('--check');
const BLOCK = /<!-- partial:(header|footer|cookies)((?: [\w=-]+)*) -->[\s\S]*?<!-- \/partial:\1 -->/g;

function render(name, options, page) {
  let html = readFileSync(join(root, 'partials', name + '.html'), 'utf8').trim();
  const opts = options.trim().split(/\s+/).filter(Boolean);
  const actif = (opts.find((o) => o.startsWith('actif=')) || '').slice(6) || page;
  if (opts.includes('demo')) {
    html = html.match(/<header[\s\S]*<\/header>/)[0]
      .replace(/ (id|aria-controls)="[^"]*"/g, '')
      .replace('<header class="hdr"', () => `<header class="hdr${opts.includes('compact') ? ' is-compact' : ''}" inert`);
  }
  // Lien de la page courante, posé en dur (lisible sans JavaScript).
  return html.replaceAll(`data-nav="${actif}"`, `data-nav="${actif}" aria-current="page"`);
}

const stale = [];
for (const file of readdirSync(root).filter((f) => f.endsWith('.html'))) {
  const before = readFileSync(join(root, file), 'utf8');
  const page = (before.match(/<body[^>]*data-page="([^"]*)"/) || [])[1] || '';
  const after = before.replace(BLOCK, (_, name, options) => [
    `<!-- partial:${name}${options} -->`,
    `<!-- Généré depuis partials/${name}.html par « node tools/sync-partials.mjs » : ne pas modifier ici. -->`,
    render(name, options, page),
    `<!-- /partial:${name} -->`,
  ].join('\n'));
  if (after === before) continue; // page sans repère, ou déjà à jour
  stale.push(file);
  if (!checkOnly) writeFileSync(join(root, file), after);
}

if (checkOnly && stale.length) {
  console.error('Pages à resynchroniser (lancer « node tools/sync-partials.mjs ») :\n  ' + stale.join('\n  '));
  process.exit(1);
}
console.log(checkOnly ? 'Toutes les pages sont à jour.' : stale.length ? 'Pages mises à jour : ' + stale.join(', ') : 'Rien à mettre à jour.');
