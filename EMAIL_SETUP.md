# Configuration de l’envoi automatique des e-mails

Le site est statique : il ne peut pas envoyer de courriels directement depuis le navigateur sans passer par un fournisseur d’e-mail. Les commandes et demandes de devis sont préparées dans `email.js` via EmailJS. **L’envoi reste inactif tant que les identifiants EmailJS ne sont pas configurés.**

## Mise en service

1. Créez un compte EmailJS et reliez-y le service e-mail qui recevra les notifications.
2. Créez un modèle EmailJS dont le champ destinataire (« To Email ») est fixé à `bendadaabdenour@gmail.com`. Configurez l’objet avec `{{subject}}` et le contenu du message avec `{{message}}`. Le modèle reçoit aussi `{{type}}` (`commande` ou `devis`).
3. Dans `email.js`, renseignez les valeurs du service, du modèle et la clé publique EmailJS dans `serviceId`, `templateId` et `publicKey`. La clé publique est destinée à être utilisée côté navigateur ; ne mettez jamais de clé privée ou de mot de passe dans ce fichier.
4. Dans les paramètres EmailJS, limitez les origines autorisées au domaine du site et activez les protections anti-abus disponibles.
5. Testez une commande et une demande de devis. La confirmation indique si la notification a été envoyée ; les détails des articles comprennent le modèle, la quantité, les prix, la finition, les dimensions, l’ouverture, la quincaillerie et le cadre lorsqu’ils sont disponibles.

Les demandes de devis libres contiennent le message saisi par le client. Les demandes lancées depuis le configurateur incluent aussi la configuration et la quantité choisies.
