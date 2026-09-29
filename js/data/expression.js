/* Contenus pour l'expression : connecteurs, quiz, citations. */

const CONNECTEURS = [
  { f: "Ajouter", w: ["de plus", "en outre", "par ailleurs", "qui plus est", "de surcroît"] },
  { f: "Opposer", w: ["cependant", "néanmoins", "toutefois", "en revanche", "pourtant", "or"] },
  { f: "Concéder", w: ["certes", "bien que", "il est vrai que", "même si", "quoique"] },
  { f: "Expliquer (cause)", w: ["car", "en effet", "puisque", "étant donné que", "dans la mesure où"] },
  { f: "Conclure (conséquence)", w: ["donc", "ainsi", "par conséquent", "c'est pourquoi", "dès lors"] },
  { f: "Illustrer", w: ["par exemple", "notamment", "à l'image de", "comme en témoigne", "prenons le cas de"] },
  { f: "Ordonner", w: ["tout d'abord", "ensuite", "puis", "enfin", "d'une part… d'autre part"] },
  { f: "Résumer", w: ["en somme", "en définitive", "pour conclure", "en un mot", "bref"] },
];

const CONNECTEUR_QUIZ = [
  { q: "Il pleuvait à verse. ___, nous sommes sortis nous promener.", o: ["Pourtant", "Donc", "Car", "Par exemple"], a: 0, why: "Opposition : on sort malgré la pluie." },
  { q: "Ce projet est rentable. ___, il crée des emplois.", o: ["De plus", "Cependant", "Car", "Bien que"], a: 0, why: "On ajoute un second argument dans le même sens." },
  { q: "Il a été retenu ___ il avait le meilleur dossier.", o: ["car", "pourtant", "ensuite", "certes"], a: 0, why: "Cause : le meilleur dossier explique la sélection." },
  { q: "Les ventes ont chuté de 30 %. ___, nous devons revoir notre stratégie.", o: ["Par conséquent", "Néanmoins", "Par exemple", "Certes"], a: 0, why: "Conséquence logique de la chute des ventes." },
  { q: "___ la méthode est coûteuse, elle reste la plus efficace.", o: ["Certes,", "Donc", "Ainsi", "Car"], a: 0, why: "Concession : on reconnaît un défaut avant d'affirmer l'essentiel." },
  { q: "Beaucoup de villes innovent ; ___, Copenhague a fait du vélo la norme.", o: ["par exemple", "en revanche", "donc", "bien que"], a: 0, why: "Illustration par un cas concret." },
  { q: "Le produit est innovant. ___, son prix risque de freiner les ventes.", o: ["Toutefois", "De plus", "En effet", "Ainsi"], a: 0, why: "On nuance l'idée précédente." },
  { q: "___, je présenterai le contexte ; ensuite, les solutions.", o: ["Tout d'abord", "Enfin", "Pourtant", "Or"], a: 0, why: "Premier élément d'une énumération ordonnée." },
  { q: "Il faut agir vite. ___, chaque mois de retard coûte cher.", o: ["En effet", "Cependant", "Certes", "Bref"], a: 0, why: "« En effet » introduit une justification." },
  { q: "Tout le monde attendait une baisse ; ___, les prix ont augmenté.", o: ["or", "donc", "de plus", "par exemple"], a: 0, why: "« Or » introduit un fait qui contredit l'attente." },
  { q: "Nous avons parlé du budget, du calendrier et de l'équipe. ___, le projet est prêt.", o: ["En somme", "Pourtant", "Car", "Par ailleurs"], a: 0, why: "On résume avant de conclure." },
  { q: "Il n'est pas venu, ___ il ait été prévenu.", o: ["bien qu'", "parce qu'", "donc", "puisqu'"], a: 0, why: "« Bien que » marque la concession et se construit avec le subjonctif." },
];

const TRUE_FALSE = [
  { s: "Il faut éviter tout silence pendant un discours.", a: false, why: "Les pauses donnent du poids aux idées et laissent le temps de comprendre." },
  { s: "Le trac diminue avec la préparation et la répétition.", a: true, why: "Plus on maîtrise son contenu, moins l'incertitude nourrit le stress." },
  { s: "Regarder toujours la même personne rassure l'auditoire.", a: false, why: "Balayez la salle et arrêtez-vous quelques secondes sur différentes personnes." },
  { s: "On retient mieux le début et la fin d'un discours.", a: true, why: "Ce sont les effets de primauté et de récence : soignez l'accroche et la conclusion." },
  { s: "Lire ses notes mot à mot rend le discours plus vivant.", a: false, why: "La lecture coupe le contact visuel ; préférez des mots clés." },
  { s: "Un débit de 120 à 160 mots par minute est généralement confortable.", a: true, why: "C'est la zone où l'auditoire suit sans effort." },
  { s: "Croiser les bras donne une image ouverte et accessible.", a: false, why: "C'est souvent perçu comme une fermeture ; gardez les mains visibles." },
  { s: "Une histoire personnelle aide à capter l'attention.", a: true, why: "Le récit crée de l'émotion et de l'identification." },
  { s: "Il vaut mieux développer dix idées que trois.", a: false, why: "Trois idées fortes sont bien plus mémorables que dix survolées." },
  { s: "Boire de l'eau glacée juste avant de parler est idéal pour la voix.", a: false, why: "Préférez l'eau à température ambiante, plus douce pour les cordes vocales." },
  { s: "La règle de trois rend un message plus mémorable.", a: true, why: "Le rythme ternaire est naturellement équilibré et facile à retenir." },
  { s: "Répéter à voix haute est plus efficace que relire son texte en silence.", a: true, why: "La voix, le souffle et le rythme ne se travaillent qu'en parlant." },
  { s: "S'excuser d'être stressé en début de discours aide toujours.", a: false, why: "Cela attire l'attention sur le stress ; le public ne le remarque souvent même pas." },
  { s: "Baisser la voix en fin de phrase affirmative donne de l'assurance.", a: true, why: "Une fin de phrase qui monte sonne comme une question ou un doute." },
  { s: "Les gestes distraient toujours l'auditoire.", a: false, why: "Des gestes ouverts et en lien avec le propos renforcent le message." },
  { s: "Sourire s'entend, même au téléphone.", a: true, why: "Le sourire modifie la résonance de la voix et la rend plus chaleureuse." },
  { s: "Il faut apprendre son discours par cœur, mot pour mot.", a: false, why: "Mémorisez le plan, l'accroche et la conclusion ; le reste gagne à rester naturel." },
  { s: "En visioconférence, il faut regarder la caméra plutôt que l'écran.", a: true, why: "C'est ce qui donne à l'interlocuteur l'impression d'être regardé." },
];

const QUOTES = [
  { t: "Ce que l'on conçoit bien s'énonce clairement, et les mots pour le dire arrivent aisément.", a: "Nicolas Boileau, L'Art poétique" },
  { t: "La vraie éloquence se moque de l'éloquence.", a: "Blaise Pascal, Pensées" },
  { t: "L'éloquence est une peinture de la pensée.", a: "Blaise Pascal, Pensées" },
  { t: "Le style est l'homme même.", a: "Buffon, Discours sur le style" },
  { t: "La clarté est la politesse de l'homme de lettres.", a: "Jules Renard, Journal" },
  { t: "Car le mot, qu'on le sache, est un être vivant.", a: "Victor Hugo, Les Contemplations" },
  { t: "Il faut tourner sept fois sa langue dans sa bouche avant de parler.", a: "Proverbe" },
  { t: "La parole est d'argent, mais le silence est d'or.", a: "Proverbe" },
  { t: "Les paroles s'envolent, les écrits restent.", a: "Proverbe latin" },
  { t: "Nous avons deux oreilles et une seule bouche, pour écouter deux fois plus que nous ne parlons.", a: "Attribuée à Zénon de Kition" },
  { t: "Soyez sincère, soyez bref, soyez assis.", a: "Attribuée à Franklin D. Roosevelt" },
  { t: "Ce n'est pas assez d'avoir l'esprit bon, mais le principal est de l'appliquer bien.", a: "René Descartes, Discours de la méthode" },
];
