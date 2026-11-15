#!/usr/bin/env node
/** Internal link + asset checker for docs/. Zero dependencies. */
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs');

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = await walk(ROOT);
const html = files.filter((f) => f.endsWith('.html'));
const exists = async (p) => !!(await stat(p).catch(() => null));

const problems = [];
let checked = 0;

for (const file of html) {
  const src = await readFile(file, 'utf8');
  const attrs = [...src.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const raw of attrs) {
    if (/^(https?:|mailto:|data:|#|javascript:)/.test(raw)) continue;
    const clean = raw.split('#')[0].split('?')[0];
    if (!clean) continue;
    checked++;
    const target = path.join(path.dirname(file), decodeURIComponent(clean));
    let ok = await exists(target);
    if (!ok && !path.extname(target)) ok = await exists(path.join(target, 'index.html'));
    if (!ok) problems.push(`${path.relative(ROOT, file)} -> ${raw}`);
  }
}

console.log(`${html.length} HTML files · ${checked} internal refs · ${problems.length} broken`);
for (const p of problems.slice(0, 50)) console.error(`BROKEN ${p}`);
process.exitCode = problems.length ? 1 : 0;
