#!/usr/bin/env node
// Captures d’écran de contrôle, sans dépendance : sert le site, pilote Chrome sans interface
// (protocole DevTools) et découpe chaque page en tranches de la hauteur de la fenêtre.
//
//   node tools/shots.mjs                          toutes les pages, en 390 et 1440 px, dans .captures/
//   node tools/shots.mjs --pages index,devis      seulement ces pages
//   node tools/shots.mjs --pages "index?menu=ouvert"   un état de démonstration (voir README)
//   node tools/shots.mjs --largeurs 390,960,1440,1920
//   node tools/shots.mjs --reduit                 émule « prefers-reduced-motion: reduce »
//   node tools/shots.mjs --sans-js                JavaScript désactivé
//   node tools/shots.mjs --sortie dossier --echelle 0.75
//
// Code de sortie 1 si une page a une erreur dans la console ou déborde horizontalement.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, mkdtempSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const arg = (name, fallback) => { const i = process.argv.indexOf('--' + name); return i > -1 ? process.argv[i + 1] : fallback; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const out = resolve(arg('sortie', join(root, '.captures')));
const widths = arg('largeurs', '390,1440').split(',').map(Number);
const scale = Number(arg('echelle', 1));
const reduced = process.argv.includes('--reduit');
const noJs = process.argv.includes('--sans-js');
const pages = arg('pages')
  ? arg('pages').split(',')
  : readdirSync(root).filter((f) => f.endsWith('.html') && !f.includes('Maquette')).map((f) => f.slice(0, -5)).sort();
const HEIGHTS = { 390: 844, 960: 1100, 1440: 900, 1920: 1080 };
mkdirSync(out, { recursive: true });

// Petit serveur de fichiers : les modules JavaScript ne se chargent pas en file://.
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const server = createServer((req, res) => {
  const file = normalize(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

// Chrome sans interface, sur un port libre choisi par lui.
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + mkdtempSync(join(tmpdir(), 'cr-chrome-')),
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const wsUrl = await new Promise((ok, ko) => {
  let log = '';
  chrome.stderr.on('data', (d) => { log += d; const m = log.match(/DevTools listening on (ws:\/\/\S+)/); if (m) ok(m[1]); });
  chrome.on('exit', () => ko(new Error('Chrome s’est arrêté au lancement')));
  setTimeout(() => ko(new Error('Chrome ne répond pas')), 20000);
});
const ws = new WebSocket(wsUrl);
await new Promise((ok, ko) => { ws.onopen = ok; ws.onerror = ko; });
let id = 0;
const pending = new Map();
const listeners = new Set();
ws.onmessage = ({ data }) => {
  const m = JSON.parse(data);
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id);
    pending.delete(m.id);
    m.error ? p.ko(new Error(m.error.message)) : p.ok(m.result);
  } else listeners.forEach((fn) => fn(m));
};
const send = (method, params = {}, sessionId) => new Promise((ok, ko) => {
  const n = ++id;
  pending.set(n, { ok, ko });
  ws.send(JSON.stringify({ id: n, method, params, sessionId }));
});

const report = [];
let failed = false;
try {
  for (const width of widths) {
    const height = HEIGHTS[width] || Math.round(width * 0.625);
    const mobile = width <= 720;
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const cmd = (method, params) => send(method, params, sessionId);
    const errors = [];
    let onLoad = () => {};
    listeners.add((m) => {
      if (m.sessionId !== sessionId) return;
      if (m.method === 'Page.loadEventFired') onLoad();
      if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map((a) => a.value || a.description).join(' '));
      if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
    });
    await cmd('Page.enable'); await cmd('Runtime.enable'); await cmd('Log.enable');
    await cmd('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile });
    if (mobile) await cmd('Emulation.setTouchEmulationEnabled', { enabled: true });
    if (reduced) await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    if (noJs) await cmd('Emulation.setScriptExecutionDisabled', { value: true });
    const evaluate = async (expression) => (await cmd('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
    const shot = async (file, clip) => {
      const { data } = await cmd('Page.captureScreenshot', clip ? { format: 'png', captureBeyondViewport: true, clip } : { format: 'png' });
      writeFileSync(file, Buffer.from(data, 'base64'));
    };

    for (const name of pages) {
      errors.length = 0;
      const loaded = new Promise((ok) => { onLoad = ok; setTimeout(ok, 15000); });
      const [page, query] = name.split('?');
      await cmd('Page.navigate', { url: base + page + '.html' + (query ? '?' + query : '') });
      await loaded;
      await sleep(500);
      const size = async () => (await cmd('Page.getLayoutMetrics')).cssContentSize;
      const file = (n) => join(out, `${name.replace(/[^\w-]+/g, '-')}-${width}-${String(n).padStart(2, '0')}.png`);
      let slices = 0;
      if (noJs) {
        // Sans JavaScript, rien ne réagit au défilement : on découpe la page d’un seul tenant.
        const { height: total } = await size();
        for (let y = 0; y < total - 40; y += height) await shot(file(++slices), { x: 0, y, width, height: Math.min(height, total - y), scale: 1 });
      } else {
        // Premier passage : déclenche les images différées et les observateurs. Second : capture.
        const first = (await size()).height;
        for (let y = 0; y < first; y += height) { await evaluate(`window.scrollTo(0, ${y})`); await sleep(80); }
        await evaluate('Promise.race([Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; }))), new Promise((r) => setTimeout(r, 5000))])');
        await sleep(800);
        const total = (await size()).height;
        const step = height - 140; // recouvrement : l’en-tête collant masque le haut de chaque tranche
        for (let y = 0; y < total - 40; y += step) {
          const top = Math.min(y, Math.max(0, total - height));
          await evaluate(`window.scrollTo({ top: ${top}, behavior: 'instant' })`);
          await sleep(250);
          await shot(file(++slices));
          if (top !== y) break;
        }
      }
      const { width: contentWidth, height: total } = await size();
      const overflow = Math.ceil(contentWidth) > width;
      if (overflow || errors.length) failed = true;
      report.push({ page: name, largeur: width, hauteur: Math.round(total), tranches: slices, deborde: overflow, erreurs: [...errors] });
    }
    await send('Target.closeTarget', { targetId });
  }
} finally {
  ws.close();
  chrome.kill();
  server.close();
}

for (const r of report) {
  const state = r.deborde || r.erreurs.length ? 'À VOIR' : 'ok';
  console.log(`${state.padEnd(7)} ${r.page.padEnd(28)} ${String(r.largeur).padStart(5)} px  ${String(r.hauteur).padStart(6)} px de haut  ${r.tranches} tranches${r.deborde ? '  DÉBORDE' : ''}`);
  r.erreurs.forEach((e) => console.log('         erreur : ' + e));
}
console.log(`\n${report.length} captures de pages dans ${out}`);
process.exit(failed ? 1 : 0);
