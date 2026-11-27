import { SECTIONS } from './schema.mjs';

export const esc = (v = '') =>
  String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const slugify = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const fmtMoney = (n) =>
  typeof n === 'number' && Number.isFinite(n) ? `$${n.toLocaleString('en-US')}` : '—';

export function get(obj, path) {
  return path.split('.').reduce((acc, k) => (acc == null ? undefined : acc[k]), obj);
}

/** Serialise JSON for inline <script> safely. */
export function jsonScript(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/-->/g, '--\\u003e');
}

/* ------------------------------------------------------------------ layout */

const ICON_SEARCH =
  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>';

const ICON_SUN =
  '<svg class="icon-dark" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2 12h2.4M19.6 12H22M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7"/></svg>';

const ICON_MOON =
  '<svg class="icon-light" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z"/></svg>';

/** Is this nav entry the current section? */
function isCurrent(href, canonicalPath) {
  if (href === '/') return canonicalPath === '/';
  return canonicalPath === href || canonicalPath.startsWith(href);
}

export function layout({
  rel = '',
  site,
  title,
  description,
  canonicalPath,
  jsonPath,
  content,
  jsonld = [],
  pageType = 'page',
  breadcrumbs = [],
  noindex = false,
}) {
  const canonical = site.base_url + canonicalPath;
  const navItems = site.nav
    .map((n) => {
      const href = n.href === '/' ? rel || './' : rel + n.href.replace(/^\//, '');
      const current = isCurrent(n.href, canonicalPath) ? ' aria-current="page"' : '';
      return `<li><a href="${esc(href)}"${current}>${esc(n.label)}</a></li>`;
    })
    .join('');

  const searchAction = `${rel}search/`;

  const crumbs = breadcrumbs.length
    ? `<nav class="crumbs" aria-label="Breadcrumb"><ol>${breadcrumbs
        .map((b, i) =>
          i === breadcrumbs.length - 1
            ? `<li><span aria-current="page">${esc(b.label)}</span></li>`
            : `<li><a href="${esc(b.href === '/' ? rel || './' : rel + b.href.replace(/^\//, ''))}">${esc(b.label)}</a></li>`
        )
        .join('')}</ol></nav>`
    : '';

  const alternate = jsonPath
    ? `<link rel="alternate" type="application/json" href="${esc(rel + jsonPath.replace(/^\//, ''))}" title="Machine-readable JSON">`
    : '';

  return `<!doctype html>
<html lang="${esc(site.language || 'en')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
${alternate}
<meta name="robots" content="${noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large'}">
<meta name="generator" content="gta-hub build">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.title)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(site.base_url + (site.build.og_image || '/assets/img/brand/og.png'))}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0b0c0e">
<link rel="icon" href="${rel}assets/img/brand/favicon.svg" type="image/svg+xml">
<script>(function(){try{var t=localStorage.getItem('gta-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}})();</script>
<link rel="stylesheet" href="${rel}assets/css/site.css">
${jsonld.map((o) => `<script type="application/ld+json">${jsonScript(o)}</script>`).join('\n')}
<script src="${rel}assets/js/site.js" defer></script>
</head>
<body data-page="${esc(pageType)}">
<a class="skip" href="#main">Skip to content</a>
<header class="site-head">
  <a class="brand" href="${rel || './'}"><svg width="30" height="30" viewBox="0 0 128 128" aria-hidden="true"><rect width="128" height="128" rx="20" fill="#1a1d23"/><text x="64" y="86" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="54" fill="#ff4d5a">GTA</text></svg><span>${esc(site.title)}</span></a>
  <nav aria-label="Primary"><ul>${navItems}</ul></nav>
  <div class="head-actions">
    <form class="head-search" role="search" action="${esc(searchAction)}" method="get">
      ${ICON_SEARCH}
      <label class="visually-hidden" for="head-q">Search all games</label>
      <input id="head-q" name="q" type="search" placeholder="Search records…" autocomplete="off">
    </form>
    <button class="icon-btn" id="theme-toggle" type="button" aria-label="Toggle colour theme" title="Toggle colour theme">${ICON_SUN}${ICON_MOON}</button>
  </div>
</header>
${crumbs}
<main id="main" tabindex="-1">
${content}
</main>
<footer class="site-foot">
  <div class="foot-inner">
    <div class="foot-brand">
      <a class="brand" href="${rel || './'}"><svg width="26" height="26" viewBox="0 0 128 128" aria-hidden="true"><rect width="128" height="128" rx="20" fill="#1a1d23"/><text x="64" y="86" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="54" fill="#ff4d5a">GTA</text></svg><span>${esc(site.title)}</span></a>
      <p>${esc(site.tagline)} Static, machine-readable, no external services.</p>
    </div>
    <nav class="foot-col" aria-label="Explore">
      <h2>Explore</h2>
      <ul>
        <li><a href="${rel}timeline/">Timeline</a></li>
        <li><a href="${rel}compare/">Compare games</a></li>
        <li><a href="${rel}cheats/">Cheat codes</a></li>
        <li><a href="${rel}locations/">Locations</a></li>
        <li><a href="${rel}search/">Search</a></li>
      </ul>
    </nav>
    <nav class="foot-col" aria-label="Data">
      <h2>Data</h2>
      <ul>
        <li><a href="${rel}data/index.json">index.json</a></li>
        <li><a href="${rel}data/search-index.json">search-index.json</a></li>
        <li><a href="${rel}data/images.json">images.json</a></li>
        <li><a href="${rel}llms.txt">llms.txt</a></li>
        <li><a href="${rel}sitemap.xml">sitemap.xml</a></li>
      </ul>
    </nav>
    <nav class="foot-col" aria-label="About">
      <h2>About</h2>
      <ul>
        <li><a href="${rel}about/">How this site works</a></li>
        <li><a href="${rel}about/#accuracy">Accuracy</a></li>
        <li><a href="${rel}assets/img/CREDITS.md">Image credits</a></li>
        <li><a href="${esc(site.repo)}" rel="noopener">Source on GitHub</a></li>
      </ul>
    </nav>
  </div>
  <div class="foot-legal">
    <p class="fine">Unofficial fan reference. Game names, trademarks and artwork are property of Rockstar Games and Take-Two Interactive. ${esc(site.license)}</p>
  </div>
</footer>
</body>
</html>
`;
}

/* -------------------------------------------------------------- components */

export function pageHead({ eyebrow, title, lead, meta = [] }) {
  return `<header class="page-head">
  ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
  <h1>${esc(title)}</h1>
  ${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
  ${
    meta.length
      ? `<dl class="facts">${meta
          .map((m) => `<div><dt>${esc(m.label)}</dt><dd>${m.html ?? esc(m.value)}</dd></div>`)
          .join('')}</dl>`
      : ''
  }
</header>`;
}

export function dataLink(rel, href, label) {
  return `<p class="data-link"><a href="${esc(rel + href.replace(/^\//, ''))}" type="application/json">${esc(label)} <span aria-hidden="true">→</span></a></p>`;
}

export function coverageBadge(section, sectionData) {
  const count = (sectionData?.items || []).length;
  const coverage = sectionData?.coverage || 'empty';
  return `<span class="badge badge-${esc(coverage)}" title="coverage: ${esc(coverage)}">${count} ${esc(SECTIONS[section].title.toLowerCase())} · ${esc(coverage)}</span>`;
}

function cellValue(col, row, rel, game) {
  const v = get(row, col.key);
  switch (col.type) {
    case 'number':
      return typeof v === 'number' ? `<td class="num" data-sort="${v}">${v.toLocaleString('en-US')}</td>` : '<td class="num" data-sort="">—</td>';
    case 'money':
      return `<td class="num" data-sort="${typeof v === 'number' ? v : ''}">${fmtMoney(v)}</td>`;
    case 'list':
      return `<td data-sort="${esc(Array.isArray(v) ? v.join(', ') : '')}">${Array.isArray(v) && v.length ? v.map((x) => esc(x)).join(', ') : '—'}</td>`;
    case 'codes':
      return `<td class="codes">${
        Array.isArray(v) && v.length
          ? v
              .map(
                (c) =>
                  `<span class="code-row"><span class="plat">${esc(c.platform)}${
                    c.edition ? ` · ${esc(c.edition)}` : ''
                  }</span><code>${esc(c.code)}</code></span>`
              )
              .join('')
          : '—'
      }</td>`;
    default: {
      const sort = esc(v == null ? '' : Array.isArray(v) ? v.join(', ') : v);
      if (col.primary) {
        const key = col.__section;
        if (SECTIONS[key]?.detail) {
          return `<td data-sort="${sort}"><a href="${esc(`${rel}games/${game.slug}/${key}/${row.id}/`)}">${esc(v)}</a></td>`;
        }
        return `<td data-sort="${sort}"><strong>${esc(v)}</strong></td>`;
      }
      return `<td data-sort="${sort}">${v == null || v === '' ? '—' : esc(v)}</td>`;
    }
  }
}

export function sectionTable(section, items, rel, game) {
  const s = SECTIONS[section];
  const cols = s.columns.map((c) => ({ ...c, __section: section }));
  const numeric = s.columns.filter((c) => c.type === 'number' || c.type === 'money').length;
  const thumbs = items.some((r) => r.image);
  const rows = items
    .map((row) => {
      const cells = cols.map((c) => cellValue(c, row, rel, game)).join('');
      const thumb = thumbs
        ? `<td class="thumb-col">${
            row.image
              ? `<img loading="lazy" decoding="async" src="${esc(rel + row.image)}" alt="${esc(
                  (row.name || row.effect || '') + (row.image.endsWith('.svg') ? ' (placeholder)' : '')
                )}" width="${s.image.width}" height="${s.image.height}">`
              : ''
          }</td>`
        : '';
      return `<tr data-id="${esc(row.id)}" data-search="${esc(
        [row.id, row.name, row.effect, row.summary, row.status, row.role, row.location, row.giver]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
      )}"${row.verified === false ? ' class="unverified" title="Unverified record"' : ''}>${thumb}${cells}</tr>`;
    })
    .join('\n');
  return `<div class="table-wrap">
<table class="data-table${numeric ? ' has-num' : ''}${thumbs ? ' has-thumb' : ''}" data-sortable>
<caption>${esc(s.title)} — ${esc(game.title)} (${items.length} records)</caption>
<thead><tr>${thumbs ? '<th scope="col" class="thumb-col"><span class="visually-hidden">Image</span></th>' : ''}${cols
    .map(
      (c) =>
        `<th scope="col" data-sort${c.type === 'number' || c.type === 'money' ? ' class="num"' : ''}>${esc(c.label)}</th>`
    )
    .join('')}</tr></thead>
<tbody>
${rows || `<tr><td colspan="${cols.length + (thumbs ? 1 : 0)}">No records yet.</td></tr>`}
</tbody>
</table>
</div>`;
}

export function filterBar(label, placeholder, withToggle = false) {
  const toggle = withToggle
    ? `<div class="view-toggle" role="group" aria-label="View mode">
    <button type="button" data-view="gallery" aria-pressed="true">Gallery</button>
    <button type="button" data-view="table" aria-pressed="false">Table</button>
  </div>`
    : '';
  return `<div class="filter-bar">
  <label for="table-filter">${esc(label)}</label>
  <input id="table-filter" type="search" autocomplete="off" placeholder="${esc(placeholder)}" aria-controls="gallery-results table-results">
  <span class="filter-count" id="table-filter-count" aria-live="polite"></span>
  ${toggle}
</div>`;
}

function galleryMeta(section, row) {
  switch (section) {
    case 'characters': {
      const parts = [];
      if (row.status) parts.push(`<span><strong>Status:</strong> ${esc(row.status)}</span>`);
      if (row.affiliations?.length) parts.push(`<span>${esc(row.affiliations.slice(0, 2).join(', '))}</span>`);
      return parts.join('');
    }
    case 'missions': {
      const parts = [];
      if (row.giver) parts.push(`<span><strong>Giver:</strong> ${esc(row.giver)}</span>`);
      if (row.reward?.money) parts.push(`<span><strong>Reward:</strong> ${fmtMoney(row.reward.money)}</span>`);
      else if (row.location) parts.push(`<span>${esc(row.location)}</span>`);
      return parts.join('');
    }
    case 'vehicles': {
      const parts = [];
      if (row.top_speed_kph) parts.push(`<span><strong>Top:</strong> ${row.top_speed_kph} km/h</span>`);
      if (row.seats != null) parts.push(`<span><strong>Seats:</strong> ${row.seats}</span>`);
      if (row.price) parts.push(`<span><strong>Price:</strong> ${fmtMoney(row.price)}</span>`);
      return parts.join('');
    }
    case 'weapons': {
      const parts = [];
      if (row.damage_tier) parts.push(`<span><strong>Damage:</strong> ${esc(row.damage_tier)}</span>`);
      if (row.price != null) parts.push(`<span><strong>Price:</strong> ${fmtMoney(row.price)}</span>`);
      if (row.ammo) parts.push(`<span><strong>Ammo:</strong> ${esc(row.ammo)}</span>`);
      return parts.join('');
    }
    case 'locations': {
      const parts = [];
      if (row.parent) parts.push(`<span><strong>In:</strong> ${esc(row.parent)}</span>`);
      return parts.join('');
    }
    case 'collectibles': {
      const parts = [];
      if (row.count != null) parts.push(`<span><strong>Count:</strong> ${row.count}</span>`);
      if (row.reward?.money) parts.push(`<span><strong>Reward:</strong> ${fmtMoney(row.reward.money)}</span>`);
      return parts.join('');
    }
    default:
      return '';
  }
}

function galleryKicker(section, row) {
  switch (section) {
    case 'characters':
      return row.role || 'Character';
    case 'missions':
      return `#${row.order ?? ''} · ${row.type || 'Mission'}`;
    case 'vehicles':
      return [row.category, row.class].filter(Boolean).join(' · ') || 'Vehicle';
    case 'weapons':
      return row.type || 'Weapon';
    case 'locations':
      return row.type || 'Location';
    case 'collectibles':
      return row.count != null ? `${row.count} items` : 'Collectible';
    default:
      return '';
  }
}

/** Spacious visual card gallery for a game section. */
export function sectionGallery(section, items, rel, game) {
  const s = SECTIONS[section];
  const isPortrait = section === 'characters';
  const isContain = section === 'vehicles' || section === 'weapons' || section === 'collectibles';
  const cards = items
    .map((row) => {
      const title = row.name || row.effect || row.id;
      const kicker = galleryKicker(section, row);
      const meta = galleryMeta(section, row);
      const search = [row.id, row.name, row.effect, row.summary, row.status, row.role, row.location, row.giver, row.category, row.type]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const thumb = row.image
        ? `<div class="media-thumb${isPortrait ? ' is-portrait' : ''}${isContain ? ' is-contain' : ''}">
        <img loading="lazy" decoding="async" src="${esc(rel + row.image)}" alt="${esc(title)}${row.image.endsWith('.svg') ? ' (placeholder)' : ''}" width="${s.image.width}" height="${s.image.height}">
      </div>`
        : '';
      const inner = `${thumb}<div class="media-body">
        ${kicker ? `<div class="media-kicker">${esc(kicker)}</div>` : ''}
        <div class="media-title">${esc(title)}</div>
        ${row.summary ? `<p class="media-summary">${esc(row.summary)}</p>` : ''}
        ${meta ? `<div class="media-meta">${meta}</div>` : ''}
      </div>`;
      const wrapped = s.detail
        ? `<a class="media-card-link" href="${esc(`${rel}games/${game.slug}/${section}/${row.id}/`)}">${inner}</a>`
        : inner;
      return `<li class="media-card" data-id="${esc(row.id)}" data-search="${esc(search)}">${wrapped}</li>`;
    })
    .join('\n');
  return `<ul class="media-grid">${cards}</ul>`;
}


export function statGrid(stats) {
  return `<dl class="stats">${stats
    .map(
      (s) =>
        `<div class="stat"><dt>${esc(s.label)}</dt><dd>${s.html ?? esc(s.value)}</dd></div>`
    )
    .join('')}</dl>`;
}

export function cardGrid(cards) {
  return `<ul class="cards">${cards
    .map(
      (c) => `<li class="card${c.muted ? ' muted' : ''}">
  <a href="${esc(c.href)}">
    <span class="card-kicker">${esc(c.kicker || '')}</span>
    <span class="card-title">${esc(c.title)}</span>
    <span class="card-meta">${esc(c.meta || '')}</span>
  </a>
</li>`
    )
    .join('')}</ul>`;
}

/** Poster grid for the game library. */
export function gameGrid(games) {
  return `<ul class="game-grid">${games
    .map(
      (g, i) => `<li>
  <a class="game-card${g.empty ? ' is-empty' : ''}" href="${esc(g.href)}"${g.accent ? ` style="--game-accent:${esc(g.accent)}"` : ''}>
    <span class="cover-wrap">
      <img class="cover" src="${esc(g.cover)}" alt="${esc(g.title)} box art" width="600" height="900" loading="${
        i < 6 ? 'eager' : 'lazy'
      }" decoding="async">
      <span class="cover-badge">${esc(g.badge || '')}</span>
    </span>
    <span class="game-body">
      <span class="game-title">${esc(g.title)}</span>
      <span class="game-meta">${esc(g.meta || '')}</span>
    </span>
  </a>
</li>`
    )
    .join('')}</ul>`;
}
