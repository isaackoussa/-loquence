/* Programme de 30 jours : chaque jour, trois activités. */

const PROGRAM = [
  // Semaine 1 : fondations
  { w: 1, t: "Faire connaissance avec sa voix", tasks: [["Lire le cours « Apprivoiser le trac »", "cours"], ["Faire 2 minutes de cohérence cardiaque", "souffle"], ["Vous présenter librement pendant 1 minute", "discours"]] },
  { w: 1, t: "Le souffle", tasks: [["Lire le cours « Respirer pour parler »", "cours"], ["Exercice « Souffle long »", "souffle"], ["Lire un texte au rythme posé", "lecture"]] },
  { w: 1, t: "Réveiller les articulateurs", tasks: [["Faire l'échauffement vocal guidé", "souffle"], ["Réussir 3 virelangues faciles", "articulation"], ["Faire une gamme d'articulation", "articulation"]] },
  { w: 1, t: "Articuler avec précision", tasks: [["Lire le cours « Articuler »", "cours"], ["3 virelangues en mode stylo, puis sans", "articulation"], ["Travailler les sons proches", "articulation"]] },
  { w: 1, t: "La posture", tasks: [["Lire le cours « Posture et ancrage »", "cours"], ["Improviser 1 minute debout, bien ancré", "impro"], ["Faire le quiz Vrai ou faux", "quiz"]] },
  { w: 1, t: "Chasser les tics", tasks: [["Lire le cours « La pause et le silence »", "cours"], ["Jouer à « Une minute sans hésiter »", "jeux"], ["Parler 1 minute avec le buzzer anti-tics", "discours"]] },
  { w: 1, t: "Bilan de la semaine 1", tasks: [["Vous présenter à nouveau pendant 1 minute", "discours"], ["Comparer avec le jour 1 dans Progression", "progression"], ["Réussir un virelangue moyen", "articulation"]] },
  // Semaine 2 : la voix
  { w: 2, t: "Explorer sa voix", tasks: [["Lire le cours « La voix »", "cours"], ["Mesurer l'étendue de votre voix", "voix"], ["Faire la sirène de l'échauffement", "souffle"]] },
  { w: 2, t: "L'intonation", tasks: [["Dire 3 phrases avec 3 émotions différentes", "voix"], ["Lire un récit au téléprompteur", "lecture"], ["Réécouter et noter ce qui sonne juste", "voix"]] },
  { w: 2, t: "Le débit", tasks: [["Lire un texte au rythme lent, puis dynamique", "lecture"], ["Parler 1 minute et viser 130 mots/min", "discours"], ["Réussir un virelangue difficile lentement", "articulation"]] },
  { w: 2, t: "Le regard", tasks: [["Lire le cours « Le regard »", "cours"], ["Lire au téléprompteur en levant les yeux aux pauses", "lecture"], ["Improviser 1 minute en regardant la caméra", "impro"]] },
  { w: 2, t: "Les gestes", tasks: [["Lire le cours « Les gestes »", "cours"], ["Raconter une histoire avec de grands gestes", "histoire"], ["Faire le quiz Figures de style", "quiz"]] },
  { w: 2, t: "Le mot juste", tasks: [["Découvrir le mot du jour", "vocabulaire"], ["Faire 3 reformulations", "vocabulaire"], ["Faire le quiz Vocabulaire", "quiz"]] },
  { w: 2, t: "Bilan de la semaine 2", tasks: [["Lire un grand discours au téléprompteur en vous enregistrant", "lecture"], ["Faire le défi ×3 sur un virelangue", "articulation"], ["Consulter vos badges", "progression"]] },
  // Semaine 3 : structure
  { w: 3, t: "Structurer", tasks: [["Lire le cours « Structurer son discours »", "cours"], ["Préparer un discours de 2 minutes dans l'atelier", "atelier"], ["Improviser avec la structure PREP", "impro"]] },
  { w: 3, t: "L'accroche", tasks: [["Lire le cours « Réussir son introduction »", "cours"], ["Écrire 3 accroches pour votre discours", "atelier"], ["Improviser en commençant par une question", "impro"]] },
  { w: 3, t: "La conclusion", tasks: [["Lire le cours « Conclure avec impact »", "cours"], ["Écrire une conclusion qui fait écho à l'accroche", "atelier"], ["Répéter votre discours au téléprompteur", "lecture"]] },
  { w: 3, t: "Raconter", tasks: [["Lire le cours « Raconter une histoire »", "cours"], ["Raconter une histoire avec 4 cartes", "histoire"], ["Jouer aux mots imposés", "jeux"]] },
  { w: 3, t: "Les connecteurs", tasks: [["Revoir les connecteurs logiques", "vocabulaire"], ["Faire le quiz Connecteurs", "quiz"], ["Improviser 90 secondes en soignant les transitions", "impro"]] },
  { w: 3, t: "Improviser", tasks: [["Lire le cours « Improviser sans paniquer »", "cours"], ["Faire 3 improvisations d'une minute", "impro"], ["Jouer à l'alphabet de l'orateur", "jeux"]] },
  { w: 3, t: "Bilan de la semaine 3", tasks: [["Prononcer votre discours de l'atelier sans notes", "discours"], ["Viser un score supérieur à 70", "discours"], ["Faire le quiz Vrai ou faux", "quiz"]] },
  // Semaine 4 : persuasion
  { w: 4, t: "Convaincre", tasks: [["Lire le cours « Convaincre : ethos, pathos, logos »", "cours"], ["Préparer une motion de débat", "debat"], ["Plaider pendant 2 minutes", "debat"]] },
  { w: 4, t: "Réfuter", tasks: [["Faire 3 réfutations express", "debat"], ["Jouer au Tabou", "jeux"], ["Faire le quiz Connecteurs", "quiz"]] },
  { w: 4, t: "Changer de camp", tasks: [["Plaider pour, puis contre la même motion", "debat"], ["Utiliser au moins une concession", "debat"], ["Relire le cours sur la concession", "cours"]] },
  { w: 4, t: "Répondre aux questions", tasks: [["Lire le cours « Répondre aux questions »", "cours"], ["Faire une interview média simulée", "entretien"], ["Réécouter vos réponses", "entretien"]] },
  { w: 4, t: "L'entretien", tasks: [["Faire une simulation d'entretien d'embauche", "entretien"], ["Préparer votre présentation en 1 minute", "atelier"], ["Lire le cours « Parler en visioconférence »", "cours"]] },
  { w: 4, t: "Le pitch", tasks: [["Préparer un pitch Problème-Solution-Bénéfice", "atelier"], ["Le répéter au téléprompteur", "lecture"], ["Le prononcer sans notes", "discours"]] },
  { w: 4, t: "Répétition générale", tasks: [["Échauffement vocal complet", "souffle"], ["3 virelangues difficiles", "articulation"], ["Discours de 3 minutes sur le sujet de votre choix", "discours"]] },
  // Finale
  { w: 5, t: "Le grand oral", tasks: [["Cohérence cardiaque 3 minutes", "souffle"], ["Simulation d'oral d'examen complète", "entretien"], ["Comparer avec vos débuts", "progression"]] },
  { w: 5, t: "Et maintenant ?", tasks: [["Refaire votre présentation du jour 1", "discours"], ["Mesurer vos progrès dans Progression", "progression"], ["Choisir votre prochain défi de prise de parole réel", "atelier"]] },
];

const PROGRAM_WEEKS = { 1: "Semaine 1 · Les fondations", 2: "Semaine 2 · La voix", 3: "Semaine 3 · La structure", 4: "Semaine 4 · La persuasion", 5: "Finale" };
