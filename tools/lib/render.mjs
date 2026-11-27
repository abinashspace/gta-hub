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

const APP_TABS = [
  {
    key: 'home',
    label: 'Home',
    href: '/',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
  },
  {
    key: 'search',
    label: 'Search',
    href: '/search/',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>',
  },
  {
    key: 'cheats',
    label: 'Cheats',
    href: '/cheats/',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="4"/><path d="M7 12h4M9 10v4M15.5 11h.01M17.5 13h.01"/></svg>',
  },
  {
    key: 'profile',
    label: 'Profile',
    href: '/profile/',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  },
];

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

  const activeTabLabel =
    pageType === 'home'
      ? 'HOME'
      : pageType === 'search'
        ? 'SEARCH'
        : pageType === 'profile'
          ? 'PROFILE'
          : pageType === 'cheats'
            ? 'CHEATS'
            : pageType === 'locations'
              ? 'LOCATIONS'
              : pageType === 'timeline'
                ? 'TIMELINE'
                : pageType === 'compare'
                  ? 'COMPARE'
                  : pageType === 'game' || pageType === 'section' || pageType === 'detail'
                    ? 'GAMES'
                    : 'GUIDE';

  const appNavItems = APP_TABS.map((t) => {
    const href = t.href === '/' ? rel || './' : rel + t.href.replace(/^\//, '');
    const current = isCurrent(t.href, canonicalPath) ? ' aria-current="page"' : '';
    return `<a class="app-nav-item" href="${esc(href)}"${current}>${t.icon}<span>${esc(t.label)}</span></a>`;
  }).join('');

  return `<!doctype html>
<html lang="${esc(site.language || 'en')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
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
<meta name="theme-color" content="#FFD500">
<link rel="icon" href="${rel}assets/img/brand/favicon.svg" type="image/svg+xml">
<script>(function(){try{var t=localStorage.getItem('gta-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}})();</script>
<link rel="stylesheet" href="${rel}assets/css/site.css">
${jsonld.map((o) => `<script type="application/ld+json">${jsonScript(o)}</script>`).join('\n')}
<script src="${rel}assets/js/site.js" defer></script>
</head>
<body data-page="${esc(pageType)}">
<a class="skip" href="#main">Skip to content</a>
<div class="desktop-stage">
  <aside class="desktop-intro" aria-label="About GTA Hub">
    <div class="desktop-avatar">
      <img src="${rel}assets/img/cover/gta-v/cover.png" alt="GTA Hub" width="96" height="96" loading="eager" decoding="async">
    </div>
    <h2 class="desktop-title">GTA Hub</h2>
    <p class="desktop-lead">Every Grand Theft Auto game in one place. Look up characters, vehicles, weapons, missions, locations, and cheat codes.</p>
    <ul class="desktop-pills">
      <li>17 GTA games &amp; 3,700+ records</li>
      <li>Real in-game art &amp; portraits</li>
      <li>Offline cheat codes &amp; search</li>
      <li>Daily “Do You Know?” spotlight</li>
    </ul>
    <a class="desktop-apk-btn" href="https://github.com/abinashspace/gta-hub/releases/latest" target="_blank" rel="noopener">Download Android APK →</a>
  </aside>
  <div class="phone-frame">
    <div class="phone-screen">
      <header class="site-head">
        <a class="brand" href="${rel || './'}"><span class="brand-mark">GTA</span><span>HUB</span></a>
        <nav aria-label="Primary"><ul>${navItems}</ul></nav>
        <div class="head-actions">
          <form class="head-search" role="search" action="${esc(searchAction)}" method="get">
            ${ICON_SEARCH}
            <label class="visually-hidden" for="head-q">Search all games</label>
            <input id="head-q" name="q" type="search" placeholder="Search records…" autocomplete="off">
          </form>
          <span class="app-tab-pill">${esc(activeTabLabel)}</span>
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
            <a class="brand" href="${rel || './'}"><span class="brand-mark">GTA</span><span>HUB</span></a>
            <p>${esc(site.tagline)}</p>
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
    </div>
    <nav class="app-nav" aria-label="App navigation">${appNavItems}</nav>
    <div id="toast" role="status" aria-live="polite"></div>
  </div>
</div>
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

function galleryTag(section, row) {
  switch (section) {
    case 'vehicles':
      return row.category || '';
    case 'weapons':
      return row.type || '';
    case 'locations':
      return row.type || '';
    case 'missions':
      return row.type || '';
    default:
      return '';
  }
}

/** Pure visual image gallery — image + title (+ optional 1-word tag). */
export function sectionGallery(section, items, rel, game) {
  const s = SECTIONS[section];
  const isPortrait = section === 'characters';
  const isContain = section === 'vehicles' || section === 'weapons' || section === 'collectibles';
  const cards = items
    .map((row) => {
      const title = row.name || row.effect || row.id;
      const tag = galleryTag(section, row);
      const search = [row.id, row.name, row.effect, row.status, row.role, row.location, row.giver, row.category, row.type]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const thumb = row.image
        ? `<div class="media-thumb${isPortrait ? ' is-portrait' : ''}${isContain ? ' is-contain' : ''}">
        <img loading="lazy" decoding="async" src="${esc(rel + row.image)}" alt="${esc(title)}" width="${s.image.width}" height="${s.image.height}">
      </div>`
        : '';
      const inner = `${thumb}<div class="media-body">
        <span class="media-title">${esc(title)}</span>
        ${tag ? `<span class="media-tag">${esc(tag)}</span>` : ''}
      </div>`;
      const wrapped = s.detail
        ? `<a class="media-card-link" href="${esc(`${rel}games/${game.slug}/${section}/${row.id}/`)}">${inner}</a>`
        : `<a class="media-card-link" href="${esc(`${rel}games/${game.slug}/${section}/`)}">${inner}</a>`;
      return `<li class="media-card" data-id="${esc(row.id)}" data-search="${esc(search)}">${wrapped}</li>`;
    })
    .join('\n');
  return `<ul class="media-grid">${cards}</ul>`;
}

/** Compact visual preview strip (used on home & game overview pages). */
export function visualStrip(section, items, rel, game, limit = 4) {
  const real = items.filter((r) => r.image && !r.image.endsWith('.svg'));
  const picks = (real.length ? real : items.filter((r) => r.image)).slice(0, limit);
  if (!picks.length) return '';
  const s = SECTIONS[section];
  const isPortrait = section === 'characters';
  const isContain = section === 'vehicles' || section === 'weapons' || section === 'collectibles';
  const cards = picks
    .map((row) => {
      const title = row.name || row.effect || row.id;
      const href = s.detail
        ? `${rel}games/${game.slug}/${section}/${row.id}/`
        : `${rel}games/${game.slug}/${section}/`;
      return `<li class="media-card">
  <a class="media-card-link" href="${esc(href)}">
    <div class="media-thumb${isPortrait ? ' is-portrait' : ''}${isContain ? ' is-contain' : ''}">
      <img loading="lazy" decoding="async" src="${esc(rel + row.image)}" alt="${esc(title)}" width="${s.image.width}" height="${s.image.height}">
    </div>
    <div class="media-body">
      <span class="media-title">${esc(title)}</span>
    </div>
  </a>
</li>`;
    })
    .join('\n');
  return `<ul class="visual-strip">${cards}</ul>`;
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

/** Poster grid for the game library — cover art + title only. */
export function gameGrid(games) {
  return `<ul class="game-grid">${games
    .map(
      (g, i) => `<li>
  <a class="game-card${g.empty ? ' is-empty' : ''}" href="${esc(g.href)}">
    <span class="cover-wrap">
      <img class="cover" src="${esc(g.cover)}" alt="${esc(g.title)} box art" width="600" height="900" loading="${
        i < 6 ? 'eager' : 'lazy'
      }" decoding="async">
    </span>
    <span class="game-body">
      <span class="game-title">${esc(g.title)}</span>
    </span>
  </a>
</li>`
    )
    .join('')}</ul>`;
}
