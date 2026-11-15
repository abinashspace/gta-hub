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
import { placeholder, brandSvg, shade } from './lib/art.mjs';
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
await scanReal();

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

function imageFor(kind, gameSlug, id, { width, height, title, subtitle, accent }) {
  const key = `${kind}/${gameSlug}/${id}`;
  const real = realImages.get(key);
  if (real) {
    manifest.push({ kind, game: gameSlug, id, path: real, width, height, status: 'real', alt: title });
    return real;
  }
  const rel = `assets/img/${kind}/${gameSlug}/${id}.svg`;
  manifest.push({ kind, game: gameSlug, id, path: rel, width, height, status: 'placeholder', alt: title });
  return rel;
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
  const coverCards = cardGrid(
    games.map((g) => ({
      href: `${rel}games/${g.slug}/`,
      kicker: `${g.year} · ${g.type}`,
      title: g.title,
      meta: `${g.cities.join(' · ')} — ${SECTION_KEYS.reduce((n, k) => n + g.sections[k].items.length, 0)} records`,
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

  const content = `${pageHead({
    eyebrow: 'Static · JSON-first · No external services',
    title: 'GTA Hub',
    lead: `${games.length} games. ${SECTION_KEYS.length} section types. ${Object.values(totalCounts).reduce((a, b) => a + b, 0)} records. Every page has a JSON twin.`,
  })}
${statGrid([
    { label: 'Games', value: games.length },
    { label: 'Records', value: Object.values(totalCounts).reduce((a, b) => a + b, 0) },
    { label: 'Sections', value: SECTION_KEYS.length },
    { label: 'Build', html: `<time datetime="${TODAY}">${TODAY}</time>` },
  ])}
${coverCards}
<h2 id="games">Every game</h2>
${gameTable}
<h2 id="coverage">Coverage</h2>
<p class="note">Cells show how many records exist today. <span class="badge badge-complete">complete</span> <span class="badge badge-partial">partial</span> <span class="badge badge-limited">limited</span> <span class="badge badge-official-only">official-only</span> <span class="badge badge-empty">empty</span></p>
${matrix}
<h2 id="machines">For machines</h2>
<p>No JavaScript is required to read this site. Prefer JSON: every URL below is a static file in this repository.</p>
${endpoints}
<p class="data-link"><a href="llms.txt">llms.txt →</a> <a href="sitemap.xml">sitemap.xml →</a> <a href="robots.txt">robots.txt →</a></p>`;

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

  const content = `${pageHead({
    eyebrow: `${g.year} · ${g.type}${g.status === 'upcoming' ? ' · upcoming' : ''}`,
    title: g.title,
    lead: g.notes,
    meta: gameMeta(g),
  })}
<figure class="hero">
  <img src="${rel}${g.images.banner}" alt="${esc(g.title)} banner (placeholder)" width="1920" height="800" loading="lazy" decoding="async">
  <figcaption>${esc(g.title)} — banner. ${g.images.banner.endsWith('.svg') ? 'Placeholder art; add a real image at assets/img/banner/' + g.slug + '/banner.jpg.' : ''}</figcaption>
</figure>
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
${sectionTable(key, items, rel, g)}
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
    <img src="${drel}${row.image}" alt="${esc(row.name)} ${s.singular.toLowerCase()} image (placeholder)" width="${s.image.width}" height="${s.image.height}" loading="lazy" decoding="async">
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
<p>Real in-game artwork is owned by Rockstar Games and cannot be redistributed here. Each image slot currently resolves to an original generated SVG placeholder at the exact target dimensions. To swap in real art, place a file at the same path with the same basename and a real extension:</p>
<pre><code>assets/img/portrait/gta-iii/claude.jpg
assets/img/vehicle/gta-v/adder.png
assets/img/weapon/gta-san-andreas/ak-47.webp</code></pre>
<p>Rebuild: <code>node tools/build.mjs</code>. The build prefers the real file, updates <code>data/images.json</code>, and leaves every URL and record untouched.</p>
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

const urls = ['/', '/data/', '/search/', '/about/'];
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
    `- ${site.base_url}/data/schema/<section>.json — JSON Schema per record type`,
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
  lines.push('## Notes', '', '- Unofficial fan data. Trademarks belong to Rockstar Games / Take-Two Interactive.', '- Artwork is not included; image paths resolve to generated placeholders.', '');
  await write('llms.txt', lines.join('\n'));
}

/* ----------------------------------------------------------------- assets */

await mkdir(path.join(OUT, 'assets/img'), { recursive: true });
await copyDir(path.join(ROOT, 'assets/css'), path.join(OUT, 'assets/css'));
await copyDir(path.join(ROOT, 'assets/js'), path.join(OUT, 'assets/js'));

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
    });
    await write(m.path, svg);
  }
  log(`Art: ${written.size} placeholders, ${manifest.filter((m) => m.status === 'real').length} real images`);
}

await write('.nojekyll', '');

log(`Build complete: ${urls.length} pages, ${manifest.length} images tracked.`);
