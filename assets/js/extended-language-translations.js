'use strict';

const extendedTranslations = {
  fr: {
    meta: {
      title: 'Alvaro Molina | Portfolio',
      description: 'Portfolio personnel d’Alvaro Molina axé sur le développement web, l’identité visuelle, la performance et l’expérience utilisateur.',
    },
    sidebar: {
      eyebrow: 'Portfolio personnel',
      role: 'Développeur web avec un œil visuel et une mentalité commerciale.',
      availability: 'Toujours en train d’affiner l’expérience',
      detailsToggle: 'Afficher les détails',
      linkedinValue: 'Profil professionnel',
      whatsappValue: 'Message direct',
      note: 'J’aime créer des interfaces fiables, soignées et utiles, pas seulement décoratives.',
      primaryAction: 'Discutons',
      secondaryAction: 'Voir GitHub',
    },
    controls: {
      quickAria: 'Contrôles rapides',
      languageLabel: 'Langue',
      languageHelper: 'Anglais par défaut, autres langues en un clic.',
      themeLabel: 'Accent',
      themeHelper: 'Ouvre la palette qui correspond le mieux à l’ambiance.',
    },
    theme: {
      blue: 'Bleu',
      green: 'Vert',
      red: 'Rouge',
      orange: 'Orange',
      yellow: 'Jaune',
      white: 'Blanc',
      pink: 'Rose',
      black: 'Noir',
    },
    nav: {
      aria: 'Sections principales',
      about: 'À propos',
      focus: 'Approche',
      work: 'Portfolio',
      contact: 'Contact',
    },
    about: {
      eyebrow: 'Introduction',
      title: 'Une présence numérique plus personnelle, une structure plus claire et un point de vue visuel plus fort.',
      lead: 'Je combine développement web, structure visuelle et pensée commerciale pour créer des expériences qui expliquent qui vous êtes et où va un projet.',
      primaryAction: 'Contacter maintenant',
      secondaryAction: 'Voir le profil',
      noteOne: 'Une hiérarchie claire et une interface qui ressemble moins à un modèle.',
      noteTwo: 'Une attention particulière à la vitesse, à la lisibilité et à l’UX globale.',
      noteThree: 'Une base solide pour des démos, des cas réels ou un travail technique plus profond plus tard.',
      statusPill: 'web + ventes + produit',
      metricLabel: 'Profil',
      metricTitle: 'Développement avec conscience commerciale',
      metricBody: 'Message, conversion et présentation travaillent ensemble.',
      servicesTitle: 'Ce que j’apporte',
      featureOneTitle: 'UI avec personnalité',
      featureOneBody: 'Des mises en page plus intentionnelles, moins d’effet modèle et une présence numérique plus reconnaissable.',
      featureTwoTitle: 'Performance visible',
      featureTwoBody: 'Attention au poids visuel, à la structure et à la sensation globale de vitesse.',
      featureThreeTitle: 'Mentalité commerciale',
      featureThreeBody: 'Avoir une belle apparence ne suffit pas ; l’expérience doit aussi expliquer la valeur et pousser à l’action.',
      featureFourTitle: 'Livraison propre',
      featureFourBody: 'Des composants clairs, une structure modifiable et une base capable d’évoluer avec vous.',
      stackTitle: 'Stack et sujets que je veux continuer à affiner',
      stackAccessibility: 'Accessibilité',
      stackBranding: 'Marque personnelle',
      stackConversion: 'Conversion',
      stackLanding: 'Landing pages',
    },
    focus: {
      eyebrow: 'Approche',
      title: 'Je préfère construire un site qui communique bien plutôt qu’un site bruyant sans direction.',
      stepOneTitle: '1. Verrouiller le message d’abord',
      stepOneBody: 'Je définis la proposition de valeur, le ton et l’objectif principal avant de toucher aux effets ou aux astuces visuelles.',
      stepTwoTitle: '2. Structurer l’expérience',
      stepTwoBody: 'La hiérarchie, le rythme de lecture et les appels à l’action doivent sembler naturels et faciles à suivre.',
      stepThreeTitle: '3. Construire avec intention',
      stepThreeBody: 'Je travaille sur une base propre pour que le portfolio soit fort aujourd’hui et facile à faire évoluer demain.',
      stepFourTitle: '4. Affiner ce qui compte',
      stepFourBody: 'Le contraste, l’espacement, la clarté et le niveau de finition comptent plus que la complexité aléatoire.',
      cardOneLabel: 'Priorités',
      cardOneTitle: 'Clarté, confiance et conversion',
      cardOneBody: 'Une forte première impression a besoin d’ordre visuel, de cohérence et d’une prochaine étape claire.',
      cardTwoLabel: 'Base technique',
      cardTwoTitle: 'HTML, CSS et JavaScript propres',
      cardTwoBody: 'Je veux que la partie visuelle soit soignée sans rendre le projet plus difficile à maintenir ensuite.',
      cardThreeLabel: 'Idée centrale',
      cardThreeBody: 'Un portfolio personnel ne devrait pas ressembler à une démo recyclée ; il devrait être une présentation claire et confiante.',
    },
    work: {
      eyebrow: 'Portfolio',
      title: 'Le type de pièces et de solutions qui correspond le mieux à ce profil.',
      intro: 'Ces cartes montrent le type de travail que ce portfolio peut représenter aujourd’hui et enrichir demain avec de vrais cas, des démos ou des liens spécifiques.',
      filterAria: 'Filtrer les projets',
      filterAll: 'Tous',
      filterUi: 'UI',
      filterPerformance: 'Performance',
      filterSystems: 'Systèmes',
      projectOneTagOne: 'Branding',
      projectOneTagTwo: 'Portfolio',
      projectOneTitle: 'Portfolio vCard personnalisé',
      projectOneBody: 'Une page d’accueil compacte et élégante pour présenter rapidement le profil, la valeur et les appels à l’action.',
      projectOneActionOne: 'Voir GitHub',
      projectOneActionTwo: 'En parler',
      projectTwoTagOne: 'Landing',
      projectTwoTagTwo: 'Conversion',
      projectTwoTitle: 'Landing page orientée action',
      projectTwoBody: 'Message clair, forte hiérarchie de blocs et CTA visibles sans perdre le style.',
      projectTwoActionOne: 'Voir le profil',
      projectTwoActionTwo: 'Je veux quelque chose comme ça',
      projectThreeTitle: 'Optimisation de la vitesse et du flux de lecture',
      projectThreeBody: 'Réduire la friction visuelle et technique pour que toute l’expérience paraisse plus rapide et plus convaincante.',
      projectThreeActionOne: 'Examiner une idée',
      projectFourTagOne: 'Données',
      projectFourTitle: 'Interfaces opérationnelles et de suivi',
      projectFourBody: 'Des panneaux sobres pour organiser l’information, les processus internes et les points de contrôle.',
      projectFourActionOne: 'Explorer les repos',
      projectFiveTagOne: 'Accessibilité',
      projectFiveTagTwo: 'Contenu',
      projectFiveTitle: 'Expérience plus propre et plus accessible',
      projectFiveBody: 'Structure de texte plus nette, contraste plus fort et décisions pensées pour réduire la friction.',
      projectFiveActionOne: 'Se connecter',
      projectSixTagOne: 'Automatisation',
      projectSixTitle: 'Une base qui peut continuer à grandir',
      projectSixBody: 'Une structure simple et soignée, prête à évoluer d’une page personnelle vers quelque chose de plus grand.',
      projectSixActionOne: 'Transformer cela en vrai cas',
    },
    contact: {
      eyebrow: 'Contact',
      title: 'Recrutement, collaboration ou besoin d’une présence web plus claire ? Parlons-en.',
      lead: 'Si vous êtes recruteur, client ou membre d’une équipe à la recherche d’une exécution front-end plus solide, d’une présentation plus nette et d’une communication plus claire, c’est le moyen le plus rapide de me joindre.',
      primaryAction: 'Commencer sur WhatsApp',
      secondaryAction: 'Ouvrir LinkedIn',
      githubBody: 'Parcourir des exemples de code, des expérimentations et du travail technique.',
      linkedinBody: 'Consulter le parcours, l’expérience et le contexte professionnel.',
      instagramBody: 'Une facette plus légère et visuelle de la marque personnelle.',
      whatsappBody: 'Le meilleur canal pour parler de projets, de collaboration ou de disponibilité.',
      footer: '2026 Alvaro Molina. Ouvert aux collaborations, au freelance et aux projets web orientés produit.',
    },
    cv: {
      eyebrow: 'CV',
      title: 'Téléchargez mon <span class="cv-accent-word">CV</span>.',
      body: 'Un CV compact axé sur le développement full-stack, les intégrations, l’automatisation, les workflows connectés à Azure et la livraison technique.',
      download: 'Télécharger le CV',
      fallback: 'Télécharge le PDF exact ajouté à ce portfolio.',
      chips: ['Full Stack', 'Intégration', 'Automatisation', 'Azure', 'APIs'],
    },
  },
  ga: {
    meta: {
      title: 'Alvaro Molina | Punann',
      description: 'Punann pearsanta Alvaro Molina dírithe ar fhorbairt gréasáin, féiniúlacht amhairc, feidhmíocht agus taithí úsáideora.',
    },
    sidebar: {
      eyebrow: 'Punann phearsanta',
      role: 'Forbróir gréasáin le súil amhairc agus meon tráchtála.',
      availability: 'Ag feabhsú na taithí i gcónaí',
      detailsToggle: 'Taispeáin sonraí',
      linkedinValue: 'Próifíl ghairmiúil',
      whatsappValue: 'Teachtaireacht dhíreach',
      note: 'Is maith liom comhéadain iontaofa, snasta agus úsáideacha a thógáil, ní maisiú amháin.',
      primaryAction: 'Labhraímis',
      secondaryAction: 'Féach GitHub',
    },
    controls: {
      quickAria: 'Rialuithe tapa',
      languageLabel: 'Teanga',
      languageHelper: 'Béarla mar réamhshocrú, teangacha eile le sconna amháin.',
      themeLabel: 'Aicinn',
      themeHelper: 'Oscail an pailéad a oireann don ghiúmar.',
    },
    theme: {
      blue: 'Gorm',
      green: 'Glas',
      red: 'Dearg',
      orange: 'Oráiste',
      yellow: 'Buí',
      white: 'Bán',
      pink: 'Bándearg',
      black: 'Dubh',
    },
    nav: {
      aria: 'Príomhranna',
      about: 'Fúm',
      focus: 'Cur chuige',
      work: 'Punann',
      contact: 'Teagmháil',
    },
    about: {
      eyebrow: 'Réamhrá',
      title: 'Láithreacht dhigiteach níos pearsanta, struchtúr níos soiléire agus dearcadh amhairc níos láidre.',
      lead: 'Meascaim forbairt gréasáin, struchtúr amhairc agus smaointeoireacht tráchtála chun eispéiris a chruthú a mhíníonn cé thú agus cá bhfuil tionscadal ag dul.',
      primaryAction: 'Déan teagmháil anois',
      secondaryAction: 'Féach próifíl',
      noteOne: 'Ordlathas soiléir agus comhéadan nach mothaíonn mar theimpléad.',
      noteTwo: 'Cúram breise don luas, inléiteacht agus UX iomlán.',
      noteThree: 'Bunús láidir do dheamónna, cásanna fíora nó obair theicniúil níos doimhne níos déanaí.',
      statusPill: 'web + díolacháin + táirge',
      metricLabel: 'Próifíl',
      metricTitle: 'Forbairt le feasacht tráchtála',
      metricBody: 'Teachtaireacht, tiontú agus cur i láthair ag obair le chéile.',
      servicesTitle: 'Cad a thugaim leis',
      featureOneTitle: 'UI le pearsantacht',
      featureOneBody: 'Leaganacha amach níos cuspóirí, níos lú fuinnimh teimpléid agus láithreacht dhigiteach níos so-aitheanta.',
      featureTwoTitle: 'Feidhmíocht infheicthe',
      featureTwoBody: 'Aire do mheáchan amhairc, struchtúr agus an mothú ginearálta luais.',
      featureThreeTitle: 'Meon tráchtála',
      featureThreeBody: 'Ní leor cuma mhaith; ba chóir don taithí luach a mhíniú agus gníomh a spreagadh.',
      featureFourTitle: 'Seachadadh glan',
      featureFourBody: 'Comhpháirteanna soiléire, struchtúr in-eagarthóireachta agus bunús atá in ann fás leat.',
      stackTitle: 'Stack agus ábhair ba mhaith liom a ghéarú i gcónaí',
      stackAccessibility: 'Inrochtaineacht',
      stackBranding: 'Brandáil phearsanta',
      stackConversion: 'Tiontú',
      stackLanding: 'Landing pages',
    },
    focus: {
      eyebrow: 'Cur chuige',
      title: 'B’fhearr liom suíomh a thógáil a dhéanann cumarsáid mhaith ná suíomh torannach gan treo.',
      stepOneTitle: '1. Socraigh an teachtaireacht ar dtús',
      stepOneBody: 'Sainím an tairiscint luacha, an ton agus an príomhsprioc sula mbogaim chuig éifeachtaí nó cleasa amhairc.',
      stepTwoTitle: '2. Cruthaigh an taithí',
      stepTwoBody: 'Ba chóir don ordlathas, rithim léitheoireachta agus glaonna chun gnímh a bheith nádúrtha agus éasca le leanúint.',
      stepThreeTitle: '3. Tóg le hintinn',
      stepThreeBody: 'Oibrím ar bhunús glan ionas go mbeidh an punann láidir inniu agus éasca le forbairt amárach.',
      stepFourTitle: '4. Snasaigh an rud atá tábhachtach',
      stepFourBody: 'Tá codarsnacht, spásáil, soiléireacht agus snas foriomlán níos tábhachtaí ná castacht randamach.',
      cardOneLabel: 'Tosaíochtaí',
      cardOneTitle: 'Soiléireacht, muinín agus tiontú',
      cardOneBody: 'Teastaíonn ord amhairc, comhsheasmhacht agus céim shoiléir eile ó chéad tuiscint láidir.',
      cardTwoLabel: 'Bunús teicniúil',
      cardTwoTitle: 'HTML, CSS agus JavaScript glan',
      cardTwoBody: 'Ba mhaith liom go mbraithfeadh an taobh amhairc snasta gan an tionscadal a dhéanamh níos deacra le cothabháil.',
      cardThreeLabel: 'Croísmaoineamh',
      cardThreeBody: 'Níor chóir do phunann phearsanta mothú mar dheamó athchúrsáilte; ba chóir di a bheith mar réamhrá soiléir muiníneach.',
    },
    work: {
      eyebrow: 'Punann',
      title: 'Na píosaí agus na réitigh is fearr a oireann don phróifíl seo.',
      intro: 'Taispeánann na cártaí seo an cineál oibre is féidir leis an bpunann seo a léiriú inniu agus a leathnú amárach le cásanna fíora, deamónna nó naisc shonracha.',
      filterAria: 'Scag tionscadail',
      filterAll: 'Uile',
      filterUi: 'UI',
      filterPerformance: 'Feidhmíocht',
      filterSystems: 'Córais',
      projectOneTagOne: 'Brandáil',
      projectOneTagTwo: 'Punann',
      projectOneTitle: 'Punann vCard saincheaptha',
      projectOneBody: 'Leathanach baile dlúth galánta chun próifíl, luach agus glaonna chun gnímh a chur i láthair go tapa.',
      projectOneActionOne: 'Féach GitHub',
      projectOneActionTwo: 'Labhair faoi',
      projectTwoTagOne: 'Landing',
      projectTwoTagTwo: 'Tiontú',
      projectTwoTitle: 'Landing page dírithe ar ghníomh',
      projectTwoBody: 'Teachtaireacht shoiléir, ordlathas láidir bloc agus CTAanna infheicthe gan stíl a chailleadh.',
      projectTwoActionOne: 'Féach próifíl',
      projectTwoActionTwo: 'Ba mhaith liom rud mar seo',
      projectThreeTitle: 'Optamú luais agus sreafa léitheoireachta',
      projectThreeBody: 'Frithchuimilt amhairc agus theicniúil a laghdú ionas go mothaíonn an taithí iomlán níos tapúla agus níos inchreidte.',
      projectThreeActionOne: 'Athbhreithnigh smaoineamh',
      projectFourTagOne: 'Sonraí',
      projectFourTitle: 'Comhéadain oibriúcháin agus rianaithe',
      projectFourBody: 'Painéil shocra chun faisnéis, próisis inmheánacha agus pointí rialaithe a eagrú.',
      projectFourActionOne: 'Fiosraigh repos',
      projectFiveTagOne: 'Inrochtaineacht',
      projectFiveTagTwo: 'Ábhar',
      projectFiveTitle: 'Taithí níos glaine agus níos inrochtana',
      projectFiveBody: 'Struchtúr cóipe níos géire, codarsnacht níos láidre agus cinntí déanta chun frithchuimilt a laghdú.',
      projectFiveActionOne: 'Ceangail',
      projectSixTagOne: 'Uathoibriú',
      projectSixTitle: 'Bunús atá in ann fás',
      projectSixBody: 'Struchtúr simplí snasta réidh le forbairt ó leathanach pearsanta go rud níos mó.',
      projectSixActionOne: 'Déan cás fíor de seo',
    },
    contact: {
      eyebrow: 'Teagmháil',
      title: 'Fostú, comhoibriú nó láithreacht gréasáin níos soiléire uait? Labhraímis.',
      lead: 'Más earcaitheoir, cliant nó cuid d’fhoireann thú atá ag lorg cur i bhfeidhm front-end níos láidre, cur i láthair níos géire agus cumarsáid níos soiléire, seo an bealach is tapúla chun teagmháil a dhéanamh liom.',
      primaryAction: 'Tosaigh ar WhatsApp',
      secondaryAction: 'Oscail LinkedIn',
      githubBody: 'Brabhsáil samplaí cód, turgnaimh agus obair theicniúil.',
      linkedinBody: 'Athbhreithnigh cúlra, taithí agus comhthéacs gairmiúil.',
      instagramBody: 'Taobh níos éadroime agus níos amhairc den bhranda pearsanta.',
      whatsappBody: 'An cainéal is fearr do cheisteanna tionscadail, comhoibriú nó infhaighteacht.',
      footer: '2026 Alvaro Molina. Oscailte do chomhoibrithe, obair freelance agus tionscadail ghréasáin dírithe ar tháirge.',
    },
    cv: {
      eyebrow: 'CV',
      title: 'Íoslódáil mo <span class="cv-accent-word">CV</span>.',
      body: 'CV dlúth dírithe ar fhorbairt full-stack, comhtháthuithe, uathoibriú, workflows ceangailte le Azure agus seachadadh teicniúil.',
      download: 'Íoslódáil CV',
      fallback: 'Íoslódálann sé an PDF cruinn atá curtha leis an bpunann seo.',
      chips: ['Full Stack', 'Comhtháthú', 'Uathoibriú', 'Azure', 'APIs'],
    },
  },
};

const getDeepValue = (source, path) => path.split('.').reduce((value, key) => value?.[key], source);

const applyExtendedTranslations = () => {
  const language = document.body?.dataset?.language;
  const dictionary = extendedTranslations[language];
  if (!dictionary) return;

  document.documentElement.lang = language;

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.getAttribute('data-i18n');
    const value = getDeepValue(dictionary, key);
    if (typeof value !== 'string') return;

    const attr = node.getAttribute('data-i18n-attr');
    if (attr) {
      node.setAttribute(attr, value);
    } else if (value.includes('<')) {
      node.innerHTML = value;
    } else {
      node.textContent = value;
    }
  });

  const cv = dictionary.cv;
  if (cv) {
    document.querySelectorAll('[data-target="cv"]').forEach((button) => {
      button.textContent = 'CV';
    });
    document.querySelector('[data-cv-copy="eyebrow"]')?.replaceChildren(document.createTextNode(cv.eyebrow));
    const title = document.querySelector('[data-cv-copy="title"]');
    if (title) title.innerHTML = cv.title;
    document.querySelector('[data-cv-copy="body"]')?.replaceChildren(document.createTextNode(cv.body));
    document.querySelector('[data-cv-copy="fallback"]')?.replaceChildren(document.createTextNode(cv.fallback));
    const chips = document.querySelector('[data-cv-chips]');
    if (chips) chips.innerHTML = cv.chips.map((chip) => `<span>${chip}</span>`).join('');
    document.querySelectorAll('[data-cv-button-copy]').forEach((node) => {
      node.textContent = cv.download;
    });
    document.querySelectorAll('.cv-download-section__button[data-download-cv]').forEach((button) => {
      button.textContent = cv.download;
    });
  }
};

const initExtendedTranslations = () => {
  applyExtendedTranslations();

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(applyExtendedTranslations);
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-language'],
  });

  document.addEventListener('click', () => {
    window.setTimeout(applyExtendedTranslations, 90);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExtendedTranslations);
} else {
  initExtendedTranslations();
}
