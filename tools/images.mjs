#!/usr/bin/env node
// Prépare les images du site à partir d’un fichier source (photo ou vidéo), avec ffmpeg.
//
//   node tools/images.mjs photo <source> <nom> [--largeurs 800,1600,2400] [--recadrage 600:720]
//       écrit assets/img/<nom>-800.webp, -1600.webp… (les largeurs supérieures à la source sont ignorées)
//       et affiche la balise srcset à recopier.
//
//   node tools/images.mjs sequence <vidéo> <dossier> [--debut 1] [--fin 112] [--pas 1]
//                                  [--largeur 1276] [--recadrage 600:720] [--qualite 55]
//       écrit assets/img/<dossier>/001.webp, 002.webp… : les images que le hero de l’accueil
//       fait défiler (js/scrolly.js). --recadrage largeur:hauteur garde le centre de l’image.
//
// Pour remplacer un visuel par une vraie photo : relancer la commande « photo » avec le même nom.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const FULL = '/opt/homebrew/opt/ffmpeg-full/bin/';
const bin = (name) => process.env[name.toUpperCase()] || (existsSync(FULL + name) ? FULL + name : name);
const [mode, source, name] = process.argv.slice(2);
const arg = (key, fallback) => { const i = process.argv.indexOf('--' + key); return i > -1 ? process.argv[i + 1] : fallback; };
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stderr || r.error); process.exit(1); }
  return r.stdout;
};
const kb = (file) => Math.round(statSync(file).size / 1024);
const crop = arg('recadrage') ? `crop=${arg('recadrage')},` : '';

if (mode === 'photo' && source && name) {
  const width = Number(run(bin('ffprobe'), ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width', '-of', 'csv=p=0', source]));
  const visible = arg('recadrage') ? Number(arg('recadrage').split(':')[0]) : width;
  const widths = arg('largeurs', '800,1600,2400').split(',').map(Number).filter((w, i) => w <= visible || i === 0);
  const set = [];
  for (const w of widths) {
    const out = join(root, 'assets/img', `${name}-${w}.webp`);
    run(bin('ffmpeg'), ['-loglevel', 'error', '-y', '-i', source, '-vf', `${crop}scale=${Math.min(w, visible)}:-2:flags=lanczos`, '-c:v', 'libwebp', '-quality', arg('qualite', '78'), '-compression_level', '6', out]);
    set.push(`assets/img/${name}-${w}.webp ${Math.min(w, visible)}w`);
    console.log(`${name}-${w}.webp  ${kb(out)} Ko`);
  }
  console.log('\nsrcset="' + set.join(', ') + '"');
} else if (mode === 'sequence' && source && name) {
  const dir = join(root, 'assets/img', name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const first = Number(arg('debut', 1)) - 1;
  const last = arg('fin') ? Number(arg('fin')) - 1 : 1e9;
  const step = Number(arg('pas', 1));
  const scale = arg('largeur') ? `scale=${arg('largeur')}:-2:flags=lanczos` : 'null';
  run(bin('ffmpeg'), ['-loglevel', 'error', '-y', '-i', source, '-vf', `select='between(n\\,${first}\\,${last})*not(mod(n-${first}\\,${step}))',${crop}${scale}`,
    '-fps_mode', 'passthrough', '-c:v', 'libwebp', '-quality', arg('qualite', '55'), '-compression_level', '6', '-f', 'image2', join(dir, '%03d.webp')]);
  const files = readdirSync(dir);
  const total = files.reduce((sum, f) => sum + statSync(join(dir, f)).size, 0);
  console.log(`${files.length} images dans assets/img/${name}/  ${(total / 1048576).toFixed(2)} Mo au total, ${Math.round(total / files.length / 1024)} Ko en moyenne`);
} else {
  console.error('Usage : node tools/images.mjs photo <source> <nom> [options]  |  node tools/images.mjs sequence <vidéo> <dossier> [options]');
  process.exit(1);
}
