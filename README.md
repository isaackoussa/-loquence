# Éloquence 🎙️

Application web pour améliorer son **éloquence**, sa **prise de parole**, son **articulation** et sa **qualité d’expression** en français.

## Fonctionnalités

- **Accueil** : séance du jour en 4 étapes, série de jours d’affilée, statistiques et historique de progression.
- **Articulation** : 41 virelangues (facile → difficile) notés par reconnaissance vocale, mots mal prononcés surlignés, modèle audio à 3 vitesses, défi « 3 fois de suite », mode « stylo entre les dents », gammes de syllabes et paires de sons proches (poisson / poison, bon / banc / bain…).
- **Lecture & intonation** : téléprompteur qui surligne le texte au rythme choisi (lent, posé, dynamique) et marque les pauses, avec enregistrement ; textes d’entraînement et extraits de Victor Hugo et Jean Jaurès. Exercice « une phrase, mille intentions » : dire une même phrase avec 10 émotions différentes et se réécouter.
- **Analyse de discours** : enregistrement avec transcription en direct et bilan chiffré : débit (mots/minute), tics de langage (« euh », « du coup », « en fait », « genre »…), pauses et silences trop longs, diversité du vocabulaire, mots répétés et passe-partout, score global et réécoute. Option **buzzer anti-tics** qui sonne à chaque tic détecté.
- **Improvisation** : 57 sujets (argumenter, raconter, pitcher, décalé), 20 contraintes optionnelles, 30 s de préparation puis enregistrement analysé.
- **Souffle & voix** : respirations guidées (cohérence cardiaque, carrée, 4-7-8, souffle long) et échauffement vocal minuté en 9 étapes.
- **Expression** : 45 mots du jour, alternatives aux mots passe-partout, 20 phrases à reformuler et 12 figures de style de l’orateur.

## Utilisation

Aucune installation ni compilation : ce sont des fichiers statiques.

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Le micro nécessite `https://` ou `localhost` (GitHub Pages, Netlify… conviennent).
La reconnaissance vocale (Web Speech API) fonctionne dans **Chrome** et **Edge** ; sur les autres navigateurs, les exercices restent disponibles et l’analyse se limite aux pauses et à la durée.

Les données de progression sont stockées localement dans le navigateur ; les enregistrements ne quittent pas l’appareil (la transcription de Chrome passe toutefois par le service de reconnaissance de Google).
