// Réglages du site.

// Adresse qui reçoit les formulaires (devis rapide, contact, devis en 3 étapes, candidature).
// Chaque formulaire y est envoyé en POST « application/json » ; toute réponse 2xx vaut succès.
// « /api/demande » est la fonction du dépôt (api/demande.js) : elle envoie le compte rendu à contactpro@crescendeau.fr
// et l’accusé de réception au visiteur. Elle demande la clé RESEND_API_KEY dans Vercel (voir README).
// Vide = mode démonstration : les formulaires se valident mais n’envoient rien et le disent.
export const FORM_ENDPOINT = '/api/demande';
