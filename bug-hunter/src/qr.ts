/* Joining a friend by QR, inside the game: one phone shows its game's code as a QR, the other reads it with its
   camera. Nothing goes through a link, so on an iPhone the game added to the home screen (whose saved game is its
   own, apart from Safari's) is the one that joins. The QR holds the game's address with the code after `#unir=`,
   so a phone's own camera app opens the game and joins too (in the browser). The reader (`jsqr`, about 45 kB) is
   loaded only when the camera opens: Safari has no built-in QR reader for pages. */
import qrcode from 'qrcode-generator';

/** The QR of a text, as an SVG that fills its box (dark squares on white, with a quiet margin). */
export function qrSvg(text: string): string {
  const q = qrcode(0, 'M');
  q.addData(text);
  q.make();
  return q.createSvgTag({ cellSize: 4, margin: 3, scalable: true });
}

/** What a QR read in the game means: a game's code to join, or a friend's shared profile. */
export type QrTarget = { code: string } | { friend: string; name: string };
export function readQr(text: string): QrTarget | null {
  const s = text.trim();
  const hash = s.includes('#') ? s.slice(s.indexOf('#') + 1) : '';
  const q = new URLSearchParams(hash);
  const code = (q.get('unir') ?? (/^[A-Za-z0-9]{4}$/.test(s) ? s : '')).toUpperCase();
  if (/^[A-Z0-9]{4}$/.test(code)) return { code };
  const friend = q.get('amigo') ?? '';
  if (friend) return { friend, name: q.get('n') ?? '' };
  return null;
}

let stream: MediaStream | null = null;
let frame = 0;
let scanning = 0;

/** Turns the camera off (leaving the reader, or a code was read). */
export function stopScan() {
  scanning += 1;
  cancelAnimationFrame(frame);
  stream?.getTracks().forEach((tr) => tr.stop());
  stream = null;
}

/** Opens the back camera in that video and reads it until a QR the game knows turns up (`found`), or fails
    (`fail`: no camera, or permission refused). */
export async function startScan(video: HTMLVideoElement, found: (t: QrTarget) => void, fail: (why: 'denied' | 'none', detail: string) => void) {
  stopScan();
  const run = scanning;
  // The browser gives pages no camera here (an older iPhone's home-screen app, a web view inside another app).
  if (!navigator.mediaDevices?.getUserMedia) { fail('none', 'no mediaDevices'); return; }
  let jsQR: typeof import('jsqr').default;
  try {
    // The back camera, or failing that (a phone that does not name its cameras so) any camera.
    const camera = navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .catch((e: Error) => (e.name === 'NotAllowedError' ? Promise.reject(e) : navigator.mediaDevices.getUserMedia({ video: true, audio: false })));
    const [cam, lib] = await Promise.all([camera, import('jsqr')]);
    if (run !== scanning) { cam.getTracks().forEach((tr) => tr.stop()); return; }
    stream = cam;
    jsQR = lib.default;
  } catch (e) {
    const err = e as Error;
    if (run === scanning) fail(err.name === 'NotAllowedError' ? 'denied' : 'none', `${err.name || 'Error'}${err.message ? `: ${err.message}` : ''}`.slice(0, 120));
    return;
  }
  video.setAttribute('playsinline', '');
  video.muted = true;
  video.srcObject = stream;
  try { await video.play(); } catch { /* shown once the page lets it play */ }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let last = 0;
  const tick = (now: number) => {
    if (run !== scanning || !ctx) return;
    frame = requestAnimationFrame(tick);
    // A few reads a second are plenty, and keep the phone cool.
    if (now - last < 120 || video.readyState < 2 || !video.videoWidth) return;
    last = now;
    const k = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * k);
    canvas.height = Math.round(video.videoHeight * k);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hit = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
    const target = hit ? readQr(hit.data) : null;
    if (target) { stopScan(); found(target); }
  };
  frame = requestAnimationFrame(tick);
}

/** Reads a QR out of a photo (the phone's own camera app, through a file input: it works where the live camera does
    not, as in an iPhone's home-screen app). */
export async function scanPhoto(file: File): Promise<QrTarget | null> {
  const { default: jsQR } = await import('jsqr');
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((ok, no) => { img.onload = () => ok(); img.onerror = () => no(new Error('bad image')); img.src = url; });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    // Tried at a few sizes: a big photo's QR reads best shrunk, a small one as it is.
    for (const max of [800, 1400, 500]) {
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      canvas.width = Math.round(img.naturalWidth * k); canvas.height = Math.round(img.naturalHeight * k);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const hit = jsQR(data.data, data.width, data.height, { inversionAttempts: 'attemptBoth' });
      const target = hit ? readQr(hit.data) : null;
      if (target) return target;
    }
    return null;
  } finally { URL.revokeObjectURL(url); }
}
