import sharp from 'sharp';

interface TextOverlay {
  title: string;
  location?: string;
  cta?: string;
}

/**
 * Downloads a background image and composites a text overlay (gradient + job title + CTA).
 * Returns a PNG buffer ready for upload.
 */
export async function composeAdImage(
  backgroundUrl: string,
  text: TextOverlay
): Promise<Buffer> {
  const { title, location, cta = 'Jetzt bewerben' } = text;

  // Download background image
  const res = await fetch(backgroundUrl);
  if (!res.ok) throw new Error(`Failed to download background image: ${res.status}`);
  const bgBuffer = Buffer.from(await res.arrayBuffer());

  // Resize to 1080×1080 (standard Facebook feed square)
  const bg = sharp(bgBuffer).resize(1080, 1080, { fit: 'cover', position: 'centre' });
  const { width = 1080, height = 1080 } = await bg.metadata();

  // Truncate title if too long
  const maxChars = 38;
  const titleLine1 = title.length <= maxChars ? title : title.slice(0, maxChars - 1) + '…';

  // Build SVG overlay
  const svgWidth = width;
  const svgHeight = height;
  const gradientStart = Math.round(svgHeight * 0.45); // gradient begins at 45% from top

  const ctaBoxW = 320;
  const ctaBoxH = 52;
  const ctaBoxX = 48;
  const ctaBoxY = svgHeight - 60;

  const locationY = ctaBoxY - 16;
  const titleY = locationY - (location ? 52 : 20);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.82)" />
    </linearGradient>
  </defs>

  <!-- Gradient overlay -->
  <rect x="0" y="${gradientStart}" width="${svgWidth}" height="${svgHeight - gradientStart}" fill="url(#grad)" />

  <!-- Job title -->
  <text
    x="48" y="${titleY}"
    font-family="Arial, Helvetica, sans-serif"
    font-weight="700"
    font-size="52"
    fill="white"
    dominant-baseline="auto"
  >${escapeXml(titleLine1)}</text>

  ${location ? `
  <!-- Location -->
  <text
    x="48" y="${locationY}"
    font-family="Arial, Helvetica, sans-serif"
    font-weight="400"
    font-size="28"
    fill="rgba(255,255,255,0.85)"
    dominant-baseline="auto"
  >${escapeXml(location)}</text>
  ` : ''}

  <!-- CTA pill background -->
  <rect
    x="${ctaBoxX}" y="${ctaBoxY - ctaBoxH + 8}"
    width="${ctaBoxW}" height="${ctaBoxH}"
    rx="26" ry="26"
    fill="white"
  />

  <!-- CTA text -->
  <text
    x="${ctaBoxX + ctaBoxW / 2}" y="${ctaBoxY - ctaBoxH / 2 + 14}"
    font-family="Arial, Helvetica, sans-serif"
    font-weight="700"
    font-size="22"
    fill="#111111"
    text-anchor="middle"
    dominant-baseline="middle"
  >${escapeXml(cta)}</text>
</svg>`.trim();

  const svgBuffer = Buffer.from(svg);

  const result = await bg
    .composite([{ input: svgBuffer, top: 0, left: 0 }])
    .png()
    .toBuffer();

  return result;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
