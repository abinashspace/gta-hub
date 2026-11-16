#!/usr/bin/env node
/**
 * Write GAPS.md — every image slot that is still a generated placeholder, with
 * the exact filename that would fill it.
 *
 *   node tools/build.mjs   # manifest first
 *   node tools/gaps.mjs
 *
 * Reads docs/data/images.json (the same worklist fetch-images.mjs uses) and does
 * not touch anything else. Run after a build so the list matches the site.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(ROOT, 'docs/data/images.json'), 'utf8'));

const games = JSON.parse(await readFile(path.join(ROOT, 'content/games.json'), 'utf8'));
const gameName = new Map((Array.isArray(games) ? games : games.games).map((g) => [g.slug, g.title ?? g.name]));

// Section label shown in the report, in the order the site presents them.
const KIND_ORDER = ['cover', 'banner', 'map', 'vehicle', 'weapon', 'cheat', 'location', 'mission', 'collectible', 'portrait'];
const KIND_LABEL = {
  cover: 'Game cover',
  banner: 'Game banner',
  map: 'Map',
  vehicle: 'Vehicle',
  weapon: 'Weapon',
  cheat: 'Cheat code icon',
  location: 'Location',
  mission: 'Mission screenshot',
  collectible: 'Collectible',
  portrait: 'Character portrait',
};
const KIND_NOTE = {
  cover: 'Box art / key art',
  banner: 'Wide promotional art',
  map: 'Full in-game map image',
  vehicle: 'In-game vehicle render or screenshot',
  weapon: 'Weapon render or screenshot',
  cheat: 'Small icon shown beside the cheat row (any 128x128 tile works)',
  location: 'Screenshot of the place',
  mission: 'In-game screenshot of the mission',
  collectible: 'Icon or screenshot of the collectible',
  portrait: 'Face render or portrait',
};

const missing = manifest.images.filter((x) => x.status === 'placeholder');
if (!missing.length) {
  await writeFile(path.join(ROOT, 'GAPS.md'), '# Image gaps\n\nEvery slot has real art. Nothing to fill.\n');
  console.log('No gaps — all slots are real.');
  process.exit(0);
}

const byKind = new Map();
for (const slot of missing) {
  if (!byKind.has(slot.kind)) byKind.set(slot.kind, new Map());
  const byGame = byKind.get(slot.kind);
  if (!byGame.has(slot.game)) byGame.set(slot.game, []);
  byGame.get(slot.game).push(slot);
}

const total = manifest.images.length;
const real = total - missing.length;
const date = new Date().toISOString().slice(0, 10);

let out = `# Image gaps

${missing.length} of ${total} image slots are still generated placeholders
(${real} are real). Fill any of them by saving a file at the path shown in the "file"
column — \`jpg\`, \`png\`, \`webp\` or \`avif\` all work, the id must match exactly — and
then running \`node tools/build.mjs\`. The build flips the slot to \`real\` automatically.

Sizes are the slot's target dimensions; anything close is fine, the page scales the image.

| Kind | Missing | Slots |
|---|---|---|
`;

for (const kind of KIND_ORDER) {
  const byGame = byKind.get(kind);
  if (!byGame) continue;
  const n = [...byGame.values()].reduce((a, b) => a + b.length, 0);
  const slots = manifest.images.filter((x) => x.kind === kind).length;
  out += `| ${KIND_LABEL[kind] ?? kind} | ${n} | ${slots} |\n`;
}
out += `| **total** | **${missing.length}** | **${total}** |\n`;

out += `\nGenerated ${date} by \`tools/gaps.mjs\` from \`docs/data/images.json\`.\n`;

for (const kind of KIND_ORDER) {
  const byGame = byKind.get(kind);
  if (!byGame) continue;
  const n = [...byGame.values()].reduce((a, b) => a + b.length, 0);
  out += `\n## ${KIND_LABEL[kind] ?? kind} — ${n} missing\n\n`;
  if (KIND_NOTE[kind]) out += `${KIND_NOTE[kind]}.\n`;
  for (const [slug, slots] of [...byGame.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    out += `\n### ${gameName.get(slug) ?? slug} (${slots.length})\n\n`;
    out += `| Record | Size | Save as |\n|---|---|---|\n`;
    for (const s of slots) {
      const name = (s.alt ?? s.record ?? s.id).replace(/\|/g, '/').trim();
      out += `| ${name} | ${s.width}x${s.height} | \`${s.path.replace(/\.svg$/, '.<ext>')}\` |\n`;
    }
  }
}

await writeFile(path.join(ROOT, 'GAPS.md'), out);

const rows = ['kind,game,id,record,alt,width,height,save_as'];
for (const s of missing) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  rows.push(
    [s.kind, s.game, s.id, s.record, s.alt, s.width, s.height, s.path.replace(/\.svg$/, '.<ext>')]
      .map(esc)
      .join(',')
  );
}
await writeFile(path.join(ROOT, 'GAPS.csv'), rows.join('\n') + '\n');

console.log(`Gaps: ${missing.length} of ${total} slots.`);
for (const kind of KIND_ORDER) {
  const byGame = byKind.get(kind);
  if (!byGame) continue;
  const n = [...byGame.values()].reduce((a, b) => a + b.length, 0);
  console.log(`  ${kind.padEnd(12)} ${String(n).padStart(4)}`);
}
console.log('Wrote GAPS.md and GAPS.csv');
