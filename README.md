# GTA Hub

A static, machine-first encyclopedia of the **Grand Theft Auto** series: all 17 games,
seven sections each, every record available as HTML **and** portable JSON. No server,
no build service, no external requests — GitHub Pages serves the whole thing for free.

```
17 games · 7 sections · 1,205 pages · 3,807 image slots (2,794 real) · 0 runtime dependencies
```

## What's here

| Section | Records today |
|---|---|
| Characters | name, role, affiliations, status, summary, portrait |
| Missions | order, type, giver, location, reward, summary, banner |
| Vehicles | category, class, top speed, seats, price, side shot |
| Weapons | type, damage tier, ammo, price, unlock, icon |
| Cheat codes | effect + code per platform/edition |
| Locations | city / district / landmark hierarchy, photo |
| Collectibles | type, total, reward, item icon |

Every record carries `verified` (boolean) and optional `source`. Every section carries a
`coverage` flag so "partial" never gets mistaken for "complete".

## Current coverage

Records per game and section (— means the game genuinely has none, which is recorded as
`coverage: empty` rather than left blank):

| Game | Characters | Missions | Vehicles | Weapons | Cheats | Locations | Collectibles |
|---|---|---|---|---|---|---|---|
| [Grand Theft Auto 2](../games/gta-2/) | 9 | 4 | 68 | 20 | 33 | 4 | 1 |
| [Grand Theft Auto Advance](../games/gta-advance/) | 7 | 41 | 31 | 18 | 10 | 4 | 2 |
| [Grand Theft Auto: Chinatown Wars](../games/gta-chinatown-wars/) | 10 | 58 | 75 | 33 | 20 | 5 | 2 |
| [Grand Theft Auto III](../games/gta-iii/) | 19 | 68 | 63 | 26 | 23 | 18 | 3 |
| [GTA IV: The Lost and Damned](../games/gta-iv-the-lost-and-damned/) | 12 | 22 | 143 | 24 | — | 6 | 3 |
| [Grand Theft Auto IV](../games/gta-iv/) | 26 | 90 | 122 | 23 | 32 | 12 | 4 |
| [GTA: Liberty City Stories](../games/gta-liberty-city-stories/) | 17 | 71 | 81 | 40 | 43 | 10 | 5 |
| [GTA: London 1961](../games/gta-london-1961/) | 2 | 9 | 41 | 6 | 1 | 1 | — |
| [GTA: London 1969](../games/gta-london-1969/) | 3 | 47 | 42 | 6 | 28 | 4 | — |
| [Grand Theft Auto Online](../games/gta-online/) | 11 | 8 | 8 | 6 | — | 5 | 3 |
| [Grand Theft Auto: San Andreas](../games/gta-san-andreas/) | 24 | 101 | 171 | 90 | 101 | 22 | 6 |
| [GTA: The Ballad of Gay Tony](../games/gta-the-ballad-of-gay-tony/) | 12 | 26 | 144 | 27 | — | 7 | 4 |
| [Grand Theft Auto V](../games/gta-v/) | 24 | 75 | 298 | 62 | 36 | 14 | 6 |
| [Grand Theft Auto VI](../games/gta-vi/) | 2 | — | — | — | — | 2 | — |
| [GTA: Vice City Stories](../games/gta-vice-city-stories/) | 15 | 59 | 106 | 42 | 31 | 10 | 5 |
| [Grand Theft Auto: Vice City](../games/gta-vice-city/) | 24 | 61 | 107 | 59 | 59 | 17 | 4 |
| [Grand Theft Auto](../games/gta/) | 4 | 100 | 60 | 8 | 35 | 3 | 1 |

GTA VI is deliberately official-information-only: Jason, Lucia, Leonida and Vice City, with
no invented missions, vehicles, weapons, cheats or collectibles. Its empty sections carry
`coverage: empty` and a note explaining why.

## Cross-game views

Four pages cut across the per-game structure. Each has a JSON twin:

| Page | What it does | JSON |
|---|---|---|
| `/timeline/` | Every release in order, grouped into 2D, 3D and HD universes | `/data/cross/timeline.json` |
| `/compare/` | Record matrix, section leaders and shared cities | `/data/cross/compare.json` |
| `/cheats/` | All 452 cheat codes, grouped by game, with platform codes | `/data/cheats.json` |
| `/locations/` | All 144 locations, plus a city index | `/data/locations.json` |

## Local development

Requires Node 18+. There is nothing to install.

```bash
node tools/validate.mjs    # schema + data checks
node tools/build.mjs       # content/ + assets/ -> docs/
node tools/linkcheck.mjs   # internal link + asset audit
node tools/serve.mjs       # preview at http://localhost:8080/
```

Or `npm run build && npm run serve`.

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: `main`, folder: **`/docs`**
3. Wait for the first deployment. The site appears at
   `https://<user>.github.io/<repo>/`.

`.nojekyll` is generated into `docs/`, so no Jekyll processing and no underscore-directory
problems. If you rename the repository, update `base_url` in `content/site.json` and rebuild:
all canonical URLs, `sitemap.xml`, `robots.txt` and `llms.txt` are generated from it.
Page links themselves are relative, so the site also works from `file://` or any subpath.

## Repository layout

```
content/site.json          site metadata, base URL, navigation
content/games.json         17-game registry (order, year, cities, accent colour)
content/games/<slug>.json  one bundle per game: all seven sections
assets/css, assets/js      the only front-end code (no frameworks)
assets/img/                drop real images here (see below)
tools/                     zero-dependency Node build, validator, link checker, server
docs/                      BUILD OUTPUT — the GitHub Pages root
```

## Images

**2,794 of 3,807 image slots are real in-game art.** Character portraits, mission screenshots,
location photos, collectible icons, vehicle and weapon renders and box art are fetched from
[GTA Wiki](https://gta.wiki) by `tools/fetch-images.mjs` and stored under
`assets/img/<kind>/<game>/<record-id>.<ext>`. That artwork belongs to Rockstar Games /
Take-Two Interactive and is used here for a personal, non-commercial reference site — see
`assets/img/CREDITS.md`.

Every unfilled slot resolves to a generated SVG placeholder at the exact target size, so the
layout never breaks. `docs/data/images.json` lists every slot with its `kind`, dimensions and
`status` (`real` or `placeholder`) — that file is the worklist.

Two sources are used: **GTA Wiki** (`gta.wiki`, the live home of the GTA Fandom community) for
everything from the 3D era onward, and **Grand Theft Wiki** (`grandtheftwiki.com`) for the
top-down 2D-era vehicle sprites that gta.wiki does not illustrate.

```bash
node tools/fetch-images.mjs                    # all supported kinds
node tools/fetch-images.mjs --kinds=portrait   # just portraits
node tools/fetch-images.mjs --dry --limit=20   # plan only
node tools/fetch-images.mjs --force            # re-download over existing files
```

To add your own art instead, drop a file in the matching folder with the same basename and
rebuild — nothing else changes:

```
assets/img/portrait/gta-iii/claude.jpg
assets/img/mission/gta-v/the-third-way.webp
assets/img/vehicle/gta-san-andreas/infernus.png
```

Current state by kind: cover 17/17, banner 17/17, map 3/17, mission 626/840,
vehicle 1,491/1,560, weapon 313/490, portrait 189/221, location 105/144,
collectible 33/49. The three real maps are the GTA III, Vice City and San Andreas
poster maps from Grand Theft Wiki. Cheat icons and the other 14 maps remain generated
placeholders — no per-record art exists for those slots.

## Machine interface

| Path | Contents |
|---|---|
| `/data/index.json` | Site index, all games, counts, links |
| `/data/games/<slug>.json` | Whole game bundle |
| `/data/games/<slug>/<section>.json` | One section collection |
| `/data/schema/<section>.json` | JSON Schema (draft 2020-12) |
| `/data/search-index.json` | One object per record |
| `/data/images.json` | Image manifest with status |
| `/data/status.json` | Per-game coverage |
| `/data/cheats.json` | Every cheat code flattened across games |
| `/data/locations.json` | Every location flattened across games |
| `/data/cross/timeline.json` | Releases grouped by universe |
| `/data/cross/compare.json` | Record matrix and section leaders |
| `/llms.txt` | Plain-text map for LLM crawlers |

Conventions: permanent kebab-case `id`; unknown numbers are `null`, never `0`;
coverage is `complete | partial | limited | official-only | empty`; arrays are sorted
deterministically.

## Status

All seven sections exist for all 17 games. Mission chains are complete for 15 games (GTA 2
and GTA Online are honest district/job summaries), vehicle and weapon rosters are complete
for the 15 games that have them, and cheat tables cover the 13 games that ship cheats.
Character and location depth still varies per game; every section declares its own
`coverage` so a verified core is never mistaken for a full list.

Remaining gaps: real artwork (all slots are generated placeholders), full casts for every
game, and GTA VI, which stays official-information-only by design. See `PLAN.md`.

## License

Code: MIT. Data is an unofficial fan compilation. “Grand Theft Auto”, “GTA”, all game
titles, character names and artwork are trademarks of Rockstar Games / Take-Two
Interactive. This site is not affiliated with or endorsed by them.
