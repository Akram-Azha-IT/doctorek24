# Chargement Doctorek

`LogoLoader` est l’unique indicateur de chargement animé de l’application.

## Variantes

- `wordmark` : chargement d’une page, d’une redirection ou d’une section de contenu. Afficher un libellé précis dès que l’attente peut être perceptible.
- `mark` : action compacte dans un bouton, un toast ou un contrôle. Utiliser `decorative` si le texte adjacent annonce déjà l’action en cours.
- `inverse` : variante compacte placée sur un fond de marque ou un fond foncé.

## Exemples

```tsx
<LogoLoader fullScreen width={140} label="Ouverture de votre espace…" />

<button disabled>
  <LogoLoader variant="mark" size={16} inverse decorative />
  Enregistrement…
</button>
```

Les skeletons restent adaptés lorsqu’ils représentent la structure du contenu à venir. Ne pas créer de nouvel anneau `animate-spin` ou de loader local. L’animation de `LogoLoader` respecte automatiquement `prefers-reduced-motion`.
