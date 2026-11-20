// Couche commune des formulaires : validation, messages d’erreur, pièce jointe, envoi, préremplissage.
//
// Tout se déclare dans le HTML :
//   <form data-form>                    formulaire pris en charge
//   name="…"                            nom du champ envoyé
//   required, pattern="…"               règles de validation des champs de saisie
//   <p data-err="nom-du-champ" hidden>  message d’erreur ; sa présence rend le champ contrôlé
//                                       (pour des cases ou boutons radio : au moins un choix)
//   data-when="sent | demo | error"     bloc affiché selon le résultat de l’envoi
//   data-file-trigger, data-file-name   bouton et libellé d’une pièce jointe
import { FORM_ENDPOINT } from './config.js';

const params = new URLSearchParams(window.location.search);
// Mode démonstration : aucune adresse d’envoi, ou état de maquette ouvert par ?etat=…
const DEMO = !FORM_ENDPOINT || params.has('etat');

const controls = (form, name) => [...form.elements].filter((el) => el.name === name);

function isValid(form, name) {
  const list = controls(form, name);
  const first = list[0];
  if (!first) return true;
  if (first.type === 'radio' || first.type === 'checkbox') return list.some((el) => el.checked);
  if (first.type === 'file') {
    const file = first.files[0];
    if (!file) return true;
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    return first.accept.split(',').includes(extension) && file.size <= first.dataset.maxMo * 1024 * 1024;
  }
  const value = first.value.trim();
  if (!value) return !first.required;
  return !first.pattern || new RegExp('^(?:' + first.pattern + ')$', 'u').test(value);
}

// Noms des champs en erreur dans « scope » (le formulaire entier ou une étape), dans l’ordre de la page.
export function invalid(form, scope = form) {
  return [...scope.querySelectorAll('[data-err]')]
    .map((message) => message.dataset.err)
    .filter((name) => !isValid(form, name));
}

// Affiche les messages des champs listés, masque tous les autres.
export function showErrors(form, names) {
  form.querySelectorAll('[data-err]').forEach((message) => {
    const name = message.dataset.err;
    const on = names.includes(name);
    message.hidden = !on;
    const list = controls(form, name);
    list.forEach((el) => { if (el.hasAttribute('aria-invalid')) el.setAttribute('aria-invalid', String(on)); });
    const box = list[0] && list[0].closest('.checkbox, .choices, .field');
    if (box) box.classList.toggle('is-error', on);
  });
}

// Ancre vers un champ en erreur (résumé des erreurs du devis).
export function errorAnchor(form, name) {
  const first = controls(form, name)[0];
  const box = first.closest('.checkbox, .choices, .field');
  return '#' + (box && box.id ? box : first.parentElement.closest('[id]')).id;
}

// État d’envoi : « sending », « sent », « demo » ou « error ».
export function setState(form, state) {
  form.dataset.state = state;
  form.setAttribute('aria-busy', String(state === 'sending'));
  form.querySelectorAll('[type="submit"], [data-action="next"]').forEach((button) => { button.disabled = state === 'sending'; });
  form.querySelectorAll('[data-when]').forEach((block) => { block.hidden = !block.dataset.when.split(' ').includes(state); });
}

// Numéro de demande au format de la maquette : CR-AAMM-NNNN.
// ponytail: tiré au hasard dans le navigateur, donc pas garanti unique. Le serveur devra l’attribuer une fois branché.
function requestNumber() {
  const now = new Date();
  const yymm = String(now.getFullYear()).slice(2) + String(now.getMonth() + 1).padStart(2, '0');
  return 'CR-' + yymm + '-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

// Envoie le formulaire. Renvoie { state, numero }.
export async function send(form) {
  const numero = requestNumber();
  if (DEMO) return { state: 'demo', numero };
  const data = new FormData(form);
  // Envoi en JSON, lisible par n’importe quel serveur : une valeur texte par champ.
  // Cases multiples : valeurs réunies par « , ». Pièce jointe : seul son nom est transmis.
  const corps = {};
  for (const name of new Set(data.keys())) {
    const values = data.getAll(name).map((v) => (typeof v === 'string' ? v : v.name)).filter(Boolean);
    corps[name] = values.join(', ');
  }
  corps.numero = numero;
  try {
    const response = await fetch(FORM_ENDPOINT, { method: 'POST', body: JSON.stringify(corps), headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });
    return { state: response.ok ? 'sent' : 'error', numero };
  } catch {
    return { state: 'error', numero };
  }
}

// Préremplit les champs depuis l’adresse (?nom=…&prestations=…). Jamais le consentement ni un fichier.
function prefill(form) {
  [...form.elements].forEach((el) => {
    if (!el.name || !params.has(el.name) || el.name === 'consentement' || el.type === 'file' || el.type === 'hidden') return;
    if (el.type === 'radio' || el.type === 'checkbox') el.checked = params.getAll(el.name).includes(el.value);
    else el.value = params.get(el.name);
  });
}

export function initForms() {
  // Pièces jointes : le bouton ouvre le sélecteur de fichier, le nom choisi s’affiche dessous.
  document.querySelectorAll('[data-file-trigger]').forEach((button) => {
    const field = button.closest('.field');
    const input = field.querySelector('input[type="file"]');
    const label = field.querySelector('[data-file-name]');
    button.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      label.textContent = input.files[0] ? input.files[0].name : '';
      label.hidden = !input.files[0];
    });
  });

  document.querySelectorAll('form[data-form]').forEach((form) => {
    form.noValidate = true; // la validation est faite ici, avec les messages de la page
    prefill(form);
    if (form.querySelector('[data-step]')) return; // formulaire en étapes : piloté par devis.js

    let checked = false;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const names = invalid(form);
      checked = true;
      showErrors(form, names);
      if (names.length) {
        controls(form, names[0])[0].focus();
        return;
      }
      setState(form, 'sending');
      const { state } = await send(form);
      setState(form, state);
      if (state !== 'sent') return;
      form.reset();
      form.querySelectorAll('[data-file-name]').forEach((label) => { label.hidden = true; });
      checked = false;
    });
    // Une fois les erreurs affichées, elles se mettent à jour pendant la correction.
    form.addEventListener('input', () => { if (checked) showErrors(form, invalid(form)); });
  });
}
