// Génère des aperçus des courriers dans emails/ (ouvrables dans un navigateur) : node tools/email-apercu.mjs
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const { preparer } = createRequire(import.meta.url)('../api/_email.js');

const demande = {
  formulaire: 'devis', numero: 'CR-261123-1425', nom: 'Claire Muller', entreprise: 'Groupe Rhénan', fonction: 'Responsable des services généraux',
  email: 'claire.muller@exemple.fr', telephone: '03 88 00 00 00', contact_prefere: 'Téléphone', creneaux: 'En journée',
  type_site: 'bureaux', code_postal: '67210', ville: 'Obernai', surface: '2 000 à 5 000 m²', nb_sites: 'Un seul site',
  prestations: 'Nettoyage de bureaux, Vitrerie et façades', frequence: 'Autres', demarrage: 'Dans le mois',
  precisions: 'Accès par badge à l’accueil.\nPassage de préférence avant 8 h.', consentement: 'on',
};
const { courriers } = preparer(demande, { destinataire: 'contactpro@crescendeau.fr', siteUrl: '..' });
mkdirSync('emails', { recursive: true });
writeFileSync('emails/apercu-equipe.html', courriers[0].html);
writeFileSync('emails/apercu-visiteur.html', courriers[1].html);
console.log('emails/apercu-equipe.html, emails/apercu-visiteur.html');
