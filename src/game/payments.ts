/* Paying for coins. Like ads.ts, the provider is swappable:
   - On localhost, a test checkout: a dialog that says nothing is charged and
     asks to confirm, so the store can be tried end to end.
   - Anywhere else, none: the store is a preview and buying does nothing.
   Real payments need a server (Stripe Checkout and its webhook) and player
   accounts so a purchase survives a cleared browser; until then this stays
   on 'none' in production. */

export type Checkout = { name: string; price: string };
type Provider = { name: 'none' | 'dev'; buy: (item: Checkout) => Promise<boolean> };

const text = { title: 'Test purchase', note: 'Nothing is charged.', ok: 'Confirm', cancel: 'Cancel' };
export function configurePayments(t: Partial<typeof text>) {
  Object.assign(text, t);
}

const none: Provider = { name: 'none', buy: async () => false };

const dev: Provider = {
  name: 'dev',
  buy: (item) =>
    new Promise<boolean>((resolve) => {
      const box = document.createElement('div');
      box.className = 'pay-dev';
      box.innerHTML = `<div class="pay-dev-card"><p class="pay-dev-title"></p><p class="pay-dev-item"></p><p class="pay-dev-price"></p><p class="pay-dev-note"></p><button type="button" class="pay-dev-ok"></button><button type="button" class="pay-dev-cancel"></button></div>`;
      const set = (sel: string, value: string) => { box.querySelector(sel)!.textContent = value; };
      set('.pay-dev-title', text.title);
      set('.pay-dev-item', item.name);
      set('.pay-dev-price', item.price);
      set('.pay-dev-note', text.note);
      set('.pay-dev-ok', text.ok);
      set('.pay-dev-cancel', text.cancel);
      document.body.append(box);
      const end = (paid: boolean) => { box.remove(); resolve(paid); };
      box.querySelector('.pay-dev-ok')!.addEventListener('click', () => end(true));
      box.querySelector('.pay-dev-cancel')!.addEventListener('click', () => end(false));
    }),
};

const local = ['localhost', '127.0.0.1'].includes(location.hostname);
const provider: Provider = local ? dev : none;

export const payments = {
  /** False on the live site today: the store shows its prices as a preview. */
  get enabled() {
    return provider.name !== 'none';
  },
  buy: (item: Checkout) => provider.buy(item),
};
