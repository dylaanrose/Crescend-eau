// Reçoit un formulaire du site (js/forms.js, en JSON) et envoie deux courriers par Resend :
// le compte rendu à l’équipe, et l’accusé de réception au visiteur (s’il a donné son adresse).
//
// À régler dans Vercel > Settings > Environment Variables :
//   RESEND_API_KEY  clé d’API Resend (obligatoire)
//   MAIL_FROM       expéditeur, sur un domaine vérifié chez Resend (ex. « Crescend’eau <demandes@crescendeau.fr> »)
//   MAIL_TO         adresse qui reçoit les demandes (par défaut contactpro@crescendeau.fr)
//   SITE_URL        adresse publique du site, sans « / » final (pour le logo des courriers)
const { preparer } = require('./_email');

const DESTINATAIRE = 'contactpro@crescendeau.fr';

async function envoyer(cle, de, courrier) {
  const reponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: de, to: [courrier.to], reply_to: courrier.replyTo, subject: courrier.subject, html: courrier.html, text: courrier.text }),
  });
  if (!reponse.ok) throw new Error(`Resend ${reponse.status}`);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ erreur: 'Méthode non autorisée.' });
  }
  const cle = process.env.RESEND_API_KEY;
  const de = process.env.MAIL_FROM;
  if (!cle || !de) return res.status(503).json({ erreur: 'Envoi de courriels non configuré.' });

  const corps = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch { return null; } })() : req.body;
  if (!corps || typeof corps !== 'object' || Array.isArray(corps)) return res.status(400).json({ erreur: 'Demande illisible.' });

  const demande = preparer(corps, { destinataire: process.env.MAIL_TO || DESTINATAIRE, siteUrl: (process.env.SITE_URL || 'https://crescend-eau.vercel.app').replace(/\/$/, '') });
  if (!demande) return res.status(400).json({ erreur: 'Nom manquant.' });

  const resultats = await Promise.allSettled(demande.courriers.map((courrier) => envoyer(cle, de, courrier)));
  // Le courrier à l’équipe est indispensable ; l’accusé au visiteur est un plus.
  const perdu = demande.courriers.some((courrier, i) => courrier.obligatoire && resultats[i].status === 'rejected');
  if (perdu) return res.status(502).json({ erreur: 'Envoi impossible.' });
  return res.status(200).json({ ok: true, numero: demande.numero });
};
