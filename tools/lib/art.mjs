/**
 * Deterministic SVG placeholder art. Same input -> same bytes, no network, no binary assets.
 * Real images dropped into assets/img/<kind>/<game>/<id>.(jpg|png|webp|svg) win over these.
 */

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) + amount);
  const g = clamp(((n >> 8) & 255) + amount);
  const b = clamp((n & 255) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const KINDS = {
  cover: { tag: 'COVER' },
  banner: { tag: 'BANNER' },
  map: { tag: 'MAP' },
  portrait: { tag: 'CHARACTER' },
  mission: { tag: 'MISSION' },
  vehicle: { tag: 'VEHICLE' },
  weapon: { tag: 'WEAPON' },
  cheat: { tag: 'CHEAT' },
  collectible: { tag: 'COLLECTIBLE' },
  location: { tag: 'LOCATION' },
  brand: { tag: 'BRAND' },
};

/** Build one placeholder SVG string. */
export function placeholder({ kind = 'portrait', width = 512, height = 512, title = '', subtitle = '', accent = '#495057', seed }) {
  const w = width;
  const h = height;
  const bg = shade(accent, -150);
  const bg2 = shade(accent, -95);
  const fg = shade(accent, 120);
  const tag = (KINDS[kind] || KINDS.portrait).tag;
  const s = hash(`${kind}|${title}|${seed || ''}`);
  const angle = 18 + (s % 26);
  const cx = w / 2;
  const cy = h / 2;
  const big = Math.min(w, h) * (kind === 'portrait' ? 0.3 : 0.18);
  const initials = String(title)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] || '')
    .join('')
    .toUpperCase() || '?';
  const stripe = Math.max(2, Math.round(Math.min(w, h) * 0.008));
  const titleSize = Math.round(Math.min(w / 12, h / 7, 64));
  const smallSize = Math.max(10, Math.round(titleSize * 0.34));
  const maxChars = Math.max(10, Math.floor((w * 0.86) / (titleSize * 0.56)));
  const shortTitle = String(title).length > maxChars ? String(title).slice(0, maxChars - 1) + '…' : String(title);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)} — placeholder image">
<title>${esc(title)} — placeholder</title>
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${bg2}"/>
</linearGradient>
<pattern id="p" width="${stripe * 6}" height="${stripe * 6}" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})">
<rect width="${stripe}" height="${stripe * 6}" fill="${fg}" opacity="0.07"/>
</pattern>
</defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>
<rect width="${w}" height="${h}" fill="url(#p)"/>
<rect x="${stripe * 2}" y="${stripe * 2}" width="${w - stripe * 4}" height="${h - stripe * 4}" fill="none" stroke="${fg}" stroke-opacity="0.25" stroke-width="${stripe}"/>
<text x="${cx}" y="${cy - big * 0.15}" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-weight="800" font-size="${big}" fill="${fg}" fill-opacity="0.22" letter-spacing="${big * 0.05}">${esc(initials)}</text>
<text x="${cx}" y="${cy + titleSize * 0.6}" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-weight="700" font-size="${titleSize}" fill="${fg}">${esc(shortTitle)}</text>
<text x="${cx}" y="${cy + titleSize * 1.6}" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,monospace" font-size="${smallSize}" fill="${fg}" fill-opacity="0.72">${esc(subtitle || tag)}</text>
<text x="${w / 2}" y="${h - stripe * 5}" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,monospace" font-size="${Math.max(8, smallSize * 0.8)}" fill="${fg}" fill-opacity="0.45">${tag} · ${w}×${h} · PLACEHOLDER</text>
</svg>`;
}

/** Simple wordmark used in the header and as the favicon. */
export function brandSvg(accent = '#e03131') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="GTA Hub">
<rect width="128" height="128" rx="18" fill="${shade(accent, -120)}"/>
<rect x="10" y="10" width="108" height="108" rx="12" fill="none" stroke="${shade(accent, 90)}" stroke-width="3"/>
<text x="64" y="82" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-weight="800" font-size="52" fill="${shade(accent, 130)}">GTA</text>
<text x="64" y="106" text-anchor="middle" font-family="ui-monospace,monospace" font-size="14" fill="${shade(accent, 100)}" letter-spacing="2">HUB</text>
</svg>`;
}
