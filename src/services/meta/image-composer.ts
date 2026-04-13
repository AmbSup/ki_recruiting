import sharp from 'sharp';

interface TextOverlay {
  title: string;
  companyName?: string;
  location?: string;
  cta?: string;
  benefits?: string[];   // up to 3 items
  logoUrl?: string;      // company logo URL
}

/**
 * Composes a recruitment ad image:
 *
 * Layout (reference: LinkedIn/Facebook job ads):
 *   TOP    — Logo + Company name
 *            "Wir stellen ein:"
 *            Job Title (large, bold)
 *   MIDDLE — 3 benefit bullet points
 *   BOTTOM — CTA button
 *
 * Dark semi-transparent overlay over entire background photo.
 */
export async function composeAdImage(
  backgroundUrl: string,
  text: TextOverlay
): Promise<Buffer> {
  const {
    title,
    companyName,
    location,
    cta = 'Jetzt bewerben!',
    benefits = [],
    logoUrl,
  } = text;

  // Download & resize background to 1080×1080
  const res = await fetch(backgroundUrl);
  if (!res.ok) throw new Error(`Failed to download background image: ${res.status}`);
  const bgBuffer = Buffer.from(await res.arrayBuffer());
  const bg = sharp(bgBuffer).resize(1080, 1080, { fit: 'cover', position: 'centre' });

  // Fetch & prepare logo (80×80 PNG)
  let logoBase64: string | null = null;
  if (logoUrl) {
    try {
      const logoRes = await fetch(logoUrl);
      if (logoRes.ok) {
        const logoBuf = Buffer.from(await logoRes.arrayBuffer());
        const logoPng = await sharp(logoBuf)
          .resize(80, 80, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .png()
          .toBuffer();
        logoBase64 = logoPng.toString('base64');
      }
    } catch { /* logo is optional */ }
  }

  // ── Layout constants ──────────────────────────────────────────
  const W = 1080;
  const H = 1080;
  const PAD = 64;

  // Truncate title for 2 lines max (~22 chars per line at 80px)
  const maxChars = 22;
  const words = title.split(' ');
  let line1 = '';
  let line2 = '';
  for (const word of words) {
    if (line1.length + word.length + 1 <= maxChars) {
      line1 = line1 ? `${line1} ${word}` : word;
    } else {
      line2 = line2 ? `${line2} ${word}` : word;
    }
  }
  if (line2.length > maxChars) line2 = line2.slice(0, maxChars - 1) + '…';

  const hasTwoLines = line2.length > 0;

  // Top section positions
  const logoY = PAD;
  const companyNameX = logoUrl ? PAD + 90 : PAD;
  const companyNameY = logoY + 50;

  const taglineY = logoUrl ? logoY + 110 : PAD + 60;   // "Wir stellen ein:"
  const titleY1 = taglineY + 90;                        // title line 1
  const titleY2 = titleY1 + 95;                         // title line 2 (if needed)

  // Benefits section
  const benefitsStartY = (hasTwoLines ? titleY2 : titleY1) + 80;
  const benefitLineH = 72;

  // CTA at bottom
  const ctaH = 76;
  const ctaW = 400;
  const ctaY = H - PAD - ctaH;

  // Location (small, above CTA)
  const locationY = ctaY - 24;

  // Truncate benefits
  const bMax = 20;
  const b = benefits.slice(0, 3).map((s) =>
    s.length <= bMax ? s : s.slice(0, bMax - 1) + '…'
  );

  // ── SVG ──────────────────────────────────────────────────────
  const logoBlock = logoBase64 ? `
  <defs>
    <clipPath id="lc">
      <rect x="${PAD}" y="${logoY}" width="80" height="80" rx="12"/>
    </clipPath>
  </defs>
  <rect x="${PAD - 4}" y="${logoY - 4}" width="88" height="88" rx="15" fill="white" opacity="0.15"/>
  <image href="data:image/png;base64,${logoBase64}"
    x="${PAD}" y="${logoY}" width="80" height="80"
    clip-path="url(#lc)" preserveAspectRatio="xMidYMid meet"/>
  ` : '';

  const benefitItems = b.map((txt, i) => {
    const y = benefitsStartY + i * benefitLineH;
    return `
    <text x="${PAD + 44}" y="${y}"
      font-family="Arial,Helvetica,sans-serif" font-weight="400" font-size="38"
      fill="white" dominant-baseline="middle"
    >${escapeXml(txt)}</text>
    <circle cx="${PAD + 14}" cy="${y}" r="8" fill="white" opacity="0.9"/>`;
  }).join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}">

  <!-- Dark overlay over entire image for readability -->
  <rect x="0" y="0" width="${W}" height="${H}" fill="rgba(0,0,0,0.55)"/>

  ${logoBlock}

  ${companyName ? `
  <!-- Company name -->
  <text x="${companyNameX}" y="${companyNameY}"
    font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="34"
    fill="white" dominant-baseline="middle" opacity="0.95"
  >${escapeXml(companyName)}</text>` : ''}

  <!-- "Wir stellen ein:" tagline -->
  <text x="${PAD}" y="${taglineY}"
    font-family="Arial,Helvetica,sans-serif" font-weight="400" font-size="42"
    fill="rgba(255,255,255,0.85)" dominant-baseline="auto"
  >Wir stellen ein:</text>

  <!-- Job title line 1 -->
  <text x="${PAD}" y="${titleY1}"
    font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="84"
    fill="white" dominant-baseline="auto"
  >${escapeXml(line1)}</text>

  ${hasTwoLines ? `
  <!-- Job title line 2 -->
  <text x="${PAD}" y="${titleY2}"
    font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="84"
    fill="white" dominant-baseline="auto"
  >${escapeXml(line2)}</text>` : ''}

  <!-- Benefits -->
  ${benefitItems}

  ${location ? `
  <!-- Location -->
  <text x="${PAD}" y="${locationY}"
    font-family="Arial,Helvetica,sans-serif" font-weight="400" font-size="34"
    fill="rgba(255,255,255,0.75)" dominant-baseline="auto"
  >${escapeXml(location)}</text>` : ''}

  <!-- CTA pill -->
  <rect x="${PAD}" y="${ctaY}" width="${ctaW}" height="${ctaH}" rx="${ctaH / 2}" fill="white"/>
  <text x="${PAD + ctaW / 2}" y="${ctaY + ctaH / 2 + 2}"
    font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="32"
    fill="#111111" text-anchor="middle" dominant-baseline="middle"
  >${escapeXml(cta)}</text>

</svg>`;

  const svgBuffer = Buffer.from(svg);

  return bg
    .composite([{ input: svgBuffer, top: 0, left: 0 }])
    .png()
    .toBuffer();
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
