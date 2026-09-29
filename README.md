# Éloquence 🎙️

Application web complète pour améliorer son **éloquence**, sa **prise de parole**, son **articulation** et sa **qualité d’expression** en français. Menu latéral (bouton ☰), 18 sections, installable comme une application (PWA) et utilisable hors connexion.

## Sections

**Tableau de bord**
- **Accueil** : citation du jour, séance express, statistiques, accès à tous les exercices.
- **Programme 30 jours** : parcours progressif en 4 semaines (fondations, voix, structure, persuasion), 3 activités par jour.
- **Progression & badges** : calendrier d’activité, courbes (score, débit, tics, précision), 23 badges à débloquer.

**Voix & corps**
- **Souffle & échauffement** : 4 respirations guidées (avec guidage vocal) et échauffement vocal en 9 étapes.
- **Articulation** : 41 virelangues notés par reconnaissance vocale, défi ×3, mode stylo, gammes de syllabes, sons proches.
- **Voix & intonation** : courbe de hauteur de la voix en temps réel (sirène, projection, question/affirmation, note tenue) et exercice des 10 émotions.
- **Lecture guidée** : téléprompteur au rythme choisi, avec vos propres textes ou votre discours de l’atelier.

**Prise de parole**
- **Analyse de discours** : débit, tics de langage, pauses, diversité du vocabulaire, expressivité de la voix, score et conseils ; buzzer anti-tics.
- **Improvisation** : 57 sujets, 20 contraintes, temps de préparation réglable.
- **Débat & argumentation** : 28 motions, plaidoirie pour/contre avec plan guidé, 15 réfutations express.
- **Entretien & oral** : simulations (embauche, grand oral, interview média, réunion) avec questions lues à voix haute et bilan par réponse.
- **Storytelling** : cartes personnage / lieu / objet / rebondissement et schéma narratif.
- **Jeux de parole** : mots imposés, Tabou, une minute sans hésiter, alphabet de l’orateur.

**Expression** : vocabulaire & style (mot du jour, lexique personnel, mots passe-partout, reformulations, connecteurs, figures de style) et 5 quiz.

**Apprendre** : 16 cours pratiques avec exercice et mini-quiz, atelier de préparation de discours (structure, durée estimée, vérifications, export).

**Réglages** : prénom, thème clair/sombre, accent de reconnaissance, voix de lecture, sauvegarde/import des données, installation.

## Lancer

Fichiers statiques, sans compilation :

```bash
python3 -m http.server 8000   # puis http://localhost:8000
```

Le micro nécessite `https://` ou `localhost`. La reconnaissance vocale fonctionne dans **Chrome** et **Edge**.

### Mettre en ligne
- **GitHub Pages** : *Settings → Pages → Deploy from a branch → `master` / root*.
- **Netlify** : importer ce dépôt (le fichier `netlify.toml` publie la racine).

## Structure

```
index.html            coquille (menu, en-tête)
css/style.css         styles (thèmes clair et sombre)
js/core.js            navigation, stockage, historique, réglages
js/speech.js          reconnaissance vocale, analyse audio (pauses, hauteur), bilans
js/data/*.js          contenus (virelangues, sujets, cours, programme…)
js/views/*.js         sections de l’application
sw.js                 cache hors ligne
```

Les données restent dans le navigateur (localStorage). La transcription de Chrome passe par le service de reconnaissance de Google.
