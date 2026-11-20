// Courriers envoyés après un formulaire du site : un compte rendu pour l’équipe, un pour le visiteur.
// Les courriels n’acceptent ni feuille de style ni police web : la mise en forme est donc écrite dans
// les balises, avec les couleurs de css/tokens.css. Ce fichier n’est pas une page du site.
// (Le préfixe « _ » dit à Vercel de ne pas en faire une route.)

const COULEURS = {
  fond: '#02070a', // --surface-100
  carte: '#0a1317', // --surface-300
  trait: '#1a262d', // --line
  accent: '#3ab0b5', // --accent
  clair: '#11d4d9', // --accent-hover
  teinte: '#0c2a2e', // --accent-soft
  surAccent: '#04181b', // --on-accent
  texte: '#f5f6f6', // --ink
  doux: '#dfe4e6', // --ink-soft
  discret: '#a9b3b8', // --ink-muted
  tres: '#7d878d', // --ink-subtle
};
const TITRES = "Montserrat, 'Helvetica Neue', Arial, sans-serif";
const CORPS = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";

const ENTREPRISE = {
  nom: 'Crescend’eau',
  tel: '06 59 02 83 59',
  telLien: '+33659028359',
  mail: 'contactpro@crescendeau.fr',
  adresse: '9 rue Principale, 67140 Gertwiller',
  siret: '793 638 701 00045',
  instagram: 'https://www.instagram.com/crescendeau_/',
};

// Champs affichés, dans l’ordre, pour chaque formulaire du site (valeur du champ « formulaire »).
const FORMULAIRES = {
  devis: {
    titre: 'Demande de',
    accent: 'devis.',
    sujet: 'Demande de devis',
    sections: [
      ['Votre site', ['type_site', 'code_postal', 'ville', 'surface', 'nb_sites']],
      ['Vos besoins', ['prestations', 'depannage_multiservices', 'frequence', 'demarrage', 'precisions', 'piece_jointe']],
      ['Vos coordonnées', ['nom', 'entreprise', 'fonction', 'email', 'telephone', 'contact_prefere', 'creneaux']],
    ],
  },
  'devis-rapide': {
    titre: 'Demande de',
    accent: 'devis rapide.',
    sujet: 'Demande de devis rapide',
    sections: [['Votre demande', ['type_site', 'entreprise', 'nom', 'telephone']]],
  },
  contact: {
    titre: 'Votre',
    accent: 'message.',
    sujet: 'Message',
    sections: [
      ['Votre demande', ['objet', 'creneau_rappel', 'message']],
      ['Vos coordonnées', ['nom', 'entreprise', 'email', 'telephone']],
    ],
  },
  candidature: {
    titre: 'Candidature',
    accent: 'spontanée.',
    sujet: 'Candidature spontanée',
    sections: [
      ['Votre candidature', ['poste', 'message', 'piece_jointe']],
      ['Vos coordonnées', ['nom', 'email', 'telephone']],
    ],
  },
};

const LIBELLES = {
  type_site: 'Type de site', code_postal: 'Code postal', ville: 'Ville', surface: 'Surface', nb_sites: 'Nombre de sites',
  prestations: 'Prestations souhaitées', depannage_multiservices: 'Dépannage & multiservices', frequence: 'Fréquence',
  demarrage: 'Démarrage souhaité', precisions: 'Précisions', piece_jointe: 'Pièce jointe', nom: 'Nom et prénom',
  entreprise: 'Entreprise ou organisme', fonction: 'Fonction', email: 'E-mail', telephone: 'Téléphone',
  contact_prefere: 'Contact préféré', creneaux: 'Créneaux', creneau_rappel: 'Créneau de rappel', objet: 'Objet',
  message: 'Message', poste: 'Poste visé',
};

// Le devis en 3 étapes envoie des identifiants ; on affiche les mêmes mots que sur le site.
const TYPES_DE_SITE = {
  bureaux: 'Bureaux et commerces', industrie: 'Site industriel', collectivite: 'Collectivités',
  parkings: 'Parkings', copro: 'Copropriétés', autre: 'Autre site',
};

// Champs techniques, jamais affichés.
const IGNORES = new Set(['formulaire', 'numero', 'viewport', 'consentement', 'medias', 'mesure']);

const echapper = (valeur) => String(valeur).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const enHtml = (valeur) => echapper(valeur).replace(/\r?\n/g, '<br>');
const humaniser = (nom) => nom.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

// Ne garde que du texte court, avec un plafond de taille (le serveur ne fait pas confiance au navigateur).
function nettoyer(champs) {
  const propres = {};
  Object.entries(champs || {}).slice(0, 40).forEach(([nom, valeur]) => {
    if (!/^[a-z_]{1,40}$/.test(nom)) return;
    const texte = String(valeur ?? '').trim().slice(0, 4000);
    if (texte) propres[nom] = texte;
  });
  return propres;
}

function valeurAffichee(nom, valeur) {
  if (nom === 'type_site') return TYPES_DE_SITE[valeur] || valeur;
  return valeur;
}

function numeroDemande(champs) {
  if (/^CR-\d{4}-\d{4}$/.test(champs.numero || '')) return champs.numero;
  const maintenant = new Date();
  return 'CR-' + String(maintenant.getFullYear()).slice(2) + String(maintenant.getMonth() + 1).padStart(2, '0') + '-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

function lignes(champs, formulaire) {
  const vus = new Set();
  const sections = formulaire.sections.map(([titre, noms]) => {
    const rangees = noms.filter((nom) => champs[nom]).map((nom) => { vus.add(nom); return [LIBELLES[nom], valeurAffichee(nom, champs[nom])]; });
    return [titre, rangees];
  });
  const autres = Object.keys(champs).filter((nom) => !vus.has(nom) && !IGNORES.has(nom)).map((nom) => [LIBELLES[nom] || humaniser(nom), champs[nom]]);
  if (autres.length) sections.push(['Autres informations', autres]);
  return sections.filter(([, rangees]) => rangees.length);
}

function rangeeHtml([libelle, valeur]) {
  return `<tr>
<td valign="top" width="38%" style="padding:10px 16px 10px 0;font:500 12px/18px ${CORPS};letter-spacing:.08em;text-transform:uppercase;color:${COULEURS.discret};">${echapper(libelle)}</td>
<td valign="top" style="padding:10px 0;font:400 15px/24px ${CORPS};color:${COULEURS.texte};">${enHtml(valeur)}</td>
</tr>`;
}

function sectionHtml([titre, rangees]) {
  return `<tr><td style="padding:0 0 16px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COULEURS.carte}" style="background:${COULEURS.carte};border:1px solid ${COULEURS.trait};border-radius:16px;">
<tr><td style="padding:24px 28px 12px 28px;">
<p style="margin:0 0 8px 0;font:600 12px/16px ${TITRES};letter-spacing:.2em;text-transform:uppercase;color:${COULEURS.accent};">${echapper(titre)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${rangees.map(rangeeHtml).join('\n')}
</table>
</td></tr></table>
</td></tr>`;
}

function bouton(href, texte, plein) {
  const fond = plein ? COULEURS.accent : 'transparent';
  const couleur = plein ? COULEURS.surAccent : COULEURS.texte;
  const bordure = plein ? COULEURS.accent : '#5e6a72';
  return `<a href="${echapper(href)}" style="display:inline-block;min-width:200px;padding:14px 28px;border-radius:999px;border:1px solid ${bordure};background:${fond};font:600 13px/20px ${TITRES};letter-spacing:.1em;text-transform:uppercase;text-align:center;text-decoration:none;color:${couleur};">${echapper(texte)}</a>`;
}

// Construit le courrier. « public » : 'equipe' (compte rendu interne) ou 'visiteur' (accusé de réception).
function composer({ champs, formulaire, numero, public: lecteur, siteUrl, date }) {
  const prenomNom = champs.nom || '';
  const sections = lignes(champs, formulaire);
  const equipe = lecteur === 'equipe';
  const intro = equipe
    ? `Une demande vient d’arriver par le site${prenomNom ? ` de la part de <strong style="color:${COULEURS.texte};">${echapper(prenomNom)}</strong>` : ''}. Voici son compte rendu.`
    : `Bonjour${prenomNom ? ` ${echapper(prenomNom)}` : ''}, nous avons bien reçu votre demande. Voici le compte rendu de ce que vous nous avez transmis.`;
  const prochaine = equipe
    ? (champs.email ? bouton(`mailto:${champs.email}?subject=${encodeURIComponent('Votre demande ' + numero)}`, 'Répondre', true) : '') + (champs.telephone ? ' &nbsp; ' + bouton('tel:' + champs.telephone.replace(/[^+\d]/g, ''), 'Appeler', false) : '')
    : bouton('tel:' + ENTREPRISE.telLien, 'Nous appeler', true) + ' &nbsp; ' + bouton('mailto:' + ENTREPRISE.mail, 'Nous écrire', false);
  const phraseFin = equipe
    ? 'Vous pouvez répondre directement à ce message : la réponse part vers le visiteur.'
    : `Un complément, une correction&nbsp;? Répondez simplement à ce message ou appelez-nous au ${ENTREPRISE.tel}.`;

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>${echapper(formulaire.sujet)} ${echapper(numero)}</title></head>
<body style="margin:0;padding:0;background:${COULEURS.fond};" bgcolor="${COULEURS.fond}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${echapper(formulaire.sujet)} ${echapper(numero)} — compte rendu.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COULEURS.fond}" style="background:${COULEURS.fond};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
<tr><td style="padding:0 0 24px 4px;"><a href="${echapper(siteUrl)}"><img src="${echapper(siteUrl)}/assets/img/email/logo.png" width="210" alt="Crescend’eau, une vague de propreté" style="display:block;border:0;height:auto;"></a></td></tr>
<tr><td style="padding:0 0 16px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COULEURS.carte}" style="background:${COULEURS.carte};border:1px solid ${COULEURS.trait};border-top:3px solid ${COULEURS.accent};border-radius:16px;">
<tr><td style="padding:36px 28px 32px 28px;">
<p style="margin:0 0 16px 0;font:600 12px/16px ${TITRES};letter-spacing:.2em;text-transform:uppercase;color:${COULEURS.accent};">Compte rendu</p>
<h1 style="margin:0 0 20px 0;font:500 30px/38px ${TITRES};letter-spacing:.03em;text-transform:uppercase;color:${COULEURS.texte};">${echapper(formulaire.titre)}<br><span style="color:${COULEURS.accent};">${echapper(formulaire.accent)}</span></h1>
<p style="margin:0 0 24px 0;"><span style="display:inline-block;padding:6px 14px;border-radius:999px;background:${COULEURS.teinte};font:600 12px/16px ${TITRES};letter-spacing:.1em;color:${COULEURS.clair};">N° ${echapper(numero)}</span> <span style="font:400 13px/20px ${CORPS};color:${COULEURS.discret};">&nbsp;${echapper(date)}</span></p>
<p style="margin:0;font:400 16px/26px ${CORPS};color:${COULEURS.doux};">${intro}</p>
</td></tr></table>
</td></tr>
${sections.map(sectionHtml).join('\n')}
<tr><td align="center" style="padding:16px 0 8px 0;">${prochaine}</td></tr>
<tr><td align="center" style="padding:16px 24px 32px 24px;font:400 14px/22px ${CORPS};color:${COULEURS.discret};">${phraseFin}</td></tr>
<tr><td style="padding:24px 4px 0 4px;font:400 12px/20px ${CORPS};color:${COULEURS.tres};text-align:center;">
${ENTREPRISE.nom} · ${ENTREPRISE.adresse}<br>
<a href="tel:${ENTREPRISE.telLien}" style="color:${COULEURS.discret};text-decoration:none;">${ENTREPRISE.tel}</a> · <a href="mailto:${ENTREPRISE.mail}" style="color:${COULEURS.discret};text-decoration:none;">${ENTREPRISE.mail}</a> · <a href="${ENTREPRISE.instagram}" style="color:${COULEURS.discret};text-decoration:none;">Instagram</a><br>
SIRET ${ENTREPRISE.siret}<br>
${equipe ? 'Message automatique du formulaire du site.' : 'Vous recevez ce message parce que vous avez rempli un formulaire sur notre site. Vos données ne servent qu’à traiter votre demande.'}
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  const texte = [
    `${formulaire.sujet} — ${numero}`, date, '', equipe ? `Demande reçue par le site${prenomNom ? ` de la part de ${prenomNom}` : ''}.` : `Bonjour${prenomNom ? ` ${prenomNom}` : ''}, nous avons bien reçu votre demande. Voici le compte rendu.`, '',
    ...sections.flatMap(([titre, rangees]) => [titre.toUpperCase(), ...rangees.map(([l, v]) => `${l} : ${v}`), '']),
    equipe ? 'Répondez à ce message pour écrire au visiteur.' : `Un complément ? Répondez à ce message ou appelez le ${ENTREPRISE.tel}.`,
    '', `${ENTREPRISE.nom} · ${ENTREPRISE.adresse} · ${ENTREPRISE.tel} · ${ENTREPRISE.mail}`,
  ].join('\n');
  return { html, text: texte };
}

// Renvoie { numero, courriers: [{ to, subject, html, text, replyTo, obligatoire }] } ou null si la demande est inutilisable.
function preparer(champsBruts, { destinataire, siteUrl }) {
  const champs = nettoyer(champsBruts);
  if (!champs.nom) return null;
  const formulaire = FORMULAIRES[champs.formulaire] || FORMULAIRES.contact;
  const numero = numeroDemande(champs);
  const date = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'long', timeStyle: 'short' });
  const base = { champs, formulaire, numero, siteUrl, date };
  const objetEquipe = `[${numero}] ${formulaire.sujet} — ${champs.entreprise || champs.nom}`;
  const courriers = [{ to: destinataire, subject: objetEquipe, replyTo: champs.email, obligatoire: true, ...composer({ ...base, public: 'equipe' }) }];
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(champs.email || '')) {
    courriers.push({ to: champs.email, subject: `Votre demande ${numero} — ${ENTREPRISE.nom}`, replyTo: destinataire, obligatoire: false, ...composer({ ...base, public: 'visiteur' }) });
  }
  return { numero, courriers };
}

module.exports = { preparer, composer, FORMULAIRES, ENTREPRISE };
