# Audit UI/UX — Accueil Doctorek

Date : 19 août 2026
Surface : page d’accueil desktop publique
Objectif utilisateur principal : trouver un médecin approprié et accéder rapidement à un rendez-vous.
Cible d’accessibilité : WCAG 2.2 AA.

## Évidence

Capture fournie et inspectée :
`C:/Users/Akram/AppData/Local/Temp/codex-clipboard-3b59484e-97b4-436f-a6e2-b3bd3d6aa632.png`

## Étape auditée

1. **Découverte de la page d’accueil et lancement d’une recherche — santé moyenne.** Le point de départ est compréhensible, mais la proposition de valeur et l’agent se concurrencent, puis la page devient un inventaire de fonctionnalités.

## Forces

- La promesse, la photographie médicale et la recherche spécialité/ville rendent le service immédiatement compréhensible.
- Le bleu, le bleu nuit et le fond glacé forment une base de marque cohérente et rassurante.
- La recherche reste l’action principale du hero et propose un chemin direct vers l’annuaire.
- Les entrées patient et professionnel sont présentes et la sécurité des données est explicitement évoquée.

## Risques UX prioritaires

### P0 — L’agent masque le contenu au lieu d’améliorer le parcours

La barre flottante recouvre les cartes promotionnelles et arrive sans expliquer ce qu’elle peut accomplir. Elle paraît ajoutée au-dessus de la page, alors qu’elle devrait être le mode guidé de la recherche Doctorek.

**Recommandation :** intégrer l’agent au hero comme « recherche guidée », avec deux choix clairs : recherche classique ou accompagnement conversationnel. Une fois réduit, conserver uniquement une marque compacte non intrusive.

### P0 — La page dilue son objectif dans trop de sections équivalentes

Après le hero, les promotions, statistiques, spécialités, engagements, sections patient, professionnel et données ont presque le même poids. Les bénéfices patient, la carte médicale et la sécurité sont répétés plusieurs fois.

**Recommandation :** limiter la narration à cinq temps : trouver, choisir, réserver, gérer ses soins, confiance/sécurité. Réserver la bifurcation professionnelle à une section courte clairement séparée.

### P0 — Les preuves de confiance doivent être vérifiables

Les chiffres « 50 000+ », « 2 000+ » et « 30+ » attirent l’attention mais peuvent fragiliser la crédibilité s’ils ne sont pas sourcés. Le footer contient aussi des coordonnées qui ressemblent à des valeurs temporaires.

**Recommandation :** utiliser uniquement des données réelles et datées, puis ajouter des preuves utiles : médecins vérifiés, couverture géographique, délais moyens et politique de protection des données.

### P1 — La page ressemble à un assemblage de blocs marketing

Les cartes bleu pâle, grands rayons, ombres, captures de téléphone et cercles décoratifs reviennent souvent. Le badge anglais « 100% FREE » et les formes abstraites diminuent la perception clinique et premium.

**Recommandation :** définir une seule grammaire de surfaces, réduire les cartes, privilégier les séparations par espacement et employer de vraies images ou illustrations de marque plutôt que des formes décoratives génériques.

### P1 — Les appels à l’action sont génériques et concurrents

« Rechercher », « En savoir plus », « Découvrir Doctorek Pro », « Créer ma carte » et « Se connecter » se partagent l’attention. Le CTA professionnel bleu du header concurrence la recherche patient.

**Recommandation :** garder un CTA dominant par section et nommer le résultat attendu : « Voir les médecins disponibles », « Créer ma carte santé », « Découvrir l’espace praticien ».

## Risques d’accessibilité visibles

- Plusieurs textes paraissent proches de 12–13 px, particulièrement les descriptions, labels et liens du footer.
- Les textes bleu pâle sur fond bleu nuit et les placeholders gris doivent être mesurés pour confirmer le contraste AA.
- Le sélecteur de langue et certains contrôles du header semblent inférieurs à la cible tactile recommandée de 44 px.
- Les champs reposent surtout sur leurs placeholders ; des libellés persistants amélioreraient la compréhension et la saisie.
- La capture seule ne permet pas de valider le focus clavier, l’ordre de lecture, les annonces de changement d’état, le zoom à 200 % ni le comportement mobile.

## Audit de marque

- **Solide :** mot-symbole distinctif, palette bleu/bleu nuit stable, photographie médicale claire, ton simple en français.
- **À corriger :** absence de guide de marque formel, tailles et rayons trop variables, badge « FREE » hors ton, mélange de photographie produit et de formes décoratives génériques.
- **Typographie :** Plus Jakarta Sans pour les titres et Geist pour le corps constituent une bonne paire ; fixer cependant une échelle commune avec corps à 16 px et petits textes à 14 px minimum.
- **Logo :** garder le mot-symbole complet dans le header et la version blanche dans le footer, sans effets, recoloration ou ombre.

## Direction recommandée

Faire de Doctorek un **concierge de santé fiable**, et non un annuaire auquel un chatbot a été ajouté. Le hero doit unifier recherche, proximité, disponibilité et accompagnement. Le reste de la page doit prouver la confiance et expliquer le parcours avec moins de blocs.

## Limites

Audit fondé sur une capture desktop complète et le code local. Les interactions, états de chargement, erreurs, focus, lecteur d’écran et reflow responsive nécessitent un test navigateur dédié.
