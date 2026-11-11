// Formulaire de devis en 3 étapes : navigation, récapitulatif de confirmation, états de la maquette.
// La validation, les messages et l’envoi viennent de forms.js ; tous les textes sont dans devis.html.
import { invalid, showErrors, errorAnchor, send, setState } from './forms.js';

// États de la maquette ouverts par l’adresse : devis.html?etat=… → [étape, erreurs affichées]
const STATES = { etape2: [2, false], etape3: [3, false], erreur: [3, true], confirmation: [4, false] };

export function initDevis() {
  const form = document.querySelector('#formulaire');
  if (!form) return;

  const one = (selector) => form.querySelector(selector);
  const all = (selector) => [...form.querySelectorAll(selector)];
  const text = (name) => form.elements[name].value.trim();
  const picked = (name) => all('[name="' + name + '"]:checked');

  let step = 1;           // 1 à 3 : étapes ; 4 : confirmation
  let showing = false;    // les erreurs n’apparaissent qu’après une tentative de passage à la suite
  const errors = () => (step <= 3 ? invalid(form, one('[data-step="' + step + '"]')) : []);

  // Récapitulatif : chaque [data-out] garde son texte d’origine (« — ») comme valeur par défaut.
  const outputs = new Map(all('[data-out]').map((el) => [el.dataset.out, { el, empty: el.textContent }]));
  const write = (key, value) => {
    const output = outputs.get(key);
    if (output) output.el.textContent = value || output.empty;
  };
  const fillRecap = () => {
    const type = picked('type_site')[0];
    write('prenom', text('nom').split(' ')[0]);
    write('email', text('email'));
    write('type', type && type.closest('.choice').querySelector('.choice__t').textContent);
    write('surface', text('surface'));
    write('lieu', (text('code_postal') + ' ' + text('ville')).trim());
    write('presta', picked('prestations').map((input) => input.value).join(', '));
    write('freq', picked('frequence').map((input) => input.value)[0]);
    write('contact', [text('nom'), text('telephone')].filter(Boolean).join(' · '));
  };

  const render = () => {
    const shown = showing ? errors() : [];

    // Étape affichée, fil d’étapes et barre de progression
    all('[data-step]').forEach((el) => { el.hidden = Number(el.dataset.step) !== step; });
    one('[data-progress]').hidden = step > 3;
    all('.stepper .cr-steps__item').forEach((item, i) => item.classList.toggle('is-active', i + 1 === step));
    const bar = one('.progress');
    const current = Math.min(step, 3);
    bar.setAttribute('aria-valuenow', current);
    bar.setAttribute('aria-valuetext', bar.getAttribute('aria-valuetext').replace(/\d/, current));

    // Erreurs champ par champ, puis résumé en tête de formulaire
    showErrors(form, shown);
    one('[data-alert]').hidden = !shown.length;
    if (!shown.length) return;
    const title = one('[data-alert-title]');
    title.textContent = shown.length > 1 ? title.dataset.many.replace('{n}', shown.length) : title.dataset.one;
    one('[data-alert-list]').replaceChildren(...shown.map((name) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = errorAnchor(form, name);
      link.textContent = one('[data-err="' + name + '"]').textContent.trim();
      item.append(link);
      return item;
    }));
  };

  const go = async (action) => {
    if (action === 'back') {
      step = Math.max(1, step - 1);
      showing = false;
    } else if (errors().length) {
      showing = true;
    } else if (step < 3) {
      step += 1;
      showing = false;
    } else {
      // Dernière étape : envoi. En cas d’échec, on reste ici avec les réponses conservées.
      setState(form, 'sending');
      const { state, numero } = await send(form);
      setState(form, state);
      showing = false;
      if (state !== 'error') {
        fillRecap();
        write('numero', numero);
        step = 4;
      }
    }
    render();
    // Ramène le haut du formulaire (nouvelle étape, résumé des erreurs) sous l’en-tête collant.
    const headerSlot = document.querySelector('.hdr-sticky');
    window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - (headerSlot ? headerSlot.offsetHeight : 0) });
  };

  form.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (button) go(button.dataset.action);
  });
  // Touche Entrée dans un champ : même effet que « Continuer ».
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (step <= 3) go('next');
  });
  // Une fois les erreurs affichées, elles se mettent à jour pendant la correction.
  form.addEventListener('input', () => { if (showing) render(); });

  // État de la maquette demandé par l’adresse (les champs sont déjà préremplis par forms.js).
  const preset = STATES[new URLSearchParams(window.location.search).get('etat')];
  if (preset) {
    [step, showing] = preset;
    if (step === 4) {
      fillRecap();
      setState(form, 'demo');
    }
  }
  render();
}
