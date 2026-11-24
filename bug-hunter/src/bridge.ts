/* Bug Hunter has its own site now (https://bug-hunter-game.onrender.com). This page, the game's old address on the
   portfolio, sends each player there with their whole saved game in the address's hash (`#save=<code>`, the transfer
   code of `transfer.ts`), which never reaches a server; the new site puts it in place only when it has no saved
   game yet (its `src/boot.ts`). With no saved game here, it just goes. */
import { exportGame } from './transfer';

export const GAME_SITE = 'https://bug-hunter-game.onrender.com/';

async function go() {
  let hash = '';
  try {
    let has = false;
    try { has = localStorage.getItem('bugHunter') != null; } catch { /* no storage */ }
    if (has) hash = `#save=${await exportGame()}`;
  } catch { /* the save could not be packed: go without it */ }
  location.replace(GAME_SITE + location.search + hash);
}
void go();
