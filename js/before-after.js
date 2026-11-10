// Comparateur Avant / Après : le curseur (input range invisible posé sur l’image)
// pilote la variable CSS --pos, lue par css/pages.css.
export function initBeforeAfter() {
  document.querySelectorAll('.cr-ba').forEach((figure) => {
    const range = figure.querySelector('.cr-ba__range');
    const sync = () => figure.style.setProperty('--pos', range.value + '%');
    range.addEventListener('input', sync);
    sync();
  });
}
