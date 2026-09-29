# Éloquence 🎙️

Application web pour améliorer son **éloquence**, sa **prise de parole**, son **articulation** et sa **qualité d’expression** en français.

## Fonctionnalités

- **Accueil** : séance du jour en 4 étapes, série de jours d’affilée, statistiques et historique de progression.
- **Articulation** : 24 virelangues (facile → difficile) notés par reconnaissance vocale, mots mal prononcés surlignés, modèle audio à 3 vitesses, défi « 3 fois de suite », mode « stylo entre les dents » et gammes de syllabes.
- **Analyse de discours** : enregistrement avec transcription en direct et bilan chiffré : débit (mots/minute), tics de langage (« euh », « du coup », « en fait », « genre »…), pauses et silences trop longs, diversité du vocabulaire, mots répétés et passe-partout, score global et réécoute.
- **Improvisation** : 33 sujets (argumenter, raconter, pitcher, décalé), contraintes optionnelles, 30 s de préparation puis enregistrement analysé.
- **Souffle & voix** : respirations guidées (cohérence cardiaque, carrée, 4-7-8, souffle long) et échauffement vocal minuté en 9 étapes.
- **Expression** : mot du jour, alternatives aux mots passe-partout, exercices de reformulation et figures de style de l’orateur.

## Utilisation

Aucune installation ni compilation : ce sont des fichiers statiques.

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Le micro nécessite `https://` ou `localhost` (GitHub Pages, Netlify… conviennent).
La reconnaissance vocale (Web Speech API) fonctionne dans **Chrome** et **Edge** ; sur les autres navigateurs, les exercices restent disponibles et l’analyse se limite aux pauses et à la durée.

Les données de progression sont stockées localement dans le navigateur ; les enregistrements ne quittent pas l’appareil (la transcription de Chrome passe toutefois par le service de reconnaissance de Google).
