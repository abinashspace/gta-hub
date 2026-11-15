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
      return `<li><a href="${esc(href)}">${esc(n.label)}</a></li>`;
    })
    .join('');

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
<link rel="stylesheet" href="${rel}assets/css/site.css">
${jsonld.map((o) => `<script type="application/ld+json">${jsonScript(o)}</script>`).join('\n')}
<script src="${rel}assets/js/site.js" defer></script>
</head>
<body data-page="${esc(pageType)}">
<a class="skip" href="#main">Skip to content</a>
<header class="site-head">
  <a class="brand" href="${rel || './'}"><svg width="28" height="28" viewBox="0 0 128 128" aria-hidden="true"><rect width="128" height="128" rx="18" fill="#1a1d23"/><text x="64" y="84" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="54" fill="#ff6b6b">GTA</text></svg><span>${esc(site.title)}</span></a>
  <nav aria-label="Primary"><ul>${navItems}</ul></nav>
</header>
${crumbs}
<main id="main" tabindex="-1">
${content}
</main>
<footer class="site-foot">
  <p><strong>${esc(site.title)}</strong> — static, machine-readable, no external services.</p>
  <p>Data files: <a href="${rel}data/index.json">index.json</a> · <a href="${rel}data/search-index.json">search-index.json</a> · <a href="${rel}llms.txt">llms.txt</a> · <a href="${rel}sitemap.xml">sitemap.xml</a></p>
  <p class="fine">Unofficial fan reference. Game names, trademarks and artwork are property of Rockstar Games and Take-Two Interactive. ${esc(site.license)}</p>
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
      return typeof v === 'number' ? `<td class="num">${v.toLocaleString('en-US')}</td>` : '<td class="num">—</td>';
    case 'money':
      return `<td class="num">${fmtMoney(v)}</td>`;
    case 'list':
      return `<td>${Array.isArray(v) && v.length ? v.map((x) => esc(x)).join(', ') : '—'}</td>`;
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
      if (col.primary) {
        const key = col.__section;
        if (SECTIONS[key]?.detail) {
          return `<td><a href="${esc(`${rel}games/${game.slug}/${key}/${row.id}/`)}">${esc(v)}</a></td>`;
        }
        return `<td><strong>${esc(v)}</strong></td>`;
      }
      return `<td>${v == null || v === '' ? '—' : esc(v)}</td>`;
    }
  }
}

export function sectionTable(section, items, rel, game) {
  const s = SECTIONS[section];
  const cols = s.columns.map((c) => ({ ...c, __section: section }));
  const numeric = s.columns.filter((c) => c.type === 'number' || c.type === 'money').length;
  const rows = items
    .map((row) => {
      const cells = cols.map((c) => cellValue(c, row, rel, game)).join('');
      return `<tr data-id="${esc(row.id)}"${row.verified === false ? ' class="unverified" title="Unverified record"' : ''}>${cells}</tr>`;
    })
    .join('\n');
  return `<div class="table-wrap">
<table class="data-table${numeric ? ' has-num' : ''}">
<caption>${esc(s.title)} — ${esc(game.title)} (${items.length} records)</caption>
<thead><tr>${cols
    .map(
      (c) =>
        `<th scope="col"${c.type === 'number' || c.type === 'money' ? ' class="num"' : ''}>${esc(c.label)}</th>`
    )
    .join('')}</tr></thead>
<tbody>
${rows || `<tr><td colspan="${cols.length}">No records yet.</td></tr>`}
</tbody>
</table>
</div>`;
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
