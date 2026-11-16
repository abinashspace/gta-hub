# GTA Hub — Build Plan

A static, machine-first GTA encyclopedia. Every game, every section, every record as
portable JSON, mirrored by boring semantic HTML. No server, no API keys, no runtime
build. GitHub Pages serves it forever for free.

---

## 1. Hard rules (non-negotiable)

| Rule | Consequence |
|---|---|
| No external runtime dependency | No CDNs, no webfonts, no analytics, no hotlinked images. All CSS/JS/images live in the repo. |
| Every page is real HTML | Content is server-rendered at build time. JS only enhances (search/filter). Crawlers see everything. |
| JSON is the source of truth | `content/` → `docs/data/` on every build. HTML is a view of the JSON, never the reverse. |
| Stable URLs | Slugs never change after publish. `id` is permanent; renaming = redirect. |
| Honest data | Every record carries `verified` + optional `source`. `coverage` marks sections that are not yet complete. |
| Zero build deps | Plain Node ESM. `node tools/build.mjs`. No `npm install` needed. |

## 2. Images — the copyright reality

Real in-game art (portraits, vehicle renders, weapon icons) is Rockstar's IP. I will not
bulk-download or re-host it, and hotlinking breaks the "no other server" rule. So:

- **Now:** build generates original deterministic SVG placeholders (correct dimensions,
  correct filename, labelled "placeholder") so the site is complete and consistent today.
- **Later:** you drop real files into `assets/img/<kind>/<game>/<id>.{jpg,png,webp}`.
  The build prefers them automatically and flips `images.json` status from
  `placeholder` → `real`. No markup, no data, no URL changes.
- `docs/data/images.json` is the full worklist: every image the spec demands, its exact
  path, size, and status. Feed it to any downloader/asset tool you own.

Licensed/official art you have rights to = fine. Bulk scraping Rockstar's CDN = not
something I'll wire in.

## 3. Architecture

```
content/                source of truth (hand-edited JSON)
  site.json             base URL, title, nav, build options
  games.json            17-game registry (order, year, slug, city, accent colour)
  games/<slug>.json     per-game bundle: 7 sections + meta
assets/                 source assets (css, js, real images when supplied)
tools/                  zero-dep Node build + validate + art generator
docs/                   BUILD OUTPUT — this is what GitHub Pages serves
  index.html 404.html sitemap.xml robots.txt llms.txt .nojekyll
  games/<slug>/…        game page + 7 section pages + character/mission detail pages
  data/…                index.json, games/<slug>.json, per-section JSON, schemas,
                        search-index.json, images.json
```

Deploy: repo Settings → Pages → Branch `main`, folder `/docs`.

## 4. URL contract

| URL | Content |
|---|---|
| `/` | Hub: 17 games, coverage matrix, data links |
| `/games/gta-iii/` | Game overview, key facts, section index, coverage |
| `/games/gta-iii/characters/` | Full table + JSON link |
| `/games/gta-iii/characters/claude/` | Detail page (portrait, facts, JSON, prev/next) |
| `/games/gta-iii/missions/` … `/missions/<id>/` | Same pattern |
| `/games/gta-iii/vehicles/` `weapons/` `cheats/` `locations/` `collectibles/` | Tables (no detail pages) |
| `/data/index.json` | Machine entry point |
| `/data/games/<slug>.json` | Whole game in one request |
| `/data/games/<slug>/<section>.json` | One section |
| `/data/search-index.json` | Flat search corpus |
| `/data/schema/<section>.json` | JSON Schema (draft 2020-12) |
| `/llms.txt` | Plain-text map for LLM crawlers |

Every HTML page advertises its JSON twin:
`<link rel="alternate" type="application/json" href="…">`.
Every collection page embeds JSON-LD (`ItemList`); game pages embed `VideoGame`.

## 5. Record schemas (abridged)

```
character    id name role affiliations[] summary status first_appearance image verified source
mission      id name order type giver location reward{money,other} summary requirements[] image verified source
vehicle      id name category class top_speed_kph top_speed_mph seats price image verified source
weapon       id name type damage_tier ammo price unlock image verified source
cheat        id effect codes[{platform,edition,code}] icon verified source
location     id name type parent summary image verified source
collectible  id name type total reward image verified source
```

Section metadata (columns, sort, image size, detail-page eligibility) lives in
`tools/lib/schema.mjs` and generates the tables, the JSON Schemas, the image manifest,
and the validator — one definition, four consumers.

## 6. Session plan

### Session 0 — Foundations ✅ (this session)
- [x] Plan, hard rules, image policy
- [x] 17-game registry with slugs, accents, cities, platforms, status
- [x] Zero-dep build engine, validators, SVG art generator
- [x] Design system (dark/light, system fonts, print styles)
- [x] Machine layer: JSON bundle, schemas, sitemap, robots, llms.txt, JSON-LD, search index
- [x] Deploy config (`.nojekyll`, `/docs`, README)
- Deliverable: `node tools/build.mjs` → green build, site browsable offline.

### Session 1 — 3D era core (GTA III, Vice City, San Andreas)
- Full main-story mission lists (III ~53, VC ~38 + assets, SA ~100) with giver, location, reward
- Every named story character + major side characters, with affiliations
- Vehicle sets: category/class/seats, top speed from in-game handling data where known
- Weapons with damage tiers, ammo caps, prices, unlock source
- Cheats: every effect, per platform (PC / PS2 / Xbox / mobile editions)
- Locations hierarchy: city → district → landmark; collectibles (hidden packages, oysters,
  horseshoes, snapshots) with totals and rewards
- Mark every record `verified: true` only when checked against an in-game or documented source

### Session 2 — HD era (IV, TLAD, TBoGT, V, Online)
- IV + episodes: mission chains incl. choice branches, friendship/reward systems
- V: 3 protagonists, heist planning variants, Strangers & Freaks, 100% checklist
- Online: no cheats — model `contact missions`, `heists`, `businesses` as mission `type`
  values so the schema stays uniform
- Vehicles: handling-based top speeds, class taxonomy (sports/super/muscle/…)

### Session 3 — 2D era + handhelds (GTA 1, London 1969, London 1961, GTA 2, Advance, LCS, VCS, Chinatown Wars)
- 2D games: cities as districts, gang respect systems, GTA 2 respect/rep tiers
- LCS/VCS: PSP vs PS2 differences captured as `edition` on cheats and missions
- Chinatown Wars: drug-trade price table as its own collection later
- Advance: limited cheat set flagged `coverage: limited`

### Session 4 — GTA VI
- Official-info-only records, every field stubbed with `verified: false` + `source`
- Coverage banner on the game page; no invented missions/vehicles/weapons

### Session 5 — Cross-game layer
- [x] `/compare/` — record matrix, per-section leaders, shared cities (+ `data/cross/compare.json`)
- [x] `/search/` (client-side over `search-index.json`, works offline)
- [x] `/timeline/` — releases grouped by 2D / 3D / HD universe (+ `data/cross/timeline.json`)
- [x] `/locations/` global index (+ `data/locations.json`) and `/cheats/` global index (+ `data/cheats.json`)
- [x] Link checker, in CI on every push
- [ ] Redirect map and build-to-build data diff report (not yet needed: no URLs have moved)

### Session 6 — Hardening
- HTML validation, a11y pass (contrast, focus, landmarks, table captions)
- Payload budget per page (< 60 KB HTML, < 25 KB CSS)
- CI: GitHub Action running `validate` + `build` + link check on every push
- Data audit: spot-check 10% of records, downgrade `verified` where the source is thin

### Session 7+ — Depth passes (repeat per game)
- Missions: complete the list to 100%, add prerequisites and unlocks
- Vehicles: add handling stats (mass, drive force, gear count) from handling files
- Weapons: per-edition differences (e.g. VC Definitive vs original)
- Images: replace placeholders per `images.json`, one game at a time

## 7. Definition of done (per game)

1. All 7 section files non-empty; `coverage` honest per section.
2. Every record has `id`, `verified`; anything uncertain has `source` or `verified: false`.
3. Section pages render with captions, sortable headers, and JSON links.
4. `/data/games/<slug>.json` validates against the schemas.
5. Every image in `images.json` resolves (placeholder or real).
6. No external network requests at runtime — verified in DevTools.

## 8. Current coverage (auto-updated by build)

See `docs/data/index.json` → `coverage`, or the matrix table on the home page.
Build writes `docs/data/status.json` with per-game, per-section counts and completion flags.

## 9. Progress log

### Done

- Session 0: build engine, schemas, design system, 17 game bundles, CI, GitHub Pages live.
- Session 1-2: full mission chains sourced from published mission tables:
  GTA 1 (100), London 1969 (47), London 1961 (9), GTA III (68), Vice City (61),
  San Andreas (101), Advance (41), LCS (71), VCS (59), GTA IV (90, both endings),
  TLAD (22), TBoGT (26), GTA V (75, all approaches and endings), Chinatown Wars (58).
- Session 3: complete cheat tables for 11 games (per-platform button sequences and
  keyboard/phone codes); TLAD, TBoGT and GTA Online documented as having no cheats.
- Session 4: full vehicle rosters for 15 games (GTA V 298, San Andreas 171, IV 122,
  VC 107, VCS 106, LCS 81, Chinatown Wars 75, GTA 2 68, III 63, GTA 1 60, London 42/41).
- Session 5: full weapon tables for 15 games (San Andreas 90, GTA V 62, VC 59, VCS 42, LCS 40).
- Session 6: mission-giver characters derived from the mission tables (27 added).
- Session 7: cross-game layer — `/timeline/`, `/compare/`, `/cheats/`, `/locations/` with
  JSON twins, plus cheat-data normalisation (removed wiki reference artefacts from effects
  and slugs, unified platform labels, `phone` input type).
- Session 8: real artwork. `tools/fetch-images.mjs` pulls per-game art from GTA Wiki:
  2,460 of 3,807 slots now real (cover 17/17, banner 17/17, mission 626/840,
  vehicle 1,298/1,560, weapon 313/490, portrait 189/221). Tables show thumbnails; every
  image slot keeps a generated placeholder fallback. Credits in `assets/img/CREDITS.md`.
- Validator: 0 errors, 0 warnings. Linkcheck: 1,206 files, 35,767 internal refs, 0 broken.

### Open

- Artwork gaps: maps (17), cheat icons (452), locations (144) and collectibles (49) are
  still generated placeholders — the wiki has no per-record art for those slots. Missions
  214, vehicles 262 and weapons 177 records likewise have no usable wiki image.
- Characters below full cast for every game (main cast plus all mission givers).
- Weapon damage/ammo/price only where a game tabulates it; the fields are optional and
  omitted rather than invented.
- GTA 2 missions are summaries of the three district chains rather than per-mission rows.
- GTA VI stays official-information-only by design.
