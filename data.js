/* Contenu pédagogique de l'application. */

const TWISTERS = [
  { t: "Ton thé t'a-t-il ôté ta toux ?", level: "facile", focus: "Son « t »" },
  { t: "Suis-je bien chez ce cher Serge ?", level: "facile", focus: "Sons « ch » / « s » / « j »" },
  { t: "Un chasseur sachant chasser doit savoir chasser sans son chien.", level: "facile", focus: "Sons « ch » / « s »" },
  { t: "Dans ta tente, ta tante t'attend.", level: "facile", focus: "Son « t » et nasales" },
  { t: "Cinq chiens chassent six chats.", level: "facile", focus: "Sons « ch » / « s »" },
  { t: "Poisson sans boisson est poison.", level: "facile", focus: "Sons « p » / « b », « s » / « z »" },
  { t: "Seize chaises sèchent.", level: "facile", focus: "Sons « s » / « ch »" },
  { t: "Pruneau cru, pruneau cuit.", level: "facile", focus: "Groupes « pr » / « cr »" },
  { t: "Qu'a bu l'âne au lac ? L'âne au lac a bu l'eau.", level: "facile", focus: "Son « l » et voyelles" },
  { t: "Les chaussettes de l'archiduchesse sont-elles sèches, archi-sèches ?", level: "moyen", focus: "Sons « ch » / « s »" },
  { t: "Je veux et j'exige d'exquises excuses.", level: "moyen", focus: "Son « x » (gz / ks)" },
  { t: "Didon dîna, dit-on, du dos d'un dodu dindon.", level: "moyen", focus: "Son « d »" },
  { t: "Natacha n'attacha pas son chat Pacha qui s'échappa.", level: "moyen", focus: "Sons « ch » / « t »" },
  { t: "Fruits frais, fruits frits, fruits cuits, fruits crus.", level: "moyen", focus: "Groupes « fr » / « cr »" },
  { t: "Tas de riz, tas de rats. Tas de riz tentant, tas de rats tentés.", level: "moyen", focus: "Son « r » et nasales" },
  { t: "La pie niche haut, l'oie niche bas. Où niche le hibou ? Le hibou niche ni haut ni bas.", level: "moyen", focus: "Voyelles et rythme" },
  { t: "Je suis ce que je suis, et si je suis ce que je suis, qu'est-ce que je suis ?", level: "moyen", focus: "Sons « s » / « ch » / « j »" },
  { t: "Le ver vert va vers le verre vert.", level: "moyen", focus: "Son « v » et « r »" },
  { t: "Si six scies scient six cyprès, six cent six scies scient six cent six cyprès.", level: "difficile", focus: "Son « s »" },
  { t: "Trois gros rats gris dans trois gros trous ronds rongent trois gros croûtons ronds.", level: "difficile", focus: "Son « r » et groupes « gr » / « tr »" },
  { t: "Un généreux déjeuner régénérerait des généraux dégénérés.", level: "difficile", focus: "Sons « j » / « r » / « é »" },
  { t: "Combien sont ces six saucissons-ci ? Ces six saucissons-ci sont six sous.", level: "difficile", focus: "Son « s »" },
  { t: "Un pâtissier qui pâtissait chez un tapissier qui tapissait dit un jour au tapissier : vaut-il mieux pâtisser chez un tapissier ou tapisser chez un pâtissier ?", level: "difficile", focus: "Sons « p » / « t » / « s »" },
  { t: "Les chemises de l'archiduchesse sont-elles sèches ou archi-sèches ? Elles sont sèches, archi-sèches.", level: "difficile", focus: "Sons « ch » / « s »" },
];

const TWISTER_TIPS = [
  "Commencez très lentement, en exagérant les mouvements de la bouche.",
  "Détachez chaque syllabe comme si vous parliez à quelqu'un au fond d'une grande salle.",
  "Gardez une voix posée : la vitesse ne doit jamais sacrifier la netteté.",
  "Accentuez les consonnes : ce sont elles qui rendent un discours intelligible.",
  "Respirez avant de commencer et tenez la phrase sur un seul souffle si possible.",
];

/* Tics de langage à repérer (formes normalisées, sans accents). */
const FILLERS = [
  "euh", "heu", "hum", "hmm", "bah", "ben", "genre", "du coup", "en fait", "voila",
  "en gros", "tu vois", "vous voyez", "je veux dire", "j veux dire", "style", "grave",
  "bref", "entre guillemets", "basiquement", "litteralement", "quelque part", "on va dire",
  "tout a fait", "voila quoi",
];

/* Mots vides ignorés pour détecter les répétitions. */
const STOPWORDS = new Set(("a au aux avec ce ces c cet cette dans de des du d elle elles en est et etre eu il ils je j l la le les leur lui ma mais me meme mes moi mon ne n nos notre nous on ou par pas pour qu que qui s sa se ses son sur ta te tes toi ton tu un une vos votre vous y ai as avons avez ont suis es sommes etes sont fait faire plus tres bien aussi comme alors donc si tout tous toute toutes cela ca ceci celui celle ceux quand parce puis leurs dont ici la-bas oui non sans sous chez entre vers deja encore autre autres peu beaucoup peut va vais vont y a avait etait sera ete avoir").split(" "));

const TOPICS = [
  { cat: "argumenter", t: "Faut-il interdire les téléphones portables à l'école ?" },
  { cat: "argumenter", t: "Le télétravail rend-il plus heureux ?" },
  { cat: "argumenter", t: "Vaut-il mieux être craint ou être aimé ?" },
  { cat: "argumenter", t: "Les réseaux sociaux rapprochent-ils les gens ?" },
  { cat: "argumenter", t: "L'échec est-il nécessaire pour réussir ?" },
  { cat: "argumenter", t: "Faut-il toujours dire la vérité ?" },
  { cat: "argumenter", t: "La politesse est-elle démodée ?" },
  { cat: "argumenter", t: "Doit-on apprendre à s'ennuyer ?" },
  { cat: "argumenter", t: "Les villes devraient-elles interdire les voitures ?" },
  { cat: "argumenter", t: "L'intelligence artificielle va-t-elle nous rendre plus créatifs ?" },
  { cat: "raconter", t: "Racontez un moment où vous avez dû faire preuve de courage." },
  { cat: "raconter", t: "Décrivez le plus beau paysage que vous ayez vu." },
  { cat: "raconter", t: "Racontez une rencontre qui a changé votre façon de voir les choses." },
  { cat: "raconter", t: "Le meilleur conseil que l'on vous ait donné." },
  { cat: "raconter", t: "Racontez votre souvenir d'enfance préféré." },
  { cat: "raconter", t: "Un objet auquel vous tenez et son histoire." },
  { cat: "raconter", t: "Racontez une journée où tout est allé de travers." },
  { cat: "raconter", t: "La personne qui vous inspire le plus, et pourquoi." },
  { cat: "convaincre", t: "Présentez-vous en une minute à un recruteur." },
  { cat: "convaincre", t: "Convainquez-nous d'adopter votre passion." },
  { cat: "convaincre", t: "Vendez le stylo (ou l'objet) le plus proche de vous." },
  { cat: "convaincre", t: "Convainquez votre ville de créer un nouveau lieu public de votre choix." },
  { cat: "convaincre", t: "Présentez un livre, un film ou une série que tout le monde devrait découvrir." },
  { cat: "convaincre", t: "Défendez votre idée d'entreprise devant des investisseurs." },
  { cat: "convaincre", t: "Convainquez un ami sceptique de se mettre au sport." },
  { cat: "decaler", t: "Plaidez pour que le lundi devienne le jour préféré de tous." },
  { cat: "decaler", t: "Vous êtes une chaussette orpheline : racontez votre vie." },
  { cat: "decaler", t: "Faites l'éloge funèbre d'un vieux téléphone." },
  { cat: "decaler", t: "Expliquez à un extraterrestre ce qu'est un embouteillage." },
  { cat: "decaler", t: "Défendez les pigeons devant un tribunal." },
  { cat: "decaler", t: "Annoncez au monde que le chocolat est désormais un légume." },
  { cat: "decaler", t: "Vous êtes guide touristique dans votre propre cuisine." },
  { cat: "decaler", t: "Présentez la météo d'une planète imaginaire." },
];

const CONSTRAINTS = [
  "Sans dire « euh » ni « du coup »",
  "Commencez par une question",
  "Utilisez au moins une anaphore",
  "Terminez par une phrase choc",
  "Faites au moins deux pauses volontaires de 2 secondes",
  "Donnez un exemple chiffré",
  "Utilisez une métaphore",
  "Placez le mot « néanmoins »",
  "Placez le mot « indubitablement »",
  "Commencez par une anecdote personnelle",
  "Annoncez votre plan en trois points dès le début",
  "Parlez plus lentement que d'habitude",
];

const TIPS = [
  "La pause est votre meilleure alliée : elle donne du poids à vos mots et remplace avantageusement les « euh ».",
  "Un débit de 120 à 160 mots par minute est confortable pour votre auditoire.",
  "Regardez votre auditoire : balayez la salle du regard et arrêtez-vous 2 à 3 secondes sur une personne.",
  "Commencez fort : une question, une anecdote ou un chiffre surprenant captent l'attention dès la première phrase.",
  "Variez l'intonation : une voix monotone endort, une voix qui monte et descend raconte une histoire.",
  "Terminez vos phrases en baissant la voix : cela donne de l'assurance et de l'autorité.",
  "Préparez votre conclusion aussi soigneusement que votre introduction : c'est ce que l'on retient.",
  "Enregistrez-vous régulièrement : on progresse beaucoup plus vite quand on s'écoute.",
  "Articulez davantage que dans une conversation : la moitié de l'intelligibilité se perd à distance.",
  "Ancrez vos pieds au sol, épaules relâchées : un corps stable donne une voix stable.",
  "Une idée par phrase : les phrases courtes sont plus faciles à dire et à comprendre.",
  "Le trac est normal : respirez lentement par le ventre pendant une minute avant de parler.",
];

const WORDS = [
  { w: "Éloquent", n: "adjectif", d: "Qui s'exprime avec aisance et sait émouvoir ou persuader.", e: "Son plaidoyer éloquent a convaincu le jury." },
  { w: "Laconique", n: "adjectif", d: "Qui s'exprime en peu de mots.", e: "Sa réponse laconique a surpris tout le monde : « Non. »" },
  { w: "Prolixe", n: "adjectif", d: "Qui s'exprime trop longuement, avec trop de mots.", e: "Évitez d'être prolixe : allez droit au but." },
  { w: "Sagace", n: "adjectif", d: "Qui a de la finesse d'esprit, qui comprend vite et juste.", e: "Une analyse sagace de la situation." },
  { w: "Péremptoire", n: "adjectif", d: "Qui n'admet pas de réplique, tranchant.", e: "Il a répondu d'un ton péremptoire." },
  { w: "Idoine", n: "adjectif", d: "Qui convient parfaitement, approprié.", e: "C'est la personne idoine pour ce poste." },
  { w: "Circonspect", n: "adjectif", d: "Qui agit avec prudence, après avoir bien réfléchi.", e: "Restons circonspects avant de tirer des conclusions." },
  { w: "Pérenne", n: "adjectif", d: "Qui dure longtemps, durable.", e: "Il faut trouver une solution pérenne." },
  { w: "Truculent", n: "adjectif", d: "Qui s'exprime avec une verve haute en couleur, pittoresque.", e: "Un personnage truculent qui animait tous les repas." },
  { w: "Fallacieux", n: "adjectif", d: "Qui cherche à tromper, faux malgré les apparences.", e: "Un argument fallacieux qui ne résiste pas à l'examen." },
  { w: "Sibyllin", n: "adjectif", d: "Dont le sens est obscur, énigmatique.", e: "Il a laissé un message sibyllin avant de partir." },
  { w: "Ineffable", n: "adjectif", d: "Qu'on ne peut exprimer par des mots, tant c'est intense.", e: "Un bonheur ineffable." },
  { w: "Dithyrambique", n: "adjectif", d: "D'un éloge enthousiaste, voire excessif.", e: "La critique a été dithyrambique." },
  { w: "Magnanime", n: "adjectif", d: "Qui pardonne facilement, généreux envers ceux qu'il pourrait punir.", e: "Le vainqueur s'est montré magnanime." },
  { w: "Velléitaire", n: "adjectif", d: "Qui a des intentions mais ne passe jamais à l'action.", e: "Ne soyez pas velléitaire : fixez-vous une date." },
  { w: "Atermoyer", n: "verbe", d: "Remettre à plus tard, chercher à gagner du temps.", e: "Cessons d'atermoyer et décidons." },
  { w: "Étayer", n: "verbe", d: "Appuyer, soutenir un raisonnement par des preuves.", e: "Étayez votre propos par des exemples précis." },
  { w: "Corroborer", n: "verbe", d: "Confirmer une idée, un témoignage.", e: "Les chiffres corroborent cette hypothèse." },
  { w: "Éluder", n: "verbe", d: "Éviter avec adresse une question, une difficulté.", e: "Il a habilement éludé la question." },
  { w: "Haranguer", n: "verbe", d: "Adresser un discours solennel ou énergique à une foule.", e: "Le capitaine harangua ses troupes." },
  { w: "Acrimonie", n: "nom féminin", d: "Mauvaise humeur qui s'exprime par des propos amers et blessants.", e: "Il parlait de son ancien patron avec acrimonie." },
  { w: "Diatribe", n: "nom féminin", d: "Critique violente, souvent sous forme de discours.", e: "Une longue diatribe contre la bureaucratie." },
  { w: "Emphase", n: "nom féminin", d: "Exagération dans le ton ou le style ; insistance.", e: "Il a mis l'emphase sur la sécurité." },
  { w: "Sérendipité", n: "nom féminin", d: "Le fait de trouver par hasard quelque chose que l'on ne cherchait pas.", e: "La pénicilline est un bel exemple de sérendipité." },
  { w: "Verve", n: "nom féminin", d: "Imagination et vivacité dans la parole.", e: "Il raconte ses voyages avec beaucoup de verve." },
  { w: "Rhétorique", n: "nom féminin", d: "Art de bien parler et de persuader.", e: "Les grands orateurs maîtrisent la rhétorique." },
  { w: "Aphorisme", n: "nom masculin", d: "Phrase courte qui résume une vérité ou une règle de vie.", e: "« Qui ne risque rien n'a rien » est un aphorisme." },
  { w: "Nonobstant", n: "préposition", d: "Malgré, en dépit de.", e: "Nonobstant la pluie, la cérémonie a eu lieu." },
  { w: "Néanmoins", n: "adverbe", d: "Pourtant, malgré cela.", e: "Le projet est ambitieux ; néanmoins, il est réalisable." },
  { w: "Indubitablement", n: "adverbe", d: "D'une manière certaine, sans aucun doute.", e: "C'est indubitablement la meilleure option." },
];

const WEAK_WORDS = {
  "chose": {
    alt: ["élément", "aspect", "point", "sujet", "idée", "objet", "phénomène", "question", "fait"],
    ex: ["Il y a une chose importante → Un point essentiel mérite votre attention.", "C'est une chose difficile → C'est une tâche ardue."],
  },
  "faire": {
    alt: ["réaliser", "effectuer", "accomplir", "concevoir", "fabriquer", "rédiger", "organiser", "mener", "élaborer"],
    ex: ["Faire un projet → Mener un projet.", "Faire un gâteau → Préparer un gâteau.", "Faire un rapport → Rédiger un rapport."],
  },
  "dire": {
    alt: ["affirmer", "expliquer", "souligner", "préciser", "déclarer", "suggérer", "rappeler", "avouer", "exposer"],
    ex: ["Il a dit que c'était faux → Il a affirmé que c'était faux.", "Je voudrais dire que… → Je tiens à souligner que…"],
  },
  "il y a": {
    alt: ["exister", "se trouver", "figurer", "régner", "compter", "comporter"],
    ex: ["Il y a trois raisons → Trois raisons expliquent cela.", "Il y a une bonne ambiance → Une bonne ambiance règne."],
  },
  "très": {
    alt: ["extrêmement", "particulièrement", "remarquablement", "profondément", "fort", "hautement"],
    ex: ["Très grand → immense, gigantesque.", "Très content → ravi, enchanté.", "Très fatigué → épuisé, exténué."],
  },
  "beaucoup": {
    alt: ["énormément", "considérablement", "abondamment", "nombre de", "quantité de", "une multitude de"],
    ex: ["Beaucoup de gens → De nombreuses personnes.", "Ça a beaucoup changé → Cela a considérablement évolué."],
  },
  "truc / machin": {
    alt: ["objet", "outil", "dispositif", "appareil", "astuce", "procédé", "méthode"],
    ex: ["Un truc pour se souvenir → Une astuce mnémotechnique.", "Ce machin → Cet appareil."],
  },
  "bien": {
    alt: ["excellent", "pertinent", "judicieux", "efficace", "remarquable", "satisfaisant", "convaincant"],
    ex: ["C'est bien comme idée → C'est une idée judicieuse.", "Un bon livre → Un livre passionnant."],
  },
  "mettre": {
    alt: ["placer", "poser", "installer", "ranger", "déposer", "insérer", "consacrer"],
    ex: ["Mettre du temps → Consacrer du temps.", "Mettre en place → Instaurer, établir."],
  },
  "voir": {
    alt: ["observer", "constater", "remarquer", "examiner", "percevoir", "distinguer", "découvrir"],
    ex: ["On voit que les ventes baissent → On constate une baisse des ventes."],
  },
  "problème": {
    alt: ["difficulté", "obstacle", "enjeu", "défi", "écueil", "dilemme", "inconvénient"],
    ex: ["Il y a un problème → Nous faisons face à un obstacle.", "Le problème principal → L'enjeu majeur."],
  },
  "avoir": {
    alt: ["posséder", "détenir", "disposer de", "obtenir", "bénéficier de", "éprouver"],
    ex: ["Avoir une bonne note → Obtenir une bonne note.", "Avoir peur → Éprouver de la crainte."],
  },
};

const REFORMULATIONS = [
  { s: "Il y a beaucoup de choses à faire.", a: "De nombreuses tâches nous attendent." },
  { s: "C'est très bien ce que tu as fait.", a: "Ton travail est remarquable." },
  { s: "Du coup, en fait, le truc c'est que on a pas eu le temps.", a: "Le temps nous a manqué." },
  { s: "On a fait une réunion pour dire les problèmes.", a: "Nous avons organisé une réunion pour exposer les difficultés." },
  { s: "Ça a beaucoup changé depuis avant.", a: "La situation a considérablement évolué." },
  { s: "Je vais vous dire des choses sur le projet.", a: "Je vais vous présenter les grandes lignes du projet." },
  { s: "Il y a un gros problème avec les chiffres.", a: "Les chiffres révèlent une difficulté majeure." },
  { s: "C'est un truc super important.", a: "C'est un enjeu capital." },
  { s: "J'ai vu que les gens étaient pas contents.", a: "J'ai constaté un profond mécontentement." },
  { s: "On va mettre en place un truc pour que ça marche mieux.", a: "Nous allons instaurer un dispositif pour améliorer l'efficacité." },
  { s: "Il a dit qu'il était pas d'accord.", a: "Il a exprimé son désaccord." },
  { s: "C'est pas facile de faire ça.", a: "C'est une tâche ardue." },
];

const FIGURES = [
  { n: "Anaphore", d: "Répéter un même mot ou groupe de mots en début de phrases successives, pour marteler une idée.", e: "« Paris ! Paris outragé ! Paris brisé ! Paris martyrisé ! mais Paris libéré ! » (de Gaulle)" },
  { n: "Question rhétorique", d: "Poser une question dont la réponse est évidente, pour impliquer l'auditoire.", e: "« Qui, parmi nous, n'a jamais douté ? »" },
  { n: "Gradation", d: "Enchaîner des termes d'intensité croissante pour créer un crescendo.", e: "« Va, cours, vole, et nous venge. » (Corneille)" },
  { n: "Antithèse", d: "Opposer deux idées dans une même phrase pour frapper les esprits.", e: "« Un petit pas pour l'homme, un bond de géant pour l'humanité. »" },
  { n: "Chiasme", d: "Croiser deux termes en ordre inverse (A-B / B-A).", e: "« Il faut manger pour vivre et non vivre pour manger. » (Molière)" },
  { n: "Métaphore", d: "Comparer sans outil de comparaison, pour rendre une idée concrète et mémorable.", e: "« Cette entreprise est un navire dans la tempête. »" },
  { n: "Règle de trois", d: "Regrouper les idées par trois : un rythme naturellement mémorable et convaincant.", e: "« Je suis venu, j'ai vu, j'ai vaincu. » (César)" },
  { n: "Prétérition", d: "Dire qu'on ne va pas parler d'une chose… tout en en parlant.", e: "« Je ne vous parlerai pas de ses retards répétés… »" },
];

const BREATH_PATTERNS = [
  { id: "coherence", name: "Cohérence cardiaque", desc: "5 s d'inspiration, 5 s d'expiration. Apaise le trac en quelques minutes. Idéal : 5 minutes.", steps: [["Inspirez", 5, 1.9], ["Expirez", 5, 1]], cycles: 30 },
  { id: "carre", name: "Respiration carrée", desc: "4 temps pour inspirer, retenir, expirer, retenir. Recentre et calme l'esprit.", steps: [["Inspirez", 4, 1.9], ["Retenez", 4, 1.9], ["Expirez", 4, 1], ["Retenez", 4, 1]], cycles: 8 },
  { id: "478", name: "4-7-8", desc: "Inspirez 4 s, retenez 7 s, expirez lentement 8 s. Très efficace contre le stress.", steps: [["Inspirez", 4, 1.9], ["Retenez", 7, 1.9], ["Expirez", 8, 1]], cycles: 4 },
  { id: "souffle", name: "Souffle long", desc: "Inspirez 3 s, puis expirez sur un « sss » continu le plus longtemps possible (visez 20 s). Développe le contrôle du souffle pour les longues phrases.", steps: [["Inspirez", 3, 1.9], ["Sssss…", 20, 1]], cycles: 5 },
];

const WARMUP = [
  { t: "Détente du corps", d: "Roulez les épaules en arrière, relâchez la nuque en faisant des « oui » et des « non » lents avec la tête.", s: 40 },
  { t: "Bâillements", d: "Bâillez franchement 3 ou 4 fois en ouvrant grand la bouche : cela détend la gorge et la mâchoire.", s: 25 },
  { t: "Massage du visage", d: "Massez les joues et la mâchoire du bout des doigts, puis faites des grimaces exagérées.", s: 30 },
  { t: "Vibration des lèvres", d: "Soufflez en faisant vibrer les lèvres (« brrrr »), d'abord sur une note, puis en montant et descendant.", s: 30 },
  { t: "Sirène", d: "Sur un « ou » ou un « mmm », glissez de votre note la plus grave à la plus aiguë, puis redescendez.", s: 30 },
  { t: "Voyelles exagérées", d: "Prononcez A – É – I – O – U – OU en exagérant au maximum la forme de la bouche.", s: 30 },
  { t: "Consonnes explosives", d: "Enchaînez « pa-ta-ka, pa-ta-ka… » de plus en plus vite, en restant net.", s: 30 },
  { t: "Stylo entre les dents", d: "Placez un stylo horizontalement entre les dents et lisez un virelangue en articulant au maximum. Puis relisez-le sans le stylo.", s: 45 },
  { t: "Projection", d: "Dites « Bonjour à tous ! » comme si vous parliez à la dernière rangée d'une salle, en soutenant avec le ventre.", s: 20 },
];

const SYL_CONSONANTS = ["p", "b", "t", "d", "k", "g", "f", "v", "s", "z", "ch", "j", "m", "n", "l", "r", "pr", "br", "tr", "dr", "cr", "gr", "fr", "vr", "pl", "bl", "cl", "gl", "fl", "str", "spr"];
const SYL_VOWELS = ["a", "é", "i", "o", "u", "ou", "on", "an", "in", "eu"];
