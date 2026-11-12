#!/usr/bin/env node
// Vérifie les règles du projet sur toutes les pages. Code de sortie 1 si l’une est enfreinte.
//
//   node tools/check.mjs
//
// 1. Un langage par dossier : ni attribut style, ni bloc <style>, ni script en ligne dans le HTML.
// 2. Toute classe utilisée dans une page existe dans css/ (une faute de frappe ne passe pas).
// 3. Les id sont uniques dans chaque page.
// 4. Typographie : espace insécable avant ? ! ; : dans le texte.
// 5. En-tête et pied de page à jour (tools/sync-partials.mjs --check).
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const pages = readdirSync(root).filter((f) => f.endsWith('.html') && !f.includes('Maquette'));
const css = readdirSync(join(root, 'css')).map((f) => readFileSync(join(root, 'css', f), 'utf8')).join('\n');
const known = new Set([...css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const problems = [];

for (const page of pages) {
  const html = readFileSync(join(root, page), 'utf8');
  const say = (message) => problems.push(`${page} : ${message}`);
  if (/<[^>]+\sstyle\s*=/i.test(html)) say('attribut style dans le HTML');
  if (/<style[\s>]/i.test(html)) say('bloc <style> dans le HTML');
  for (const m of html.matchAll(/<script\b([^>]*)>/gi)) if (!/\bsrc=/.test(m[1])) say('script en ligne dans le HTML');

  const unknown = new Set();
  for (const m of html.matchAll(/\bclass="([^"]*)"/g)) for (const name of m[1].split(/\s+/)) if (name && !known.has(name)) unknown.add(name);
  if (unknown.size) say('classe(s) absente(s) du CSS : ' + [...unknown].join(', '));

  const ids = [...html.matchAll(/\bid="([^"]*)"/g)].map((m) => m[1]);
  const twice = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  if (twice.length) say('id en double : ' + twice.join(', '));

  const text = html.split(/<[^>]*>/).join('\n');
  const loose = [...text.matchAll(/\S+ [?!;:](?=\s|$)/g)].map((m) => m[0]);
  if (loose.length) say(`espace simple avant une ponctuation double (${loose.length}) : ${loose.slice(0, 3).join(' | ')}`);
}

const sync = spawnSync(process.execPath, [join(root, 'tools/sync-partials.mjs'), '--check'], { encoding: 'utf8' });
if (sync.status !== 0) problems.push(sync.stderr.trim());

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problème(s) sur ${pages.length} pages.`);
  process.exit(1);
}
console.log(`${pages.length} pages vérifiées : aucune règle enfreinte.`);
