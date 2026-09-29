/* Cours : fiches pratiques de prise de parole. */

const LESSONS = [
  {
    id: "trac", icon: "😰", title: "Apprivoiser le trac",
    intro: "Le trac n'est pas un ennemi : c'est de l'énergie. Presque tous les orateurs le ressentent. L'objectif n'est pas de le supprimer, mais de le canaliser.",
    points: [
      ["Comprendre ce qui se passe", "Cœur qui bat, mains moites, bouche sèche : c'est l'adrénaline, une réaction normale face à un enjeu. Votre corps se prépare à être performant."],
      ["Préparer, encore et toujours", "La meilleure arme contre le trac est la maîtrise de son sujet. Connaissez par cœur votre accroche et votre conclusion : ce sont les moments les plus stressants."],
      ["Respirer par le ventre", "Avant de parler, faites une minute de cohérence cardiaque (5 secondes d'inspiration, 5 d'expiration). Le rythme cardiaque ralentit, les pensées s'apaisent."],
      ["Changer son regard", "Remplacez « j'ai peur » par « je suis prêt, j'ai de l'énergie ». Le public est de votre côté : il veut que vous réussissiez."],
      ["Commencer par un ancrage", "Avant la première phrase : posez les pieds, respirez, regardez le public, souriez. Ces trois secondes de silence vous installent."],
    ],
    exercise: { t: "Faites un cycle de cohérence cardiaque de 2 minutes, puis présentez-vous en une minute.", view: "souffle" },
    quiz: [
      { q: "Quel est le meilleur moment pour mémoriser mot à mot ?", o: ["L'accroche et la conclusion", "Tout le discours", "Rien du tout"], a: 0, why: "Ce sont les moments les plus stressants : les connaître par cœur sécurise." },
      { q: "Le trac est…", o: ["Une énergie à canaliser", "Un signe d'incompétence", "Rare chez les bons orateurs"], a: 0, why: "Même les orateurs expérimentés le ressentent." },
    ],
  },
  {
    id: "respiration", icon: "🌬️", title: "Respirer pour parler",
    intro: "La voix est un souffle sonorisé. Sans respiration maîtrisée, la voix tremble, s'essouffle et les fins de phrases s'effondrent.",
    points: [
      ["La respiration abdominale", "Inspirez par le nez en gonflant le ventre, pas la poitrine. Les épaules restent immobiles. C'est la respiration naturelle d'un bébé qui dort."],
      ["Le soutien", "En parlant, le ventre rentre doucement et régulièrement, comme un soufflet. C'est lui qui porte la voix, pas la gorge."],
      ["Respirer aux ponctuations", "Profitez des virgules et des points pour reprendre de l'air. Une phrase ne doit jamais se terminer à bout de souffle."],
      ["Allonger l'expiration", "Entraînez-vous à expirer sur un « sss » régulier pendant 20 secondes : vous gagnerez en contrôle sur les phrases longues."],
    ],
    exercise: { t: "Faites l'exercice « Souffle long » : visez 20 secondes de « sss » régulier.", view: "souffle" },
    quiz: [
      { q: "En respiration abdominale, qu'est-ce qui bouge à l'inspiration ?", o: ["Le ventre", "Les épaules", "La poitrine uniquement"], a: 0, why: "Le diaphragme descend et le ventre se gonfle." },
      { q: "Quand reprendre son souffle ?", o: ["Aux ponctuations", "Au milieu des mots", "Seulement à la fin"], a: 0, why: "Les ponctuations sont des pauses naturelles." },
    ],
  },
  {
    id: "posture", icon: "🧍", title: "Posture et ancrage",
    intro: "Avant même votre premier mot, votre corps parle. Une posture stable inspire confiance, à vous comme à votre public.",
    points: [
      ["Les pieds ancrés", "Pieds écartés à la largeur du bassin, poids réparti sur les deux jambes. Évitez de vous balancer ou de croiser les jambes."],
      ["Le dos droit, sans raideur", "Imaginez un fil qui vous tire doucement vers le haut par le sommet du crâne. Épaules relâchées, menton parallèle au sol."],
      ["Occuper l'espace", "Si vous vous déplacez, faites-le avec intention : un pas vers le public pour une idée forte, puis immobilité pendant que vous parlez."],
      ["Les mains visibles", "Gardez les mains à hauteur de la taille, visibles, prêtes à accompagner vos propos. Évitez les poches et les bras croisés."],
    ],
    exercise: { t: "Enregistrez-vous 1 minute debout, bien ancré, sur un sujet d'improvisation.", view: "impro" },
    quiz: [
      { q: "Où placer ses mains par défaut ?", o: ["À hauteur de la taille, visibles", "Dans les poches", "Croisées sur la poitrine"], a: 0, why: "Des mains visibles inspirent confiance et facilitent les gestes." },
    ],
  },
  {
    id: "regard", icon: "👀", title: "Le regard",
    intro: "Le regard crée le lien. Un orateur qui regarde son public donne l'impression de parler à chacun.",
    points: [
      ["Balayer la salle", "Répartissez votre regard dans toute la salle : gauche, centre, droite, devant, fond. Personne ne doit se sentir oublié."],
      ["Une idée, une personne", "Posez votre regard 2 à 3 secondes sur une personne le temps d'une phrase, puis passez à une autre."],
      ["Les notes, un simple appui", "Regardez vos notes, prenez l'idée, relevez la tête, puis parlez. Ne parlez jamais en regardant vos feuilles."],
      ["En visio", "Regardez la caméra, pas l'écran : c'est ainsi que votre interlocuteur se sent regardé."],
    ],
    exercise: { t: "Lisez un texte au téléprompteur en levant les yeux à chaque pause.", view: "lecture" },
    quiz: [
      { q: "Combien de temps garder le regard sur une personne ?", o: ["2 à 3 secondes", "Moins d'une demi-seconde", "Tout le discours"], a: 0, why: "Assez pour créer un lien, sans mettre mal à l'aise." },
    ],
  },
  {
    id: "gestes", icon: "🙌", title: "Les gestes",
    intro: "Les gestes illustrent, soulignent et rythment le discours. Bien utilisés, ils rendent vos idées visibles.",
    points: [
      ["Des gestes ouverts", "Paumes visibles, gestes orientés vers le public : ils expriment l'ouverture et la sincérité."],
      ["Des gestes qui illustrent", "Comptez sur vos doigts pour une énumération, écartez les mains pour une idée de grandeur, montrez le passé derrière vous et l'avenir devant."],
      ["Éviter les gestes parasites", "Stylo tripoté, mèche de cheveux, bague qu'on tourne : ces gestes trahissent le stress et distraient."],
      ["Laisser venir naturellement", "Ne plaquez pas des gestes appris : ils naissent d'eux-mêmes quand on est engagé dans ce qu'on dit."],
    ],
    exercise: { t: "Racontez une histoire en 2 minutes en vous autorisant de grands gestes.", view: "histoire" },
    quiz: [
      { q: "Lequel de ces gestes est parasite ?", o: ["Tripoter son stylo", "Compter sur ses doigts", "Ouvrir les mains"], a: 0, why: "Il n'illustre rien et trahit la nervosité." },
    ],
  },
  {
    id: "voix", icon: "🔊", title: "La voix : volume, débit, hauteur",
    intro: "La voix est votre instrument. Trois réglages principaux permettent de la rendre vivante : le volume, le débit et la hauteur.",
    points: [
      ["Le volume", "Parlez pour la dernière rangée. Un volume suffisant montre votre assurance. Baissez parfois la voix pour créer une confidence et capter l'attention."],
      ["Le débit", "Entre 120 et 160 mots par minute. Ralentissez sur les idées importantes et les chiffres, accélérez légèrement sur les transitions."],
      ["La hauteur", "Variez la mélodie : une voix monocorde endort. Montez sur les questions, descendez en fin d'affirmation."],
      ["L'accentuation", "Appuyez sur les mots clés : « Ce n'est pas UN problème, c'est LE problème. » L'accent guide l'écoute."],
    ],
    exercise: { t: "Mesurez l'étendue de votre voix avec l'analyseur de voix.", view: "voix" },
    quiz: [
      { q: "Pour une affirmation assurée, la fin de phrase…", o: ["Descend", "Monte", "Reste identique"], a: 0, why: "Une fin qui monte sonne comme une question." },
      { q: "Quel débit est généralement confortable ?", o: ["120 à 160 mots/min", "60 à 80 mots/min", "200 à 250 mots/min"], a: 0, why: "C'est la zone de confort pour l'auditoire." },
    ],
  },
  {
    id: "articuler", icon: "👄", title: "Articuler",
    intro: "Bien articuler, c'est être compris sans effort. La moitié de l'intelligibilité se perd avec la distance, le bruit et le stress.",
    points: [
      ["Ouvrir la bouche", "Les voyelles se forment avec la bouche ouverte. Exagérez à l'entraînement : en situation, il en restera juste ce qu'il faut."],
      ["Soigner les consonnes", "Ce sont elles qui rendent les mots intelligibles, surtout en fin de mot : « parc », « sept », « net »."],
      ["S'échauffer", "Virelangues, « pa-ta-ka », stylo entre les dents : quelques minutes suffisent pour réveiller lèvres, langue et mâchoire."],
      ["Ne pas avaler les syllabes", "« Chais pas » devient « je ne sais pas » ; « p'têt » devient « peut-être ». À l'oral formel, chaque syllabe compte."],
    ],
    exercise: { t: "Réussissez trois virelangues de niveau moyen à plus de 90 %.", view: "articulation" },
    quiz: [
      { q: "À quoi sert l'exercice du stylo entre les dents ?", o: ["Forcer les articulateurs à travailler plus", "Détendre la gorge", "Travailler le regard"], a: 0, why: "La contrainte oblige lèvres et langue à redoubler d'effort." },
    ],
  },
  {
    id: "pause", icon: "⏸️", title: "La pause et le silence",
    intro: "Le silence fait peur, et pourtant c'est l'outil le plus puissant de l'orateur. Une pause bien placée vaut mieux que dix mots.",
    points: [
      ["La pause avant", "Avant une idée forte, marquez un temps : l'auditoire se tend, attentif."],
      ["La pause après", "Après une idée importante, laissez-la résonner une ou deux secondes : elle a le temps d'être comprise."],
      ["Remplacer les « euh »", "Chaque fois que vous sentez venir un « euh », taisez-vous simplement. Le silence paraît assuré, le « euh » paraît hésitant."],
      ["La bonne durée", "De une à trois secondes. Au-delà, on semble chercher ses mots, sauf effet dramatique volontaire."],
    ],
    exercise: { t: "Jouez à « Une minute sans hésiter » : zéro tic, des pauses à la place.", view: "jeux" },
    quiz: [
      { q: "Que faire quand un « euh » arrive ?", o: ["Se taire un instant", "Enchaîner plus vite", "Dire « du coup »"], a: 0, why: "Le silence est plus élégant et plus assuré." },
    ],
  },
  {
    id: "structure", icon: "🏗️", title: "Structurer son discours",
    intro: "Un discours structuré est facile à suivre et à retenir. Le public doit toujours savoir où il est et où il va.",
    points: [
      ["Un seul message clé", "Si le public ne devait retenir qu'une phrase, laquelle ? Tout le discours doit servir ce message."],
      ["Trois parties", "Introduction, développement en deux ou trois idées, conclusion. La règle de trois est naturellement mémorable."],
      ["Annoncer le plan", "« Je vais vous parler de trois choses : … » Le public se repère et se détend."],
      ["Des transitions claires", "« Nous avons vu… voyons maintenant… » Les transitions sont les panneaux indicateurs du discours."],
      ["Les structures types", "PREP (Position, Raison, Exemple, Position), Problème-Solution-Bénéfice, Passé-Présent-Futur."],
    ],
    exercise: { t: "Construisez votre prochain discours dans l'atelier de préparation.", view: "atelier" },
    quiz: [
      { q: "Que signifie PREP ?", o: ["Position, Raison, Exemple, Position", "Plan, Résumé, Exemple, Pause", "Problème, Réponse, Explication, Preuve"], a: 0, why: "Une structure simple pour donner son avis." },
      { q: "Combien d'idées principales viser ?", o: ["Deux ou trois", "Dix", "Une vingtaine"], a: 0, why: "Au-delà, le public ne retient plus rien." },
    ],
  },
  {
    id: "accroche", icon: "🪝", title: "Réussir son introduction",
    intro: "Vous avez environ trente secondes pour capter l'attention. Oubliez « Bonjour, je vais vous parler de… » : commencez fort.",
    points: [
      ["La question", "« Qui, dans cette salle, a déjà eu peur de prendre la parole ? »"],
      ["Le chiffre choc", "« Chaque jour, nous prononçons en moyenne plusieurs milliers de mots. Combien sont vraiment écoutés ? »"],
      ["L'anecdote", "« Il y a trois ans, j'étais sur une scène comme celle-ci, et j'ai tout oublié. »"],
      ["La citation", "Une phrase célèbre, courte, directement liée à votre sujet."],
      ["L'image", "« Imaginez… » : projetez le public dans une situation concrète."],
    ],
    exercise: { t: "Écrivez trois accroches différentes pour le même sujet dans l'atelier.", view: "atelier" },
    quiz: [
      { q: "Laquelle est une accroche efficace ?", o: ["« Imaginez que demain, votre voix disparaisse. »", "« Bonjour, alors euh, je vais parler de la voix. »", "« Je ne suis pas très à l'aise, désolé. »"], a: 0, why: "Elle projette immédiatement le public dans une situation." },
    ],
  },
  {
    id: "conclure", icon: "🎯", title: "Conclure avec impact",
    intro: "La conclusion est ce que le public retient le mieux. Ne la bâclez jamais, et ne finissez pas par « voilà, c'est tout ».",
    points: [
      ["Annoncer la fin", "« Pour conclure… » : le public se reconcentre."],
      ["Résumer", "Reprenez vos deux ou trois idées en une phrase chacune."],
      ["Revenir à l'accroche", "Faites écho à votre introduction : la boucle se referme, c'est très satisfaisant pour l'auditoire."],
      ["Appeler à l'action", "Que doit faire le public en sortant ? Soyez concret."],
      ["La dernière phrase", "Courte, forte, suivie d'un silence. Puis « Merci », sans vous précipiter."],
    ],
    exercise: { t: "Préparez une conclusion qui fait écho à votre accroche.", view: "atelier" },
    quiz: [
      { q: "Quelle fin éviter ?", o: ["« Voilà, c'est tout… »", "Un appel à l'action", "Un écho à l'introduction"], a: 0, why: "Elle affaiblit tout le discours." },
    ],
  },
  {
    id: "storytelling", icon: "📖", title: "Raconter une histoire",
    intro: "Les faits informent, les histoires marquent. Un récit active l'émotion et l'imagination : c'est l'outil de persuasion le plus ancien.",
    points: [
      ["Le schéma narratif", "Situation initiale, élément déclencheur, péripéties, dénouement, situation finale."],
      ["Un personnage", "Le public s'identifie à une personne, pas à une statistique. Donnez-lui un prénom, un désir, un obstacle."],
      ["Des détails concrets", "« Un mardi de novembre, sous une pluie fine » vaut mieux que « un jour »."],
      ["Le dialogue", "Faites parler vos personnages : le récit devient vivant."],
      ["La morale", "Reliez l'histoire à votre message : pourquoi l'avez-vous racontée ?"],
    ],
    exercise: { t: "Tirez des cartes et racontez une histoire de 2 minutes.", view: "histoire" },
    quiz: [
      { q: "Quelle est la deuxième étape du schéma narratif ?", o: ["L'élément déclencheur", "Le dénouement", "La morale"], a: 0, why: "Situation initiale, puis élément déclencheur." },
    ],
  },
  {
    id: "convaincre", icon: "⚖️", title: "Convaincre : ethos, pathos, logos",
    intro: "Aristote distinguait trois leviers de persuasion. Les grands discours combinent les trois.",
    points: [
      ["Ethos : la crédibilité", "Pourquoi vous écouter ? Votre expérience, votre sincérité, votre cohérence entre les paroles et les actes."],
      ["Pathos : l'émotion", "Touchez le public : histoires, images, valeurs partagées. L'émotion met en mouvement."],
      ["Logos : la raison", "Arguments, chiffres, exemples, raisonnement logique. La raison justifie la décision."],
      ["Anticiper les objections", "Répondez aux contre-arguments avant qu'on vous les oppose : « On pourrait me dire que… »"],
      ["La concession", "« Certes…, mais… » : reconnaître une part de vérité adverse renforce votre crédibilité."],
    ],
    exercise: { t: "Préparez et plaidez une motion dans la section Débat.", view: "debat" },
    quiz: [
      { q: "Le pathos, c'est…", o: ["L'appel aux émotions", "La crédibilité de l'orateur", "La logique des arguments"], a: 0, why: "Ethos = crédibilité, logos = raison." },
      { q: "« Certes…, mais… » est une…", o: ["Concession", "Hyperbole", "Anaphore"], a: 0, why: "On concède un point pour mieux affirmer le sien." },
    ],
  },
  {
    id: "questions", icon: "❓", title: "Répondre aux questions",
    intro: "Les questions sont une chance : elles montrent que le public est intéressé. Voici comment y répondre avec aisance.",
    points: [
      ["Écouter jusqu'au bout", "Ne coupez pas la parole, même si vous avez compris. Cela montre du respect."],
      ["Reformuler", "« Si je comprends bien, vous me demandez… » Vous gagnez du temps et tout le monde entend la question."],
      ["Répondre court", "Réponse directe d'abord, justification ensuite. Puis vérifiez : « Cela répond-il à votre question ? »"],
      ["Oser dire « je ne sais pas »", "« Je n'ai pas la réponse précise, je reviens vers vous. » L'honnêteté renforce la crédibilité."],
      ["Face à l'agressivité", "Restez calme, reconnaissez l'émotion, recentrez sur les faits."],
    ],
    exercise: { t: "Passez une simulation d'interview média.", view: "entretien" },
    quiz: [
      { q: "Pourquoi reformuler une question ?", o: ["Vérifier sa compréhension et gagner du temps", "Montrer qu'elle est mal posée", "Éviter d'y répondre"], a: 0, why: "Et tout le public entend la question." },
    ],
  },
  {
    id: "visio", icon: "💻", title: "Parler en visioconférence",
    intro: "En visio, l'énergie passe moins bien. Il faut compenser par la voix, le regard et une bonne installation.",
    points: [
      ["La caméra à hauteur des yeux", "Surélevez votre ordinateur. Cadrage : de la tête jusqu'au milieu du buste."],
      ["La lumière de face", "Une fenêtre ou une lampe devant vous, jamais derrière."],
      ["Regarder la caméra", "Surtout sur les phrases importantes : c'est le seul moyen de « regarder » l'autre dans les yeux."],
      ["Plus d'énergie", "Parlez un peu plus fort et plus expressivement qu'en face à face : l'écran aplatit tout."],
      ["Des phrases plus courtes", "Le décalage et la fatigue d'écran demandent un discours encore plus clair."],
    ],
    exercise: { t: "Faites une simulation d'entretien assis face à votre caméra.", view: "entretien" },
    quiz: [
      { q: "Où placer la source de lumière ?", o: ["Devant soi", "Derrière soi", "Au-dessus de la caméra, vers le mur"], a: 0, why: "Une lumière dans le dos vous transforme en silhouette." },
    ],
  },
  {
    id: "improviser", icon: "⚡", title: "Improviser sans paniquer",
    intro: "Improviser, ce n'est pas inventer à partir de rien : c'est appliquer des structures qu'on a en réserve.",
    points: [
      ["Gagner quelques secondes", "Reformulez le sujet, respirez, choisissez une structure. Le public ne perçoit pas ces trois secondes comme un vide."],
      ["Avoir des structures prêtes", "PREP, Passé-Présent-Futur, Problème-Solution-Bénéfice : choisissez-en une et suivez-la."],
      ["Partir du concret", "Une anecdote personnelle est toujours disponible et facile à raconter."],
      ["Accepter l'imperfection", "Une improvisation n'a pas besoin d'être parfaite, seulement claire et sincère."],
      ["Finir proprement", "Revenez à votre idée de départ et terminez par une phrase courte. Puis taisez-vous."],
    ],
    exercise: { t: "Tirez un sujet d'improvisation et parlez 1 minute.", view: "impro" },
    quiz: [
      { q: "Quel est le meilleur réflexe face à un sujet imprévu ?", o: ["Choisir une structure connue", "Parler tout de suite très vite", "Refuser le sujet"], a: 0, why: "La structure guide la pensée." },
    ],
  },
];
