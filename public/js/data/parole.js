/* Contenus pour la prise de parole : débat, entretien, récit, jeux. */

const MOTIONS = [
  "Les réseaux sociaux font plus de mal que de bien.",
  "Il faut instaurer un revenu universel.",
  "L'école devrait commencer plus tard le matin.",
  "Les voitures devraient être interdites en centre-ville.",
  "Le télétravail devrait devenir la norme.",
  "Il faut interdire la publicité destinée aux enfants.",
  "Les jeux vidéo sont une forme d'art.",
  "Le droit de vote devrait être accordé dès 16 ans.",
  "Il vaut mieux être généraliste que spécialiste.",
  "Les zoos devraient être fermés.",
  "L'uniforme scolaire devrait être obligatoire.",
  "Il faut taxer davantage les billets d'avion.",
  "Les notes à l'école devraient être supprimées.",
  "L'intelligence artificielle doit être strictement encadrée.",
  "Le tourisme de masse devrait être limité.",
  "Tout le monde devrait apprendre à coder.",
  "Les sportifs professionnels sont trop payés.",
  "La semaine de quatre jours devrait être généralisée.",
  "Il faut privilégier les produits locaux, même plus chers.",
  "Les smartphones devraient être interdits avant 15 ans.",
  "Le mensonge est parfois nécessaire.",
  "Les musées devraient être gratuits pour tous.",
  "Mieux vaut un bon compromis qu'une victoire totale.",
  "Le service civique devrait être obligatoire.",
  "Les livres papier ont encore de l'avenir.",
  "Il faut apprendre la prise de parole dès l'école primaire.",
  "La célébrité est un fardeau plus qu'une chance.",
  "Les villes doivent laisser plus de place à la nature qu'aux parkings.",
];

const ARGUMENT_TYPES = [
  { n: "Par l'exemple", d: "Un cas concret, une anecdote, un fait vécu." },
  { n: "Par les chiffres", d: "Une statistique, un ordre de grandeur, une comparaison chiffrée." },
  { n: "Par les conséquences", d: "« Si l'on fait cela, alors… » : montrez ce qui en découle." },
  { n: "Par l'analogie", d: "Comparez avec une situation connue pour rendre l'idée évidente." },
  { n: "D'autorité", d: "Appuyez-vous sur un expert, une institution, une étude reconnue." },
  { n: "Par les valeurs", d: "Justice, liberté, égalité, respect : invoquez un principe partagé." },
];

const REFUTATIONS = [
  { s: "Les jeunes ne lisent plus.", h: "Questionnez la généralisation : de quels jeunes parle-t-on ? Et que lisent-ils sur écran ?" },
  { s: "Le télétravail rend les gens paresseux.", h: "Demandez des preuves et proposez un contre-exemple." },
  { s: "C'était mieux avant.", h: "Précisez « avant » : quand, pour qui ? Opposez des progrès concrets." },
  { s: "L'argent ne fait pas le bonheur.", h: "Nuancez : l'argent ne suffit pas, mais son absence pèse lourdement." },
  { s: "Les écrans rendent bête.", h: "Distinguez l'outil de l'usage : quels écrans, pour quoi faire, combien de temps ?" },
  { s: "Parler en public, c'est un don : on l'a ou on ne l'a pas.", h: "Contre-exemples d'orateurs qui ont appris, et rôle de l'entraînement." },
  { s: "Il faut toujours suivre son instinct.", h: "Montrez les limites de l'intuition et l'intérêt de la réflexion." },
  { s: "Les voyages forment la jeunesse, donc tout le monde devrait voyager loin.", h: "Attaquez le lien logique : la conclusion découle-t-elle vraiment du principe ?" },
  { s: "Si on autorise ça, bientôt tout sera permis.", h: "Dénoncez la pente glissante : rien ne prouve l'enchaînement annoncé." },
  { s: "Tout le monde le fait, donc c'est normal.", h: "Le nombre ne fait pas la raison : relevez l'argument de la majorité." },
  { s: "Les experts se trompent tout le temps, autant ne pas les écouter.", h: "Opposez la fréquence des erreurs à celle des réussites, et l'alternative proposée." },
  { s: "Le sport à la télévision, ce n'est pas du vrai sport.", h: "Définissez les termes : qu'est-ce que le « vrai » sport ?" },
  { s: "L'intelligence artificielle va remplacer tous les métiers.", h: "Nuancez « tous » et distinguez tâches et métiers." },
  { s: "Les réunions sont une perte de temps.", h: "Concédez une part de vérité, puis montrez les conditions d'une réunion utile." },
  { s: "On ne change pas une équipe qui gagne.", h: "Montrez qu'un succès passé ne garantit pas l'avenir." },
];

const REFUTATION_TECHNIQUES = [
  "Demander des preuves",
  "Trouver un contre-exemple",
  "Nuancer une généralisation",
  "Redéfinir les termes",
  "Concéder puis retourner l'argument",
  "Montrer une faille logique",
];

const INTERVIEWS = {
  embauche: {
    name: "Entretien d'embauche",
    icon: "💼",
    q: [
      { q: "Présentez-vous.", tip: "Deux minutes maximum : parcours, compétences clés, et pourquoi vous êtes là. Finissez sur le poste visé." },
      { q: "Pourquoi voulez-vous ce poste ?", tip: "Reliez vos motivations à la mission et à l'entreprise, avec un élément précis." },
      { q: "Quelles sont vos principales qualités ?", tip: "Trois qualités maximum, chacune illustrée par un exemple concret." },
      { q: "Quel est votre plus grand défaut ?", tip: "Un vrai défaut, non rédhibitoire, et ce que vous faites pour le corriger." },
      { q: "Parlez-moi d'un échec et de ce que vous en avez appris.", tip: "Méthode STAR : Situation, Tâche, Action, Résultat, puis la leçon tirée." },
      { q: "Où vous voyez-vous dans cinq ans ?", tip: "Montrez de l'ambition cohérente avec le poste, sans sembler déjà partir." },
      { q: "Pourquoi devrions-nous vous choisir plutôt qu'un autre candidat ?", tip: "Votre valeur ajoutée unique, en une phrase forte, puis une preuve." },
      { q: "Racontez une situation où vous avez géré un conflit.", tip: "Restez factuel, montrez votre écoute et la solution trouvée." },
      { q: "Qu'est-ce qui vous motive au quotidien ?", tip: "Soyez sincère et concret : un moteur réel, relié au travail." },
      { q: "Avez-vous des questions à nous poser ?", tip: "Toujours oui : posez une question sur l'équipe, les défis ou les priorités du poste." },
    ],
  },
  oral: {
    name: "Oral d'examen / Grand oral",
    icon: "🎓",
    q: [
      { q: "Présentez votre sujet et votre problématique en deux minutes.", tip: "Accroche, problématique claire, annonce du plan." },
      { q: "Pourquoi avez-vous choisi ce sujet ?", tip: "Un lien personnel sincère, puis l'intérêt intellectuel du sujet." },
      { q: "Pouvez-vous définir le terme central de votre sujet ?", tip: "Définition précise, éventuellement étymologie, puis application au sujet." },
      { q: "Quelle est la principale limite de votre raisonnement ?", tip: "Reconnaître une limite montre votre recul : nommez-la et proposez une piste." },
      { q: "Quel exemple concret illustre le mieux votre propos ?", tip: "Un exemple précis, daté, sourcé si possible." },
      { q: "Comment ce sujet se relie-t-il à votre projet d'avenir ?", tip: "Faites le pont entre le sujet, vos études et votre orientation." },
      { q: "Si vous deviez retenir une seule idée de votre exposé, laquelle serait-ce ?", tip: "Une phrase claire, mémorable, qui résume votre thèse." },
    ],
  },
  media: {
    name: "Interview média",
    icon: "🎤",
    q: [
      { q: "Pouvez-vous résumer votre projet en une phrase ?", tip: "Une phrase simple, sans jargon, compréhensible par un enfant de 12 ans." },
      { q: "Qu'est-ce qui vous distingue des autres ?", tip: "Un élément différenciant fort, illustré par un fait." },
      { q: "Que répondez-vous à ceux qui vous critiquent ?", tip: "Restez calme : reconnaissez la critique, puis recentrez sur votre message." },
      { q: "Quel a été le moment le plus difficile ?", tip: "Racontez brièvement, avec une émotion sincère, puis ce qui vous a fait tenir." },
      { q: "Quelle est la prochaine étape ?", tip: "Concrète et datée si possible : donnez envie de suivre la suite." },
      { q: "Un dernier mot pour ceux qui nous écoutent ?", tip: "Votre message clé, reformulé, avec un appel à l'action." },
    ],
  },
  pro: {
    name: "Réunion & management",
    icon: "📊",
    q: [
      { q: "Présentez l'avancement de votre projet.", tip: "Où en est-on, ce qui va bien, ce qui bloque, ce dont vous avez besoin." },
      { q: "Annoncez une mauvaise nouvelle à votre équipe.", tip: "Allez droit au fait, expliquez pourquoi, puis ce qui va se passer ensuite." },
      { q: "Défendez votre budget devant la direction.", tip: "Chiffres clés, retour attendu, risques si l'on ne fait rien." },
      { q: "Faites un retour constructif à un collègue.", tip: "Faits observés, impact, puis proposition : restez bienveillant et précis." },
      { q: "Remerciez l'équipe pour un succès.", tip: "Soyez précis sur ce qui a été accompli et par qui ; évitez les généralités." },
      { q: "Ouvrez une réunion en une minute.", tip: "Objectif, ordre du jour, durée, et ce que l'on doit avoir décidé à la fin." },
    ],
  },
};

const STORY_CARDS = {
  personnage: ["une vieille horlogère", "un pompier timide", "une enfant de huit ans", "un robot jardinier", "un chef cuisinier distrait", "une astronaute retraitée", "un facteur curieux", "une pianiste insomniaque", "un chat qui parle", "un détective myope", "une championne d'échecs", "un marchand de glaces", "une exploratrice", "un magicien raté", "un gardien de musée"],
  lieu: ["dans un train de nuit", "au sommet d'un phare", "dans une bibliothèque abandonnée", "sur une île minuscule", "dans un ascenseur en panne", "au marché du dimanche", "dans une station spatiale", "au fond d'une forêt", "dans une salle d'attente", "sur un bateau de pêche", "dans une école vide", "au milieu d'un embouteillage", "dans un grenier", "sur une piste de ski", "dans un cirque"],
  objet: ["une clé rouillée", "une lettre jamais envoyée", "un parapluie jaune", "une boussole cassée", "un carnet de recettes", "une photo déchirée", "un ticket de loterie", "une boîte à musique", "un vieux téléphone", "une carte au trésor", "une paire de lunettes", "un œuf doré", "une valise oubliée", "une plume", "un bocal de billes"],
  probleme: ["mais tout le monde a perdu la mémoire", "mais il ne reste qu'une heure", "mais une tempête approche", "mais personne ne la croit", "mais la porte ne s'ouvre plus", "mais un secret risque d'être révélé", "mais il faut choisir entre deux amis", "mais l'électricité est coupée", "mais c'est le jour de son anniversaire", "mais un inconnu la suit", "mais la parole est interdite", "mais tout est à l'envers", "mais le temps s'arrête", "mais il pleut depuis cent jours", "mais le chemin a disparu"],
};

const STORY_STEPS = [
  ["Situation initiale", "Qui ? Où ? Quand ? Posez le décor en deux phrases."],
  ["Élément déclencheur", "« Mais un jour… » : ce qui vient tout bouleverser."],
  ["Péripéties", "Les obstacles, les tentatives, la tension qui monte."],
  ["Dénouement", "Le moment décisif qui résout le problème."],
  ["Situation finale", "Ce qui a changé. Terminez par une image ou une morale."],
];

const TABOO = [
  { w: "Parapluie", f: ["pluie", "ouvrir", "eau", "protéger"] },
  { w: "Boulangerie", f: ["pain", "croissant", "baguette", "magasin"] },
  { w: "Vacances", f: ["été", "plage", "repos", "voyage"] },
  { w: "Téléphone", f: ["appeler", "portable", "écran", "sonner"] },
  { w: "Bibliothèque", f: ["livre", "lire", "emprunter", "silence"] },
  { w: "Anniversaire", f: ["gâteau", "bougie", "fête", "âge"] },
  { w: "Soleil", f: ["chaud", "ciel", "lumière", "étoile"] },
  { w: "Médecin", f: ["malade", "soigner", "hôpital", "docteur"] },
  { w: "Football", f: ["ballon", "but", "équipe", "match"] },
  { w: "Cinéma", f: ["film", "écran", "salle", "acteur"] },
  { w: "Montagne", f: ["ski", "neige", "haut", "sommet"] },
  { w: "Chocolat", f: ["cacao", "sucré", "brun", "dessert"] },
  { w: "Train", f: ["gare", "rail", "voyage", "wagon"] },
  { w: "Orateur", f: ["parler", "discours", "public", "éloquence"] },
  { w: "Musée", f: ["art", "tableau", "exposition", "visite"] },
  { w: "Réveil", f: ["matin", "sonner", "heure", "dormir"] },
  { w: "Cuisine", f: ["manger", "recette", "repas", "plat"] },
  { w: "Pompier", f: ["feu", "incendie", "camion", "eau"] },
  { w: "Jardin", f: ["fleur", "plante", "herbe", "arroser"] },
  { w: "Mariage", f: ["épouser", "amour", "robe", "cérémonie"] },
  { w: "Ordinateur", f: ["écran", "clavier", "internet", "souris"] },
  { w: "Hiver", f: ["froid", "neige", "saison", "décembre"] },
  { w: "Avion", f: ["voler", "aéroport", "pilote", "ciel"] },
  { w: "Professeur", f: ["école", "enseigner", "élève", "classe"] },
  { w: "Café", f: ["boire", "tasse", "noir", "matin"] },
  { w: "Piscine", f: ["nager", "eau", "maillot", "plonger"] },
  { w: "Pizza", f: ["italie", "fromage", "four", "tomate"] },
  { w: "Guitare", f: ["musique", "cordes", "jouer", "instrument"] },
  { w: "Hôpital", f: ["malade", "médecin", "soins", "urgences"] },
  { w: "Élection", f: ["voter", "candidat", "urne", "président"] },
];

const RANDOM_WORDS = [
  "parapluie", "girafe", "volcan", "bicyclette", "horloge", "trésor", "nuage", "violon", "sandwich", "fusée",
  "citron", "dragon", "boussole", "miroir", "pyramide", "chaussette", "tempête", "pingouin", "lanterne", "cactus",
  "sous-marin", "crocodile", "grenier", "confiture", "château", "satellite", "escargot", "trompette", "cerf-volant", "marmite",
  "papillon", "igloo", "locomotive", "ananas", "phare", "moustache", "labyrinthe", "parachute", "carrosse", "tortue",
  "brouillard", "accordéon", "dinosaure", "éventail", "sablier", "hibou", "gondole", "arc-en-ciel", "télescope", "citrouille",
];

const MINUTE_SUBJECTS = [
  "les chaussures", "la pluie", "le petit-déjeuner", "les voisins", "la lune", "le silence", "les clés", "le dimanche",
  "les chats", "la mer", "le métro", "les cadeaux", "le chocolat", "la patience", "les vacances", "le téléphone",
  "les montagnes", "la musique", "les files d'attente", "le courage", "les rêves", "la cuisine", "le vent", "l'amitié",
  "les livres", "la politesse", "l'hiver", "les photos", "le jardin", "les secrets",
];

const ALPHABET_TOPICS = [
  "Votre journée idéale", "Les vacances", "La ville où vous vivez", "L'école", "Le sport", "La cuisine", "Les voyages", "Le travail",
];
