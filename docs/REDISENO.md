# Rediseño del portfolio (octubre 2026)

Estado: **solo en local, sin commit ni push.** Este documento recoge qué ha cambiado, por qué y cómo revisarlo antes de publicar.

## Cómo verlo en local

```bash
npm install        # solo si no tienes node_modules
npm start          # http://localhost:8080 con recarga en caliente
```

O como en producción:

```bash
npm run build      # genera dist/
npx serve dist     # o: python -m http.server 8765 --directory dist
```

Qué conviene probar:

- El desplegable de **idioma** (globo + bandera): 10 idiomas. Se guarda en `localStorage` y, la primera vez, sigue el idioma del navegador. En árabe la página pasa a RTL.
- El desplegable de **acento** (paleta + punto de color): los 8 colores de antes.
- El botón de **sol/luna** (sigue al sistema hasta que lo pulsas).
- Las **pestañas** del menú: bajan a cada sección y se marcan solas al hacer scroll.
- La ventana estrecha (unos 390 px): las pestañas pasan a una fila con scroll horizontal, como antes.
- **Descargar CV**, que baja el PDF nuevo.
- Los enlaces a `planning.html` y `gym.html`, que no cambian.

## Qué ha cambiado y por qué

### 1. Menú: igual que antes

Se mantiene el menú del sitio anterior, adaptado a los colores nuevos:

- Barra flotante y *sticky* con la marca **"am" · alvrich / portfolio**.
- **Pestañas tipo píldora** (About · Work · Experience · Skills · Contact). La activa se rellena con el degradado del acento. En vez de ocultar secciones, cada pestaña baja a la suya y se marca sola al hacer scroll.
- A la derecha, los **desplegables compactos** de antes:
  - **Idioma:** globo + bandera actual, con una lista de idiomas con banderas.
  - **Acento:** paleta + punto de color, con una lista de 8 colores.
  - Al lado, el botón de modo claro/oscuro.
- En pantallas de menos de 1080 px las pestañas bajan a una segunda fila con scroll horizontal, igual que en el menú anterior.

### 1b. Versión móvil (≤760 px): como la de antes

Se recupera el comportamiento móvil del sitio anterior (`mobile-vcard-drawer.js`, `mobile-polish.js`, `mobile-cta-row.css` y la barra de progreso), reescrito dentro de `main.js` y `main.css`:

- **Sin barra superior.** Arriba quedan los selectores **Language** y **Accent** con etiqueta y valor ("LANGUAGE · 🇬🇧 English"), y el botón de tema.
- **Botón de menú flotante** (arriba a la derecha, a la izquierda en árabe). Siempre está a mano mientras haces scroll.
- **Menú a casi pantalla completa** que entra desde el lado. Lleva pestañas grandes con la tipografía de los titulares (la sección actual va en degradado), la pestaña **"Life"** hacia `gym.html` como antes, y debajo los desplegables de idioma y acento y el cambio de tema. Se cierra con la ×, al tocar fuera, con Esc o al elegir una sección.
- **Barra de progreso horizontal arriba**, con un punto por sección y una burbuja con el nombre de la sección mientras haces scroll. En escritorio sigue siendo el riel vertical.
- **Botones del hero:** dos por fila y "Download CV" a todo el ancho. En pantallas de menos de 370 px van en una sola columna.

### 2. Colores: los 8 acentos de antes

Vuelve el selector **Accent** con azul (por defecto, como antes), verde, rojo, naranja, amarillo, rosa, blanco y negro.

- En **modo oscuro** se usan exactamente los tonos del sitio anterior (`#6C98FF`, `#67DFA0`, `#FF6F79`…).
- En **modo claro** cada color tiene una variante más oscura para que el texto en acento supere el contraste 4.5:1 sobre el fondo papel.
- El acento tiñe ligeramente el fondo (un 4–7 %), como hacía antes cada tema.
- La elección se guarda en el navegador y se aplica antes del primer pintado, sin parpadeo.

### 3. Idiomas: los 10 de antes

EN, ES, Gaeilge, Français, Deutsch, Русский, Polski, 中文, العربية y Andalûh, con sus banderas y en el mismo orden que el selector anterior. El francés también estaba: lo añadía un script aparte.

- El inglés vive en el HTML y el resto en `assets/js/i18n.js`. Todo el contenido nuevo está traducido a los 10.
- El árabe cambia la página a **derecha a izquierda** (`dir="rtl"`).
- Las fechas del AI Radar se formatean en el idioma elegido.

### 4. Contenido: enfoque editorial

El cuerpo de la página deja de ser una rejilla de cards y pasa a leerse de arriba abajo:

| Sección | Formato | Antes |
| --- | --- | --- |
| Hero | Titular grande en serif, tu foto (`author-portrait.jpg`) en un aro giratorio con el color del acento y una fila de datos (Ahora / Desde / Foco / Idiomas) | Sidebar con avatar y textos genéricos |
| 01 Proyectos | **Índice numerado** en filas: plataforma de operaciones aduaneras y plataforma de soporte y operaciones (anonimizadas, con sus funcionalidades), Live AI Radar, Bubble Planning OS, alvrich gym y esta web | Rejilla de 6 cards con ilustraciones de stock |
| 02 Experiencia | Línea de tiempo con el **logo de cada empresa** en una línea vertical, datos de LinkedIn, puntos clave y tecnologías. Los 3 puestos de Primeline van agrupados. Educación con los logos de la US, el IES Alixar y Portaceli | No existía |
| 03 Stack | Lista agrupada por áreas | Nube de chips |
| 04 Lo que estoy leyendo | El AI Radar como lista de titulares | Card con su propio script |
| 05 Fuera del trabajo | La Giralda y un texto personal (Sevilla → Irlanda, gym, planning) | No existía |
| 06 Contacto | Cierre tipográfico con el email como enlace principal | Rejilla de 4 cards |

Datos sacados del **CV de 2026**:

- Rol: Software Engineer, Fusion Analyst en Synovia Digital.
- Experiencia (según LinkedIn): Synovia Digital, Mercor, Outlier, Primeline Group (SAP Administrator, System Admin, General Operative), Getronics, y "Antes del software" (Stratton Global y El Tortillón).
- Cada empresa y centro de estudios enlaza a su web oficial (Synovia Digital, Mercor, Outlier, Primeline, Getronics, US, IES Alixar, Portaceli). Stratton Global y El Tortillón van sin enlace porque no pude verificar su web.
- La línea "fechas · duración · tipo · lugar · modalidad" se genera en JS en el idioma elegido. La duración del puesto actual se calcula sola cada mes.
- Logos guardados en `assets/images/logos/`, sacados de las webs oficiales y del servicio de favicons de Google. Así no dependen de servicios externos al cargar la página.
- Formación y certificados.
- LinkedIn unificado a `linkedin.com/in/alvrich/`.

### 5. Icono (favicon): tu Funko entero

`hero.png` entero, sin recortar, ajustado al cuadrado:

- `assets/images/favicon-32.png` (pestaña del navegador)
- `assets/images/favicon-192.png` (Android / imagen OG)
- `assets/images/apple-touch-icon.png` (iOS, con fondo papel)

### 6. Sistema visual

- **Tipografía:** *Fraunces* (tu nombre y titulares; el apellido y las palabras destacadas en cursiva), *Instrument Sans* (texto) y *JetBrains Mono* (fechas, etiquetas, stack).
- **Modo claro y oscuro** con tokens CSS. Respeta `prefers-color-scheme`.
- **Movimiento sutil:** aparición suave al hacer scroll y el aro de la foto, que gira y brilla con el color del acento. Todo se desactiva con `prefers-reduced-motion`. Sin JS, el contenido se ve igualmente.
- **Accesibilidad:** enlace "saltar al contenido", foco visible, desplegables con `aria-expanded` y `aria-pressed` que se cierran con Esc, y objetivos táctiles de 44 px.

### 7. Código y build

| Archivo | Cambio |
| --- | --- |
| `index.html` | Reescrito. Iconos SVG en línea, ya no se carga Ionicons desde unpkg. |
| `assets/css/main.css` | **Nuevo.** Todo el estilo de la home (unos 26 KB). |
| `assets/js/main.js` | **Nuevo.** Desplegables, idioma, acento, tema, pestañas, animaciones y AI Radar (unos 11 KB). |
| `assets/js/i18n-experience.js` | **Nuevo.** Traducciones de la experiencia y de las etiquetas de fechas, tipo y modalidad. Se mezcla en `i18n.js`. |
| `assets/images/logos/` | **Nuevo.** 8 logos de empresas y centros de estudio. |
| `assets/js/i18n.js` | **Nuevo.** Lista de idiomas y acentos, y las traducciones de los 9 idiomas que no son inglés. |
| `webpack.config.js` | Las entradas pasan de 14 a 2: `main` (home) y `gymPolish` (lo usa `gym.html`). `index.html` solo inyecta `main`. |
| `assets/cv/alvaro-molina-cv.pdf` | **Nuevo:** el CV actualizado. |
| `assets/images/favicon-*.png`, `apple-touch-icon.png` | **Nuevos.** |

El AI Radar sigue leyendo `data/ai-radar.json`, así que el workflow diario (`daily-ai-maintenance.yml`) funciona sin cambios. Además, ahora decodifica las entidades HTML que traen algunos titulares (`&#8217;`).

`gym.html` y `planning.html` **no se han tocado.**

## Pendiente de decidir antes del push

1. **Archivos que ya no usa nadie.** Siguen en el repo, pero no entran en el build. Si das el visto bueno, se borran en el mismo commit:
   - CSS: `circular-profile-photo.css`, `header-controls*.css`, `language-menu-scroll.css`, `mobile-cta-row.css`, `nav-tabs-polish.css`, `quality-polish.css`, `sidebar-scroll-desktop.css`, `style.css`
   - JS: `script.js`, `header-controls-align.js`, `mobile-*.js`, `irish-language-option.js`, `planning-link-section.js`, `portfolio-*.js`, `personal-portfolio-highlights.js`, `ai-radar-link-polish.js`, `gym-link.js`, `nav-scroll-fix.js`, `giralda-fix.js`, `glass-background-polish.js`, `cv-download-section.js`, `scroll-experience.js`, `vertical-scroll-progress.js`, `premium-*.js`, `extended-language-translations.js`, `cv-language-translations.js`, `connect-dropdown-desktop.js`
   - Imágenes: `author.png`, `blog-*.png`, `*-blog.*`, `flag-england.svg`, `pattern.png`, `logo-*.svg`, `favicon.ico`. Las demás banderas **sí se usan**.
   - CV antiguo: `assets/cv/alvrodmol CV.pdf`
2. **Textos con tono personal:** revisa que te representen ("yes, that's me. in vinyl", "Let's make it boring", "too much coffee"…). Están en `index.html` (EN) y en `assets/js/i18n.js` (resto).
3. **Traducciones:** las he escrito yo. Si alguien nativo puede revisar el irlandés, el árabe o el chino, mejor. El andaluz sigue el estilo informal del sitio anterior.
4. **Datos públicos:** la web muestra tu email y enlaza a WhatsApp. El teléfono no aparece en la página, pero sí en el PDF del CV.
5. `dist/` se regenera en GitHub Actions al hacer push a `main`, así que no hace falta commitearlo a mano.
