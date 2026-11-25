/* The page's entry. Bug Hunter used to live on the portfolio's site, whose saved games stay in that site's browser
   storage; its old page sends players here with the whole save in the address (`#save=<code>`, the transfer code of
   `transfer.ts`, which never reaches a server). It is put in place only when there is no saved game here yet, so it
   never overwrites progress, and the address is cleaned. Then the game starts. */
import { readGame, restoreGame } from './transfer';

async function handOver() {
  const code = new URLSearchParams(location.hash.slice(1)).get('save');
  if (!code) return;
  try {
    let here = false;
    try { here = localStorage.getItem('bugHunter') != null; } catch { /* no storage */ }
    if (!here) { const data = await readGame(code); if (data) restoreGame(data); }
  } finally {
    history.replaceState(null, '', location.pathname + location.search);
  }
}

handOver().catch(() => {}).finally(() => { void import('./main'); });
