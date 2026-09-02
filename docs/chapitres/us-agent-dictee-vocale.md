# US — Dictée vocale de l'agent

## Besoin

En tant que patient marocain, je veux dicter ma recherche en français, arabe ou
darija mélangé au français afin de remplir rapidement le composeur de l'agent.

## Flux

```text
MediaRecorder (30 s max)
  → conversion locale en WAV PCM mono 16 kHz
  → POST /api/v1/agent/transcriptions (JWT patient, multipart)
  → Spring Boot valide taille/type et applique le quota
  → Gemini 3.5 Transcribe (audio inline, sans Files API)
  → texte modifiable dans le composeur
  → envoi manuel par le patient
```

## Critères d'acceptation

- Le micro n'apparaît que pour un patient et lorsque la transcription est configurée.
- L'utilisateur peut annuler sans envoyer l'audio.
- L'enregistrement s'arrête automatiquement après 30 secondes.
- Le frontend affiche les états autorisation, enregistrement et transcription.
- Le texte obtenu reste modifiable et n'est jamais envoyé automatiquement à l'agent.
- L'endpoint est réservé au rôle `PATIENT`, limité à 2 Mo, 30 secondes, 2 appels
  simultanés par instance et 10 requêtes par patient toutes les 5 minutes.
- Aucun audio n'est stocké par Doctorek ni envoyé à la Gemini Files API.
- Les termes Doctorek, villes marocaines et spécialités médicales biaisent la reconnaissance.
- Le texte injecté respecte la limite de 500 caractères du message de l'agent.

## Configuration

```env
SPRING_AI_MODEL_CHAT=google-genai
GEMINI_API_KEY=...
AGENT_TRANSCRIPTION_ENABLED=true
GEMINI_TRANSCRIBE_API_KEY=... # clé dédiée facultative, recommandée en production
GEMINI_TRANSCRIBE_MODEL=gemini-3.5-transcribe
```

Le palier gratuit Gemini convient aux essais et à une démonstration PFE, dans la
limite des quotas Google du projet. Google indique que les contenus du palier
gratuit peuvent servir à améliorer ses produits. Il ne faut donc pas l'utiliser
avec de vraies données de santé. En production, la transcription reste désactivée
par défaut : utiliser un compte facturé avec les garanties contractuelles
appropriées et obtenir le consentement explicite du patient avant l'envoi de
l'audio.
