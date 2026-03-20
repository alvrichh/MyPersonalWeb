'use strict';

import '../css/style.css';

const translations = {
  en: {
    meta: {
      title: 'Alvaro Molina | Portfolio',
      description: 'Personal portfolio of Alvaro Molina focused on web development, visual identity, performance, and user experience.',
    },
    sidebar: {
      eyebrow: 'Personal portfolio',
      role: 'Web developer with a visual eye and a commercial mindset.',
      availability: 'Always refining the experience',
      detailsToggle: 'Show details',
      linkedinValue: 'Professional profile',
      whatsappValue: 'Direct message',
      note: 'I like building interfaces that feel trustworthy, polished, and useful, not just decorative.',
      primaryAction: "Let's talk",
      secondaryAction: 'View GitHub',
    },
    controls: {
      quickAria: 'Quick controls',
      languageLabel: 'Language',
      languageHelper: 'English by default, Spanish one tap away.',
      themeLabel: 'Accent',
      themeHelper: 'Open the palette that matches the mood.',
    },
    theme: {
      blue: 'Blue',
      green: 'Green',
      red: 'Red',
      orange: 'Orange',
      yellow: 'Yellow',
      white: 'White',
      pink: 'Pink',
      black: 'Black',
    },
    nav: {
      aria: 'Main sections',
      about: 'About',
      focus: 'Approach',
      work: 'Portfolio',
      contact: 'Contact',
    },
    about: {
      eyebrow: 'Introduction',
      title: 'A more personal digital presence, clearer structure, and a stronger visual point of view.',
      lead: 'I blend web development, visual structure, and commercial thinking to build experiences that explain who you are and where a project is going.',
      primaryAction: 'Contact now',
      secondaryAction: 'View profile',
      noteOne: 'Clear hierarchy and a less template-looking interface.',
      noteTwo: 'Extra care for speed, readability, and overall UX.',
      noteThree: 'A strong base for demos, real case studies, or deeper technical work later on.',
      statusPill: 'web + sales + product',
      metricLabel: 'Profile',
      metricTitle: 'Development with commercial awareness',
      metricBody: 'Message, conversion, and presentation working together.',
      servicesTitle: 'What I bring to the table',
      featureOneTitle: 'UI with personality',
      featureOneBody: 'More intentional layouts, less template energy, and a digital presence that feels more recognizable.',
      featureTwoTitle: 'Visible performance',
      featureTwoBody: 'Care for visual weight, structure, and the overall sensation of speed.',
      featureThreeTitle: 'Commercial mindset',
      featureThreeBody: 'Looking good is not enough; the experience should also explain value and drive action.',
      featureFourTitle: 'Clean delivery',
      featureFourBody: 'Clear components, editable structure, and a setup that can keep growing with you.',
      stackTitle: 'Stack and topics I want to keep sharpening',
      stackAccessibility: 'Accessibility',
      stackBranding: 'Personal branding',
      stackConversion: 'Conversion',
      stackLanding: 'Landing pages',
    },
    focus: {
      eyebrow: 'Approach',
      title: 'I would rather build a site that communicates well than a noisy site with no direction.',
      stepOneTitle: '1. Lock the message first',
      stepOneBody: 'I define the value proposition, the tone, and the main goal before touching effects or visual tricks.',
      stepTwoTitle: '2. Shape the experience',
      stepTwoBody: 'Hierarchy, reading rhythm, and calls to action should feel natural and easy to follow.',
      stepThreeTitle: '3. Build with intention',
      stepThreeBody: 'I work on a clean base so the portfolio looks strong today and stays easy to evolve tomorrow.',
      stepFourTitle: '4. Refine what matters',
      stepFourBody: 'Contrast, spacing, clarity, and overall polish matter more than random complexity.',
      cardOneLabel: 'Priorities',
      cardOneTitle: 'Clarity, trust, and conversion',
      cardOneBody: 'A strong first impression needs visual order, consistency, and a clear next step.',
      cardTwoLabel: 'Technical base',
      cardTwoTitle: 'HTML, CSS, and JavaScript done cleanly',
      cardTwoBody: 'I want the visual side to feel polished without making the project harder to maintain later.',
      cardThreeLabel: 'Core idea',
      cardThreeBody: 'A personal portfolio should not feel like a recycled demo; it should feel like a clear, confident introduction.',
    },
    work: {
      eyebrow: 'Portfolio',
      title: 'The kind of pieces and solutions that fit this profile best.',
      intro: 'These cards show the kind of work this portfolio can represent today and expand tomorrow with real case studies, demos, or specific links.',
      filterAria: 'Filter projects',
      filterAll: 'All',
      filterUi: 'UI',
      filterPerformance: 'Performance',
      filterSystems: 'Systems',
      projectOneTagOne: 'Branding',
      projectOneTagTwo: 'Portfolio',
      projectOneTitle: 'Custom vCard portfolio',
      projectOneBody: 'A compact, elegant homepage designed to present profile, value, and calls to action fast.',
      projectOneActionOne: 'View GitHub',
      projectOneActionTwo: 'Talk about it',
      projectTwoTagOne: 'Landing',
      projectTwoTagTwo: 'Conversion',
      projectTwoTitle: 'Action-oriented landing page',
      projectTwoBody: 'Clear messaging, strong block hierarchy, and visible calls to action without losing style.',
      projectTwoActionOne: 'View profile',
      projectTwoActionTwo: 'Show me something like this',
      projectThreeTitle: 'Speed and reading flow optimization',
      projectThreeBody: 'Reduce visual and technical friction so the whole experience feels faster and more convincing.',
      projectThreeActionOne: 'Review an idea',
      projectFourTagOne: 'Data',
      projectFourTitle: 'Operational and tracking interfaces',
      projectFourBody: 'Sober panels for organizing information, internal processes, and control points.',
      projectFourActionOne: 'Explore repos',
      projectFiveTagOne: 'Accessibility',
      projectFiveTagTwo: 'Content',
      projectFiveTitle: 'Cleaner, more accessible experience',
      projectFiveBody: 'Sharper copy structure, stronger contrast, and decisions made to reduce friction.',
      projectFiveActionOne: 'Connect',
      projectSixTagOne: 'Automation',
      projectSixTitle: 'A base that can keep growing',
      projectSixBody: 'A simple, polished structure ready to evolve from a personal page into something bigger.',
      projectSixActionOne: 'Turn this into a real case',
    },
    contact: {
      eyebrow: 'Contact',
      title: "Hiring, collaborating, or looking for a clearer web presence? Let's talk.",
      lead: 'If you are a recruiter, client, or part of a team looking for stronger front-end execution, sharper presentation, and clearer communication, this is the fastest way to reach me.',
      primaryAction: 'Start on WhatsApp',
      secondaryAction: 'Open LinkedIn',
      githubBody: 'Browse code samples, experiments, and technical work.',
      linkedinBody: 'Review background, experience, and professional context.',
      instagramBody: 'A lighter, more visual side of the personal brand.',
      whatsappBody: 'Best channel for project enquiries, collaboration, or availability.',
      footer: '2026 Alvaro Molina. Open to collaborations, freelance work, and product-focused web projects.',
    },
  },
  es: {
    meta: {
      title: 'Alvaro Molina | Portfolio',
      description: 'Portfolio personal de Alvaro Molina con foco en desarrollo web, identidad visual, performance y experiencia de usuario.',
    },
    sidebar: {
      eyebrow: 'Portfolio personal',
      role: 'Web developer con ojo visual y mentalidad comercial.',
      availability: 'Siempre refinando la experiencia',
      detailsToggle: 'Mostrar detalles',
      linkedinValue: 'Perfil profesional',
      whatsappValue: 'Mensaje directo',
      note: 'Me interesa construir interfaces que transmitan confianza, se vean pulidas y sean utiles, no solo decorativas.',
      primaryAction: 'Hablemos',
      secondaryAction: 'Ver GitHub',
    },
    controls: {
      quickAria: 'Controles rapidos',
      languageLabel: 'Idioma',
      languageHelper: 'Ingles por defecto, espanol a un toque.',
      themeLabel: 'Acento',
      themeHelper: 'Abre la paleta que mejor encaje con el mood.',
    },
    theme: {
      blue: 'Azul',
      green: 'Verde',
      red: 'Rojo',
      orange: 'Naranja',
      yellow: 'Amarillo',
      white: 'Blanco',
      pink: 'Rosa',
      black: 'Negro',
    },
    nav: {
      aria: 'Secciones principales',
      about: 'Sobre mi',
      focus: 'Enfoque',
      work: 'Portfolio',
      contact: 'Contacto',
    },
    about: {
      eyebrow: 'Presentacion',
      title: 'Una presencia digital mas personal, una estructura mas clara y un punto de vista visual mas fuerte.',
      lead: 'Combino desarrollo web, estructura visual y pensamiento comercial para crear experiencias que explican mejor quien eres y hacia donde va un proyecto.',
      primaryAction: 'Contactar ahora',
      secondaryAction: 'Ver perfil',
      noteOne: 'Jerarquia clara y una interfaz con menos energia de plantilla.',
      noteTwo: 'Cuidado extra en velocidad, legibilidad y experiencia general.',
      noteThree: 'Una base fuerte para demos, casos reales o trabajo tecnico mas profundo mas adelante.',
      statusPill: 'web + ventas + producto',
      metricLabel: 'Perfil',
      metricTitle: 'Desarrollo con criterio comercial',
      metricBody: 'Mensaje, conversion y presentacion trabajando juntos.',
      servicesTitle: 'Lo que aporto',
      featureOneTitle: 'UI con personalidad',
      featureOneBody: 'Layouts mas intencionales, menos sensacion de plantilla y una presencia digital mas reconocible.',
      featureTwoTitle: 'Performance visible',
      featureTwoBody: 'Cuidado del peso visual, la estructura y la sensacion general de velocidad.',
      featureThreeTitle: 'Mentalidad comercial',
      featureThreeBody: 'Verse bien no basta; la experiencia tambien debe explicar valor y mover a la accion.',
      featureFourTitle: 'Entrega limpia',
      featureFourBody: 'Componentes claros, estructura editable y una base que puede seguir creciendo contigo.',
      stackTitle: 'Stack y temas que quiero seguir afinando',
      stackAccessibility: 'Accesibilidad',
      stackBranding: 'Branding personal',
      stackConversion: 'Conversion',
      stackLanding: 'Landing pages',
    },
    focus: {
      eyebrow: 'Enfoque',
      title: 'Prefiero construir una web que comunique bien antes que una web ruidosa sin direccion.',
      stepOneTitle: '1. Cerrar primero el mensaje',
      stepOneBody: 'Defino la propuesta de valor, el tono y el objetivo principal antes de tocar efectos o trucos visuales.',
      stepTwoTitle: '2. Dar forma a la experiencia',
      stepTwoBody: 'La jerarquia, el ritmo de lectura y los CTA deben sentirse naturales y faciles de seguir.',
      stepThreeTitle: '3. Construir con intencion',
      stepThreeBody: 'Trabajo sobre una base limpia para que el portfolio se vea fuerte hoy y siga siendo facil de evolucionar manana.',
      stepFourTitle: '4. Afinar lo que importa',
      stepFourBody: 'Contraste, espaciado, claridad y pulido general importan mas que la complejidad aleatoria.',
      cardOneLabel: 'Prioridades',
      cardOneTitle: 'Claridad, confianza y conversion',
      cardOneBody: 'Una buena primera impresion necesita orden visual, consistencia y un siguiente paso claro.',
      cardTwoLabel: 'Base tecnica',
      cardTwoTitle: 'HTML, CSS y JavaScript bien resueltos',
      cardTwoBody: 'Quiero que lo visual se sienta pulido sin volver el proyecto mas dificil de mantener despues.',
      cardThreeLabel: 'Idea central',
      cardThreeBody: 'Un portfolio personal no deberia sentirse como una demo reciclada; deberia sentirse como una presentacion clara y segura.',
    },
    work: {
      eyebrow: 'Portfolio',
      title: 'El tipo de piezas y soluciones que mejor encajan con este perfil.',
      intro: 'Estas cards muestran el tipo de trabajo que este portfolio puede representar hoy y ampliar manana con casos reales, demos o enlaces concretos.',
      filterAria: 'Filtrar proyectos',
      filterAll: 'Todo',
      filterUi: 'UI',
      filterPerformance: 'Performance',
      filterSystems: 'Sistemas',
      projectOneTagOne: 'Branding',
      projectOneTagTwo: 'Portfolio',
      projectOneTitle: 'Portfolio vCard a medida',
      projectOneBody: 'Una home compacta y elegante para presentar perfil, valor y llamadas a la accion con rapidez.',
      projectOneActionOne: 'Ver GitHub',
      projectOneActionTwo: 'Hablar de esto',
      projectTwoTagOne: 'Landing',
      projectTwoTagTwo: 'Conversion',
      projectTwoTitle: 'Landing orientada a la accion',
      projectTwoBody: 'Mensaje claro, buena jerarquia de bloques y CTA visibles sin perder estilo.',
      projectTwoActionOne: 'Ver perfil',
      projectTwoActionTwo: 'Quiero algo asi',
      projectThreeTitle: 'Optimizacion de velocidad y lectura',
      projectThreeBody: 'Reducir la friccion visual y tecnica para que toda la experiencia se sienta mas rapida y convincente.',
      projectThreeActionOne: 'Revisar una idea',
      projectFourTagOne: 'Datos',
      projectFourTitle: 'Interfaces operativas y de seguimiento',
      projectFourBody: 'Paneles sobrios para ordenar informacion, procesos internos y puntos de control.',
      projectFourActionOne: 'Explorar repos',
      projectFiveTagOne: 'Accesibilidad',
      projectFiveTagTwo: 'Contenido',
      projectFiveTitle: 'Experiencia mas limpia y accesible',
      projectFiveBody: 'Copy mejor estructurado, contraste mas fuerte y decisiones pensadas para reducir friccion.',
      projectFiveActionOne: 'Conectar',
      projectSixTagOne: 'Automatizacion',
      projectSixTitle: 'Una base que puede seguir creciendo',
      projectSixBody: 'Una estructura simple y cuidada lista para evolucionar de pagina personal a algo mas grande.',
      projectSixActionOne: 'Convertir esto en un caso real',
    },
    contact: {
      eyebrow: 'Contacto',
      title: 'Si vienes a contratar, colaborar o buscar una web mas clara, hablemos.',
      lead: 'Si eres recruiter, cliente o formas parte de un equipo que necesita mas claridad, mejor presencia visual y una ejecucion front-end solida, aqui tienes la forma mas directa de contactar conmigo.',
      primaryAction: 'Escribir por WhatsApp',
      secondaryAction: 'Abrir LinkedIn',
      githubBody: 'Para ver codigo, pruebas y trabajo tecnico.',
      linkedinBody: 'Para revisar perfil, experiencia y contexto profesional.',
      instagramBody: 'Para una parte mas visual y cercana de la marca personal.',
      whatsappBody: 'El canal mas rapido para hablar de proyecto, colaboracion o disponibilidad.',
      footer: '2026 Alvaro Molina. Disponible para colaboraciones, freelance y proyectos web con foco en producto.',
    },
  },
  ru: {
    meta: {
      title: 'Alvaro Molina | Портфолио',
      description: 'Личное портфолио Альваро Молины с фокусом на веб-разработке, визуальной идентичности, производительности и пользовательском опыте.',
    },
    sidebar: {
      eyebrow: 'Личное портфолио',
      role: 'Веб-разработчик с визуальным чутьем и коммерческим мышлением.',
      availability: 'Постоянно улучшаю опыт',
      detailsToggle: 'Показать детали',
      linkedinValue: 'Профессиональный профиль',
      whatsappValue: 'Личное сообщение',
      note: 'Мне нравится создавать интерфейсы, которые внушают доверие, выглядят аккуратно и действительно полезны, а не просто декоративны.',
      primaryAction: 'Давайте поговорим',
      secondaryAction: 'Открыть GitHub',
    },
    controls: {
      quickAria: 'Быстрые настройки',
      languageLabel: 'Язык',
      themeLabel: 'Акцент',
    },
    theme: {
      blue: 'Синий',
      green: 'Зеленый',
      red: 'Красный',
      orange: 'Оранжевый',
      yellow: 'Желтый',
      white: 'Белый',
      pink: 'Розовый',
      black: 'Черный',
    },
    nav: {
      aria: 'Основные разделы',
      about: 'Обо мне',
      focus: 'Подход',
      work: 'Портфолио',
      contact: 'Контакт',
    },
    about: {
      eyebrow: 'Введение',
      title: 'Более личное цифровое присутствие, более ясная структура и более сильный визуальный взгляд.',
      lead: 'Я совмещаю веб-разработку, визуальную структуру и коммерческое мышление, чтобы создавать опыт, который лучше объясняет, кто вы и куда движется проект.',
      primaryAction: 'Связаться',
      secondaryAction: 'Открыть профиль',
      noteOne: 'Ясная иерархия и интерфейс, который меньше похож на шаблон.',
      noteTwo: 'Дополнительное внимание к скорости, читабельности и общему UX.',
      noteThree: 'Сильная основа для демо, реальных кейсов или более глубокой технической работы позже.',
      statusPill: 'web + продажи + продукт',
      metricLabel: 'Профиль',
      metricTitle: 'Разработка с коммерческим пониманием',
      metricBody: 'Сообщение, конверсия и подача работают вместе.',
      servicesTitle: 'Что я привношу',
      featureOneTitle: 'UI с характером',
      featureOneBody: 'Более намеренные макеты, меньше ощущения шаблона и более узнаваемое цифровое присутствие.',
      featureTwoTitle: 'Заметная производительность',
      featureTwoBody: 'Внимание к визуальному весу, структуре и общему ощущению скорости.',
      featureThreeTitle: 'Коммерческое мышление',
      featureThreeBody: 'Хорошо выглядеть недостаточно; опыт должен еще и объяснять ценность и подталкивать к действию.',
      featureFourTitle: 'Чистая реализация',
      featureFourBody: 'Понятные компоненты, редактируемая структура и база, которая может расти вместе с вами.',
      stackTitle: 'Стек и темы, которые я хочу прокачивать дальше',
      stackAccessibility: 'Доступность',
      stackBranding: 'Личный бренд',
      stackConversion: 'Конверсия',
      stackLanding: 'Лендинги',
    },
    focus: {
      eyebrow: 'Подход',
      title: 'Я лучше сделаю сайт, который хорошо коммуницирует, чем шумный сайт без направления.',
      stepOneTitle: '1. Сначала зафиксировать сообщение',
      stepOneBody: 'Я определяю ценностное предложение, тон и главную цель до того, как трогать эффекты или визуальные трюки.',
      stepTwoTitle: '2. Сформировать опыт',
      stepTwoBody: 'Иерархия, ритм чтения и призывы к действию должны ощущаться естественно и быть простыми для восприятия.',
      stepThreeTitle: '3. Строить с намерением',
      stepThreeBody: 'Я работаю на чистой основе, чтобы портфолио выглядело сильным сегодня и оставалось простым в развитии завтра.',
      stepFourTitle: '4. Доработать важное',
      stepFourBody: 'Контраст, отступы, ясность и общий уровень полировки важнее случайной сложности.',
      cardOneLabel: 'Приоритеты',
      cardOneTitle: 'Ясность, доверие и конверсия',
      cardOneBody: 'Сильное первое впечатление требует визуального порядка, согласованности и понятного следующего шага.',
      cardTwoLabel: 'Техническая база',
      cardTwoTitle: 'Чистые HTML, CSS и JavaScript',
      cardTwoBody: 'Мне важно, чтобы визуальная часть выглядела аккуратно и не усложняла поддержку проекта позже.',
      cardThreeLabel: 'Главная идея',
      cardThreeBody: 'Личное портфолио не должно ощущаться как переработанное демо; оно должно быть ясным и уверенным представлением.',
    },
    work: {
      eyebrow: 'Портфолио',
      title: 'Тип работ и решений, которые лучше всего подходят этому профилю.',
      intro: 'Эти карточки показывают тот тип работы, который это портфолио может представлять сегодня и расширять завтра реальными кейсами, демо или конкретными ссылками.',
      filterAria: 'Фильтр проектов',
      filterAll: 'Все',
      filterUi: 'UI',
      filterPerformance: 'Производительность',
      filterSystems: 'Системы',
      projectOneTagOne: 'Брендинг',
      projectOneTagTwo: 'Портфолио',
      projectOneTitle: 'Персональное портфолио в стиле vCard',
      projectOneBody: 'Компактная и элегантная главная страница, чтобы быстро показать профиль, ценность и призывы к действию.',
      projectOneActionOne: 'Открыть GitHub',
      projectOneActionTwo: 'Обсудить это',
      projectTwoTagOne: 'Лендинг',
      projectTwoTagTwo: 'Конверсия',
      projectTwoTitle: 'Лендинг, ориентированный на действие',
      projectTwoBody: 'Понятное сообщение, сильная иерархия блоков и заметные CTA без потери стиля.',
      projectTwoActionOne: 'Открыть профиль',
      projectTwoActionTwo: 'Хочу что-то похожее',
      projectThreeTitle: 'Оптимизация скорости и ритма чтения',
      projectThreeBody: 'Снизить визуальное и техническое трение, чтобы весь опыт ощущался быстрее и убедительнее.',
      projectThreeActionOne: 'Обсудить идею',
      projectFourTagOne: 'Данные',
      projectFourTitle: 'Операционные и трекинговые интерфейсы',
      projectFourBody: 'Сдержанные панели для организации информации, внутренних процессов и контрольных точек.',
      projectFourActionOne: 'Посмотреть репозитории',
      projectFiveTagOne: 'Доступность',
      projectFiveTagTwo: 'Контент',
      projectFiveTitle: 'Более чистый и доступный опыт',
      projectFiveBody: 'Более четкая структура текста, сильнее контраст и решения, снижающие трение.',
      projectFiveActionOne: 'Связаться',
      projectSixTagOne: 'Автоматизация',
      projectSixTitle: 'База, которая может расти',
      projectSixBody: 'Простая и аккуратная структура, готовая вырасти из личной страницы во что-то большее.',
      projectSixActionOne: 'Сделать из этого реальный кейс',
    },
    contact: {
      eyebrow: 'Контакт',
      title: 'Если вы хотите нанять, сотрудничать или усилить цифровое присутствие, давайте поговорим.',
      lead: 'Если вы рекрутер, клиент или часть команды, которой нужны более ясная подача, сильнее визуальная презентация и уверенная front-end реализация, здесь со мной проще всего связаться.',
      primaryAction: 'Написать в WhatsApp',
      secondaryAction: 'Открыть LinkedIn',
      githubBody: 'Посмотреть код, эксперименты и техническую работу.',
      linkedinBody: 'Понять опыт, профиль и профессиональный контекст.',
      instagramBody: 'Более визуальная и личная сторона бренда.',
      whatsappBody: 'Самый быстрый канал для разговора о проекте, сотрудничестве или доступности.',
      footer: '2026 Alvaro Molina. Открыт к сотрудничеству, фрилансу и продуктовым веб-проектам.',
    },
  },
  zh: {
    meta: {
      title: 'Alvaro Molina | 作品集',
      description: 'Alvaro Molina 的个人作品集，聚焦网页开发、视觉识别、性能和用户体验。',
    },
    sidebar: {
      eyebrow: '个人作品集',
      role: '有审美和商业思维的 Web 开发者。',
      availability: '持续打磨体验',
      detailsToggle: '显示详情',
      linkedinValue: '职业档案',
      whatsappValue: '直接消息',
      note: '我喜欢打造让人信任、足够精致而且真正有用的界面，而不只是装饰性的页面。',
      primaryAction: '聊一聊',
      secondaryAction: '查看 GitHub',
    },
    controls: {
      quickAria: '快捷控制',
      languageLabel: '语言',
      themeLabel: '主色',
    },
    theme: {
      blue: '蓝色',
      green: '绿色',
      red: '红色',
      orange: '橙色',
      yellow: '黄色',
      white: '白色',
      pink: '粉色',
      black: '黑色',
    },
    nav: {
      aria: '主要版块',
      about: '关于我',
      focus: '方法',
      work: '作品集',
      contact: '联系',
    },
    about: {
      eyebrow: '介绍',
      title: '更个人化的数字形象、更清晰的结构，以及更有辨识度的视觉视角。',
      lead: '我把网页开发、视觉结构和商业思维结合起来，打造能更好说明你是谁、项目要去哪里的体验。',
      primaryAction: '立即联系',
      secondaryAction: '查看档案',
      noteOne: '层级更清晰，界面也更少模板感。',
      noteTwo: '更加关注速度、可读性和整体体验。',
      noteThree: '为未来加入真实案例、演示或更深入的技术工作打下更强的基础。',
      statusPill: 'web + sales + product',
      metricLabel: '定位',
      metricTitle: '带有商业意识的开发',
      metricBody: '表达、转化和呈现一起协同工作。',
      servicesTitle: '我能带来的价值',
      featureOneTitle: '有个性的 UI',
      featureOneBody: '更有意图的布局、更少模板味道，以及更容易被记住的数字形象。',
      featureTwoTitle: '看得见的性能',
      featureTwoBody: '关注视觉重量、结构和整体速度感。',
      featureThreeTitle: '商业思维',
      featureThreeBody: '好看还不够；体验还要能说明价值并推动行动。',
      featureFourTitle: '干净的交付',
      featureFourBody: '清晰的组件、可编辑的结构，以及能继续成长的基础。',
      stackTitle: '我想继续打磨的技术栈和方向',
      stackAccessibility: '无障碍',
      stackBranding: '个人品牌',
      stackConversion: '转化',
      stackLanding: '落地页',
    },
    focus: {
      eyebrow: '方法',
      title: '我更愿意做一个沟通清晰的网站，而不是一个热闹却没有方向的网站。',
      stepOneTitle: '1. 先把信息讲清楚',
      stepOneBody: '在碰效果或视觉技巧之前，我会先定义价值主张、语气和核心目标。',
      stepTwoTitle: '2. 设计整体体验',
      stepTwoBody: '层级、阅读节奏和行动按钮都应该自然、顺滑、容易理解。',
      stepThreeTitle: '3. 有意图地搭建',
      stepThreeBody: '我会从干净的基础开始，让作品集今天看起来有说服力，明天也容易继续演进。',
      stepFourTitle: '4. 打磨真正重要的部分',
      stepFourBody: '对比、留白、清晰度和整体质感，比随机堆复杂度更重要。',
      cardOneLabel: '优先级',
      cardOneTitle: '清晰、信任与转化',
      cardOneBody: '好的第一印象需要视觉秩序、一致性和明确的下一步。',
      cardTwoLabel: '技术基础',
      cardTwoTitle: '干净实现的 HTML、CSS 和 JavaScript',
      cardTwoBody: '我希望视觉效果足够精致，同时不会让项目后续更难维护。',
      cardThreeLabel: '核心想法',
      cardThreeBody: '个人作品集不该像重复使用的 demo，而应该像一次清晰、自信的自我介绍。',
    },
    work: {
      eyebrow: '作品集',
      title: '最适合这个个人定位的作品类型与解决方案。',
      intro: '这些卡片展示了这个作品集今天可以承载的工作类型，也能在未来扩展成真实案例、演示或具体链接。',
      filterAria: '筛选项目',
      filterAll: '全部',
      filterUi: 'UI',
      filterPerformance: '性能',
      filterSystems: '系统',
      projectOneTagOne: '品牌',
      projectOneTagTwo: '作品集',
      projectOneTitle: '定制化 vCard 作品集',
      projectOneBody: '一个紧凑而优雅的首页，用更快的方式展示个人定位、价值和行动入口。',
      projectOneActionOne: '查看 GitHub',
      projectOneActionTwo: '聊聊这个',
      projectTwoTagOne: '落地页',
      projectTwoTagTwo: '转化',
      projectTwoTitle: '以行动为导向的落地页',
      projectTwoBody: '信息清晰、模块层级明确、行动按钮醒目，同时保留足够的风格感。',
      projectTwoActionOne: '查看档案',
      projectTwoActionTwo: '我想要类似的',
      projectThreeTitle: '速度与阅读流优化',
      projectThreeBody: '减少视觉和技术层面的摩擦，让整体体验更快、更有说服力。',
      projectThreeActionOne: '讨论一个想法',
      projectFourTagOne: '数据',
      projectFourTitle: '运营与追踪界面',
      projectFourBody: '更克制的面板，用来整理信息、内部流程和关键控制点。',
      projectFourActionOne: '浏览仓库',
      projectFiveTagOne: '无障碍',
      projectFiveTagTwo: '内容',
      projectFiveTitle: '更干净、更易访问的体验',
      projectFiveBody: '更清晰的文案结构、更强的对比度，以及减少摩擦的设计决策。',
      projectFiveActionOne: '联系我',
      projectSixTagOne: '自动化',
      projectSixTitle: '一套还能继续成长的基础',
      projectSixBody: '简单而精致的结构，能够从个人页面继续演进成更完整的东西。',
      projectSixActionOne: '把它变成真实案例',
    },
    contact: {
      eyebrow: '联系',
      title: '如果你在寻找合作、招聘，或想让网站表达更清晰，我们聊聊。',
      lead: '如果你是招聘方、客户，或团队里正在寻找更强的前端执行、视觉表达和信息清晰度的人，这里是联系我最快的地方。',
      primaryAction: '通过 WhatsApp 联系',
      secondaryAction: '打开 LinkedIn',
      githubBody: '查看代码样例、实验和技术实现。',
      linkedinBody: '了解经历、背景和职业信息。',
      instagramBody: '更轻松、更视觉化的个人品牌侧面。',
      whatsappBody: '最快讨论项目、合作或档期的渠道。',
      footer: '2026 Alvaro Molina。可合作、可接 freelance，也欢迎偏产品导向的网页项目。',
    },
  },
  pl: {
    meta: {
      title: 'Alvaro Molina | Portfolio',
      description: 'Osobiste portfolio Alvaro Moliny skupione na web developmencie, identyfikacji wizualnej, wydajnosci i UX.',
    },
    sidebar: {
      eyebrow: 'Portfolio osobiste',
      role: 'Web developer z wyczuciem wizualnym i komercyjnym podejsciem.',
      availability: 'Caly czas dopracowuje doswiadczenie',
      detailsToggle: 'Pokaz szczegoly',
      linkedinValue: 'Profil zawodowy',
      whatsappValue: 'Wiadomosc bezposrednia',
      note: 'Lubie tworzyc interfejsy, ktore budza zaufanie, wygladaja schludnie i sa naprawde uzyteczne, a nie tylko dekoracyjne.',
      primaryAction: 'Porozmawiajmy',
      secondaryAction: 'Zobacz GitHub',
    },
    controls: {
      quickAria: 'Szybkie kontrolki',
      languageLabel: 'Jezyk',
      themeLabel: 'Akcent',
    },
    theme: {
      blue: 'Niebieski',
      green: 'Zielony',
      red: 'Czerwony',
      orange: 'Pomaranczowy',
      yellow: 'Zolty',
      white: 'Bialy',
      pink: 'Rozowy',
      black: 'Czarny',
    },
    nav: {
      aria: 'Glowne sekcje',
      about: 'O mnie',
      focus: 'Podejscie',
      work: 'Portfolio',
      contact: 'Kontakt',
    },
    about: {
      eyebrow: 'Wstep',
      title: 'Bardziej osobista obecnosc online, czytelniejsza struktura i mocniejszy wizualny charakter.',
      lead: 'Lacze web development, strukture wizualna i myslenie komercyjne, aby tworzyc doswiadczenia, ktore lepiej tlumacza kim jestes i dokad zmierza projekt.',
      primaryAction: 'Skontaktuj sie',
      secondaryAction: 'Zobacz profil',
      noteOne: 'Jasna hierarchia i interfejs, ktory mniej przypomina gotowy szablon.',
      noteTwo: 'Wieksza dbalosc o szybkosc, czytelnosc i ogolne UX.',
      noteThree: 'Mocna baza pod dema, prawdziwe case studies i glebsza prace techniczna w przyszlosci.',
      statusPill: 'web + sales + product',
      metricLabel: 'Profil',
      metricTitle: 'Development z komercyjnym wyczuciem',
      metricBody: 'Przekaz, konwersja i prezentacja pracuja razem.',
      servicesTitle: 'Co wnosze',
      featureOneTitle: 'UI z charakterem',
      featureOneBody: 'Bardziej swiadome layouty, mniej energii szablonu i bardziej rozpoznawalna obecnosc cyfrowa.',
      featureTwoTitle: 'Widoczna wydajnosc',
      featureTwoBody: 'Troska o ciezar wizualny, strukture i ogolne poczucie szybkosci.',
      featureThreeTitle: 'Komercyjne myslenie',
      featureThreeBody: 'Sam wyglad nie wystarczy; doswiadczenie powinno tez wyjasniac wartosc i prowadzic do dzialania.',
      featureFourTitle: 'Czyste dostarczenie',
      featureFourBody: 'Jasne komponenty, edytowalna struktura i baza, ktora moze rosnac razem z toba.',
      stackTitle: 'Stack i obszary, ktore chce dalej szlifowac',
      stackAccessibility: 'Dostepnosc',
      stackBranding: 'Marka osobista',
      stackConversion: 'Konwersja',
      stackLanding: 'Landing page',
    },
    focus: {
      eyebrow: 'Podejscie',
      title: 'Wole zbudowac strone, ktora dobrze komunikuje, niz glosna strone bez kierunku.',
      stepOneTitle: '1. Najpierw dopracowac przekaz',
      stepOneBody: 'Zanim dotkne efektow czy wizualnych trikow, definiuje propozycje wartosci, ton i glowny cel.',
      stepTwoTitle: '2. Ulozyc cale doswiadczenie',
      stepTwoBody: 'Hierarchia, rytm czytania i CTA powinny byc naturalne i latwe do sledzenia.',
      stepThreeTitle: '3. Budowac z intencja',
      stepThreeBody: 'Pracuje na czystej bazie, aby portfolio wygladalo mocno dzis i bylo latwe do rozwijania jutro.',
      stepFourTitle: '4. Dopracowac to, co najwazniejsze',
      stepFourBody: 'Kontrast, odstepy, czytelnosc i ogolne dopieszczenie sa wazniejsze niz przypadkowa zlozonosc.',
      cardOneLabel: 'Priorytety',
      cardOneTitle: 'Jasnosc, zaufanie i konwersja',
      cardOneBody: 'Mocne pierwsze wrazenie potrzebuje porzadku wizualnego, spojnosc i jasnego kolejnego kroku.',
      cardTwoLabel: 'Baza techniczna',
      cardTwoTitle: 'Czyste HTML, CSS i JavaScript',
      cardTwoBody: 'Chce, aby warstwa wizualna byla dopracowana bez utrudniania utrzymania projektu pozniej.',
      cardThreeLabel: 'Glowna idea',
      cardThreeBody: 'Portfolio osobiste nie powinno wygladac jak recykling demo; powinno byc jasnym i pewnym przedstawieniem.',
    },
    work: {
      eyebrow: 'Portfolio',
      title: 'Rodzaj materialow i rozwiazan, ktore najlepiej pasuja do tego profilu.',
      intro: 'Te karty pokazuja typ pracy, jaki to portfolio moze reprezentowac dzis i rozbudowac jutro o prawdziwe case studies, dema lub konkretne linki.',
      filterAria: 'Filtruj projekty',
      filterAll: 'Wszystko',
      filterUi: 'UI',
      filterPerformance: 'Wydajnosc',
      filterSystems: 'Systemy',
      projectOneTagOne: 'Branding',
      projectOneTagTwo: 'Portfolio',
      projectOneTitle: 'Portfolio vCard szyte na miare',
      projectOneBody: 'Zwarta i elegancka strona glowna zaprojektowana tak, by szybko pokazac profil, wartosc i wezwania do dzialania.',
      projectOneActionOne: 'Zobacz GitHub',
      projectOneActionTwo: 'Porozmawiajmy o tym',
      projectTwoTagOne: 'Landing',
      projectTwoTagTwo: 'Konwersja',
      projectTwoTitle: 'Landing page nastawiony na dzialanie',
      projectTwoBody: 'Czytelny przekaz, mocna hierarchia blokow i widoczne CTA bez utraty stylu.',
      projectTwoActionOne: 'Zobacz profil',
      projectTwoActionTwo: 'Chce cos takiego',
      projectThreeTitle: 'Optymalizacja szybkosci i rytmu czytania',
      projectThreeBody: 'Ograniczenie tarcia wizualnego i technicznego, aby cale doswiadczenie bylo szybsze i bardziej przekonujace.',
      projectThreeActionOne: 'Omowic pomysl',
      projectFourTagOne: 'Dane',
      projectFourTitle: 'Interfejsy operacyjne i monitoring',
      projectFourBody: 'Stonowane panele do porzadkowania informacji, procesow wewnetrznych i punktow kontrolnych.',
      projectFourActionOne: 'Przegladaj repozytoria',
      projectFiveTagOne: 'Dostepnosc',
      projectFiveTagTwo: 'Tresc',
      projectFiveTitle: 'Czystsze i bardziej dostepne doswiadczenie',
      projectFiveBody: 'Lepsza struktura copy, mocniejszy kontrast i decyzje projektowe, ktore zmniejszaja tarcie.',
      projectFiveActionOne: 'Skontaktuj sie',
      projectSixTagOne: 'Automatyzacja',
      projectSixTitle: 'Baza, ktora moze dalej rosnac',
      projectSixBody: 'Prosta, dopracowana struktura gotowa rozwinac sie z osobistej strony w cos wiekszego.',
      projectSixActionOne: 'Zmien to w prawdziwy case',
    },
    contact: {
      eyebrow: 'Kontakt',
      title: 'Jesli chcesz zatrudnic, wspolpracowac albo poprawic to, jak twoja strona komunikuje, porozmawiajmy.',
      lead: 'Jesli jestes rekruterem, klientem albo czescia zespolu, ktory potrzebuje lepszej przejrzystosci, mocniejszej prezentacji i solidnego front-endu, tutaj najszybciej sie ze mna skontaktujesz.',
      primaryAction: 'Napisz na WhatsApp',
      secondaryAction: 'Otworz LinkedIn',
      githubBody: 'Zobacz kod, eksperymenty i prace techniczne.',
      linkedinBody: 'Sprawdz profil, doswiadczenie i kontekst zawodowy.',
      instagramBody: 'Bardziej wizualna i bardziej osobista strona marki.',
      whatsappBody: 'Najszybszy kanal, aby pogadac o projekcie, wspolpracy lub dostepnosci.',
      footer: '2026 Alvaro Molina. Otwarty na wspolprace, freelance i webowe projekty produktowe.',
    },
  },
  de: {
    meta: {
      title: 'Alvaro Molina | Portfolio',
      description: 'Persoenliches Portfolio von Alvaro Molina mit Fokus auf Webentwicklung, visuelle Identitaet, Performance und Nutzererlebnis.',
    },
    sidebar: {
      eyebrow: 'Persoenliches Portfolio',
      role: 'Webentwickler mit visuellem Gespuer und kommerziellem Denken.',
      availability: 'Ich verfeinere die Erfahrung laufend',
      detailsToggle: 'Details anzeigen',
      linkedinValue: 'Berufliches Profil',
      whatsappValue: 'Direkte Nachricht',
      note: 'Ich moechte Interfaces bauen, die Vertrauen vermitteln, sauber wirken und wirklich nuetzlich sind, nicht nur dekorativ.',
      primaryAction: 'Lass uns sprechen',
      secondaryAction: 'GitHub ansehen',
    },
    controls: {
      quickAria: 'Schnellsteuerung',
      languageLabel: 'Sprache',
      themeLabel: 'Akzent',
    },
    theme: {
      blue: 'Blau',
      green: 'Gruen',
      red: 'Rot',
      orange: 'Orange',
      yellow: 'Gelb',
      white: 'Weiss',
      pink: 'Pink',
      black: 'Schwarz',
    },
    nav: {
      aria: 'Hauptbereiche',
      about: 'Ueber mich',
      focus: 'Ansatz',
      work: 'Portfolio',
      contact: 'Kontakt',
    },
    about: {
      eyebrow: 'Einfuehrung',
      title: 'Eine persoenlichere digitale Praesenz, eine klarere Struktur und ein staerkerer visueller Blick.',
      lead: 'Ich verbinde Webentwicklung, visuelle Struktur und kommerzielles Denken, um Erlebnisse zu bauen, die besser erklaeren, wer du bist und wohin sich ein Projekt bewegt.',
      primaryAction: 'Jetzt kontaktieren',
      secondaryAction: 'Profil ansehen',
      noteOne: 'Klare Hierarchie und eine Oberflaeche mit weniger Template-Gefuehl.',
      noteTwo: 'Mehr Sorgfalt bei Tempo, Lesbarkeit und dem gesamten UX-Gefuehl.',
      noteThree: 'Eine starke Basis fuer Demos, echte Fallstudien oder spaetere tiefere technische Arbeit.',
      statusPill: 'web + sales + product',
      metricLabel: 'Profil',
      metricTitle: 'Entwicklung mit kommerziellem Blick',
      metricBody: 'Botschaft, Conversion und Praesentation arbeiten zusammen.',
      servicesTitle: 'Was ich einbringe',
      featureOneTitle: 'UI mit Persoenlichkeit',
      featureOneBody: 'Bewusstere Layouts, weniger Template-Energie und eine digitale Praesenz mit mehr Wiedererkennung.',
      featureTwoTitle: 'Sichtbare Performance',
      featureTwoBody: 'Sorgfalt fuer visuelles Gewicht, Struktur und das allgemeine Gefuehl von Geschwindigkeit.',
      featureThreeTitle: 'Kommerzielles Denken',
      featureThreeBody: 'Gut auszusehen reicht nicht; die Erfahrung sollte auch Wert erklaeren und zum Handeln fuehren.',
      featureFourTitle: 'Saubere Umsetzung',
      featureFourBody: 'Klare Komponenten, editierbare Struktur und eine Basis, die mit dir weiter wachsen kann.',
      stackTitle: 'Stack und Themen, die ich weiter schaerfen will',
      stackAccessibility: 'Barrierefreiheit',
      stackBranding: 'Personal Branding',
      stackConversion: 'Conversion',
      stackLanding: 'Landingpages',
    },
    focus: {
      eyebrow: 'Ansatz',
      title: 'Ich baue lieber eine Website, die klar kommuniziert, als eine laute Website ohne Richtung.',
      stepOneTitle: '1. Zuerst die Botschaft festziehen',
      stepOneBody: 'Ich definiere Wertversprechen, Ton und Hauptziel, bevor ich Effekte oder visuelle Tricks anfasse.',
      stepTwoTitle: '2. Die Erfahrung formen',
      stepTwoBody: 'Hierarchie, Lesefluss und CTAs sollten sich natuerlich anfuehlen und leicht zu verfolgen sein.',
      stepThreeTitle: '3. Mit Absicht bauen',
      stepThreeBody: 'Ich arbeite auf einer sauberen Basis, damit das Portfolio heute stark aussieht und morgen leicht weiterentwickelt werden kann.',
      stepFourTitle: '4. Das Wichtige verfeinern',
      stepFourBody: 'Kontrast, Abstaende, Klarheit und Gesamtpolitur sind wichtiger als zufaellige Komplexitaet.',
      cardOneLabel: 'Prioritaeten',
      cardOneTitle: 'Klarheit, Vertrauen und Conversion',
      cardOneBody: 'Ein starker erster Eindruck braucht visuelle Ordnung, Konsistenz und einen klaren naechsten Schritt.',
      cardTwoLabel: 'Technische Basis',
      cardTwoTitle: 'Sauberes HTML, CSS und JavaScript',
      cardTwoBody: 'Ich moechte, dass die visuelle Seite sauber wirkt, ohne das Projekt spaeter schwerer wartbar zu machen.',
      cardThreeLabel: 'Kernidee',
      cardThreeBody: 'Ein persoenliches Portfolio sollte sich nicht wie ein recyceltes Demo anfuehlen; es sollte wie eine klare, selbstbewusste Vorstellung wirken.',
    },
    work: {
      eyebrow: 'Portfolio',
      title: 'Die Art von Arbeiten und Loesungen, die am besten zu diesem Profil passen.',
      intro: 'Diese Karten zeigen die Art von Arbeit, die dieses Portfolio heute darstellen kann und morgen mit echten Cases, Demos oder konkreten Links erweitern kann.',
      filterAria: 'Projekte filtern',
      filterAll: 'Alle',
      filterUi: 'UI',
      filterPerformance: 'Performance',
      filterSystems: 'Systeme',
      projectOneTagOne: 'Branding',
      projectOneTagTwo: 'Portfolio',
      projectOneTitle: 'Individuelles vCard-Portfolio',
      projectOneBody: 'Eine kompakte, elegante Startseite, um Profil, Wert und Handlungsaufrufe schnell zu praesentieren.',
      projectOneActionOne: 'GitHub ansehen',
      projectOneActionTwo: 'Darueber sprechen',
      projectTwoTagOne: 'Landingpage',
      projectTwoTagTwo: 'Conversion',
      projectTwoTitle: 'Handlungsorientierte Landingpage',
      projectTwoBody: 'Klare Botschaft, starke Block-Hierarchie und sichtbare CTAs ohne Stil zu verlieren.',
      projectTwoActionOne: 'Profil ansehen',
      projectTwoActionTwo: 'Ich will etwas Aehnliches',
      projectThreeTitle: 'Optimierung von Geschwindigkeit und Lesefluss',
      projectThreeBody: 'Visuelle und technische Reibung reduzieren, damit sich die gesamte Erfahrung schneller und ueberzeugender anfuehlt.',
      projectThreeActionOne: 'Eine Idee pruefen',
      projectFourTagOne: 'Daten',
      projectFourTitle: 'Operative und Tracking-Interfaces',
      projectFourBody: 'Nuechterne Panels zum Ordnen von Informationen, internen Prozessen und Kontrollpunkten.',
      projectFourActionOne: 'Repos erkunden',
      projectFiveTagOne: 'Barrierefreiheit',
      projectFiveTagTwo: 'Inhalt',
      projectFiveTitle: 'Sauberere, zugaenglichere Erfahrung',
      projectFiveBody: 'Bessere Textstruktur, staerkerer Kontrast und Entscheidungen, die Reibung verringern.',
      projectFiveActionOne: 'Kontakt aufnehmen',
      projectSixTagOne: 'Automatisierung',
      projectSixTitle: 'Eine Basis, die weiter wachsen kann',
      projectSixBody: 'Eine einfache, saubere Struktur, bereit, von einer persoenlichen Seite zu etwas Groesserem zu werden.',
      projectSixActionOne: 'Mach daraus einen echten Case',
    },
    contact: {
      eyebrow: 'Kontakt',
      title: 'Wenn du jemanden fuer Zusammenarbeit, Einstellung oder eine klarere Webpraesenz suchst, lass uns sprechen.',
      lead: 'Wenn du Recruiter, Kunde oder Teil eines Teams bist, das mehr Klarheit, staerkere Praesentation und saubere Frontend-Umsetzung braucht, ist das hier der direkteste Weg zu mir.',
      primaryAction: 'Auf WhatsApp schreiben',
      secondaryAction: 'LinkedIn oeffnen',
      githubBody: 'Code, Experimente und technische Arbeit ansehen.',
      linkedinBody: 'Profil, Erfahrung und beruflichen Kontext pruefen.',
      instagramBody: 'Die visuellere und persoenlichere Seite der Marke.',
      whatsappBody: 'Der schnellste Kanal fuer Projektanfragen, Zusammenarbeit oder Verfuegbarkeit.',
      footer: '2026 Alvaro Molina. Offen fuer Zusammenarbeit, Freelance und produktorientierte Webprojekte.',
    },
  },
  ar: {
    meta: {
      title: 'Alvaro Molina | الملف الشخصي',
      description: 'ملف أعمال شخصي لألفارو مولينا يركز على تطوير الويب والهوية البصرية والأداء وتجربة المستخدم.',
    },
    sidebar: {
      eyebrow: 'ملف شخصي',
      role: 'مطور ويب بعين بصرية وفكر تجاري.',
      availability: 'أواصل تحسين التجربة',
      detailsToggle: 'إظهار التفاصيل',
      linkedinValue: 'الملف المهني',
      whatsappValue: 'رسالة مباشرة',
      note: 'أحب بناء واجهات تمنح الثقة، تبدو متقنة، وتكون مفيدة فعلا لا مجرد شيء زخرفي.',
      primaryAction: 'لنتحدث',
      secondaryAction: 'عرض GitHub',
    },
    controls: {
      quickAria: 'عناصر التحكم السريعة',
      languageLabel: 'اللغة',
      themeLabel: 'اللون الرئيسي',
    },
    theme: {
      blue: 'أزرق',
      green: 'أخضر',
      red: 'أحمر',
      orange: 'برتقالي',
      yellow: 'أصفر',
      white: 'أبيض',
      pink: 'وردي',
      black: 'أسود',
    },
    nav: {
      aria: 'الأقسام الرئيسية',
      about: 'نبذة',
      focus: 'المنهج',
      work: 'الأعمال',
      contact: 'التواصل',
    },
    about: {
      eyebrow: 'مقدمة',
      title: 'حضور رقمي أكثر شخصية، وهيكل أوضح، ونظرة بصرية أقوى.',
      lead: 'أجمع بين تطوير الويب، والبنية البصرية، والتفكير التجاري لصناعة تجارب تشرح بشكل أفضل من أنت وإلى أين يتجه المشروع.',
      primaryAction: 'تواصل الآن',
      secondaryAction: 'عرض الملف',
      noteOne: 'تسلسل بصري أوضح وواجهة أقل إحساسا بالقوالب الجاهزة.',
      noteTwo: 'اهتمام أكبر بالسرعة، وسهولة القراءة، وتجربة الاستخدام العامة.',
      noteThree: 'قاعدة قوية للعروض، ودراسات الحالة الحقيقية، والعمل التقني الأعمق لاحقا.',
      statusPill: 'web + sales + product',
      metricLabel: 'الملف',
      metricTitle: 'تطوير بوعي تجاري',
      metricBody: 'الرسالة والتحويل والعرض يعملون معا.',
      servicesTitle: 'ما الذي أقدمه',
      featureOneTitle: 'واجهة بشخصية',
      featureOneBody: 'تخطيطات أكثر قصدا، وإحساس أقل بالقالب، وحضور رقمي أسهل في التذكر.',
      featureTwoTitle: 'أداء ملموس',
      featureTwoBody: 'اهتمام بالوزن البصري، والبنية، والإحساس العام بالسرعة.',
      featureThreeTitle: 'عقلية تجارية',
      featureThreeBody: 'الجمال وحده لا يكفي؛ يجب أن تشرح التجربة القيمة وتدفع إلى الفعل.',
      featureFourTitle: 'تسليم نظيف',
      featureFourBody: 'مكونات واضحة، وهيكل قابل للتعديل، وقاعدة يمكنها أن تنمو معك.',
      stackTitle: 'التقنيات والموضوعات التي أريد صقلها أكثر',
      stackAccessibility: 'إمكانية الوصول',
      stackBranding: 'العلامة الشخصية',
      stackConversion: 'التحويل',
      stackLanding: 'صفحات الهبوط',
    },
    focus: {
      eyebrow: 'المنهج',
      title: 'أفضل أن أبني موقعا يتواصل بوضوح على موقع صاخب بلا اتجاه.',
      stepOneTitle: '1. تثبيت الرسالة أولا',
      stepOneBody: 'أحدد عرض القيمة، والنبرة، والهدف الرئيسي قبل لمس المؤثرات أو الحيل البصرية.',
      stepTwoTitle: '2. تشكيل التجربة',
      stepTwoBody: 'يجب أن تبدو الهرمية، وإيقاع القراءة، والدعوات إلى الإجراء طبيعية وسهلة المتابعة.',
      stepThreeTitle: '3. البناء بنية واضحة',
      stepThreeBody: 'أعمل على قاعدة نظيفة حتى يبدو هذا الملف قويا اليوم ويبقى سهلا في التطوير غدا.',
      stepFourTitle: '4. صقل ما يهم',
      stepFourBody: 'التباين، والمسافات، والوضوح، والصقل العام أهم من التعقيد العشوائي.',
      cardOneLabel: 'الأولويات',
      cardOneTitle: 'الوضوح، والثقة، والتحويل',
      cardOneBody: 'الانطباع الأول القوي يحتاج إلى ترتيب بصري واتساق وخطوة تالية واضحة.',
      cardTwoLabel: 'القاعدة التقنية',
      cardTwoTitle: 'HTML و CSS و JavaScript بشكل نظيف',
      cardTwoBody: 'أريد أن تبدو الجهة البصرية متقنة من دون أن يصبح المشروع أصعب في الصيانة لاحقا.',
      cardThreeLabel: 'الفكرة الأساسية',
      cardThreeBody: 'لا ينبغي أن يبدو الملف الشخصي كأنه عرض تجريبي معاد الاستخدام؛ بل يجب أن يكون تقديما واضحا وواثقا.',
    },
    work: {
      eyebrow: 'الأعمال',
      title: 'نوع القطع والحلول التي تناسب هذا الملف أكثر.',
      intro: 'توضح هذه البطاقات نوع العمل الذي يمكن لهذا الملف أن يمثله اليوم، ثم يوسعه لاحقا بدراسات حالة حقيقية أو عروض أو روابط محددة.',
      filterAria: 'تصفية المشاريع',
      filterAll: 'الكل',
      filterUi: 'الواجهة',
      filterPerformance: 'الأداء',
      filterSystems: 'الأنظمة',
      projectOneTagOne: 'هوية',
      projectOneTagTwo: 'ملف شخصي',
      projectOneTitle: 'ملف vCard مخصص',
      projectOneBody: 'صفحة رئيسية مضغوطة وأنيقة لعرض الملف والقيمة والدعوات إلى الإجراء بسرعة.',
      projectOneActionOne: 'عرض GitHub',
      projectOneActionTwo: 'لنتحدث عنه',
      projectTwoTagOne: 'Landing',
      projectTwoTagTwo: 'تحويل',
      projectTwoTitle: 'صفحة هبوط موجهة للفعل',
      projectTwoBody: 'رسالة واضحة، وتسلسل قوي للكتل، ودعوات ظاهرة إلى الإجراء من دون خسارة الأسلوب.',
      projectTwoActionOne: 'عرض الملف',
      projectTwoActionTwo: 'أريد شيئا مشابها',
      projectThreeTitle: 'تحسين السرعة وسلاسة القراءة',
      projectThreeBody: 'تقليل الاحتكاك البصري والتقني حتى تبدو التجربة كلها أسرع وأكثر إقناعا.',
      projectThreeActionOne: 'مراجعة فكرة',
      projectFourTagOne: 'بيانات',
      projectFourTitle: 'واجهات تشغيل ومتابعة',
      projectFourBody: 'لوحات هادئة لتنظيم المعلومات والعمليات الداخلية ونقاط التحكم.',
      projectFourActionOne: 'استكشاف المستودعات',
      projectFiveTagOne: 'إمكانية الوصول',
      projectFiveTagTwo: 'المحتوى',
      projectFiveTitle: 'تجربة أنظف وأسهل وصولا',
      projectFiveBody: 'بنية نصية أوضح، وتباين أقوى، وقرارات تقلل الاحتكاك.',
      projectFiveActionOne: 'تواصل',
      projectSixTagOne: 'أتمتة',
      projectSixTitle: 'قاعدة يمكنها أن تنمو',
      projectSixBody: 'هيكل بسيط ومتقن جاهز ليتطور من صفحة شخصية إلى شيء أكبر.',
      projectSixActionOne: 'حوّل هذا إلى حالة حقيقية',
    },
    contact: {
      eyebrow: 'التواصل',
      title: 'إذا كنت تبحث عن تعاون، توظيف، أو حضور ويب أوضح، فلنتحدث.',
      lead: 'إذا كنت مسؤولا عن التوظيف، أو عميلا، أو جزءا من فريق يحتاج إلى وضوح أفضل، وحضور بصري أقوى، وتنفيذ Front-end متقن، فهذا هو الطريق الأسرع للتواصل معي.',
      primaryAction: 'راسلني عبر WhatsApp',
      secondaryAction: 'افتح LinkedIn',
      githubBody: 'للاطلاع على الكود، والتجارب، والعمل التقني.',
      linkedinBody: 'لمراجعة الخبرة، والملف المهني، والسياق العملي.',
      instagramBody: 'الجانب الأكثر خفة وبصرية من العلامة الشخصية.',
      whatsappBody: 'أسرع قناة للحديث عن مشروع أو تعاون أو التوفر.',
      footer: '2026 Alvaro Molina. متاح للتعاون، والأعمال الحرة، ومشاريع الويب ذات التوجه المنتج.',
    },
  },
  and: {
    meta: {
      title: 'Alvaro Molina | Portfolio',
      description: "Portfolio personal d'Alvaro Molina con sentío pa'l desarrollo web, la identidá visual, er rendimiento y la experiencia d'usuario.",
    },
    sidebar: {
      eyebrow: 'Portfolio personal',
      role: 'Desarrollaó web con ojo visual y cabesa comercial.',
      availability: "Siempre afinando er sentío d'la experiencia",
      detailsToggle: 'Ver er detalle',
      linkedinValue: 'Perfil profesional',
      whatsappValue: 'Mensaje der tirón',
      note: 'Me gusta montar interfaces que den confianza, se vean apañás y sirvan de verdá, no solo pa echar er rato.',
      primaryAction: 'Hablemo',
      secondaryAction: 'Ver GitHub',
    },
    controls: {
      quickAria: 'Controles rapiditos',
      languageLabel: 'Idioma',
      themeLabel: 'Acento',
    },
    theme: {
      blue: 'Azul',
      green: 'Verde',
      red: 'Rojo',
      orange: 'Naranja',
      yellow: 'Amarillo',
      white: 'Blanco',
      pink: 'Rosa',
      black: 'Negro',
    },
    nav: {
      aria: 'Secciones principaleh',
      about: 'Sobre mí',
      focus: 'Enfoque',
      work: 'Portfolio',
      contact: 'Contacto',
    },
    about: {
      eyebrow: 'Presentasión',
      title: 'Una presencia digital más tuya, una estructura más clarita y un punto de vista visual con más empaque.',
      lead: "Mezclo desarrollo web, estructura visual y cabesa comercial pa crear experiencias que cuentan mejor quién eres y pa dónde va er proyecto.",
      primaryAction: 'Contactar ya',
      secondaryAction: 'Ver perfil',
      noteOne: 'Jerarquía clara y una interfaz con menos cara de plantilla.',
      noteTwo: 'Mimito extra en velocidá, legibilidá y experiencia general.',
      noteThree: 'Una base firme pa demos, casos reales o curro técnico más fino más palante.',
      statusPill: 'web + ventas + producto',
      metricLabel: 'Perfil',
      metricTitle: 'Desarrollo con sentío comercial',
      metricBody: 'Mensaje, conversión y presentación currando juntas.',
      servicesTitle: 'Lo que aporto',
      featureOneTitle: 'UI con personalidad',
      featureOneBody: 'Layouts más intencionaos, menos olor a plantilla y una presencia digital que se recuerda mejor.',
      featureTwoTitle: 'Rendimiento que se nota',
      featureTwoBody: 'Cuidando er peso visual, la estructura y esa sensación de que to va fino.',
      featureThreeTitle: 'Mentalidá comercial',
      featureThreeBody: 'Verse bien no basta; la experiencia también tiene que explicar er valor y mover a la acción.',
      featureFourTitle: 'Entrega limpita',
      featureFourBody: 'Componentes claros, estructura editable y una base que puede seguir creciendo contigo sin dar guerra.',
      stackTitle: 'Stack y cositas que quiero seguir afinando',
      stackAccessibility: 'Accesibilidá',
      stackBranding: 'Marca personal',
      stackConversion: 'Conversión',
      stackLanding: 'Landing pages',
    },
    focus: {
      eyebrow: 'Enfoque',
      title: 'Prefiero montar una web que diga las cosas claritas antes que una web escandalosa y sin rumbo.',
      stepOneTitle: '1. Cerrá primero er mensaje',
      stepOneBody: 'Defino la propuesta de valor, er tono y er objetivo principal antes de meter efectos o florituras visuales.',
      stepTwoTitle: '2. Darle forma a la experiencia',
      stepTwoBody: "La jerarquía, er ritmo de lectura y los CTA tienen que sentirse naturales y fáciles de seguí.",
      stepThreeTitle: '3. Construí con intención',
      stepThreeBody: 'Trabajo sobre una base limpia pa que er portfolio se vea potente hoy y siga siendo fácil de evolucioná mañana.',
      stepFourTitle: '4. Afiná lo que importa',
      stepFourBody: 'Contraste, espacio, claridad y pulío general importan más que la complejidá metía porque sí.',
      cardOneLabel: 'Prioridaeh',
      cardOneTitle: 'Claridá, confianza y conversión',
      cardOneBody: 'Una buena primera impresión necesita orden visual, consistencia y un siguiente paso bien clarito.',
      cardTwoLabel: 'Base técnica',
      cardTwoTitle: 'HTML, CSS y JavaScript bien montaos',
      cardTwoBody: 'Quiero que lo visual se sienta pulío sin volver er proyecto más complicao de mantené después.',
      cardThreeLabel: 'Idea central',
      cardThreeBody: 'Un portfolio personal no debería sentirse como una demo reciclá; debería sentirse como una presentación clara, con empaque y con sentío.',
    },
    work: {
      eyebrow: 'Portfolio',
      title: 'Er tipo de piezas y soluciones que mejor le pegan a este perfil.',
      intro: 'Estas cards enseñan er tipo de curro que este portfolio puede representar ahora y ensanchar mañana con casos reales, demos o enlaces concretos.',
      filterAria: 'Filtrar proyectos',
      filterAll: 'To',
      filterUi: 'UI',
      filterPerformance: 'Rendimiento',
      filterSystems: 'Sistemas',
      projectOneTagOne: 'Branding',
      projectOneTagTwo: 'Portfolio',
      projectOneTitle: 'Portfolio vCard hecho a tu medida',
      projectOneBody: 'Una home compacta y elegante pa enseñar perfil, valor y llamadas a la acción con rapidez.',
      projectOneActionOne: 'Ver GitHub',
      projectOneActionTwo: 'Hablar de esto',
      projectTwoTagOne: 'Landing',
      projectTwoTagTwo: 'Conversión',
      projectTwoTitle: 'Landing pensá pa mover a la acción',
      projectTwoBody: 'Mensaje claro, buena jerarquía de bloques y CTA visibles sin perder estilo.',
      projectTwoActionOne: 'Ver perfil',
      projectTwoActionTwo: 'Quiero algo asín',
      projectThreeTitle: 'Optimización de velocidá y lectura',
      projectThreeBody: 'Reducí la fricción visual y técnica pa que toa la experiencia se sienta más rápida y convincente.',
      projectThreeActionOne: 'Revisar una idea',
      projectFourTagOne: 'Datos',
      projectFourTitle: 'Interfaces operativas y de seguimiento',
      projectFourBody: 'Paneles sobrios pa ordenar información, procesos internos y puntos de control sin lios.',
      projectFourActionOne: 'Explorar repos',
      projectFiveTagOne: 'Accesibilidá',
      projectFiveTagTwo: 'Contenido',
      projectFiveTitle: 'Experiencia más limpia y accesible',
      projectFiveBody: 'Copy mejor ordenao, contraste más fuerte y decisiones pensás pa quitar fricción.',
      projectFiveActionOne: 'Conectar',
      projectSixTagOne: 'Automatización',
      projectSixTitle: 'Una base que puede seguí creciendo',
      projectSixBody: 'Una estructura simple y cuidaíta lista pa pasar de página personal a algo con más empaque.',
      projectSixActionOne: 'Convertí esto en un caso real',
    },
    contact: {
      eyebrow: 'Contacto',
      title: 'Si vienes buscando a alguien pa mejorar tu web, tu presencia o tu front-end, hablemo.',
      lead: 'Si eres cliente, recruiter o formas parte de un equipo que necesita más claridad, mejor presencia visual y una ejecución fina en front-end, este es er sitio pa contactá conmigo der tirón.',
      primaryAction: 'Escribime por WhatsApp',
      secondaryAction: 'Abrí LinkedIn',
      githubBody: 'Pa ver código, pruebas y curro técnico.',
      linkedinBody: 'Pa revisar perfil, experiencia y contexto profesional.',
      instagramBody: 'Pa una parte más visual y más cercana de la marca personal.',
      whatsappBody: 'Er canal más rápido pa hablar de proyecto, colaboración o disponibilidad.',
      footer: '2026 Alvaro Molina. Disponible pa colaboraciones, freelance y proyectos web con sentío de producto.',
    },
  },
};

const languageMeta = {
  en: {
    label: 'English',
    htmlLang: 'en',
    dir: 'ltr',
    flag: { type: 'custom', className: 'flag-uk' },
  },
  es: {
    label: 'Espa\u00F1ol',
    htmlLang: 'es',
    dir: 'ltr',
    flag: { type: 'custom', className: 'flag-spain' },
  },
  ru: {
    label: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439',
    htmlLang: 'ru',
    dir: 'ltr',
    flag: { type: 'custom', className: 'flag-russia' },
  },
  zh: {
    label: '\u4E2D\u6587',
    htmlLang: 'zh-CN',
    dir: 'ltr',
    flag: { type: 'custom', className: 'flag-china' },
  },
  pl: {
    label: 'Polski',
    htmlLang: 'pl',
    dir: 'ltr',
    flag: { type: 'custom', className: 'flag-poland' },
  },
  de: {
    label: 'Deutsch',
    htmlLang: 'de',
    dir: 'ltr',
    flag: { type: 'custom', className: 'flag-germany' },
  },
  ar: {
    label: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629',
    htmlLang: 'ar',
    dir: 'rtl',
    flag: { type: 'custom', className: 'flag-saudi' },
  },
  and: {
    label: 'Andal\u00FBh',
    htmlLang: 'es',
    dir: 'ltr',
    flag: { type: 'custom', className: 'flag-andalusia' },
  },
};

const storageKeys = {
  language: 'portfolio-language',
  theme: 'portfolio-theme',
};

const defaultLanguage = 'en';
const defaultTheme = 'blue';

const supportedLanguages = Object.keys(languageMeta);
const supportedThemes = ['blue', 'green', 'red', 'orange', 'yellow', 'pink', 'white', 'black'];

const sidebar = document.querySelector('[data-sidebar]');
const sidebarToggle = document.querySelector('[data-sidebar-toggle]');
const sidebarPanel = document.querySelector('[data-sidebar-panel]');
const sectionButtons = Array.from(document.querySelectorAll('.nav-tab'));
const panels = Array.from(document.querySelectorAll('[data-panel]'));
const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
const projectCards = Array.from(document.querySelectorAll('.project-card'));
const languageButtons = Array.from(document.querySelectorAll('[data-language-option]'));
const themeButtons = Array.from(document.querySelectorAll('[data-theme-option]'));
const languageCurrentLabel = document.querySelector('[data-language-current]');
const languageCurrentFlag = document.querySelector('[data-language-current-flag]');
const themeCurrentLabel = document.querySelector('[data-theme-current]');
const desktopQuery = window.matchMedia('(min-width: 1100px)');

const pickers = {
  language: {
    key: 'language',
    root: document.querySelector('[data-language-picker]'),
    toggle: document.querySelector('[data-language-toggle]'),
    menu: document.querySelector('[data-language-menu]'),
  },
  theme: {
    key: 'theme',
    root: document.querySelector('[data-theme-picker]'),
    toggle: document.querySelector('[data-theme-toggle]'),
    menu: document.querySelector('[data-theme-menu]'),
  },
};

const pickerList = Object.values(pickers).filter((picker) => picker.root && picker.toggle && picker.menu);

const getPanelById = (id) => panels.find((panel) => panel.id === id);

const getTranslationValue = (language, key) => {
  const value = key.split('.').reduce((current, part) => current?.[part], translations[language]);
  return value ?? key.split('.').reduce((current, part) => current?.[part], translations[defaultLanguage]);
};

const setFlagAppearance = (element, language) => {
  if (!element) {
    return;
  }

  const meta = languageMeta[language] ?? languageMeta[defaultLanguage];

  if (meta.flag.type === 'custom') {
    element.className = `flag-custom ${meta.flag.className}`;
    element.textContent = '';
    return;
  }

  element.className = 'flag-emoji';
  element.textContent = meta.flag.value;
};

const updateLanguageCurrentDisplay = (language) => {
  const meta = languageMeta[language] ?? languageMeta[defaultLanguage];

  if (languageCurrentLabel) {
    languageCurrentLabel.textContent = meta.label;
  }

  setFlagAppearance(languageCurrentFlag, language);
};

const updateThemeCurrentLabel = (theme, language) => {
  if (!themeCurrentLabel) {
    return;
  }

  themeCurrentLabel.textContent = getTranslationValue(language, `theme.${theme}`) ?? theme;
};

const updatePickerState = (pickerKey, expanded) => {
  const picker = pickers[pickerKey];

  if (!picker?.root || !picker.toggle || !picker.menu) {
    return;
  }

  picker.root.classList.toggle('is-open', expanded);
  picker.toggle.setAttribute('aria-expanded', String(expanded));
  picker.menu.hidden = !expanded;
};

const closeAllPickers = (options = {}) => {
  const { except } = options;

  pickerList.forEach((picker) => {
    updatePickerState(picker.key, picker.key === except);
  });
};

const applyTranslations = (language) => {
  const nextLanguage = supportedLanguages.includes(language) ? language : defaultLanguage;
  const htmlLanguage = languageMeta[nextLanguage]?.htmlLang ?? defaultLanguage;
  const direction = languageMeta[nextLanguage]?.dir ?? 'ltr';

  document.documentElement.lang = htmlLanguage;
  document.documentElement.dir = direction;
  document.body.dataset.language = nextLanguage;

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n;
    const attribute = element.dataset.i18nAttr;
    const value = getTranslationValue(nextLanguage, key);

    if (!value) {
      return;
    }

    if (attribute) {
      element.setAttribute(attribute, value);
    } else {
      element.textContent = value;
    }
  });

  languageButtons.forEach((button) => {
    const isActive = button.dataset.languageOption === nextLanguage;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  updateLanguageCurrentDisplay(nextLanguage);
  updateThemeCurrentLabel(document.body.dataset.theme || defaultTheme, nextLanguage);
};

const applyTheme = (theme) => {
  const nextTheme = supportedThemes.includes(theme) ? theme : defaultTheme;
  document.body.dataset.theme = nextTheme;

  themeButtons.forEach((button) => {
    const isActive = button.dataset.themeOption === nextTheme;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  updateThemeCurrentLabel(nextTheme, document.body.dataset.language || defaultLanguage);
};

const updateSidebarState = (expanded) => {
  if (!sidebar || !sidebarPanel || !sidebarToggle) {
    return;
  }

  const nextState = desktopQuery.matches ? true : expanded;

  sidebar.classList.toggle('is-open', nextState);
  sidebarPanel.hidden = !nextState;
  sidebarToggle.setAttribute('aria-expanded', String(nextState));
};

const setActivePanel = (panelId, options = {}) => {
  const { updateHash = true } = options;
  const nextPanel = getPanelById(panelId) || panels[0];

  if (!nextPanel) {
    return;
  }

  panels.forEach((panel) => {
    const isActive = panel === nextPanel;
    panel.classList.toggle('is-active', isActive);
    panel.hidden = !isActive;
  });

  sectionButtons.forEach((button) => {
    const isActive = button.dataset.target === nextPanel.id;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  if (updateHash) {
    window.history.replaceState(null, '', `#${nextPanel.id}`);
  }
};

const setProjectFilter = (filter) => {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  projectCards.forEach((card) => {
    const matches = filter === 'all' || card.dataset.category === filter;
    card.classList.toggle('is-hidden', !matches);
  });
};

sectionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setActivePanel(button.dataset.target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  const targetId = link.getAttribute('href')?.slice(1);

  if (!targetId || !getPanelById(targetId)) {
    return;
  }

  link.addEventListener('click', (event) => {
    event.preventDefault();
    setActivePanel(targetId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setProjectFilter(button.dataset.filter);
  });
});

languageButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const nextLanguage = button.dataset.languageOption;

    if (!supportedLanguages.includes(nextLanguage)) {
      return;
    }

    window.localStorage.setItem(storageKeys.language, nextLanguage);
    applyTranslations(nextLanguage);
    closeAllPickers();
  });
});

themeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const nextTheme = button.dataset.themeOption;

    if (!supportedThemes.includes(nextTheme)) {
      return;
    }

    window.localStorage.setItem(storageKeys.theme, nextTheme);
    applyTheme(nextTheme);
    closeAllPickers();
  });
});

pickerList.forEach((picker) => {
  picker.toggle.addEventListener('click', () => {
    const isExpanded = picker.toggle.getAttribute('aria-expanded') === 'true';
    closeAllPickers({ except: isExpanded ? undefined : picker.key });
  });
});

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Node)) {
    return;
  }

  pickerList.forEach((picker) => {
    if (!picker.root.contains(event.target)) {
      updatePickerState(picker.key, false);
    }
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') {
    return;
  }

  const openPicker = pickerList.find((picker) => picker.toggle.getAttribute('aria-expanded') === 'true');

  if (!openPicker) {
    return;
  }

  closeAllPickers();
  openPicker.toggle.focus();
});

sidebarToggle?.addEventListener('click', () => {
  const expanded = sidebarToggle.getAttribute('aria-expanded') === 'true';
  updateSidebarState(!expanded);
});

const handleViewportChange = () => {
  const expanded = sidebar?.classList.contains('is-open') ?? false;
  updateSidebarState(expanded);
};

if (typeof desktopQuery.addEventListener === 'function') {
  desktopQuery.addEventListener('change', handleViewportChange);
} else {
  desktopQuery.addListener(handleViewportChange);
}

window.addEventListener('hashchange', () => {
  const hashPanelId = window.location.hash.replace('#', '');

  if (getPanelById(hashPanelId)) {
    setActivePanel(hashPanelId, { updateHash: false });
  }
});

const savedLanguage = window.localStorage.getItem(storageKeys.language);
const savedTheme = window.localStorage.getItem(storageKeys.theme);
const initialLanguage = supportedLanguages.includes(savedLanguage) ? savedLanguage : defaultLanguage;
const initialTheme = supportedThemes.includes(savedTheme) ? savedTheme : defaultTheme;
const initialPanelId = window.location.hash.replace('#', '') || panels[0]?.id;

applyTranslations(initialLanguage);
applyTheme(initialTheme);
closeAllPickers();
setActivePanel(initialPanelId, { updateHash: Boolean(window.location.hash) });
setProjectFilter('all');
updateSidebarState(false);

window.requestAnimationFrame(() => {
  document.body.classList.add('is-ready');
});
