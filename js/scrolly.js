// Hero immersif de l’accueil : une séquence d’images défile sur un <canvas> au rythme de la page.
// La section est plus haute que l’écran et son contenu reste épinglé (position: sticky, css/site.css) :
// la progression du défilement dans la section choisit l’image affichée et le « temps » du texte.
//
// Sans ce script, en mouvement réduit, en économie de données ou sur un écran trop bas,
// la classe is-live n’est jamais posée : le hero reste une image fixe et son texte.
// Les images viennent de « node tools/images.mjs sequence … » (assets/img/hero/).
const BEATS = [0.28, 0.6]; // progression (0 à 1) où le texte passe au temps 2, puis 3
const EASE = 0.18; // part de l’écart rattrapée à chaque image : lisse les à-coups de la molette

export function initScrolly() {
  const section = document.querySelector('[data-scrolly]');
  if (!section) return;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || !window.matchMedia('(min-height: 600px)').matches
    || (navigator.connection && navigator.connection.saveData);
  if (still) return;

  const small = window.matchMedia('(max-width: 720px)').matches;
  const count = Number(small ? section.dataset.framesSm : section.dataset.frames);
  const path = small ? section.dataset.srcSm : section.dataset.src;
  const canvas = section.querySelector('canvas');
  const context = canvas.getContext('2d');
  const frames = new Array(count); // images décodées, rangées par numéro
  let target = 0; // image voulue par la position de défilement
  let current = 0; // image réellement affichée, qui rattrape la cible
  let drawn = null;
  let beat = 0;
  let pending = 0;

  // Tant qu’une image n’est pas arrivée, on montre la plus proche déjà chargée : jamais de canvas vide.
  const nearest = (index) => {
    for (let gap = 0; gap < count; gap++) {
      const frame = frames[index - gap] || frames[index + gap];
      if (frame) return frame;
    }
    return null;
  };

  const draw = () => {
    pending = 0;
    current += (target - current) * EASE;
    if (Math.abs(target - current) < 0.05) current = target;
    const frame = nearest(Math.round(current));
    if (frame && frame !== drawn) {
      if (!drawn) { canvas.width = frame.naturalWidth; canvas.height = frame.naturalHeight; }
      context.drawImage(frame, 0, 0);
      drawn = frame;
    }
    // L’affiche, plus fine que la séquence, reste visible tant que la page n’a pas bougé.
    section.classList.toggle('is-playing', Boolean(drawn) && current > 0.5);
    if (current !== target) pending = requestAnimationFrame(draw);
  };
  const schedule = () => { if (!pending) pending = requestAnimationFrame(draw); };

  const onScroll = () => {
    const box = section.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -box.top / (box.height - window.innerHeight)));
    target = progress * (count - 1);
    const next = progress < BEATS[0] ? 1 : progress < BEATS[1] ? 2 : 3;
    if (next !== beat) { beat = next; section.dataset.beat = next; }
    schedule();
  };

  const load = (index) => {
    const image = new Image();
    image.src = path + String(index + 1).padStart(3, '0') + '.webp';
    return image.decode().then(() => { frames[index] = image; schedule(); }, () => {});
  };
  // Une image sur quatre d’abord : la séquence est jouable presque aussitôt, puis elle s’affine.
  const loadAll = async () => {
    const order = [...frames.keys()].sort((a, b) => (a % 4 ? 1 : 0) - (b % 4 ? 1 : 0) || a - b);
    for (let i = 0; i < order.length; i += 6) await Promise.all(order.slice(i, i + 6).map(load));
  };

  section.classList.add('is-live');
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
  // Après le chargement de la page, pour ne pas disputer la bande passante aux polices et à l’affiche.
  if (document.readyState === 'complete') loadAll();
  else window.addEventListener('load', loadAll, { once: true });
}
