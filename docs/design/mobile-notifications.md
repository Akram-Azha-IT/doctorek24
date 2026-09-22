# Notifications mobiles — état au 21 septembre 2026

## Livré : centre authentifié dans l’application

- Cloche et compteur issus de `GET /api/v1/notifications/unread-count`.
- Liste des 50 dernières notifications via `GET /api/v1/notifications` ; filtres Toutes/Non lues.
- Lecture individuelle et globale via les endpoints existants. Échec explicite, sans faux succès.
- Navigation interne sur liste blanche de types ; aucune URL du champ `data` n’est exécutée.
- Cache mémoire par compte, `gcTime: 0`, requêtes liées à l’identité courante par `authenticatedApiFetch`. Pas de persistance des contenus.
- Actualisation toutes les 30 secondes uniquement au premier plan. Il ne s’agit pas de push OS.
- Événements existants : `MESSAGE_RECU`, `CARTE_CREEE`, `RDV_RAPPEL` (30 min). Annulation médecin : ajout de `RDV_ANNULE_MEDECIN` vers patient/comptes familiaux autorisés, hors auteur.

## À implémenter : transport push Android et iOS

Choix préparé : `expo-notifications` avec tokens natifs (`getDevicePushTokenAsync`) et envoi direct FCM v1 / APNs depuis le backend, sans relais Expo Push. Aucun SDK push, enregistrement d’appareil ou envoi distant n’est encore activé dans cette livraison.

L’activation ne doit pas transmettre de contenu de santé : titre « Doctorek », corps « Une nouvelle activité est disponible dans votre espace. » Aucun nom, message, spécialité, document, référence de carte ou horaire de consultation dans la charge push. Un identifiant opaque d’événement suffit ; les détails sont relus via l’API après authentification. Les tokens d’appareil et métadonnées restent des données à protéger ; validation sécurité/contractuelle nécessaire avant usage réel.

### Prérequis opérateur (ne pas coller de secrets dans une conversation)

Android : projet Firebase dédié, application `ma.doctorek.mobile`, configuration client Android, identité serveur FCM à privilèges minimaux dans le gestionnaire de secrets du serveur.

iOS : compte Apple Developer, App ID `ma.doctorek.mobile`, capacité Push Notifications, clés APNs et profils de signature configurés dans l’environnement sécurisé de build/serveur. Séparer APNs sandbox et production.

Après ajout du module natif : nouveau development build Android/iOS. Expo Go Android ne permet pas de valider les push distants. Les anciens APK doivent garder une dégradation sûre, sans import natif qui casse le démarrage.

### Exigences d’implémentation serveur

1. Registre d’installations authentifié : propriétaire déduit du compte, jamais d’un userId fourni ; plateforme/environnement contrôlés ; tokens chiffrés et absents des logs.
2. Rotation de token, retrait à la déconnexion, changement de compte et invalidation des tokens rejetés par FCM/APNs.
3. File d’envoi persistante liée à la transaction de notification : aucun succès annoncé avant commit ; reprises bornées, déduplication, observation des échecs sans PII.
4. Politique de rappel vérifiée juste avant envoi (RDV non annulé/non terminé, échéance encore pertinente), durée de vie courte. Ne pas programmer des rappels mobiles obsolètes sans stratégie d’annulation.
5. Permissions demandées après une explication et une action utilisateur. Refus respecté, lien vers réglages système ; aucun prompt à chaque ouverture.
6. Ouverture à froid/chaud vers le centre après contrôle de session. Ne jamais suivre une URL externe fournie dans le payload.
7. Préférences par catégorie côté serveur, sans confondre email, historique interne et push.

### Validation avant activation

Android/iOS physiques : premier plan, arrière-plan, application fermée, permission refusée, rotation du token, déconnexion/changement de compte, doublons, réception retardée, annulation avant rappel, réseau indisponible. Vérifier le contenu réel de l’écran verrouillé. Utiliser uniquement des comptes et messages fictifs.

## Références officielles

- https://docs.expo.dev/versions/v57.0.0/sdk/notifications/
- https://docs.expo.dev/push-notifications/sending-notifications-custom/
- https://docs.expo.dev/push-notifications/push-notifications-setup/
