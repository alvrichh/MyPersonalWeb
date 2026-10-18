import { storage } from '../lib/storage';

/* Bug Hunter's own text. The game page is small, so it carries English and
   Spanish (Andalûh players get Spanish); every other site language falls back
   to English. */
const en = {
  title: 'Bug Hunter',
  tagline: 'Ten sprints of bugs between you and the release. Clear every room to ship.',
  howTouch: 'Drag anywhere to move. Stand still to shoot.',
  howKeys: 'Move with WASD or the arrow keys. Stand still to shoot.',
  play: 'Play',
  again: 'Play again',
  resume: 'Resume',
  quit: 'Quit',
  pause: 'Pause',
  back: 'Back to portfolio',
  best: 'Best: sprint {room} of 10',
  bestWin: 'Best: shipped in {time}',
  sprint: 'Sprint {room}/10',
  level: 'Lv {level}',
  levelUp: 'Level up!',
  choose: 'Pick one skill',
  over: 'Production is down',
  overText: 'You reached sprint {room} and squashed {kills} bugs.',
  won: 'Shipped!',
  wonText: 'All ten sprints cleared in {time}, {kills} bugs squashed.',
  boss: 'The Monolith',
  doorOpen: 'Sprint cleared! Head for the door.',
  paused: 'Paused',
  skillLevel: 'Level {level}',
  fireName: 'Fire',
  fireText: 'Arrows set bugs on fire.',
  waterName: 'Water',
  waterText: 'Arrows slow bugs down.',
  leafName: 'Leaves',
  leafText: 'Shoot a fan of extra arrows.',
  boltName: 'Lightning',
  boltText: 'Hits jump to a nearby bug.',
  sparkName: 'Sparks',
  sparkText: 'Arrows bounce off walls.',
  ghostName: 'Ghost',
  ghostText: 'Arrows pass through bugs and walls.',
  heartName: 'Heart',
  heartText: 'More max health, and heal.',
  speedName: 'Hotfix',
  speedText: 'Shoot faster.',
  powerName: 'Refactor',
  powerText: 'Arrows hit harder.',
  doubleName: 'Pair programming',
  doubleText: 'Two arrows side by side.',
};

export type Key = keyof typeof en;

const es: Record<Key, string> = {
  title: 'Bug Hunter',
  tagline: 'Diez sprints llenos de bugs entre tú y la release. Limpia cada sala para desplegar.',
  howTouch: 'Arrastra en cualquier sitio para moverte. Quédate quieto para disparar.',
  howKeys: 'Muévete con WASD o las flechas. Quédate quieto para disparar.',
  play: 'Jugar',
  again: 'Otra partida',
  resume: 'Seguir',
  quit: 'Salir',
  pause: 'Pausa',
  back: 'Volver al portfolio',
  best: 'Récord: sprint {room} de 10',
  bestWin: 'Récord: desplegado en {time}',
  sprint: 'Sprint {room}/10',
  level: 'Nv {level}',
  levelUp: '¡Subes de nivel!',
  choose: 'Elige una habilidad',
  over: 'Producción caída',
  overText: 'Llegaste al sprint {room} y aplastaste {kills} bugs.',
  won: '¡Desplegado!',
  wonText: 'Los diez sprints superados en {time}, {kills} bugs aplastados.',
  boss: 'El Monolito',
  doorOpen: '¡Sprint superado! Ve hacia la puerta.',
  paused: 'Pausa',
  skillLevel: 'Nivel {level}',
  fireName: 'Fuego',
  fireText: 'Las flechas queman a los bugs.',
  waterName: 'Agua',
  waterText: 'Las flechas ralentizan a los bugs.',
  leafName: 'Hojas',
  leafText: 'Disparas un abanico de flechas extra.',
  boltName: 'Rayo',
  boltText: 'Cada impacto salta a un bug cercano.',
  sparkName: 'Chispas',
  sparkText: 'Las flechas rebotan en las paredes.',
  ghostName: 'Fantasma',
  ghostText: 'Las flechas atraviesan bugs y paredes.',
  heartName: 'Corazón',
  heartText: 'Más vida máxima, y te curas.',
  speedName: 'Hotfix',
  speedText: 'Disparas más rápido.',
  powerName: 'Refactor',
  powerText: 'Las flechas hacen más daño.',
  doubleName: 'Pair programming',
  doubleText: 'Dos flechas a la vez, una al lado de otra.',
};

export type Lang = 'en' | 'es';

export const pickLang = (): Lang => {
  const saved = storage.get('lang');
  const code = (saved || navigator.language || 'en').toLowerCase().split('-')[0];
  return code === 'es' || code === 'and' ? 'es' : 'en';
};

export const makeT = (lang: Lang) => {
  const dict: Record<Key, string> = lang === 'es' ? es : en;
  return (key: Key, values?: Record<string, string | number>) => {
    let text = dict[key];
    if (values) for (const [name, value] of Object.entries(values)) text = text.replace(`{${name}}`, String(value));
    return text;
  };
};

export type T = ReturnType<typeof makeT>;
