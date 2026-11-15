# GTA Hub

A static, machine-first encyclopedia of the **Grand Theft Auto** series: all 17 games,
seven sections each, every record available as HTML **and** portable JSON. No server,
no build service, no external requests — GitHub Pages serves the whole thing for free.

```
17 games · 7 sections · 687 pages · 1,395 tracked images · 0 runtime dependencies
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

Real in-game art belongs to Rockstar Games; it is not redistributed here. Every image slot
currently resolves to an original generated SVG placeholder at the exact target size.
To use real art you own or have rights to, drop a file in the matching folder with the
same basename and rebuild — nothing else changes:

```
assets/img/portrait/gta-iii/claude.jpg
assets/img/mission/gta-v/the-third-way.webp
assets/img/vehicle/gta-san-andreas/infernus.png
```

`docs/data/images.json` lists every expected image, its dimensions, and whether it is
currently `placeholder` or `real`. That file is the worklist.

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
| `/llms.txt` | Plain-text map for LLM crawlers |

Conventions: permanent kebab-case `id`; unknown numbers are `null`, never `0`;
coverage is `complete | partial | limited | official-only | empty`; arrays are sorted
deterministically.

## Status

Session 0 (engine, design, deploy) is complete. Content depth varies per game and is
declared honestly in each bundle's `coverage` flags — see `PLAN.md` for the session
roadmap and the remaining gaps (notably: full mission lists for the larger games, cheat
strings for the handheld/episodic titles, and real artwork).

## License

Code: MIT. Data is an unofficial fan compilation. “Grand Theft Auto”, “GTA”, all game
titles, character names and artwork are trademarks of Rockstar Games / Take-Two
Interactive. This site is not affiliated with or endorsed by them.
