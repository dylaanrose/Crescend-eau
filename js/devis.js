// Formulaire de devis en 3 étapes : navigation, validation, récapitulatif de confirmation.
// Tous les textes (messages d’erreur, titres) sont dans devis.html ; ce module ne fait que les afficher.
export function initDevis() {
  const card = document.querySelector('#formulaire');
  if (!card) return;

  const one = (selector) => card.querySelector(selector);
  const all = (selector) => [...card.querySelectorAll(selector)];
  const text = (id) => one('#' + id).value.trim();
  const picked = (selector) => all(selector + ' input:checked').map((input) => input.value);

  let step = 1;        // 1 à 3 : étapes ; 4 : confirmation
  let showErrors = false; // les erreurs n’apparaissent qu’après une tentative de passage à la suite

  // Champs invalides de chaque étape, dans l’ordre d’affichage.
  const invalid = {
    1: () => [
      !one('input[name="type-site"]:checked') && 'type',
      !/^\d{5}$/.test(text('f-cp')) && 'cp',
    ],
    2: () => [
      !picked('#f-presta').length && 'presta',
      !picked('#f-freq').length && 'freq',
    ],
    3: () => [
      !text('f-nom') && 'nom',
      !text('f-entreprise') && 'entreprise',
      !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(text('f-email')) && 'email',
      text('f-tel').replace(/\D/g, '').length < 10 && 'tel',
      !one('#f-consent-wrap input').checked && 'consent',
    ],
  };
  const errors = () => (step <= 3 ? invalid[step]().filter(Boolean) : []);

  // Valeurs par défaut du récapitulatif (« — »), lues dans le HTML.
  const outputs = new Map(all('[data-out]').map((el) => [el.dataset.out, { el, empty: el.textContent }]));
  const write = (key, value) => {
    const { el, empty } = outputs.get(key);
    el.textContent = value || empty;
  };
  const fillRecap = () => {
    const type = one('input[name="type-site"]:checked');
    write('prenom', text('f-nom').split(' ')[0]);
    write('email', text('f-email'));
    write('type', type && type.closest('.choice').querySelector('.choice__t').textContent);
    write('surface', one('#f-surface').value);
    write('lieu', (text('f-cp') + ' ' + text('f-ville')).trim());
    write('presta', picked('#f-presta').join(', '));
    write('freq', picked('#f-freq')[0]);
    write('contact', text('f-nom') + ' · ' + text('f-tel'));
  };

  const render = () => {
    const shown = showErrors ? errors() : [];

    // Étape affichée, fil d’étapes et barre de progression
    all('[data-step]').forEach((el) => { el.hidden = Number(el.dataset.step) !== step; });
    one('[data-progress]').hidden = step > 3;
    all('.stepper .cr-steps__item').forEach((item, i) => item.classList.toggle('is-active', i + 1 === step));
    const bar = one('.progress');
    const current = Math.min(step, 3);
    bar.setAttribute('aria-valuenow', current);
    bar.setAttribute('aria-valuetext', bar.getAttribute('aria-valuetext').replace(/\d/, current));

    // Erreurs champ par champ
    all('[data-err]').forEach((message) => {
      const key = message.dataset.err;
      const on = shown.includes(key);
      message.hidden = !on;
      if (key === 'type') one('#f-type .choices').classList.toggle('is-error', on);
      const wrap = one('#f-' + key + '-wrap'); // champs de saisie et case de consentement
      if (!wrap) return;
      (wrap.querySelector('.checkbox') || wrap).classList.toggle('is-error', on);
      wrap.querySelector('input').setAttribute('aria-invalid', String(on));
    });

    // Résumé des erreurs en tête de formulaire
    one('[data-alert]').hidden = !shown.length;
    if (shown.length) {
      const title = one('[data-alert-title]');
      title.textContent = shown.length > 1 ? title.dataset.many.replace('{n}', shown.length) : title.dataset.one;
      one('[data-alert-list]').replaceChildren(...shown.map((key) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = '#f-' + key + (one('#f-' + key + '-wrap') ? '-wrap' : '');
        link.textContent = one('[data-err="' + key + '"]').textContent.trim();
        item.append(link);
        return item;
      }));
    }
  };

  card.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    if (button.dataset.action === 'back') {
      step = Math.max(1, step - 1);
      showErrors = false;
    } else if (errors().length) {
      showErrors = true;
    } else {
      step += 1;
      showErrors = false;
      if (step === 4) fillRecap();
    }
    render();
    // Ramène le haut du formulaire (nouvelle étape ou résumé des erreurs) sous l’en-tête collant.
    const headerSlot = document.querySelector('.hdr-sticky');
    window.scrollTo({ top: card.getBoundingClientRect().top + window.scrollY - (headerSlot ? headerSlot.offsetHeight : 0) });
  });

  // Une fois les erreurs affichées, elles se mettent à jour pendant la correction.
  card.addEventListener('input', () => { if (showErrors) render(); });

  render();
}
