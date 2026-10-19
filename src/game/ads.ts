/* Rewarded ads: the player chooses to watch one for a reward (get back up,
   double the run's coins, one more reroll, a gift of coins). Nothing plays by
   itself and nothing shows during play.

   `prepare(spot)` asks the provider for an ad; it resolves with a function
   that plays it (true once it was watched to the end), or with null when no
   ad is available, in which case the page shows no button at all. Which
   provider runs:
   - Google's H5 Games Ads (the AdSense Ad Placement API) when the build has
     VITE_ADSENSE_CLIENT (ca-pub-…); VITE_ADS_TEST=1 asks Google for test ads.
   - On localhost, a fake three-second ad so the buttons can be tried.
   - Otherwise none: no ad buttons anywhere. */

export type AdSpot = 'revive' | 'doubleCoins' | 'reroll' | 'gift';
export type PlayAd = () => Promise<boolean>;
type Provider = { name: 'none' | 'dev' | 'h5'; prepare: (spot: AdSpot) => Promise<PlayAd | null> };

/** What the page does around an ad: quiet the music, and the fake ad's text. */
const hooks = {
  pause: () => {},
  resume: () => {},
  text: { title: 'Ad', skip: 'Close' },
};
export function configureAds(h: Partial<typeof hooks>) {
  Object.assign(hooks, h);
}

const none: Provider = { name: 'none', prepare: async () => null };

/* A stand-in ad for trying the buttons on localhost: a dark screen counting
   down three seconds. Closing it early gives nothing. */
const dev: Provider = {
  name: 'dev',
  prepare: async () => () =>
    new Promise<boolean>((resolve) => {
      hooks.pause();
      const box = document.createElement('div');
      box.className = 'ad-dev';
      box.innerHTML = `<p class="ad-dev-title"></p><p class="ad-dev-count">3</p><button type="button" class="ad-dev-skip"></button>`;
      box.querySelector('.ad-dev-title')!.textContent = hooks.text.title;
      box.querySelector('.ad-dev-skip')!.textContent = hooks.text.skip;
      document.body.append(box);
      let left = 3;
      const count = box.querySelector('.ad-dev-count')!;
      const timer = window.setInterval(() => {
        left -= 1;
        count.textContent = String(Math.max(0, left));
        if (left <= 0) end(true);
      }, 1000);
      const end = (watched: boolean) => {
        window.clearInterval(timer);
        box.remove();
        hooks.resume();
        resolve(watched);
      };
      box.querySelector('button')!.addEventListener('click', () => end(false));
    }),
};

/* Google's H5 Games Ads. A reward break only calls beforeReward when an ad is
   ready, so prepare() resolves with null when it does not come in time. */
type AdBreak = (o: Record<string, unknown>) => void;
declare global {
  interface Window {
    adsbygoogle?: unknown[];
    adBreak?: AdBreak;
    adConfig?: AdBreak;
  }
}
function h5(client: string, test: boolean): Provider {
  const tag = document.createElement('script');
  tag.async = true;
  tag.crossOrigin = 'anonymous';
  tag.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
  tag.dataset.adFrequencyHint = '30s';
  if (test) tag.dataset.adbreakTest = 'on';
  document.head.append(tag);
  window.adsbygoogle = window.adsbygoogle || [];
  const push: AdBreak = (o) => void window.adsbygoogle!.push(o);
  window.adBreak = window.adConfig = push;
  push({ preloadAdBreaks: 'on', sound: 'on' });
  return {
    name: 'h5',
    prepare: (spot) =>
      new Promise((resolve) => {
        let offered = false;
        let done: ((watched: boolean) => void) | null = null;
        const offer = (play: PlayAd | null) => {
          if (offered) return;
          offered = true;
          resolve(play);
        };
        window.setTimeout(() => offer(null), 2500);
        push({
          type: 'reward',
          name: spot,
          beforeAd: () => hooks.pause(),
          afterAd: () => hooks.resume(),
          beforeReward: (showAdFn: () => void) =>
            offer(() => new Promise<boolean>((r) => { done = r; showAdFn(); })),
          adViewed: () => done?.(true),
          adDismissed: () => done?.(false),
          adBreakDone: () => {
            offer(null);
            done?.(false);
          },
        });
      }),
  };
}

const env = import.meta.env;
const client = typeof env.VITE_ADSENSE_CLIENT === 'string' ? env.VITE_ADSENSE_CLIENT.trim() : '';
const local = ['localhost', '127.0.0.1'].includes(location.hostname);
let provider: Provider | null = null;
const current = () => (provider ??= client ? h5(client, env.VITE_ADS_TEST === '1') : local ? dev : none);

export const ads = {
  /** Whether any ad can ever show here (the page hides the ad buttons when not). */
  get enabled() {
    return current().name !== 'none';
  },
  prepare: (spot: AdSpot) => current().prepare(spot),
};
