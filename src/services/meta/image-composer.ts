import sharp from 'sharp';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import path from 'path';

// Register a bundled font once (Noto Sans ships with @napi-rs/canvas)
// Falls back to system sans-serif if registration fails
let fontRegistered = false;
function ensureFont() {
  if (fontRegistered) return;
  try {
    // @napi-rs/canvas bundles Noto Sans – register from its package directory
    const fontPath = path.join(
      require.resolve('@napi-rs/canvas'),
      '../../fonts/NotoSans-Regular.ttf',
    );
    GlobalFonts.registerFromPath(fontPath, 'Noto Sans');
  } catch {
    // font registration is best-effort
  }
  fontRegistered = true;
}

export interface TextOverlay {
  title: string;
  companyName?: string;
  location?: string;
  cta?: string;
  benefits?: string[];
  logoUrl?: string;
}

const W = 1080;
const H = 1080;
const PAD = 64;

/**
 * Composes a recruitment ad image with canvas-drawn text overlay.
 * Layout: Logo + Headline top → Benefits middle → CTA bottom.
 */
export async function composeAdImage(
  backgroundUrl: string,
  text: TextOverlay
): Promise<Buffer> {
  ensureFont();

  const {
    title,
    companyName,
    location,
    cta = 'Jetzt bewerben!',
    benefits = [],
    logoUrl,
  } = text;

  // 1. Download & resize background
  const bgRes = await fetch(backgroundUrl);
  if (!bgRes.ok) throw new Error(`Background download failed: ${bgRes.status}`);
  const bgBuf = await sharp(Buffer.from(await bgRes.arrayBuffer()))
    .resize(W, H, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();

  // 2. Optionally fetch & resize logo
  let logoBuf: Buffer | null = null;
  if (logoUrl) {
    try {
      const lr = await fetch(logoUrl);
      if (lr.ok) {
        logoBuf = await sharp(Buffer.from(await lr.arrayBuffer()))
          .resize(80, 80, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .png()
          .toBuffer();
      }
    } catch { /* logo is optional */ }
  }

  // 3. Draw on canvas
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background
  const bgImg = await loadImage(bgBuf);
  ctx.drawImage(bgImg, 0, 0, W, H);

  // Dark overlay
  ctx.fillStyle = 'rgba(0,0,0,0.58)';
  ctx.fillRect(0, 0, W, H);

  // Logo (top-left, rounded white backing)
  let textStartX = PAD;
  if (logoBuf) {
    const logoImg = await loadImage(logoBuf);
    // white rounded backing
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    roundRect(ctx, PAD - 4, PAD - 4, 88, 88, 14);
    ctx.fill();
    ctx.drawImage(logoImg, PAD, PAD, 80, 80);
    textStartX = PAD + 96;
  }

  // Company name (next to logo, or at top-left)
  let cursorY = PAD + 50;
  if (companyName) {
    ctx.fillStyle = 'rgba(255,255,255,0.90)';
    ctx.font = `bold 34px "Noto Sans", sans-serif`;
    ctx.fillText(companyName, textStartX, cursorY);
  }

  // "Wir stellen ein:" tagline
  cursorY = (logoBuf || companyName) ? PAD + 120 : PAD + 60;
  ctx.fillStyle = 'rgba(255,255,255,0.80)';
  ctx.font = `400 44px "Noto Sans", sans-serif`;
  ctx.fillText('Wir stellen ein:', PAD, cursorY);

  // Title (split into lines at ~22 chars)
  const titleLines = splitLines(title, 22);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 84px "Noto Sans", sans-serif`;
  cursorY += 96;
  for (const line of titleLines.slice(0, 2)) {
    ctx.fillText(line, PAD, cursorY);
    cursorY += 96;
  }

  // Benefits
  cursorY += 20;
  ctx.font = `400 40px "Noto Sans", sans-serif`;
  for (const benefit of benefits.slice(0, 3)) {
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    // bullet dot
    ctx.beginPath();
    ctx.arc(PAD + 10, cursorY - 12, 8, 0, Math.PI * 2);
    ctx.fill();
    // text
    ctx.fillText(benefit, PAD + 32, cursorY);
    cursorY += 64;
  }

  // Location
  if (location) {
    ctx.fillStyle = 'rgba(255,255,255,0.70)';
    ctx.font = `400 34px "Noto Sans", sans-serif`;
    ctx.fillText(location, PAD, H - PAD - 80 - 28);
  }

  // CTA button
  const ctaW = 400;
  const ctaH = 76;
  const ctaX = PAD;
  const ctaY = H - PAD - ctaH;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, ctaX, ctaY, ctaW, ctaH, ctaH / 2);
  ctx.fill();
  ctx.fillStyle = '#111111';
  ctx.font = `bold 32px "Noto Sans", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(cta, ctaX + ctaW / 2, ctaY + ctaH / 2 + 11);
  ctx.textAlign = 'left';

  // 4. Convert canvas to PNG buffer
  const composedPng = canvas.toBuffer('image/png');
  return composedPng;
}

// ── Helpers ────────────────────────────────────────────────────

function splitLines(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (current.length + word.length + 1 <= maxChars) {
      current = current ? `${current} ${word}` : word;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function roundRect(
  ctx: ReturnType<ReturnType<typeof createCanvas>['getContext']>,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
