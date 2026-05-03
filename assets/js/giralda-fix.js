'use strict';

const initGiraldaImageFix = () => {
  const image = document.querySelector('img.portrait-photo[src*="giralda.png"]');
  if (!image) return;

  const cleanSrc = './images/giralda.png?v=giralda-fix-2026-05';
  const fallbackSrc = './images/giralda.png?v=giralda-fallback-2026-05';

  image.decoding = 'async';
  image.loading = 'eager';

  if (!image.src.includes('giralda-fix-2026-05')) {
    image.src = cleanSrc;
  }

  image.addEventListener('error', () => {
    if (!image.src.includes('giralda-fallback-2026-05')) {
      image.src = fallbackSrc;
    }
  }, { once: true });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGiraldaImageFix);
} else {
  initGiraldaImageFix();
}
