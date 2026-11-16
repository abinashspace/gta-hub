#!/usr/bin/env node
/**
 * Fetch official in-game images from GTA Wiki into the local image slots.
 *
 *   node tools/fetch-images.mjs [--kinds=portrait,vehicle,weapon,mission,cover,banner]
 *                               [--limit=N] [--max-mb=150] [--force] [--dry]
 *
 * Sources (per game, from gta.wiki):
 *   vehicles   Vehicles_in_<Game>/images  (gallery captions -> screenshots of that game)
 *   weapons    Weapons_in_<Game>/images
 *   missions   Missions_in_<Game>         (mission table rows -> in-game screenshots)
 *   portraits  page image of each character's own wiki page (batched API)
 *   cover      page image of the game's wiki page
 *   banner     page image of the game's wiki page (larger)
 *
 * Images are copyrighted by Rockstar Games / Take-Two Interactive and are fetched
 * for a personal, non-commercial reference site. Nothing here is redistributed by
 * the build itself: the build only reads whatever is in assets/img/.
 *
 * Requires docs/data/images.json from a previous build (it is the worklist).
 */
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const has = (name) => args.includes(`--${name}`);
const DRY = has('dry');
const FORCE = has('force');
const LIMIT = Number(flag('limit') || 0);
const MAX_MB = Number(flag('max-mb') || 150);
const KINDS = new Set((flag('kinds') || 'portrait,vehicle,weapon,mission,cover,banner').split(',').map((s) => s.trim()).filter(Boolean));

const WIDTH = { vehicle: 400, weapon: 320, portrait: 480, mission: 480, cover: 600, banner: 1200, location: 480, collectible: 256 };

const VEHICLE_PAGE = {
  'gta-iii': 'GTA_III',
  'gta-vice-city': 'GTA_Vice_City',
  'gta-san-andreas': 'GTA_San_Andreas',
  'gta-advance': 'GTA_Advance',
  'gta-liberty-city-stories': 'GTA_Liberty_City_Stories',
  'gta-vice-city-stories': 'GTA_Vice_City_Stories',
  'gta-iv': 'GTA_IV',
  'gta-iv-the-lost-and-damned': 'TLAD',
  'gta-the-ballad-of-gay-tony': 'TBOGT',
  'gta-chinatown-wars': 'GTA_Chinatown_Wars',
  'gta-v': 'GTA_V',
  'gta-online': 'GTA_Online',
  'gta-vi': 'GTA_VI',
};

// Wiki page suffix per game, used for mission, vehicle and weapon gallery pages.
const WIKI_GAME = {
  gta: 'GTA_1',
  'gta-london-1969': 'GTA_London_1969',
  'gta-london-1961': 'GTA_London_1961',
  'gta-2': 'GTA_2',
  'gta-iii': 'GTA_III',
  'gta-vice-city': 'GTA_Vice_City',
  'gta-san-andreas': 'GTA_San_Andreas',
  'gta-advance': 'GTA_Advance',
  'gta-liberty-city-stories': 'GTA_Liberty_City_Stories',
  'gta-vice-city-stories': 'GTA_Vice_City_Stories',
  'gta-iv': 'GTA_IV',
  'gta-iv-the-lost-and-damned': 'TLAD',
  'gta-the-ballad-of-gay-tony': 'TBOGT',
  'gta-chinatown-wars': 'GTA_Chinatown_Wars',
  'gta-v': 'GTA_V',
  'gta-online': 'GTA_Online',
  'gta-vi': 'GTA_VI',
};

// Wiki page titles used for cover art.
const GAME_PAGE = {
  gta: 'Grand_Theft_Auto_(1997_game)',
  'gta-london-1969': 'Grand_Theft_Auto:_London_1969',
  'gta-london-1961': 'Grand_Theft_Auto:_London_1961',
  'gta-2': 'Grand_Theft_Auto_2',
  'gta-iii': 'Grand_Theft_Auto_III',
  'gta-vice-city': 'Grand_Theft_Auto:_Vice_City',
  'gta-san-andreas': 'Grand_Theft_Auto:_San_Andreas',
  'gta-advance': 'Grand_Theft_Auto_Advance',
  'gta-liberty-city-stories': 'Grand_Theft_Auto:_Liberty_City_Stories',
  'gta-vice-city-stories': 'Grand_Theft_Auto:_Vice_City_Stories',
  'gta-iv': 'Grand_Theft_Auto_IV',
  'gta-iv-the-lost-and-damned': 'The_Lost_and_Damned',
  'gta-the-ballad-of-gay-tony': 'The_Ballad_of_Gay_Tony',
  'gta-chinatown-wars': 'Grand_Theft_Auto:_Chinatown_Wars',
  'gta-v': 'Grand_Theft_Auto_V',
  'gta-online': 'Grand_Theft_Auto_Online',
  'gta-vi': 'Grand_Theft_Auto_VI',
};

const manifest = JSON.parse(await readFile(path.join(ROOT, 'docs/data/images.json'), 'utf8')).images;
const registry = JSON.parse(await readFile(path.join(ROOT, 'content/games.json'), 'utf8'));
const games = Array.isArray(registry) ? registry : registry.games;

const bundles = new Map();
for (const g of games) {
  bundles.set(g.slug, JSON.parse(await readFile(path.join(ROOT, `content/games/${g.slug}.json`), 'utf8')));
}

const decodeEntities = (s) =>
  String(s)
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#91;/g, '[')
    .replace(/&#93;/g, ']');

const key = (s) =>
  decodeEntities(s)
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, '');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url, attempts = 4) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'gta-hub static build (personal fan site)' } });
      if (res.ok) return await res.text();
      if (res.status === 404) return null;
    } catch {
      // network reset; retry
    }
    await sleep(700 * (i + 1));
  }
  return null;
}

async function fetchBinary(url, attempts = 4) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'gta-hub static build (personal fan site)' } });
      if (!res.ok) return null;
      const type = res.headers.get('content-type') || '';
      const buf = Buffer.from(await res.arrayBuffer());
      return { buf, type };
    } catch {
      // retry
    }
    await sleep(700 * (i + 1));
  }
  return null;
}

function galleryImages(html) {
  const body = html.slice(html.indexOf('<div id="mw-content-text"'));
  const map = new Map();
  for (const chunk of body.split('class="wiki-flexi-gallery-image"').slice(1)) {
    const img = chunk.match(/<img[^>]*src="([^"]+)"/);
    const cap = chunk.match(/wiki-flexi-gallery-caption-text">([\s\S]*?)<\/span>/);
    if (!img || !cap) continue;
    const name = cap[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const k = key(name);
    if (k && !map.has(k)) map.set(k, img[1]);
  }
  return map;
}

/**
 * Candidate wiki page titles for a character record, best first.
 * The wiki titles people by their full name, so nicknames and role
 * suffixes have to be stripped before asking for the page image.
 */
function titleVariants(name) {
  const variants = [];
  const add = (t) => {
    const v = t.replace(/\s+/g, ' ').trim();
    if (v && !variants.includes(v)) variants.push(v);
  };
  add(name);
  const noParen = name.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  add(noParen);
  const noNick = name.replace(/\s*['\u2018\u2019"][^'\u2018\u2019"]*['\u2018\u2019"]\s*/g, ' ').replace(/\s+/g, ' ').trim();
  add(noNick);
  add(noNick.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim());
  return variants;
}

const NOT_A_PERSON = /^(player-named protagonist|none\b|online protagonist|free mode|ceo office|.*\bleader$|.*\bcontact$)/i;

function rowImages(html, names) {
  const body = html.slice(html.indexOf('<div id="mw-content-text"'));
  const map = new Map();
  for (const row of body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    // ignore icons and blips: mission screenshots are at least ~150px wide
    const img = [...row[1].matchAll(/<img[^>]*src="([^"]+)"/g)]
      .map((m) => m[1])
      .find((src) => {
        const w = Number((src.match(/\/(\d+)px-/) || [])[1] || 0);
        return w >= 120;
      });
    if (!img) continue;
    for (const a of row[1].matchAll(/<a[^>]*href="\/w\/([^"#?]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
      if (a[1].startsWith('File:')) continue;
      const label = a[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const k = key(label);
      if (names.has(k) && !map.has(k)) map.set(k, img);
    }
  }
  return map;
}

async function missionMap(slug) {
  const suffix = WIKI_GAME[slug];
  if (!suffix) return new Map();
  // GTA Online's section holds job-type summaries rather than a mission list.
  if (slug === 'gta-online' || slug === 'gta-vi') return new Map();
  // The Advance mission table lists blips only, no screenshots.
  if (slug === 'gta-advance') return new Map();
  const items = bundles.get(slug)?.missions?.items ?? [];
  if (!items.length) return new Map();
  const names = new Set(items.map((m) => key(m.name)));
  const html = await fetchText(`https://gta.wiki/w/Missions_in_${suffix}`);
  return html ? rowImages(html, names) : new Map();
}

function pageImage(json) {
  const pages = Object.values(json?.query?.pages ?? {});
  return pages.find((p) => p.thumbnail?.source)?.thumbnail.source ?? null;
}

const upsize = (src, width) => {
  if (!src) return null;
  const wanted = width || 400;
  if (/\/images\/thumb\//.test(src)) return src.replace(/\/\d+px-/, `/${wanted}px-`);
  return src;
};

const EXT_BY_TYPE = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

/**
 * GTA Wiki serves a grey question-mark graphic as the page image for pages
 * without artwork. Treat that file as "no image" rather than as real art.
 */
const PLACEHOLDER_HASHES = new Set([
  'F6966B6C4E28BF0CB4952927D0B8B5C2EEF4CA7111E0C042A7E4F2D0E2030A1B',
]);

async function pageImages(titles, width) {
  const found = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const chunk = titles.slice(i, i + 50);
    const url =
      'https://gta.wiki/api.php?action=query&format=json&prop=pageimages&piprop=thumbnail&pithumbsize=' +
      width +
      '&redirects=1&titles=' +
      encodeURIComponent(chunk.join('|'));
    const json = JSON.parse((await fetchText(url)) || '{}');
    const q = json.query ?? {};
    const byTitle = new Map();
    for (const p of Object.values(q.pages ?? {})) {
      if (p.thumbnail?.source) byTitle.set(p.title, p.thumbnail.source);
    }
    const alias = new Map();
    for (const n of q.normalized ?? []) alias.set(n.from, n.to);
    for (const r of q.redirects ?? []) alias.set(r.from, r.to);
    for (const t of chunk) {
      let cur = t;
      const seen = new Set();
      while (alias.has(cur) && !seen.has(cur)) {
        seen.add(cur);
        cur = alias.get(cur);
      }
      const src = byTitle.get(cur);
      if (src) found.set(t, src);
    }
    await sleep(120);
  }
  return found;
}

async function portraitMap(slug) {
  const items = bundles.get(slug)?.characters?.items ?? [];
  const pending = items.filter((r) => r.name && !NOT_A_PERSON.test(r.name.trim()));
  const variants = new Map();
  const allTitles = [];
  for (const r of pending) {
    const list = titleVariants(r.name);
    variants.set(r.id, list);
    for (const t of list) if (!allTitles.includes(t)) allTitles.push(t);
  }
  const found = await pageImages(allTitles, WIDTH.portrait);
  const map = new Map();
  for (const [id, list] of variants) {
    const hit = list.find((t) => found.has(t));
    if (hit) map.set(id, found.get(hit));
  }
  return map;
}

async function galleryFor(slug, kind) {
  const suffix = VEHICLE_PAGE[slug];
  if (!suffix) return new Map();
  const page = `${kind === 'vehicle' ? 'Vehicles' : 'Weapons'}_in_${suffix}/images`;
  const html = await fetchText(`https://gta.wiki/w/${page}`);
  return html ? galleryImages(html) : new Map();
}

// Episodes from Liberty City share most of GTA IV's vehicle and weapon roster;
// their own gallery pages only list what the episode adds, so fill the rest
// from the GTA IV gallery (same models, same art style).
const FALLBACK_TO = {
  'gta-iv-the-lost-and-damned': 'gta-iv',
  'gta-the-ballad-of-gay-tony': 'gta-iv',
};

async function gameImageMap(slug, kind) {
  if (kind === 'vehicle' || kind === 'weapon') {
    const map = await galleryFor(slug, kind);
    const fallback = FALLBACK_TO[slug];
    if (fallback) {
      const base = await galleryFor(fallback, kind);
      for (const [k, v] of base) if (!map.has(k)) map.set(k, v);
    }
    return map;
  }
  if (kind === 'portrait') return portraitMap(slug);
  if (kind === 'mission') return missionMap(slug);
  return new Map();
}

async function pageImageFor(slug) {
  const title = GAME_PAGE[slug];
  if (!title) return { cover: null, banner: null };
  const url =
    'https://gta.wiki/api.php?action=query&format=json&prop=pageimages&piprop=thumbnail&pithumbsize=1200&redirects=1&titles=' +
    encodeURIComponent(title.replace(/_/g, ' '));
  const json = JSON.parse((await fetchText(url)) || '{}');
  const src = pageImage(json);
  return { cover: src, banner: src };
}

const stats = { planned: 0, fetched: 0, skipped: 0, missing: 0, failed: 0 };
let bytes = 0;
const failures = [];
const realSlots = [];

function recordName(slug, kind, id) {
  const b = bundles.get(slug);
  const section =
    kind === 'portrait'
      ? b?.characters
      : kind === 'vehicle'
        ? b?.vehicles
        : kind === 'weapon'
          ? b?.weapons
          : kind === 'mission'
            ? b?.missions
            : null;
  return section?.items?.find((r) => r.id === id)?.name ?? null;
}

async function download(slot, url, width) {
  const src = upsize(url, width);
  if (!src) {
    stats.missing += 1;
    return false;
  }
  const abs = new URL(src, 'https://gta.wiki').href;
  const target = path.join(ROOT, 'assets/img', slot.kind, slot.game);
  const extGuess = path.extname(new URL(abs).pathname).slice(1).toLowerCase() || 'png';
  if (DRY) {
    stats.fetched += 1;
    return true;
  }
  await mkdir(target, { recursive: true });
  const outPath = path.join(target, `${slot.id}.${extGuess}`);
  if (!FORCE) {
    try {
      await stat(outPath);
      stats.skipped += 1;
      return true;
    } catch {
      // not present
    }
  }
  const res = await fetchBinary(abs);
  if (!res) {
    stats.failed += 1;
    failures.push(`${slot.kind}/${slot.game}/${slot.id}`);
    return false;
  }
  const ext = EXT_BY_TYPE[res.type.split(';')[0]] ?? extGuess;
  if (res.buf.length < 12000) {
    const digest = createHash('sha256').update(res.buf).digest('hex').toUpperCase();
    if (PLACEHOLDER_HASHES.has(digest)) {
      stats.missing += 1;
      return false;
    }
  }
  const finalPath = path.join(target, `${slot.id}.${ext}`);
  if (!DRY) await writeFile(finalPath, res.buf);
  bytes += res.buf.length;
  stats.fetched += 1;
  realSlots.push({ kind: slot.kind, game: slot.game, id: slot.id, path: `assets/img/${slot.kind}/${slot.game}/${slot.id}.${ext}`, source: abs });
  return true;
}

async function runPool(tasks, concurrency = 4) {
  let i = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (i < tasks.length) {
      if (bytes / 1024 / 1024 > MAX_MB) return;
      const task = tasks[i++];
      await task();
      await sleep(80);
    }
  });
  await Promise.all(workers);
}

const work = [];
let planned = 0;

for (const game of games) {
  for (const kind of KINDS) {
    const slots = manifest.filter((m) => m.kind === kind && m.game === game.slug && m.status !== 'real');
    if (!slots.length) continue;
    if (LIMIT && planned >= LIMIT) break;

    if (kind === 'cover' || kind === 'banner') {
      const images = await pageImageFor(game.slug);
      const url = images[kind];
      if (!url) continue;
      for (const slot of LIMIT ? slots.slice(0, Math.max(0, LIMIT - planned)) : slots) {
        planned += 1;
        work.push(() => download(slot, url, WIDTH[kind]));
      }
      continue;
    }

    const map = await gameImageMap(game.slug, kind);
    if (!map.size) continue;
    let matched = 0;
    for (const slot of slots) {
      if (LIMIT && planned >= LIMIT) break;
      const url = kind === 'portrait' ? map.get(slot.record ?? slot.id) : map.get(key(recordName(game.slug, kind, slot.record ?? slot.id) ?? ''));
      if (!url) continue;
      matched += 1;
      planned += 1;
      work.push(() => download(slot, url, WIDTH[kind]));
    }
    console.log(`${game.slug.padEnd(30)} ${kind.padEnd(9)} ${String(matched).padStart(4)}/${String(slots.length).padStart(4)} matched`);
  }
}

stats.planned = planned;
if (LIMIT) work.length = Math.min(work.length, LIMIT);
console.log(`\nDownloading ${work.length} images (max ${MAX_MB} MB, width ${JSON.stringify(WIDTH)})${DRY ? ' — dry run' : ''}…`);

await runPool(work, 4);

if (!DRY && realSlots.length) {
  await mkdir(path.join(ROOT, 'assets/img'), { recursive: true });
  const credits = `# Image credits

The images in this directory were fetched from [GTA Wiki](https://gta.wiki) by
\`tools/fetch-images.mjs\`. They are screenshots, renders and cover art from Grand Theft
Auto games and remain the property of Rockstar Games / Take-Two Interactive. They are
included here for a personal, non-commercial reference site and are not licensed for reuse.

- In-game vehicle, weapon and character images come from each game's own gallery pages on
  GTA Wiki (e.g. \`Vehicles in GTA III/images\`), so the art matches the game it is filed under.
- Cover and banner slots use the game's page image on GTA Wiki.
- Anything not matched stays a generated placeholder and is listed as such in
  \`docs/data/images.json\`.

Last fetch: ${new Date().toISOString()} — ${realSlots.length} files written this run.
`;
  await writeFile(path.join(ROOT, 'assets/img/CREDITS.md'), credits);
}

console.log(
  `\nplanned ${stats.planned} · fetched ${stats.fetched} · already present ${stats.skipped} · no image on wiki ${stats.missing} · failed ${stats.failed} · ${(bytes / 1024 / 1024).toFixed(1)} MB`
);
if (failures.length) console.log(`failures (first 10): ${failures.slice(0, 10).join(', ')}`);
if (stats.planned > work.length) console.log(`stopped early at the ${MAX_MB} MB budget; re-run to continue.`);
console.log('Now run: node tools/build.mjs && node tools/linkcheck.mjs');
