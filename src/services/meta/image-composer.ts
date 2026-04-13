import sharp from 'sharp';

interface TextOverlay {
  title: string;
  location?: string;
  cta?: string;
  benefits?: string[];   // up to 3 items
  logoUrl?: string;      // company logo URL
}

/**
 * Downloads a background image and composites a branded text overlay:
 * - Company logo (top-left)
 * - Dark gradient (bottom half)
 * - Up to 3 benefit chips
 * - Job title
 * - Location
 * - CTA button
 *
 * Returns a PNG buffer ready for upload.
 */
export async function composeAdImage(
  backgroundUrl: string,
  text: TextOverlay
): Promise<Buffer> {
  const { title, location, cta = 'Jetzt bewerben', benefits = [], logoUrl } = text;

  // Download background image
  const res = await fetch(backgroundUrl);
  if (!res.ok) throw new Error(`Failed to download background image: ${res.status}`);
  const bgBuffer = Buffer.from(await res.arrayBuffer());

  // Resize to 1080×1080 (standard Facebook feed square)
  const bg = sharp(bgBuffer).resize(1080, 1080, { fit: 'cover', position: 'centre' });

  // Fetch & convert logo to base64 PNG (80×80, transparent bg)
  let logoBase64: string | null = null;
  if (logoUrl) {
    try {
      const logoRes = await fetch(logoUrl);
      if (logoRes.ok) {
        const logoBuffer = Buffer.from(await logoRes.arrayBuffer());
        const logoPng = await sharp(logoBuffer)
          .resize(80, 80, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .png()
          .toBuffer();
        logoBase64 = logoPng.toString('base64');
      }
    } catch {
      // Logo is optional — silently skip on failure
    }
  }

  // Layout constants (1080×1080)
  const W = 1080;
  const H = 1080;
  const PAD = 56;
  const gradientStart = Math.round(H * 0.42); // gradient covers bottom 58%

  // Text positions (bottom-up)
  const ctaH = 72;
  const ctaW = 380;
  const ctaY = H - 72;                         // CTA pill top
  const locationY = ctaY - 28;                 // location baseline
  const titleY = locationY - 80;               // title baseline
  const hasBenefits = benefits.length > 0;
  const benefitY = titleY - (hasBenefits ? 90 : 0); // benefit chips top

  // Truncate title
  const maxChars = 30;
  const titleText = title.length <= maxChars ? title : title.slice(0, maxChars - 1) + '…';

  // Truncate each benefit to fit in chip (~14 chars at 28px)
  const maxBenefitChars = 14;
  const b = benefits.slice(0, 3).map((s) =>
    s.length <= maxBenefitChars ? s : s.slice(0, maxBenefitChars - 1) + '…'
  );

  // Benefit chip positions (3 across)
  const chipH = 60;
  const chipGap = 14;
  const chipW = Math.floor((W - PAD * 2 - chipGap * (b.length - 1)) / Math.max(b.length, 1));

  const benefitChips = b.map((txt, i) => {
    const x = PAD + i * (chipW + chipGap);
    const y = benefitY;
    return `
    <rect x="${x}" y="${y}" width="${chipW}" height="${chipH}" rx="${chipH / 2}" fill="rgba(255,255,255,0.20)" />
    <text x="${x + 20}" y="${y + chipH / 2 + 1}"
      font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="28"
      fill="white" dominant-baseline="middle"
    >✓ ${escapeXml(txt)}</text>`;
  }).join('\n');

  // Logo block (top-left)
  const logoBlock = logoBase64 ? `
  <defs>
    <clipPath id="lc">
      <rect x="${PAD}" y="${PAD}" width="80" height="80" rx="10"/>
    </clipPath>
  </defs>
  <!-- Logo white backing -->
  <rect x="${PAD - 4}" y="${PAD - 4}" width="88" height="88" rx="13" fill="white" opacity="0.92"/>
  <!-- Logo image -->
  <image href="data:image/png;base64,${logoBase64}"
    x="${PAD}" y="${PAD}" width="80" height="80"
    clip-path="url(#lc)" preserveAspectRatio="xMidYMid meet"/>
  ` : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.85)"/>
    </linearGradient>
  </defs>

  <!-- Gradient overlay -->
  <rect x="0" y="${gradientStart}" width="${W}" height="${H - gradientStart}" fill="url(#grad)"/>

  ${logoBlock}

  ${hasBenefits ? `<!-- Benefit chips -->\n${benefitChips}` : ''}

  <!-- Job title -->
  <text x="${PAD}" y="${titleY}"
    font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="72"
    fill="white" dominant-baseline="auto"
  >${escapeXml(titleText)}</text>

  ${location ? `
  <!-- Location -->
  <text x="${PAD}" y="${locationY}"
    font-family="Arial,Helvetica,sans-serif" font-weight="400" font-size="38"
    fill="rgba(255,255,255,0.88)" dominant-baseline="auto"
  >${escapeXml(location)}</text>` : ''}

  <!-- CTA pill -->
  <rect x="${PAD}" y="${ctaY}" width="${ctaW}" height="${ctaH}" rx="${ctaH / 2}" fill="white"/>
  <text x="${PAD + ctaW / 2}" y="${ctaY + ctaH / 2 + 2}"
    font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="30"
    fill="#111111" text-anchor="middle" dominant-baseline="middle"
  >${escapeXml(cta)}</text>
</svg>`;

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
