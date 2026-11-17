# Configuration de l’envoi automatique des e-mails

Le site est statique : les notifications de commandes et de demandes de devis sont envoyées depuis le navigateur avec le service FormSubmit. Aucun identifiant EmailJS n’est nécessaire.

## Mise en service

1. Vérifiez dans `email.js` l’adresse de réception configurée dans `recipient` (actuellement `bendadaabdenour@gmail.com`).
2. Publiez le site puis effectuez une première commande test ou demande de devis.
3. FormSubmit envoie un e-mail de vérification à cette adresse lors du premier envoi. Ouvrez-le et cliquez sur le lien de confirmation pour activer la réception. Vérifiez aussi les courriers indésirables.
4. Refaites un test après activation. La page affiche si la notification a été acceptée ou si l’envoi a échoué ; en cas d’échec, consultez la console du navigateur pour les détails.

Les commandes incluent les coordonnées du client, les articles, les options, la livraison et le total. Les demandes de devis incluent les coordonnées, le message et, si la demande vient du configurateur, les détails du produit.

L’adresse de réception est visible dans le code côté navigateur. N’y placez pas de mot de passe, de clé privée ou d’autre secret. Configurez les protections anti-spam disponibles auprès de FormSubmit et surveillez les soumissions abusives.
