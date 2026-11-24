export const MAX_PHOTOS = 3;

/** Scale (w,h) down so the longest side is at most `max` (never scales up). */
export const fitWithin = (w: number, h: number, max: number) => {
  const s = Math.min(1, max / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)) };
};

const load = (file: File): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file); const img = new Image();
  img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('not an image')); };
  img.src = url;
});

/** Resize + re-encode as JPEG so a phone photo (several MB) becomes ~100-300 KB before it is analysed / uploaded. */
export async function fileToDataUrl(file: File, maxSide = 1280, maxChars = 380_000): Promise<string> {
  const img = await load(file);
  let side = maxSide;
  for (let attempt = 0; attempt < 6; attempt++) {
    const { w, h } = fitWithin(img.naturalWidth, img.naturalHeight, side);
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
    for (const q of [0.82, 0.7, 0.58]) { const url = canvas.toDataURL('image/jpeg', q); if (url.length <= maxChars) return url; }
    side = Math.round(side * 0.8);
  }
  throw new Error('image too large');
}
