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

## Compte, rappels & e-mails (Brevo)
Comme Anglais 365 et MasterGraf : on entre avec son **e-mail + un code à 6 chiffres** envoyé par Brevo, sans mot de passe.
- **Progression sauvegardée en ligne** (Netlify Blobs) : elle suit l’utilisateur sur tous ses appareils.
- **Rappels aux jours et à l’heure choisis** (menu → Compte & rappels) : notification sur le téléphone/ordinateur et/ou e-mail, envoyés *seulement si aucun exercice n’a été fait ce jour-là*. Message personnalisé : série, jour du programme, score moyen.
- **Bilan hebdomadaire** chaque dimanche : jours actifs, exercices, discours analysés, score moyen, temps de parole, programme.
- **E-mails de paliers** : premier exercice, 7/30/100/365 jours de série, 10/50/100 discours, score de 85, semaine 1 et programme terminés.
- **Contacts Brevo enrichis** : attributs `PRENOM`, `SERIE`, `EXERCICES`, `DISCOURS`, `SCORE_MOYEN`, `JOUR_PROGRAMME`, `BADGES`, `DERNIERE_ACTIVITE` (à créer dans Brevo → Contacts → Paramètres → Attributs).
- **Console admin** sur `/#admin` (clé `ADMIN_KEY`) : utilisateurs, série, exercices, score, rappels, blocage d’un compte.

Sur un hébergement sans serveur (GitHub Pages, serveur local), la barrière propose « Continuer sans compte » : progression sur l’appareil uniquement.

## Lancer en local

```bash
npm run serve   # http://localhost:8000 (sans compte : progression locale)
```

Le micro nécessite `https://` ou `localhost`. La reconnaissance vocale fonctionne dans **Chrome** et **Edge**.

## Déploiement (GitHub → Netlify)
1. Relie le site Netlify **eloquence-coach** au dépôt GitHub (Project configuration → Build & deploy → Link repository). `netlify.toml` règle tout (dossier `public`, fonctions dans `netlify/functions`).
2. Dans Netlify → Project configuration → **Environment variables**, ajoute :
   - `BREVO_API_KEY` : ta clé API Brevo (tu peux réutiliser celle d’Anglais 365 / MasterGraf).
   - `MAIL_FROM` : l’adresse expéditrice validée dans Brevo (Senders & Domains).
   - `ADMIN_KEY` : un mot de passe long de ton choix pour la console admin.
   - facultatif : `MAIL_FROM_NAME`, `BREVO_LIST_ID`, `APP_URL` (si domaine personnalisé).
   - seulement si les fonctions affichent « MissingBlobsEnvironmentError » : `NETLIFY_SITE_ID` et `NETLIFY_BLOBS_TOKEN`.
3. Redéploie. Les rappels partent automatiquement (fonction planifiée toutes les 15 minutes). Les clés des notifications push sont générées toutes seules au premier usage.

Tant que `BREVO_API_KEY` et `MAIL_FROM` ne sont pas configurées, personne ne peut se connecter sur la version Netlify : c’est voulu (comme Anglais 365).

Sur iPhone, les notifications fonctionnent une fois l’app **ajoutée à l’écran d’accueil** (Safari → Partager → Sur l’écran d’accueil).

## Structure

```
public/index.html          coquille (menu, en-tête, barrière de connexion)
public/css/style.css       styles (thèmes clair et sombre)
public/js/core.js          navigation, stockage, historique, réglages
public/js/speech.js        reconnaissance vocale, analyse audio (pauses, hauteur), bilans
public/js/cloud.js         compte, synchronisation, rappels, notifications push
public/js/data/*.js        contenus (virelangues, sujets, cours, programme…)
public/js/views/*.js       sections de l’application
public/sw.js               cache hors ligne + notifications push
netlify/functions/*.mts    API : code e-mail, compte, progression, rappels, admin
netlify/lib/*.mts          Blobs, Brevo, gabarits d’e-mails, Web Push
```

Les données restent dans le navigateur (localStorage). La transcription de Chrome passe par le service de reconnaissance de Google.
