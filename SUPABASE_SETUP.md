# Connexion Supabase

Le site sait enregistrer les commandes (`commandes`) et demandes de devis/contact (`demandes_contact`) dans Supabase. Il utilise la clé publique `anon` côté navigateur et des règles RLS qui autorisent uniquement les insertions anonymes. Le stockage local du navigateur reste disponible comme solution de secours.

## Mise en service

1. Créez un projet Supabase et ouvrez **SQL Editor**.
2. Exécutez le script [`supabase/schema.sql`](supabase/schema.sql).
3. Dans **Project Settings > API**, copiez l'URL du projet et la clé `anon` / publishable.
4. Renseignez ces valeurs dans [`supabase-config.js`](supabase-config.js) :

   ```js
   window.KBDOOR_SUPABASE_CONFIG = {
     url: 'https://VOTRE-PROJET.supabase.co',
     anonKey: 'VOTRE_CLE_PUBLIQUE_ANON'
   };
   ```

5. Déployez les fichiers du dépôt, puis passez une commande test et vérifiez les lignes dans les tables correspondantes.

**Important :** ne mettez jamais la clé `service_role` dans `supabase-config.js` ni dans le navigateur. Les clés `anon` sont publiques : les politiques RLS limitent les accès à l'insertion, mais une protection anti-spam (par exemple CAPTCHA ou Edge Function avec limitation de débit) reste recommandée avant une mise en production à grande échelle.

L'espace Administrateur actuel lit toujours les données sauvegardées dans le `localStorage` du navigateur : cette connexion enregistre les nouvelles entrées dans Supabase, mais ne synchronise pas encore le tableau de bord entre utilisateurs/appareils. Pour une consultation sécurisée des données Supabase, il faut ajouter une authentification administrateur et des politiques RLS de lecture adaptées.
