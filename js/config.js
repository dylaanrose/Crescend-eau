// Réglages du site.

// Adresse qui reçoit les formulaires (devis rapide, contact, devis en 3 étapes, candidature).
// Chaque formulaire y est envoyé en POST « multipart/form-data » ; toute réponse 2xx vaut succès.
// Vide = mode démonstration : les formulaires se valident mais n’envoient rien et le disent.
// Exemple : export const FORM_ENDPOINT = '/api/envoyer.php';
export const FORM_ENDPOINT = '';
