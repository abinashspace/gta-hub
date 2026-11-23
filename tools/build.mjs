#!/usr/bin/env node
/**
 * Static site build. Zero dependencies.
 *   node tools/build.mjs [--no-art] [--quiet]
 * content/ + assets/  ->  docs/  (served by GitHub Pages)
 */
import { readFile, writeFile, mkdir, rm, readdir, copyFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECTIONS, SECTION_KEYS, sectionSchema } from './lib/schema.mjs';
import { layout, pageHead, sectionTable, dataLink, esc, fmtMoney, jsonScript, cardGrid, statGrid } from './lib/render.mjs';
import { placeholder, cheatPlaceholder, brandSvg, shade } from './lib/art.mjs';
import { validate } from './validate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARGS = new Set(process.argv.slice(2));
const NO_ART = ARGS.has('--no-art');
const QUIET = ARGS.has('--quiet');
const log = (...a) => !QUIET && console.log(...a);

const site = JSON.parse(await readFile(path.join(ROOT, 'content/site.json'), 'utf8'));
const OUT = path.join(ROOT, site.build.out_dir);
const TODAY = new Date().toISOString().slice(0, 10);

const registry = JSON.parse(await readFile(path.join(ROOT, 'content/games.json'), 'utf8'));
const games = registry.games.sort((a, b) => a.order - b.order);

if (!ARGS.has('--no-clean')) await rm(OUT, { recursive: true, force: true });

/* ------------------------------------------------------------------ utils */

async function write(relPath, content) {
  const full = path.join(OUT, relPath);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, content);
  return relPath;
}

function relFrom(relPath) {
  const depth = path.dirname(relPath).split(/[\\/]/).filter((s) => s && s !== '.').length;
  return '../'.repeat(depth);
}

function page(relPath, opts) {
  const rel = relFrom(relPath);
  return write(relPath, layout({ rel, site, ...opts }));
}

async function copyDir(src, dest) {
  let entries;
  try {
    entries = await readdir(src, { withFileTypes: true });
  } catch {
    return;
  }
  await mkdir(dest, { recursive: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else await copyFile(s, d);
  }
}

const pad = (n, len = 2) => String(n).padStart(len, '0');
const money = (n) => (typeof n === 'number' ? fmtMoney(n) : '—');

/* --------------------------------------------------------------- registry */

// load every game bundle
for (const g of games) {
  const p = path.join(ROOT, `content/games/${g.slug}.json`);
  let bundle;
  try {
    bundle = JSON.parse(await readFile(p, 'utf8'));
  } catch {
    bundle = { meta: { sources: [] } };
  }
  g.bundle = bundle;
  g.sections = {};
  for (const key of SECTION_KEYS) {
    const sec = bundle[key] || { items: [], coverage: 'empty' };
    const s = SECTIONS[key];
    const items = (sec.items || []).slice().sort((a, b) => {
      const av = s.sort.key.split('.').reduce((o, k) => o?.[k], a);
      const bv = s.sort.key.split('.').reduce((o, k) => o?.[k], b);
      if (typeof av === 'number' && typeof bv === 'number') return s.sort.dir === 'desc' ? bv - av : av - bv;
      return String(av ?? '').localeCompare(String(bv ?? ''), 'en');
    });
    g.sections[key] = { coverage: sec.coverage || (items.length ? 'partial' : 'empty'), items };
  }
}

/* ---------------------------------------------------------------- artwork */

const IMG_EXT = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg'];
const realImages = new Map(); // "<kind>/<game>/<basename>" -> "assets/img/..."
await scanReal();

async function scanReal(dir = path.join(ROOT, 'assets/img'), prefix = 'assets/img') {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await scanReal(full, `${prefix}/${e.name}`);
    else {
      const ext = path.extname(e.name).slice(1).toLowerCase();
      if (!IMG_EXT.includes(ext)) continue;
      realImages.set(`${prefix.replace(/^assets\/img\//, '')}/${path.basename(e.name, path.extname(e.name))}`, `${prefix}/${e.name}`);
    }
  }
}

const manifest = [];

function imageFor(kind, gameSlug, id, { width, height, title, subtitle, accent, placeholderText, protagonists }) {
  // Keep file names inside Windows path limits.
  const fileId = id.length > 60 ? id.slice(0, 60).replace(/-[^-]*$/, '') : id;
  const key = `${kind}/${gameSlug}/${fileId}`;
  const real = realImages.get(key);
  if (real) {
    manifest.push({ kind, game: gameSlug, id: fileId, record: id, path: real, width, height, status: 'real', alt: title });
    return real;
  }
  const rel = `assets/img/${kind}/${gameSlug}/${fileId}.svg`;
  manifest.push({
    kind,
    game: gameSlug,
    id: fileId,
    record: id,
    path: rel,
    width,
    height,
    status: 'placeholder',
    alt: title,
    placeholderText,
    protagonists,
  });
  return rel;
}

function protagonistImageRefs(g) {
  return g.protagonists
    .map((name) => {
      const tokens = String(name).toLowerCase().match(/[a-z0-9]+/g) || [];
      const character =
        g.sections.characters.items.find((row) => row.name === name) ||
        g.sections.characters.items.find((row) => {
          const rowTokens = row.name.toLowerCase().match(/[a-z0-9]+/g) || [];
          return tokens.length > 0 && tokens.every((token) => rowTokens.includes(token));
        }) ||
        (g.protagonists.length === 1
          ? g.sections.characters.items.find((row) => /protagonist/i.test(row.role || ''))
          : null);
      if (!character) return null;
      const key = `portrait/${g.slug}/${character.id}`;
      const source = realImages.get(key) || `assets/img/portrait/${g.slug}/${character.id}.svg`;
      return {
        name,
        href: `../../${source.replace(/^assets\/img\//, '')}`,
      };
    })
    .filter(Boolean);
}

/* -------------------------------------------------------------- data layer */

const dataIndex = {
  site: { title: site.title, description: site.description, base_url: site.base_url, language: site.language },
  generated: new Date().toISOString(),
  schema_version: '1.0.0',
  counts: { games: games.length, sections: SECTION_KEYS.length },
  sections: SECTION_KEYS.map((k) => ({
    key: k,
    title: SECTIONS[k].title,
    description: SECTIONS[k].blurb,
    schema: `data/schema/${k}.json`,
    image: SECTIONS[k].image,
  })),
  games: [],
};

const searchIndex = [];
const totalCounts = Object.fromEntries(SECTION_KEYS.map((k) => [k, 0]));

for (const g of games) {
  const imageSet = {
    cover: imageFor('cover', g.slug, 'cover', { width: 600, height: 900, title: g.title, subtitle: `${g.year} · ${g.type}`, accent: g.accent }),
    banner: imageFor('banner', g.slug, 'banner', { width: 1920, height: 800, title: g.title, subtitle: g.setting || '', accent: g.accent }),
    map: imageFor('map', g.slug, 'map', { width: 2048, height: 2048, title: `${g.short_title} map`, subtitle: g.cities.join(' · '), accent: g.accent }),
  };

  for (const key of SECTION_KEYS) {
    const s = SECTIONS[key];
    for (const row of g.sections[key].items) {
      const img = imageFor(s.image.kind, g.slug, row.id, {
        width: s.image.width,
        height: s.image.height,
        title: row.name || row.effect,
        subtitle: row.role || row.type || g.short_title,
        accent: g.accent,
        placeholderText:
          key === 'cheats' ? row.codes.map((code) => code.code).join('\n') : undefined,
        protagonists: key === 'missions' ? protagonistImageRefs(g) : undefined,
      });
      if (!row.image) row.image = img;
    }
  }

  g.images = imageSet;

  for (const key of SECTION_KEYS) totalCounts[key] += g.sections[key].items.length;

  const counts = Object.fromEntries(SECTION_KEYS.map((k) => [k, g.sections[k].items.length]));
  const coverage = Object.fromEntries(SECTION_KEYS.map((k) => [k, g.sections[k].coverage]));
  const records = SECTION_KEYS.reduce((n, k) => n + counts[k], 0);

  dataIndex.games.push({
    slug: g.slug,
    order: g.order,
    title: g.title,
    short_title: g.short_title,
    year: g.year,
    released: g.released,
    type: g.type,
    status: g.status,
    cities: g.cities,
    platforms: g.platforms,
    protagonists: g.protagonists,
    cheats: g.cheats,
    accent: g.accent,
    counts,
    coverage,
    records,
    links: {
      page: `games/${g.slug}/`,
      data: `data/games/${g.slug}.json`,
      images: `data/images.json#${g.slug}`,
    },
  });

  searchIndex.push({
    kind: 'game',
    game: g.slug,
    title: g.title,
    subtitle: `${g.year} · ${g.type} · ${g.cities.join(', ')}`,
    url: `games/${g.slug}/`,
    keywords: [String(g.year), g.type, g.short_title, ...g.platforms, ...g.cities, ...g.protagonists].join(' '),
  });

  for (const key of SECTION_KEYS) {
    const s = SECTIONS[key];
    for (const row of g.sections[key].items) {
      searchIndex.push({
        kind: key,
        game: g.slug,
        id: row.id,
        title: row.name || row.effect,
        subtitle: [row.role || row.type, g.short_title].filter(Boolean).join(' · '),
        url: s.detail ? `games/${g.slug}/${key}/${row.id}/` : `games/${g.slug}/${key}/#${row.id}`,
        keywords: [
          row.name,
          row.effect,
          row.role,
          row.type,
          row.category,
          row.class,
          row.giver,
          row.location,
          row.parent,
          row.damage_tier,
          row.affiliations?.join(' '),
          ...(row.codes || []).map((c) => `${c.platform} ${c.code}`),
        ]
          .filter(Boolean)
          .join(' '),
      });
    }
  }
}

/* ------------------------------------------------------------ page helpers */

function gameMeta(g) {
  return [
    { label: 'Released', value: g.year },
    { label: 'Type', value: g.type },
    { label: 'Status', value: g.status },
    { label: 'Platforms', value: g.platforms.join(', ') },
    { label: 'Setting', value: g.setting },
    { label: 'Cities', value: g.cities.join(', ') },
    { label: 'Developer', value: g.developer },
    { label: 'Publisher', value: g.publisher },
    { label: 'Protagonists', value: g.protagonists.join(', ') },
    {
      label: 'Cheats',
      value: { full: 'Yes', limited: 'Limited set', phone: 'Yes — in-game phone', none: 'None', 'none-yet': 'Not announced' }[g.cheats],
    },
  ];
}

function coverageClass(c) {
  return ['complete', 'partial', 'limited', 'official-only'].includes(c) ? c : 'empty';
}

function coverageRow(g) {
  return `<tr><th scope="row"><a href="games/${g.slug}/">${esc(g.short_title)}</a></th>${SECTION_KEYS.map(
    (k) => `<td class="num cov cov-${coverageClass(g.sections[k].coverage)}">${g.sections[k].items.length}</td>`
  ).join('')}<td class="num"><strong>${SECTION_KEYS.reduce((n, k) => n + g.sections[k].items.length, 0)}</strong></td></tr>`;
}

/* ------------------------------------------------------------------- pages */

// home
{
  const rel = '';
  const totalRecords = Object.values(totalCounts).reduce((a, b) => a + b, 0);
  const library = gameGrid(
    games.map((g) => ({
      href: `${rel}games/${g.slug}/`,
      cover: g.images.cover,
      title: g.title,
      badge: String(g.year),
      meta: `${g.type} · ${g.cities.length} ${g.cities.length === 1 ? 'city' : 'cities'}`,
      empty: SECTION_KEYS.every((k) => g.sections[k].items.length === 0),
    }))
  );

  const matrix = `<div class="table-wrap"><table class="data-table coverage-table">
<caption>Coverage matrix — record count per section, per game</caption>
<thead><tr><th scope="col">Game</th>${SECTION_KEYS.map((k) => `<th scope="col" class="num">${esc(SECTIONS[k].title)}</th>`).join('')}<th scope="col" class="num">Total</th></tr></thead>
<tbody>${games.map(coverageRow).join('\n')}</tbody>
</table></div>`;

  const gameTable = `<div class="table-wrap"><table class="data-table">
<caption>All ${games.length} games in the series</caption>
<thead><tr><th scope="col" class="num">#</th><th scope="col">Title</th><th scope="col" class="num">Year</th><th scope="col">Type</th><th scope="col">Status</th><th scope="col">Cities</th><th scope="col">Cheats</th></tr></thead>
<tbody>${games
    .map(
      (g) =>
        `<tr><td class="num">${g.order}</td><td><a href="games/${g.slug}/">${esc(g.title)}</a></td><td class="num">${g.year}</td><td>${esc(
          g.type
        )}</td><td>${esc(g.status)}</td><td>${esc(g.cities.join(', '))}</td><td>${esc(
          { full: 'Yes', limited: 'Limited', phone: 'Phone', none: 'None', 'none-yet': 'TBA' }[g.cheats]
        )}</td></tr>`
    )
    .join('\n')}</tbody></table></div>`;

  const endpoints = `<div class="table-wrap"><table class="data-table">
<caption>Machine endpoints</caption>
<thead><tr><th scope="col">Path</th><th scope="col">Contents</th></tr></thead>
<tbody>
<tr><td><code>data/index.json</code></td><td>Entry point: site, sections, all games, counts, links</td></tr>
<tr><td><code>data/games/&lt;slug&gt;.json</code></td><td>Whole game bundle (7 sections) in one request</td></tr>
<tr><td><code>data/games/&lt;slug&gt;/&lt;section&gt;.json</code></td><td>Single section collection</td></tr>
<tr><td><code>data/schema/&lt;section&gt;.json</code></td><td>JSON Schema for each record type</td></tr>
<tr><td><code>data/images.json</code></td><td>Every image path, size, and placeholder/real status</td></tr>
<tr><td><code>data/search-index.json</code></td><td>Flat search corpus (~1 object per record)</td></tr>
<tr><td><code>data/status.json</code></td><td>Per-game build + coverage status</td></tr>
<tr><td><code>llms.txt</code></td><td>Plain-text map for LLM crawlers</td></tr>
</tbody></table></div>`;

  const content = `<section class="home-hero">
  <p class="eyebrow">Static · JSON-first · No external services</p>
  <h1>The complete <em>GTA</em> reference</h1>
  <p class="lead">${games.length} games. ${SECTION_KEYS.length} section types. ${totalRecords.toLocaleString('en-US')} records. Every page has a JSON twin — search it, browse it, or read the raw data.</p>
  <form class="home-search" role="search" action="search/" method="get">
    <label class="visually-hidden" for="hero-q">Search every record</label>
    <input id="hero-q" name="q" type="search" autocomplete="off" placeholder="Try “Rhino”, “Vice City”, “hidden package”…">
    <button class="btn" type="submit">Search</button>
  </form>
  <div class="hero-tags">
    <a href="games/gta-v/">GTA V</a>
    <a href="games/gta-san-andreas/">San Andreas</a>
    <a href="games/gta-vice-city/">Vice City</a>
    <a href="games/gta-iv/">GTA IV</a>
    <a href="games/gta-vi/">GTA VI</a>
    <a href="cheats/">All cheats →</a>
  </div>
</section>
${statGrid([
    { label: 'Games', value: games.length },
    { label: 'Records', value: totalRecords },
    { label: 'Sections', value: SECTION_KEYS.length },
    { label: 'Universes', html: `<a href="timeline/">2D · 3D · HD · VI</a>` },
  ])}
<h2 id="library">Game library</h2>
<p class="note">Seventeen releases, from the 1997 original to the upcoming GTA VI. Pick a cover to open its seven sections.</p>
${library}
<h2 id="cross">Cross-game views</h2>
${cardGrid([
    {
      href: 'timeline/',
      kicker: `${games[0].year}–${games[games.length - 1].year} · ${games.length} releases`,
      title: 'Timeline',
      meta: 'Every release in order, grouped by 2D, 3D and HD universe.',
    },
    {
      href: 'compare/',
      kicker: `${games.length} games × ${SECTION_KEYS.length} sections`,
      title: 'Compare games',
      meta: 'Record counts, section leaders and shared cities side by side.',
    },
    {
      href: 'cheats/',
      kicker: `${totalCounts.cheats} cheats`,
      title: 'All cheat codes',
      meta: 'One page, every game, with platform and button sequence.',
    },
    {
      href: 'locations/',
      kicker: `${totalCounts.locations} locations`,
      title: 'All locations',
      meta: 'Cities, districts and landmarks across the series.',
    },
  ])}
<h2 id="reference">Reference tables</h2>
<details class="panel">
  <summary>Coverage matrix — records per section, per game</summary>
  <div class="panel-body">
    <p class="note">Cells show how many records exist today. <span class="badge badge-complete">complete</span> <span class="badge badge-partial">partial</span> <span class="badge badge-limited">limited</span> <span class="badge badge-official-only">official-only</span> <span class="badge badge-empty">empty</span></p>
    ${matrix}
  </div>
</details>
<details class="panel">
  <summary>All ${games.length} games at a glance</summary>
  <div class="panel-body">${gameTable}</div>
</details>
<details class="panel" id="machines">
  <summary>Machine endpoints — for agents and crawlers</summary>
  <div class="panel-body">
    <p class="note">No JavaScript is required to read this site. Every URL below is a static file in this repository. Prefer JSON over scraping HTML.</p>
    ${endpoints}
    <p class="data-link"><a href="llms.txt">llms.txt →</a> <a href="sitemap.xml">sitemap.xml →</a> <a href="robots.txt">robots.txt →</a></p>
  </div>
</details>`;

  await page('index.html', {
    title: `${site.title} — every GTA game, in JSON and HTML`,
    description: site.description,
    canonicalPath: '/',
    jsonPath: 'data/index.json',
    pageType: 'home',
    content,
    jsonld: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: site.title,
        url: site.base_url + '/',
        description: site.description,
        inLanguage: site.language,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Grand Theft Auto games',
        numberOfItems: games.length,
        itemListElement: games.map((g, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: g.title,
          url: `${site.base_url}/games/${g.slug}/`,
        })),
      },
    ],
  });
}

// game pages
for (const g of games) {
  const base = `games/${g.slug}/`;
  const rel = relFrom(base + 'index.html');
  const counts = SECTION_KEYS.map((k) => ({ key: k, n: g.sections[k].items.length, c: g.sections[k].coverage }));

  const sectionCards = cardGrid(
    SECTION_KEYS.map((k) => ({
      href: `${k}/`,
      kicker: `${counts.find((c) => c.key === k).n} records · ${g.sections[k].coverage}`,
      title: SECTIONS[k].title,
      meta: SECTIONS[k].blurb,
      muted: counts.find((c) => c.key === k).n === 0,
    }))
  );

  const coverageTable = `<div class="table-wrap"><table class="data-table">
<caption>Coverage for ${esc(g.title)}</caption>
<thead><tr><th scope="col">Section</th><th scope="col" class="num">Records</th><th scope="col">Coverage</th><th scope="col">JSON</th></tr></thead>
<tbody>${SECTION_KEYS.map(
    (k) =>
      `<tr><td><a href="${k}/">${esc(SECTIONS[k].title)}</a></td><td class="num">${g.sections[k].items.length}</td><td><span class="badge badge-${coverageClass(
        g.sections[k].coverage
      )}">${esc(g.sections[k].coverage)}</span></td><td><a href="${relFrom(base + 'index.html')}data/games/${g.slug}/${k}.json"><code>${k}.json</code></a></td></tr>`
  ).join('')}</tbody></table></div>`;

  const bannerReal = !g.images.banner.endsWith('.svg');
  const gameRecords = SECTION_KEYS.reduce((n, k) => n + g.sections[k].items.length, 0);
  const heroFacts = gameMeta(g)
    .map((m) => `<div><dt>${esc(m.label)}</dt><dd>${m.html ?? esc(m.value)}</dd></div>`)
    .join('');
  const content = `<header class="game-hero">
  <div class="game-hero-bg"><img src="${rel}${g.images.banner}" alt="" width="1920" height="800" loading="eager" decoding="async"></div>
  <div class="game-hero-inner">
    <img class="game-hero-cover" src="${rel}${g.images.cover}" alt="${esc(g.title)} box art" width="600" height="900" loading="eager" decoding="async">
    <div class="game-hero-text">
      <p class="eyebrow">${g.year} · ${g.type}${g.status === 'upcoming' ? ' · Upcoming' : ''}</p>
      <h1>${esc(g.title)}</h1>
      <p class="lead">${esc(g.notes)}</p>
      <div class="game-hero-badges">
        <span class="badge">${gameRecords} records</span>
        <span class="badge">${esc(g.cities.join(' · '))}</span>
        <span class="badge">${esc(g.platforms.length)} platforms</span>
      </div>
    </div>
  </div>
</header>
<dl class="facts">${heroFacts}</dl>
<p class="fine">${bannerReal
      ? `Banner artwork from GTA Wiki; see <a href="${rel}assets/img/CREDITS.md">image credits</a>.`
      : `Placeholder banner art; add a real image at assets/img/banner/${g.slug}/banner.jpg.`}</p>
<h2 id="sections">Sections</h2>
${sectionCards}
<h2 id="coverage">Coverage &amp; data</h2>
${coverageTable}
${dataLink(rel, `data/games/${g.slug}.json`, `Whole game bundle — ${g.slug}.json`)}
${dataLink(rel, `data/games/${g.slug}/characters.json`, 'Example section file — characters.json')}
${
    g.bundle?.meta?.sources?.length
      ? `<h2 id="sources">Sources</h2><ul>${g.bundle.meta.sources.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`
      : ''
  }
<p class="note">Coverage flags are honest: <code>partial</code> means the list is a verified core, not the full game. See <a href="${rel}about/">about</a>.</p>`;

  await page(base + 'index.html', {
    title: `${g.title} — characters, missions, vehicles, weapons, cheats, locations, collectibles`,
    description: `${g.title} (${g.year}). ${g.notes} ${counts.reduce((n, c) => n + c.n, 0)} records across seven sections, available as HTML and JSON.`,
    canonicalPath: `/${base}`,
    jsonPath: `data/games/${g.slug}.json`,
    pageType: 'game',
    breadcrumbs: [
      { label: 'Games', href: '/' },
      { label: g.short_title, href: `/${base}` },
    ],
    content,
    jsonld: [
      {
        '@context': 'https://schema.org',
        '@type': 'VideoGame',
        name: g.title,
        url: `${site.base_url}/${base}`,
        datePublished: g.released,
        gamePlatform: g.platforms,
        author: { '@type': 'Organization', name: g.developer },
        publisher: { '@type': 'Organization', name: g.publisher },
        genre: 'Action-adventure',
        inLanguage: site.language,
      },
    ],
  });

  // section pages
  for (const key of SECTION_KEYS) {
    const s = SECTIONS[key];
    const sec = g.sections[key];
    const dir = `${base}${key}/`;
    const rel = relFrom(dir + 'index.html');
    const items = [...sec.items];

    const unverified = items.filter((i) => i.verified === false).length;

    const content = `${pageHead({
      eyebrow: `${g.short_title} · ${items.length} records · coverage: ${sec.coverage}`,
      title: `${s.title} — ${g.title}`,
      lead: s.blurb,
    })}
<p class="section-actions">
  <a class="btn" href="${rel}data/games/${g.slug}/${key}.json" type="application/json">Download ${esc(key)}.json</a>
  <a class="btn btn-ghost" href="${rel}data/games/${g.slug}.json" type="application/json">Whole game bundle</a>
  ${unverified ? `<span class="badge badge-partial">${unverified} unverified record${unverified === 1 ? '' : 's'}</span>` : ''}
</p>
${items.length > 6 ? filterBar('Filter', `Filter ${items.length} ${s.title.toLowerCase()}…`) : ''}
<div id="table-results">${sectionTable(key, items, rel, g)}</div>
${items.length ? `<h2 id="fields">Field definitions</h2>${fieldTable(key)}` : ''}
<nav class="pager" aria-label="Section navigation">
  <a href="${rel}games/${g.slug}/">← ${esc(g.short_title)} overview</a>
  <a href="${rel}">All games →</a>
</nav>`;

    await page(dir + 'index.html', {
      title: `${s.title} in ${g.title} — ${items.length} records`,
      description: `${s.blurb} ${items.length} ${key} for ${g.title}, as HTML and JSON.`,
      canonicalPath: `/${dir}`,
      jsonPath: `data/games/${g.slug}/${key}.json`,
      pageType: 'section',
      breadcrumbs: [
        { label: 'Games', href: '/' },
        { label: g.short_title, href: `/${base}` },
        { label: s.title, href: `/${dir}` },
      ],
      content,
      jsonld: [
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `${s.title} — ${g.title}`,
          numberOfItems: items.length,
          itemListElement: items.slice(0, 100).map((row, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: row.name || row.effect,
            ...(s.detail ? { url: `${site.base_url}/${dir}${row.id}/` } : {}),
          })),
        },
      ],
    });

    // detail pages
    if (!s.detail) continue;
    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      const ddir = `${dir}${row.id}/`;
      const drel = relFrom(ddir + 'index.html');
      const prev = items[i - 1];
      const next = items[i + 1];
      const facts = s.detailFields
        .map((f) => {
          const v = f.split('.').reduce((o, k) => o?.[k], row);
          if (v == null || v === '') return '';
          const val = Array.isArray(v) ? v.join(', ') : f.endsWith('price') ? money(v) : v;
          return `<div><dt>${esc(f.split('.').pop().replace(/_/g, ' '))}</dt><dd>${esc(val)}</dd></div>`;
        })
        .filter(Boolean)
        .join('');

      const content = `${pageHead({
        eyebrow: `${g.short_title} · ${s.singular}${row.verified === false ? ' · unverified' : ''}`,
        title: row.name,
        lead: row.summary || row.reward?.other || '',
      })}
<div class="detail">
  <figure class="detail-art">
    <img src="${drel}${row.image}" alt="${esc(row.name)}${row.image.endsWith('.svg') ? ' image (placeholder)' : ''}" width="${s.image.width}" height="${s.image.height}" loading="lazy" decoding="async">
    <figcaption>${row.image.endsWith('.svg') ? 'Placeholder art' : 'Local image'} — ${s.image.width}×${s.image.height}</figcaption>
  </figure>
  <div class="detail-body">
    <dl class="facts">${facts}${row.reward?.money ? `<div><dt>Reward</dt><dd>${money(row.reward.money)}</dd></div>` : ''}</dl>
    ${row.requirements?.length ? `<h2>Requirements</h2><ul>${row.requirements.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
    ${row.codes?.length ? `<h2>Codes</h2><ul class="code-list">${row.codes.map((c) => `<li><span class="plat">${esc(c.platform)}${c.edition ? ` · ${esc(c.edition)}` : ''}</span> <code>${esc(c.code)}</code></li>`).join('')}</ul>` : ''}
    <p class="provenance">${row.verified === false ? 'Unverified record' : 'Verified record'}${
      row.source
        ? ` · source: ${
            /^https?:\/\//.test(row.source)
              ? `<a href="${esc(row.source)}" rel="nofollow noopener">${esc(row.source)}</a>`
              : esc(row.source)
          }`
        : ''
    }</p>
    <p class="data-link"><a href="${drel}data/games/${g.slug}/${key}.json#${row.id}" type="application/json">Record JSON (section file) →</a></p>
  </div>
</div>
<nav class="pager" aria-label="Previous and next">
  ${prev ? `<a href="${drel}games/${g.slug}/${key}/${prev.id}/">← ${esc(prev.name)}</a>` : '<span></span>'}
  <a href="${drel}games/${g.slug}/${key}/">All ${esc(s.title.toLowerCase())}</a>
  ${next ? `<a href="${drel}games/${g.slug}/${key}/${next.id}/">${esc(next.name)} →</a>` : '<span></span>'}
</nav>`;

      await page(ddir + 'index.html', {
        title: `${row.name} — ${g.title} ${s.singular.toLowerCase()}`,
        description: `${row.name} from ${g.title}. ${(row.summary || '').slice(0, 180)}`,
        canonicalPath: `/${ddir}`,
        jsonPath: `data/games/${g.slug}/${key}.json`,
        pageType: 'detail',
        breadcrumbs: [
          { label: 'Games', href: '/' },
          { label: g.short_title, href: `/${base}` },
          { label: s.title, href: `/${dir}` },
          { label: row.name, href: `/${ddir}` },
        ],
        content,
        jsonld: [
          {
            '@context': 'https://schema.org',
            '@type': key === 'characters' ? 'Person' : 'CreativeWork',
            name: row.name,
            description: row.summary,
            url: `${site.base_url}/${ddir}`,
            ...(key === 'characters' ? { affiliation: (row.affiliations || []).map((a) => ({ '@type': 'Organization', name: a })) } : {
              isPartOf: { '@type': 'VideoGame', name: g.title },
              ...(row.reward?.money ? { award: `$${row.reward.money}` } : {}),
            }),
          },
        ],
      });
    }
  }
}

/* --------------------------------------------------------- cross-game pages */

const ERA_BY_SLUG = {
  gta: '2d',
  'gta-london-1969': '2d',
  'gta-london-1961': '2d',
  'gta-2': '2d',
  'gta-iii': '3d',
  'gta-vice-city': '3d',
  'gta-san-andreas': '3d',
  'gta-advance': '3d',
  'gta-liberty-city-stories': '3d',
  'gta-vice-city-stories': '3d',
  'gta-iv': 'hd',
  'gta-iv-the-lost-and-damned': 'hd',
  'gta-the-ballad-of-gay-tony': 'hd',
  'gta-chinatown-wars': 'hd',
  'gta-v': 'hd',
  'gta-online': 'hd',
  'gta-vi': 'upcoming',
};

const ERAS = [
  {
    key: '2d',
    name: '2D Universe',
    range: '1997–1999',
    blurb:
      'Top-down games seen from an overhead camera: the original city trilogy, the two London expansions and GTA 2’s retro-futurist Anywhere City.',
  },
  {
    key: '3d',
    name: '3D Universe',
    range: '2001–2006',
    blurb:
      'The move to third-person 3D: Liberty City, Vice City and San Andreas, plus the handheld and Stories spin-offs that reuse those maps.',
  },
  {
    key: 'hd',
    name: 'HD Universe',
    range: '2008–2013',
    blurb:
      'The high-definition era: Liberty City and Los Santos in full 3D, the two Episodes from Liberty City, Chinatown Wars and the persistent world of GTA Online.',
  },
  {
    key: 'upcoming',
    name: 'Upcoming',
    range: '2026–',
    blurb:
      'Announced but unreleased. GTA VI is recorded here from official Rockstar material only, with empty sections left explicitly empty.',
  },
];

const crossRows = games.map((g) => {
  const counts = Object.fromEntries(SECTION_KEYS.map((k) => [k, g.sections[k].items.length]));
  return {
    slug: g.slug,
    order: g.order,
    title: g.title,
    short_title: g.short_title,
    year: g.year,
    released: g.released,
    type: g.type,
    status: g.status,
    eraKey: ERA_BY_SLUG[g.slug] ?? 'hd',
    era: ERAS.find((e) => e.key === (ERA_BY_SLUG[g.slug] ?? 'hd')).name,
    setting: g.setting,
    cities: g.cities,
    protagonists: g.protagonists,
    platforms: g.platforms,
    cheats: g.cheats,
    counts,
    coverage: Object.fromEntries(SECTION_KEYS.map((k) => [k, g.sections[k].coverage])),
    records: SECTION_KEYS.reduce((n, k) => n + counts[k], 0),
  };
});

const sectionLeaders = SECTION_KEYS.map((k) => {
  const ranked = [...crossRows].sort((a, b) => b.counts[k] - a.counts[k] || a.order - b.order);
  return { key: k, title: SECTIONS[k].title, leader: ranked[0], runnerUp: ranked[1] };
});

const cheatRows = [];
for (const g of games) {
  for (const c of g.sections.cheats.items) {
    cheatRows.push({
      game: g.slug,
      game_title: g.title,
      year: g.year,
      id: c.id,
      effect: c.effect,
      platforms: [...new Set(c.codes.map((x) => x.platform))],
      codes: c.codes.map((x) => ({
        platform: x.platform,
        code: x.code,
        input: x.input,
        ...(x.edition ? { edition: x.edition } : {}),
      })),
      verified: c.verified,
      ...(c.source ? { source: c.source } : {}),
    });
  }
}

const locationRows = [];
for (const g of games) {
  for (const l of g.sections.locations.items) {
    locationRows.push({
      game: g.slug,
      game_title: g.title,
      year: g.year,
      id: l.id,
      name: l.name,
      type: l.type,
      parent: l.parent ?? null,
      summary: l.summary ?? null,
      verified: l.verified,
    });
  }
}

const cityIndex = [];
{
  const byCity = new Map();
  for (const g of games) {
    for (const city of g.cities) {
      if (!byCity.has(city)) byCity.set(city, { name: city, games: [], locations: 0 });
      const entry = byCity.get(city);
      entry.games.push({ slug: g.slug, title: g.title, year: g.year });
      entry.locations += g.sections.locations.items.filter((l) => l.name === city || l.parent === city).length;
    }
  }
  for (const entry of byCity.values()) {
    entry.games.sort((a, b) => a.year - b.year);
    cityIndex.push(entry);
  }
  cityIndex.sort((a, b) => b.games.length - a.games.length || a.name.localeCompare(b.name, 'en'));
}

const cheatGameRows = games
  .map((g) => ({
    slug: g.slug,
    title: g.title,
    year: g.year,
    count: g.sections.cheats.items.length,
    coverage: g.sections.cheats.coverage,
    platforms: [...new Set(g.sections.cheats.items.flatMap((c) => c.codes.map((x) => x.platform)))].sort(),
    note: g.bundle?.meta?.notes,
  }))
  .filter((r) => r.count > 0);

// timeline page
{
  const rel = relFrom('timeline/index.html');
  const eraBlocks = ERAS.map((era) => {
    const rows = crossRows.filter((r) => r.eraKey === era.key).sort((a, b) => a.year - b.year || a.order - b.order);
    if (!rows.length) return '';
    return `<h2 id="${era.key}">${esc(era.name)} <span class="note">${esc(era.range)}</span></h2>
<p>${esc(era.blurb)}</p>
<div class="table-wrap"><table class="data-table">
<caption>${esc(era.name)} — ${rows.length} release${rows.length === 1 ? '' : 's'}</caption>
<thead><tr><th scope="col" class="num">Year</th><th scope="col">Game</th><th scope="col">Type</th><th scope="col">Status</th><th scope="col">Setting</th><th scope="col">Cities</th><th scope="col">Protagonists</th><th scope="col" class="num">Records</th></tr></thead>
<tbody>${rows
      .map(
        (r) =>
          `<tr><td class="num">${r.year}</td><td><a href="${rel}games/${r.slug}/">${esc(r.title)}</a></td><td>${esc(
            r.type
          )}</td><td>${esc(r.status)}</td><td>${esc(r.setting)}</td><td>${esc(r.cities.join(', '))}</td><td>${esc(
            r.protagonists.join(', ')
          )}</td><td class="num">${r.records}</td></tr>`
      )
      .join('\n')}</tbody></table></div>`;
  }).join('\n');

  const content = `${pageHead({
    eyebrow: `${games[0].year}–${games[games.length - 1].year} · ${games.length} releases`,
    title: 'Timeline',
    lead: 'Every Grand Theft Auto release in order, grouped by universe. Dates are original platform releases, not ports.',
  })}
${statGrid([
    { label: 'Releases', value: games.length },
    { label: 'Main games', value: crossRows.filter((r) => r.type === 'Main').length },
    { label: 'Expansions', value: crossRows.filter((r) => r.type === 'Expansion').length },
    { label: 'Spin-offs & online', value: crossRows.filter((r) => r.type === 'Spin-off' || r.type === 'Online').length },
  ])}
${dataLink('../', 'data/cross/timeline.json', 'timeline.json — eras and releases')}
${eraBlocks}
<p class="note">Era assignment follows the game’s own universe (2D, 3D, HD), not its release date. GTA Advance sits in the 3D universe; Chinatown Wars sits in the HD universe.</p>
<nav class="pager" aria-label="Cross-game navigation">
  <a href="${rel}">← All games</a>
  <a href="${rel}compare/">Compare games →</a>
</nav>`;

  await page('timeline/index.html', {
    title: 'GTA release timeline — every game in order',
    description: `Chronological list of all ${games.length} Grand Theft Auto releases, grouped by 2D, 3D and HD universe.`,
    canonicalPath: '/timeline/',
    jsonPath: 'data/cross/timeline.json',
    pageType: 'cross',
    breadcrumbs: [
      { label: 'Games', href: '/' },
      { label: 'Timeline', href: '/timeline/' },
    ],
    content,
    jsonld: [
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Grand Theft Auto release timeline',
        numberOfItems: games.length,
        itemListElement: games.map((g, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: g.title,
          url: `${site.base_url}/games/${g.slug}/`,
        })),
      },
    ],
  });

  await write(
    'data/cross/timeline.json',
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        description: 'Every GTA release in order, grouped by universe.',
        eras: ERAS.map((e) => ({
          ...e,
          games: crossRows
            .filter((r) => r.eraKey === e.key)
            .sort((a, b) => a.year - b.year || a.order - b.order)
            .map((r) => ({
              slug: r.slug,
              title: r.title,
              year: r.year,
              released: r.released,
              type: r.type,
              status: r.status,
              setting: r.setting,
              cities: r.cities,
              protagonists: r.protagonists,
              records: r.records,
              page: `games/${r.slug}/`,
              data: `data/games/${r.slug}.json`,
            })),
        })),
      },
      null,
      2
    )
  );
}

// compare page
{
  const rel = relFrom('compare/index.html');
  const headCols = SECTION_KEYS.map((k) => `<th scope="col" class="num">${esc(SECTIONS[k].title)}</th>`).join('');
  const body = crossRows
    .map(
      (r) =>
        `<tr><td><a href="${rel}games/${r.slug}/">${esc(r.short_title)}</a></td><td class="num">${r.year}</td><td>${esc(
          r.era
        )}</td><td>${esc(r.type)}</td>${SECTION_KEYS.map(
          (k) => `<td class="num cov cov-${coverageClass(r.coverage[k])}">${r.counts[k]}</td>`
        ).join('')}<td class="num"><strong>${r.records}</strong></td></tr>`
    )
    .join('\n');

  const leaders = `<div class="table-wrap"><table class="data-table">
<caption>Most complete section per type</caption>
<thead><tr><th scope="col">Section</th><th scope="col">Largest</th><th scope="col" class="num">Records</th><th scope="col">Runner-up</th><th scope="col" class="num">Records</th></tr></thead>
<tbody>${sectionLeaders
    .map(
      (l) =>
        `<tr><td><a href="${rel}games/${l.leader.slug}/${l.key}/">${esc(l.title)}</a></td><td><a href="${rel}games/${
          l.leader.slug
        }/">${esc(l.leader.short_title)}</a></td><td class="num">${l.leader.counts[l.key]}</td><td>${
          l.runnerUp ? `<a href="${rel}games/${l.runnerUp.slug}/">${esc(l.runnerUp.short_title)}</a>` : '—'
        }</td><td class="num">${l.runnerUp ? l.runnerUp.counts[l.key] : '—'}</td></tr>`
    )
    .join('\n')}</tbody></table></div>`;

  const content = `${pageHead({
    eyebrow: '17 games · 7 sections · one table',
    title: 'Compare games',
    lead: 'Record counts per game and section, plus which games cover each section most deeply. Counts are records, not a quality score — coverage flags still apply.',
  })}
${statGrid([
    { label: 'Games', value: games.length },
    { label: 'Records', value: crossRows.reduce((n, r) => n + r.records, 0) },
    { label: 'Biggest game', value: [...crossRows].sort((a, b) => b.records - a.records)[0].short_title },
    { label: 'Sections', value: SECTION_KEYS.length },
  ])}
${dataLink('../', 'data/cross/compare.json', 'compare.json — the full matrix')}
<h2 id="matrix">Records per game and section</h2>
<div class="table-wrap"><table class="data-table has-num">
<caption>Record matrix — all ${games.length} games</caption>
<thead><tr><th scope="col">Game</th><th scope="col" class="num">Year</th><th scope="col">Era</th><th scope="col">Type</th>${headCols}<th scope="col" class="num">Total</th></tr></thead>
<tbody>${body}</tbody></table></div>
<h2 id="leaders">Section leaders</h2>
${leaders}
<h2 id="cities">Shared cities</h2>
<p>Which cities recur across the series. Counts are declared settings, not location records.</p>
<div class="table-wrap"><table class="data-table">
<caption>Cities and the games set in them</caption>
<thead><tr><th scope="col">City</th><th scope="col" class="num">Games</th><th scope="col">Appears in</th></tr></thead>
<tbody>${cityIndex
    .map(
      (c) =>
        `<tr><td>${esc(c.name)}</td><td class="num">${c.games.length}</td><td>${c.games
          .map((g) => `<a href="${rel}games/${g.slug}/">${esc(g.title)}</a>`)
          .join(', ')}</td></tr>`
    )
    .join('\n')}</tbody></table></div>
<nav class="pager" aria-label="Cross-game navigation">
  <a href="${rel}timeline/">← Timeline</a>
  <a href="${rel}cheats/">All cheat codes →</a>
</nav>`;

  await page('compare/index.html', {
    title: 'Compare every GTA game — records, sections and coverage',
    description: `Side-by-side record counts for all ${games.length} GTA games across characters, missions, vehicles, weapons, cheats, locations and collectibles.`,
    canonicalPath: '/compare/',
    jsonPath: 'data/cross/compare.json',
    pageType: 'cross',
    breadcrumbs: [
      { label: 'Games', href: '/' },
      { label: 'Compare', href: '/compare/' },
    ],
    content,
    jsonld: [
      {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'GTA Hub record matrix',
        description: 'Record counts per game and section for every Grand Theft Auto release.',
        url: `${site.base_url}/compare/`,
        isAccessibleForFree: true,
        creator: { '@type': 'Organization', name: site.author },
      },
    ],
  });

  await write(
    'data/cross/compare.json',
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        description: 'Record counts per game and section, with section leaders and shared cities.',
        sections: SECTION_KEYS.map((k) => ({ key: k, title: SECTIONS[k].title })),
        games: crossRows,
        leaders: sectionLeaders.map((l) => ({
          section: l.key,
          title: l.title,
          leader: { slug: l.leader.slug, title: l.leader.title, count: l.leader.counts[l.key] },
          runner_up: { slug: l.runnerUp.slug, title: l.runnerUp.title, count: l.runnerUp.counts[l.key] },
        })),
        cities: cityIndex,
      },
      null,
      2
    )
  );
}

// global cheats page
{
  const rel = relFrom('cheats/index.html');
  const summary = `<div class="table-wrap"><table class="data-table has-num">
<caption>Cheat coverage by game</caption>
<thead><tr><th scope="col">Game</th><th scope="col" class="num">Year</th><th scope="col" class="num">Cheats</th><th scope="col">Platforms covered</th></tr></thead>
<tbody>${cheatGameRows
    .map(
      (r) =>
        `<tr><td><a href="#${r.slug}">${esc(r.title)}</a></td><td class="num">${r.year}</td><td class="num">${r.count}</td><td>${esc(
          r.platforms.join(', ')
        )}</td></tr>`
    )
    .join('\n')}</tbody></table></div>`;

  const noCheatGames = games.filter((g) => g.sections.cheats.items.length === 0);

  const blocks = cheatGameRows
    .map((r) => {
      const g = games.find((x) => x.slug === r.slug);
      const anchor = `<h2 id="${r.slug}">${esc(r.title)} <span class="note">${r.year}</span></h2>`;
      const actions = `<p class="section-actions"><a class="btn btn-ghost" href="${rel}games/${r.slug}/cheats/">Game cheat page</a><a class="btn btn-ghost" href="${rel}data/games/${r.slug}/cheats.json" type="application/json">cheats.json</a></p>`;
      return `${anchor}${actions}${sectionTable('cheats', g.sections.cheats.items, rel, g)}`;
    })
    .join('\n');

  const content = `${pageHead({
    eyebrow: `${cheatRows.length} cheats · ${cheatGameRows.length} games`,
    title: 'All cheat codes',
    lead: 'Every cheat code in the dataset on one page, grouped by game, with the platform and button sequence or keyboard code.',
  })}
${statGrid([
    { label: 'Cheats', value: cheatRows.length },
    { label: 'Games with cheats', value: cheatGameRows.length },
    { label: 'Platform entries', value: cheatRows.reduce((n, r) => n + r.codes.length, 0) },
    {
      label: 'Games without cheats',
      html: `${noCheatGames.length} — ${noCheatGames.map((g) => esc(g.short_title)).join(', ')}`,
    },
  ])}
${dataLink('../', 'data/cheats.json', 'cheats.json — flat list with codes')}
<h2 id="summary">Coverage by game</h2>
${summary}${
    noCheatGames.length
      ? `<p class="note">${noCheatGames
          .map((g) => `<a href="${rel}games/${g.slug}/">${esc(g.title)}</a>`)
          .join(', ')} ship without cheat codes; those sections are recorded as <code>coverage: empty</code> with a note explaining why.</p>`
      : ''
  }
${blocks}
<nav class="pager" aria-label="Cross-game navigation">
  <a href="${rel}compare/">← Compare games</a>
  <a href="${rel}locations/">All locations →</a>
</nav>`;

  await page('cheats/index.html', {
    title: 'All GTA cheat codes — every game, every platform',
    description: `All ${cheatRows.length} cheat codes across ${cheatGameRows.length} Grand Theft Auto games, with button sequences, keyboard codes and platforms.`,
    canonicalPath: '/cheats/',
    jsonPath: 'data/cheats.json',
    pageType: 'cross',
    breadcrumbs: [
      { label: 'Games', href: '/' },
      { label: 'Cheats', href: '/cheats/' },
    ],
    content,
    jsonld: [
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Grand Theft Auto cheat codes',
        numberOfItems: cheatRows.length,
        itemListElement: cheatRows.slice(0, 100).map((r, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `${r.effect} — ${r.game_title}`,
        })),
      },
    ],
  });

  await write(
    'data/cheats.json',
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        description: 'Flat cheat-code list across all games. codes[].platform, code, input (button|keyboard|phone|touch).',
        count: cheatRows.length,
        games: games.map((g) => ({
          slug: g.slug,
          title: g.title,
          year: g.year,
          count: g.sections.cheats.items.length,
          coverage: g.sections.cheats.coverage,
        })),
        items: cheatRows,
      },
      null,
      2
    )
  );
}

// global locations page
{
  const rel = relFrom('locations/index.html');
  const cities = `<div class="table-wrap"><table class="data-table has-num">
<caption>Cities across the series</caption>
<thead><tr><th scope="col">City</th><th scope="col" class="num">Games</th><th scope="col" class="num">Location records</th><th scope="col">Appears in</th></tr></thead>
<tbody>${cityIndex
    .map(
      (c) =>
        `<tr><td>${esc(c.name)}</td><td class="num">${c.games.length}</td><td class="num">${c.locations}</td><td>${c.games
          .map((g) => `<a href="${rel}games/${g.slug}/">${esc(g.title)}</a>`)
          .join(', ')}</td></tr>`
    )
    .join('\n')}</tbody></table></div>`;

  const blocks = games
    .filter((g) => g.sections.locations.items.length)
    .map((g) => {
      const anchor = `<h2 id="${g.slug}">${esc(g.title)} <span class="note">${g.year}</span></h2>`;
      const actions = `<p class="section-actions"><a class="btn btn-ghost" href="${rel}games/${g.slug}/locations/">Game location page</a><a class="btn btn-ghost" href="${rel}data/games/${g.slug}/locations.json" type="application/json">locations.json</a></p>`;
      return `${anchor}${actions}${sectionTable('locations', g.sections.locations.items, rel, g)}`;
    })
    .join('\n');

  const content = `${pageHead({
    eyebrow: `${locationRows.length} locations · ${cityIndex.length} cities`,
    title: 'All locations',
    lead: 'Every city, district and landmark in the dataset, grouped by game, plus an index of which cities recur across the series.',
  })}
${statGrid([
    { label: 'Locations', value: locationRows.length },
    { label: 'Cities', value: cityIndex.length },
    { label: 'Games covered', value: games.filter((g) => g.sections.locations.items.length).length },
    { label: 'Largest', value: [...crossRows].sort((a, b) => b.counts.locations - a.counts.locations)[0].short_title },
  ])}
${dataLink('../', 'data/locations.json', 'locations.json — flat list with parents')}
<h2 id="cities">Cities across the series</h2>
<p>Declared settings per game, with the number of location records that name the city directly.</p>
${cities}
<h2 id="all">Locations by game</h2>
${blocks}
<nav class="pager" aria-label="Cross-game navigation">
  <a href="${rel}cheats/">← All cheat codes</a>
  <a href="${rel}timeline/">Timeline →</a>
</nav>`;

  await page('locations/index.html', {
    title: 'All GTA locations — cities, districts and landmarks',
    description: `All ${locationRows.length} locations across the Grand Theft Auto series, grouped by game and by city.`,
    canonicalPath: '/locations/',
    jsonPath: 'data/locations.json',
    pageType: 'cross',
    breadcrumbs: [
      { label: 'Games', href: '/' },
      { label: 'Locations', href: '/locations/' },
    ],
    content,
    jsonld: [
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Grand Theft Auto locations',
        numberOfItems: locationRows.length,
        itemListElement: locationRows.slice(0, 100).map((r, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `${r.name} — ${r.game_title}`,
        })),
      },
    ],
  });

  await write(
    'data/locations.json',
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        description: 'Flat location list across all games plus a city index. parent is the containing area.',
        count: locationRows.length,
        cities: cityIndex,
        items: locationRows,
      },
      null,
      2
    )
  );
}

dataIndex.cross = {
  pages: { timeline: 'timeline/', compare: 'compare/', cheats: 'cheats/', locations: 'locations/' },
  data: {
    timeline: 'data/cross/timeline.json',
    compare: 'data/cross/compare.json',
    cheats: 'data/cheats.json',
    locations: 'data/locations.json',
  },
};

function fieldTable(key) {
  const s = SECTIONS[key];
  const rows = Object.entries(s.fields)
    .map(([f, d]) => {
      const type = Array.isArray(d.type) ? d.type.join(' | ') : d.type;
      const req = d.required ? 'yes' : 'no';
      const extra = d.enum ? `one of: ${d.enum.join(', ')}` : d.items === 'string' ? 'array of strings' : d.pattern ? `pattern ${d.pattern}` : '';
      return `<tr><td><code>${esc(f)}</code></td><td>${esc(type)}</td><td>${req}</td><td>${esc(extra)}</td></tr>`;
    })
    .join('');
  return `<div class="table-wrap"><table class="data-table">
<caption>Fields on every ${esc(s.singular.toLowerCase())} record</caption>
<thead><tr><th scope="col">Field</th><th scope="col">Type</th><th scope="col">Required</th><th scope="col">Notes</th></tr></thead>
<tbody>${rows}</tbody></table></div>`;
}

/* -------------------------------------------------------------- data files */

await write('data/index.json', JSON.stringify(dataIndex, null, 2));
await write('data/search-index.json', JSON.stringify(searchIndex));
await write('data/images.json', JSON.stringify({ generated: new Date().toISOString(), base: 'assets/img', note: 'status=placeholder means generated SVG. Drop a real file with the same basename (jpg/png/webp/avif) into assets/img/<kind>/<game>/ and rebuild.', images: manifest }, null, 2));

for (const key of SECTION_KEYS) {
  await write(`data/schema/${key}.json`, JSON.stringify(sectionSchema(key), null, 2));
}

for (const g of games) {
  const bundle = {
    meta: {
      slug: g.slug,
      title: g.title,
      year: g.year,
      type: g.type,
      status: g.status,
      generated: new Date().toISOString(),
      schema_version: '1.0.0',
      coverage: Object.fromEntries(SECTION_KEYS.map((k) => [k, g.sections[k].coverage])),
      counts: Object.fromEntries(SECTION_KEYS.map((k) => [k, g.sections[k].items.length])),
      images: g.images,
      sources: g.bundle?.meta?.sources || [],
      license: 'Unofficial fan data. Game names and trademarks belong to Rockstar Games / Take-Two Interactive.',
    },
  };
  for (const key of SECTION_KEYS) bundle[key] = { coverage: g.sections[key].coverage, items: g.sections[key].items };
  await write(`data/games/${g.slug}.json`, JSON.stringify(bundle, null, 2));
  for (const key of SECTION_KEYS) {
    await write(
      `data/games/${g.slug}/${key}.json`,
      JSON.stringify(
        { game: g.slug, game_title: g.title, section: key, coverage: g.sections[key].coverage, count: g.sections[key].items.length, items: g.sections[key].items },
        null,
        2
      )
    );
  }
}

await write(
  'data/status.json',
  JSON.stringify(
    {
      generated: new Date().toISOString(),
      games: games.map((g) => ({
        slug: g.slug,
        title: g.title,
        status: g.status,
        records: SECTION_KEYS.reduce((n, k) => n + g.sections[k].items.length, 0),
        sections: Object.fromEntries(SECTION_KEYS.map((k) => [k, { count: g.sections[k].items.length, coverage: g.sections[k].coverage }])),
      })),
      images: { total: manifest.length, real: manifest.filter((m) => m.status === 'real').length, placeholder: manifest.filter((m) => m.status === 'placeholder').length },
    },
    null,
    2
  )
);

/* ------------------------------------------------------------- data index */

{
  const rows = SECTION_KEYS.map(
    (k) =>
      `<tr><td><code>data/schema/${k}.json</code></td><td>${esc(SECTIONS[k].title)}</td><td>${esc(SECTIONS[k].blurb)}</td></tr>`
  ).join('');
  const content = `${pageHead({
    eyebrow: 'Machine interface',
    title: 'Data',
    lead: 'Everything on this site is generated from these files. All paths are relative to the repository root and available on the live site.',
  })}
${statGrid([
    { label: 'Game bundles', value: games.length },
    { label: 'Section files', value: games.length * SECTION_KEYS.length },
    { label: 'Records', value: Object.values(totalCounts).reduce((a, b) => a + b, 0) },
    { label: 'Images tracked', value: manifest.length },
  ])}
<h2>Entry points</h2>
<div class="table-wrap"><table class="data-table">
<caption>Stable data endpoints</caption>
<thead><tr><th scope="col">Path</th><th scope="col">Type</th><th scope="col">Description</th></tr></thead>
<tbody>
<tr><td><a href="index.json"><code>/data/index.json</code></a></td><td>Index</td><td>Site, sections, all games with counts and links</td></tr>
<tr><td><a href="search-index.json"><code>/data/search-index.json</code></a></td><td>Corpus</td><td>One object per record; powers /search/</td></tr>
<tr><td><a href="images.json"><code>/data/images.json</code></a></td><td>Manifest</td><td>Every image path, dimension and status</td></tr>
<tr><td><a href="status.json"><code>/data/status.json</code></a></td><td>Status</td><td>Per-game coverage and totals</td></tr>
<tr><td><a href="cheats.json"><code>/data/cheats.json</code></a></td><td>Cross-game</td><td>Every cheat code flattened, with game, platform and input type</td></tr>
<tr><td><a href="locations.json"><code>/data/locations.json</code></a></td><td>Cross-game</td><td>Every location flattened, plus a city index</td></tr>
<tr><td><a href="cross/timeline.json"><code>/data/cross/timeline.json</code></a></td><td>Cross-game</td><td>All releases grouped by 2D, 3D and HD universe</td></tr>
<tr><td><a href="cross/compare.json"><code>/data/cross/compare.json</code></a></td><td>Cross-game</td><td>Record counts per game and section, leaders, shared cities</td></tr>
<tr><td><a href="games/gta-iii.json"><code>/data/games/&lt;slug&gt;.json</code></a></td><td>Bundle</td><td>All seven sections for one game</td></tr>
<tr><td><a href="games/gta-iii/characters.json"><code>/data/games/&lt;slug&gt;/&lt;section&gt;.json</code></a></td><td>Collection</td><td>One section, sorted, with coverage metadata</td></tr>
</tbody></table></div>
<h2>Schemas</h2>
<div class="table-wrap"><table class="data-table">
<caption>JSON Schema (draft 2020-12) per record type</caption>
<thead><tr><th scope="col">Path</th><th scope="col">Record</th><th scope="col">Description</th></tr></thead>
<tbody>${rows}</tbody></table></div>
<h2>Conventions</h2>
<ul>
<li>Record <code>id</code> is a permanent kebab-case slug, unique inside its game and section.</li>
<li><code>verified</code> is a boolean on every record. <code>false</code> means best-effort, not confirmed.</li>
<li><code>source</code> is an optional URL or document name backing the record.</li>
<li><code>coverage</code> is one of <code>complete</code>, <code>partial</code>, <code>limited</code>, <code>official-only</code>, <code>empty</code>.</li>
<li>Missing numbers are <code>null</code>, never <code>0</code> and never a guess.</li>
<li>Arrays are sorted deterministically; files contain no timestamps except the top-level <code>generated</code> field.</li>
</ul>`;

  await page('data/index.html', {
    title: 'Data — GTA Hub',
    description: 'JSON endpoints, schemas and conventions for the GTA Hub dataset.',
    canonicalPath: '/data/',
    jsonPath: 'data/index.json',
    pageType: 'data',
    breadcrumbs: [
      { label: 'Games', href: '/' },
      { label: 'Data', href: '/data/' },
    ],
    content,
  });
}

/* ------------------------------------------------------------------ search */

{
  const content = `${pageHead({
    eyebrow: 'Client-side · works offline · no API',
    title: 'Search',
    lead: 'Filters a local JSON index. Nothing leaves the page.',
  })}
<form class="search-form" role="search" action="#" onsubmit="return false">
  <label for="q">Query</label>
  <input id="q" name="q" type="search" autocomplete="off" placeholder="ches, rhino, hidden package, gta v…" aria-describedby="hint">
  <p id="hint">Matches names, roles, givers, locations, platforms, codes. Minimum 2 characters.</p>
</form>
<p id="result-count" class="note" aria-live="polite">Type to search.</p>
<ol id="results" class="results"></ol>
<noscript><p>Search needs JavaScript. Every record is also in <a href="../data/search-index.json">search-index.json</a>.</p></noscript>`;

  await page('search/index.html', {
    title: 'Search — GTA Hub',
    description: 'Search every character, mission, vehicle, weapon, cheat, location and collectible across all GTA games.',
    canonicalPath: '/search/',
    jsonPath: 'data/search-index.json',
    pageType: 'search',
    breadcrumbs: [
      { label: 'Games', href: '/' },
      { label: 'Search', href: '/search/' },
    ],
    content,
  });
}

/* ------------------------------------------------------------------- about */

{
  const content = `${pageHead({
    eyebrow: 'About',
    title: 'How this site works',
    lead: 'A deliberate choice: boring, static, complete, and readable by machines before humans.',
  })}
<h2 id="principles">Principles</h2>
<ul>
<li><strong>No runtime dependency.</strong> No CDNs, fonts, analytics, or image hotlinking. The page you load is the repository.</li>
<li><strong>HTML and JSON are generated from one source.</strong> Tables and JSON cannot disagree because both come from <code>content/</code>.</li>
<li><strong>Stable identifiers.</strong> Slugs are permanent; <code>data-*</code> attributes and row <code>id</code>s mirror the JSON <code>id</code>.</li>
<li><strong>Honest coverage.</strong> A section marked <code>partial</code> is a verified core, not a claim of completeness.</li>
<li><strong>No JavaScript required.</strong> JS adds search and nothing else.</li>
</ul>
<h2 id="accuracy">Accuracy</h2>
<p>Every record has <code>verified</code>. <code>true</code> means the record was checked against the game or a documented source; <code>false</code> means it is best-effort and may contain errors. Where a field is genuinely unknown it is <code>null</code> — never a guess. GTA VI is <code>official-only</code>: nothing beyond confirmed Rockstar material is recorded.</p>
<h2 id="images">Images</h2>
<p>Most images are real in-game art — character portraits, vehicle and weapon renders, and box art — fetched from <a href="https://gta.wiki" rel="noreferrer">GTA Wiki</a> by <code>tools/fetch-images.mjs</code>. That artwork remains the property of Rockstar Games / Take-Two Interactive and is used here for a personal, non-commercial reference site; see <a href="../assets/img/CREDITS.md">image credits</a>.</p>
<p>Every remaining slot resolves to an original generated SVG placeholder at the exact target dimensions. To replace a placeholder with your own file, put it at the same path with the same basename and a real extension:</p>
<pre><code>assets/img/portrait/gta-iii/claude.jpg
assets/img/vehicle/gta-v/adder.png
assets/img/weapon/gta-san-andreas/ak-47.webp</code></pre>
<p>Rebuild: <code>node tools/build.mjs</code>. The build prefers the real file, updates <code>data/images.json</code>, and leaves every URL and record untouched. <code>data/images.json</code> lists every slot with its <code>status</code> (<code>real</code> or <code>placeholder</code>), so what is still missing is always explicit.</p>
<h2 id="build">Build</h2>
<pre><code>node tools/validate.mjs   # data checks
node tools/build.mjs      # content/ + assets/ → docs/
node tools/serve.mjs      # local preview at http://localhost:8080</code></pre>
<p>No <code>npm install</code>. Node 18+ only.</p>
<h2 id="license">Licensing</h2>
<p>Code: MIT. Data is an unofficial fan compilation. “Grand Theft Auto”, “GTA”, all game titles, character names and artwork are trademarks of Rockstar Games / Take-Two Interactive. This site is not affiliated with or endorsed by them.</p>`;

  await page('about/index.html', {
    title: 'About — GTA Hub',
    description: 'How the GTA Hub static site and dataset are built, verified and licensed.',
    canonicalPath: '/about/',
    pageType: 'about',
    breadcrumbs: [
      { label: 'Games', href: '/' },
      { label: 'About', href: '/about/' },
    ],
    content,
  });
}

/* -------------------------------------------------------------------- 404 */

await page('404.html', {
  title: 'Page not found — GTA Hub',
  description: 'This page does not exist. Start from the game index.',
  canonicalPath: '/404.html',
  pageType: '404',
  noindex: true,
  content: `${pageHead({ title: '404 — not found', lead: 'That URL has no page. The data probably still exists.' })}
<ul>
<li><a href="/">All games</a></li>
<li><a href="/data/index.json">data/index.json</a></li>
<li><a href="/search/">Search</a></li>
</ul>`,
});

/* --------------------------------------------------------------- sitemap */

const urls = ['/', '/timeline/', '/compare/', '/cheats/', '/locations/', '/data/', '/search/', '/about/'];
for (const g of games) {
  urls.push(`/games/${g.slug}/`);
  for (const key of SECTION_KEYS) {
    urls.push(`/games/${g.slug}/${key}/`);
    if (SECTIONS[key].detail) for (const row of g.sections[key].items) urls.push(`/games/${g.slug}/${key}/${row.id}/`);
  }
}

await write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url><loc>${esc(site.base_url + u)}</loc><lastmod>${TODAY}</lastmod></url>`)
  .join('\n')}
</urlset>
`
);

await write(
  'robots.txt',
  `# ${site.title}
User-agent: *
Allow: /

# Machine entry points
# ${site.base_url}/data/index.json
# ${site.base_url}/llms.txt

Sitemap: ${site.base_url}/sitemap.xml
`
);

/* ----------------------------------------------------------------- llms.txt */

{
  const lines = [
    `# ${site.title}`,
    '',
    `> ${site.description}`,
    '',
    `Static site, no external services. Regenerated ${TODAY}.`,
    '',
    '## Machine entry points',
    '',
    `- ${site.base_url}/data/index.json — site index, all games, counts, links`,
    `- ${site.base_url}/data/search-index.json — one object per record`,
    `- ${site.base_url}/data/images.json — image manifest with status`,
    `- ${site.base_url}/data/status.json — per-game coverage`,
    `- ${site.base_url}/data/cheats.json — every cheat code, flattened across games`,
    `- ${site.base_url}/data/locations.json — every location, flattened across games`,
    `- ${site.base_url}/data/cross/timeline.json — releases by universe`,
    `- ${site.base_url}/data/cross/compare.json — record counts per game and section`,
    `- ${site.base_url}/data/schema/<section>.json — JSON Schema per record type`,
    '',
    '## Cross-game pages',
    '',
    `- ${site.base_url}/timeline/ — releases in order, grouped by universe`,
    `- ${site.base_url}/compare/ — record matrix, section leaders, shared cities`,
    `- ${site.base_url}/cheats/ — all cheat codes on one page`,
    `- ${site.base_url}/locations/ — all locations on one page`,
    '',
    '## Record contract',
    '',
    'Every record: id (permanent kebab slug), verified (boolean), optional source (URL).',
    'Sections: characters, missions, vehicles, weapons, cheats, locations, collectibles.',
    'Coverage values: complete, partial, limited, official-only, empty.',
    'Unknown numbers are null, never 0.',
    '',
    '## Games',
    '',
  ];
  for (const g of games) {
    const n = SECTION_KEYS.reduce((a, k) => a + g.sections[k].items.length, 0);
    lines.push(
      `### ${g.title} (${g.year}, ${g.type})`,
      `- Page: ${site.base_url}/games/${g.slug}/`,
      `- JSON: ${site.base_url}/data/games/${g.slug}.json`,
      `- Cities: ${g.cities.join(', ')} · Status: ${g.status} · Records: ${n}`
    );
    lines.push('');
  }
  lines.push('## Notes', '', '- Unofficial fan data. Trademarks belong to Rockstar Games / Take-Two Interactive.', `- Artwork mostly sourced from GTA Wiki (${manifest.filter((m) => m.status === 'real').length}/${manifest.length} slots); the rest resolve to generated placeholders. See /data/images.json for per-slot status.`, '');
  await write('llms.txt', lines.join('\n'));
}

/* ----------------------------------------------------------------- assets */

await mkdir(path.join(OUT, 'assets/img'), { recursive: true });
await copyDir(path.join(ROOT, 'assets/css'), path.join(OUT, 'assets/css'));
await copyDir(path.join(ROOT, 'assets/js'), path.join(OUT, 'assets/js'));

// Image credits, generated from the manifest so the counts always match the files.
{
  const kinds = [...new Set(manifest.map((m) => m.kind))];
  const rows = kinds.map((k) => {
    const all = manifest.filter((m) => m.kind === k);
    return `| ${k} | ${all.filter((m) => m.status === 'real').length} | ${all.length} |`;
  });
  await mkdir(path.join(ROOT, 'assets/img'), { recursive: true });
  await writeFile(
    path.join(ROOT, 'assets/img/CREDITS.md'),
    `# Image credits

The images in this directory were fetched from [GTA Wiki](https://gta.wiki) by
\`tools/fetch-images.mjs\`. They are screenshots, renders and cover art from Grand Theft
Auto games and remain the property of Rockstar Games / Take-Two Interactive. They are
included here for a personal, non-commercial reference site and are not licensed for reuse.

- Vehicle and weapon images come from each game's own gallery page on GTA Wiki
  (e.g. \`Vehicles in GTA III/images\`), so the art matches the game it is filed under.
  The Episodes from Liberty City fall back to GTA IV's gallery for shared models.
- Mission screenshots come from each game's \`Missions in <Game>\` table.
- Character portraits, locations and collectible sets use the record's own GTA Wiki page image,
  preferring the page for the game the record belongs to.
- Cover and banner slots use the game's page image on GTA Wiki.
- Anything unmatched stays a generated placeholder and is listed as such in
  \`data/images.json\`.

${new Date().toISOString()}

| Kind | Real | Slots |
|---|---|---|
${rows.join('\n')}
| **total** | **${manifest.filter((m) => m.status === 'real').length}** | **${manifest.length}** |
`
  );
}

// real images (fetched or dropped in by hand); placeholders are generated below
await copyDir(path.join(ROOT, 'assets/img'), path.join(OUT, 'assets/img'));

if (!NO_ART) {
  await mkdir(path.join(OUT, 'assets/img/brand'), { recursive: true });
  await writeFile(path.join(OUT, 'assets/img/brand/favicon.svg'), brandSvg());
  await writeFile(path.join(OUT, 'assets/img/brand/og.svg'), placeholder({ kind: 'brand', width: 1200, height: 630, title: site.title, subtitle: site.tagline, accent: '#e03131' }));

  // placeholder files (real images already copied by copyDir, and skip those keys)
  const written = new Set();
  for (const m of manifest) {
    if (m.status !== 'placeholder' || written.has(m.path)) continue;
    written.add(m.path);
    const accent = games.find((g) => g.slug === m.game)?.accent || '#495057';
    const svg = placeholder({
      kind: m.kind,
      width: m.width,
      height: m.height,
      title: m.alt,
      subtitle: m.game,
      accent,
      protagonists: m.protagonists,
    });
    await write(
      m.path,
      m.kind === 'cheat'
        ? cheatPlaceholder({ width: m.width, height: m.height, text: m.placeholderText || m.alt })
        : svg
    );
  }
  log(`Art: ${written.size} placeholders, ${manifest.filter((m) => m.status === 'real').length} real images`);
}

await write('.nojekyll', '');

log(`Build complete: ${urls.length} pages, ${manifest.length} images tracked.`);
