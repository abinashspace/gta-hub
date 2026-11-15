#!/usr/bin/env node
/**
 * Data validator. Zero dependencies. Run: node tools/validate.mjs [--json]
 * Checks the registry and every game bundle against tools/lib/schema.mjs.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECTIONS, SECTION_KEYS } from './lib/schema.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push({ where, msg });
const warn = (where, msg) => warnings.push({ where, msg });

function checkType(value, def, where, field) {
  const types = Array.isArray(def.type) ? def.type : [def.type];
  const actual =
    value === null ? 'null' : Array.isArray(value) ? 'array' : Number.isInteger(value) ? 'integer' : typeof value;
  const ok = types.some((t) => t === actual || (t === 'number' && actual === 'integer') || (t === 'integer' && actual === 'number'));
  if (!ok) err(`${where}.${field}`, `expected ${types.join('|')}, got ${actual}`);
  if (types.includes('string') && typeof value === 'string' && def.pattern && !new RegExp(def.pattern).test(value))
    err(`${where}.${field}`, `does not match ${def.pattern}`);
  if (def.enum && typeof value === 'string' && !def.enum.includes(value))
    err(`${where}.${field}`, `"${value}" is not one of: ${def.enum.join(', ')}`);
  if (def.minimum != null && typeof value === 'number' && value < def.minimum)
    err(`${where}.${field}`, `below minimum ${def.minimum}`);
  if (def.minItems != null && Array.isArray(value) && value.length < def.minItems)
    err(`${where}.${field}`, `needs at least ${def.minItems} items`);
  if (def.items === 'string' && Array.isArray(value)) {
    value.forEach((v, i) => typeof v !== 'string' && err(`${where}.${field}[${i}]`, 'expected string'));
  }
  if (def.items && typeof def.items === 'object' && Array.isArray(value)) {
    value.forEach((v, i) => {
      for (const [k, d] of Object.entries(def.items.properties || {})) {
        if (def.items.required?.includes(k) && v?.[k] == null) err(`${where}.${field}[${i}]`, `missing ${k}`);
        if (v?.[k] != null) checkType(v[k], d, `${where}.${field}[${i}]`, k);
      }
    });
  }
}

export async function validate() {
  const registry = JSON.parse(await readFile(path.join(ROOT, 'content/games.json'), 'utf8'));
  const games = registry.games || [];
  if (games.length !== 17) warn('content/games.json', `expected 17 games, found ${games.length}`);

  const slugs = new Set();
  const orders = new Set();
  for (const g of games) {
    const where = `games[${g.slug || '?'}]`;
    if (!g.slug || !ID_RE.test(g.slug)) err(where, 'slug missing or not kebab-case');
    if (slugs.has(g.slug)) err(where, 'duplicate slug');
    slugs.add(g.slug);
    if (orders.has(g.order)) err(where, `duplicate order ${g.order}`);
    orders.add(g.order);
    for (const k of ['title', 'short_title', 'year', 'type', 'status', 'platforms', 'cities', 'accent'])
      if (g[k] == null) err(where, `missing ${k}`);
    if (g.accent && !HEX_RE.test(g.accent)) err(where, 'accent must be #rrggbb');
    if (!['Main', 'Expansion', 'Spin-off', 'Online'].includes(g.type)) err(where, `bad type ${g.type}`);
    if (!['released', 'live', 'upcoming'].includes(g.status)) err(where, `bad status ${g.status}`);
  }

  for (const g of games) {
    let bundle;
    try {
      bundle = JSON.parse(await readFile(path.join(ROOT, `content/games/${g.slug}.json`), 'utf8'));
    } catch {
      err(g.slug, 'missing content/games/<slug>.json');
      continue;
    }
    for (const key of SECTION_KEYS) {
      const sec = bundle[key] || {};
      const items = sec.items || [];
      const s = SECTIONS[key];
      const at = `${g.slug}/${key}`;
      if (!Array.isArray(items)) {
        err(at, 'items must be an array');
        continue;
      }
      const ids = new Set();
      for (const [i, row] of items.entries()) {
        const w = `${at}[${i}]`;
        if (!row.id || !ID_RE.test(row.id)) err(w, `bad id "${row.id}"`);
        if (ids.has(row.id)) err(w, `duplicate id ${row.id}`);
        ids.add(row.id);
        if (typeof row.verified !== 'boolean') err(w, 'verified must be boolean');
        for (const [field, def] of Object.entries(s.fields)) {
          if (row[field] == null) {
            if (def.required) err(w, `missing required ${field}`);
            continue;
          }
          checkType(row[field], def, w, field);
        }
        for (const field of Object.keys(row)) {
          if (field !== 'id' && !(field in s.fields)) warn(w, `unknown field "${field}"`);
        }
        if (row.verified === false && !row.source && !bundle.meta?.sources) warn(w, 'unverified record without source');
      }
      if (items.length === 0) warn(at, 'section is empty');
      if (items.length > 0 && !sec.coverage) warn(at, 'missing coverage flag');
    }
  }

  return { games: games.length, errors, warnings };
}

if (process.argv[1] && process.argv[1].endsWith('validate.mjs')) {
  const { games, errors: E, warnings: W } = await validate();
  console.log(`Validated ${games} games — ${E.length} error(s), ${W.length} warning(s)`);
  for (const e of E) console.error(`ERROR ${e.where}: ${e.msg}`);
  for (const w of W.slice(0, 40)) console.warn(`WARN  ${w.where}: ${w.msg}`);
  if (W.length > 40) console.warn(`… ${W.length - 40} more warnings`);
  process.exitCode = E.length ? 1 : 0;
}
