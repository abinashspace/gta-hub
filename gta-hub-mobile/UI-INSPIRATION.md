# GTA Hub — UI/UX inspiration board

**What this app is:** a phone-sized reference database — 17 games, 7 sections, ~1,205 records,
plus cross-game views (timeline, compare, cheats, locations). The job is *find a thing fast,
scan it, copy a code, compare across games*. It is not a marketing site or a social network.

That distinction decides which references are useful: look at **databases, companion apps and
in-game menus**, not at landing pages.

---

## 1. North stars

### Backloggd — game profile page
<https://backloggd.com/games/grand-theft-auto-v/>
<https://backloggd.medium.com/announcing-the-backloggd-mobile-app-ee8beed85e77>

The closest thing to "Letterboxd for games", and its mobile app just entered beta (Nov 2026).

- **Steal:** the vertical *game profile* — art → title + year + studio → stat strip →
  related tabs (`DLC / Ports / Editions / Series`) → details block. It reads like a
  dossier, not a list.
- **Apply to GTA Hub:** the related-games taxonomy maps almost 1:1 onto your universe
  relationships — GTA III ↔ Liberty City Stories, Vice City ↔ VCS, GTA V ↔ Online,
  GTA ↔ London 1961/1969. Surface that instead of treating the 17 games as flat peers.
- **Skip:** ratings, reviews, logging, community. You have no accounts and don't need them.

### MapGenie — GTA interactive maps + progress tracker
<https://mapgenie.io/grand-theft-auto>

- **Steal:** the filter rail (category + icon + **count**) and the completion model
  (`14 / 22 found`, per-category ring). It makes a huge checklist feel finite.
- **Apply to GTA Hub:** locations and collectibles. You have district hierarchy and
  totals but only 3/17 real maps — so don't fake a map. Use district → landmark
  accordions with counts, plus a per-game completion meter.
- **Skip:** pin-dropping, notes, multi-profile tracking. Wrong scope for a read-only reference.

### Rockstar's own GTA VI site
<https://www.rockstargames.com/VI>

- **Steal:** full-bleed cinematic art, one huge restrained headline, tiny uppercase
  section labels, editorial nav rows (`> Music`, `> Screenshots`, `> People & Places`).
- **Apply to:** the game-detail hero and the timeline's universe sections. This is the
  strongest *brand* move available to you and it costs one image + 40px of type.

### GTA V / GTA VI pause menu
Search: `GTA V pause menu`, `GTA VI pause menu` (screenshots), Dribbble tag `pause-menu`.

- **Steal:** black translucent panel floating over art, **one** yellow accent, uppercase
  condensed tab row, and a right-hand info card for whatever is selected.
- **Apply to:** the record detail sheet (you already present it as a modal). A record
  should feel like selecting a map blip in-game, not like opening a Wikipedia article.
- This is the cultural reference your users already have in their heads — use it.

### Serebii (Pokédex) mobile app — case study
<https://paulnajarro.com/uxprojects/serebiiappdesign>

- **Steal:** the reference-DB list row: `thumbnail | number | name | 1–2 chips`, instant
  search and filter. That is exactly the shape your vehicles / weapons / characters
  lists need.
- It's the same problem you have: a beloved fan database built for desktop, squeezed
  onto a phone without losing the data.

### Steam mobile (2022 redesign) / PlayStation App
<https://www.engadget.com/valve-releases-redesigned-steam-mobile-app-qr-code-login-052010146.html>

- **Steal:** cover-art library grid, persistent search, compact persistent tab bar.
  Steam's library grid is a good model for the Saga tab — you already have box art for
  all 17 games, so a text-only grid wastes your best asset.
- **Skip:** store, news feed, community, friends.

### TopDecked (MTG) — data-driven collectible reference
<https://sealab.design/blog/bringing-the-magic-to-topdecked-case-study>

- **Steal:** the advanced-filter **sheet** with persisted filters, and stat rows on the
  detail screen. Directly applicable to vehicles (class, seats, top speed) and weapons
  (type, damage tier, price).
- Their win came from cutting fields, not adding them.

### Data tables on mobile
<https://uxmatters.com/mt/archives/2020/07/designing-mobile-tables.php>
<https://coyleandrew.medium.com/design-better-data-tables-4ecc99d23356>

- **Rule:** never render a raw table on a phone. One card per record, 3–4 prioritized
  fields, full detail on tap. Horizontal scroll is a last resort (Compare is the one
  legitimate exception — keep its header sticky).

---

## 2. Screen-by-screen pattern map

| Screen | Pattern to use | Reference |
|---|---|---|
| **Home** | Full-bleed featured-game hero (like `hero-carousel.tsx`), then horizontal rails: Universes (2D/3D/HD), Jump back in, Cheats. | GTA VI site, Steam |
| **Saga (games)** | 2-col cover grid, sticky universe headers, sort by release year, filter chips. | Steam library, Backloggd |
| **Game detail** | Hero art + logo → meta strip (year · city · universe) → coverage/progress → 7 section cards with counts + coverage badges → sticky section tabs. | Backloggd, MapGenie |
| **Section list** | Sticky search, filter chips *with counts*, rows = thumb + name + 2 stats + chevron, sort sheet. | Serebii, MapGenie |
| **Record detail (modal)** | Big art, title, key/value stat grid, summary, `verified` + `source`, actions (copy code / open location), prev-next record. | GTA pause menu, TopDecked |
| **Search** | Full-screen with keyboard up, recents, live grouped results (Games · Characters · Vehicles · Cheats), match highlighting. | Serebii, Steam |
| **Cheats** | Platform chips → monospace code → one-tap copy + haptic + toast, "works on" edition badges. | own pattern; copy is the whole feature |
| **Timeline** | Vertical spine with universe bands, year markers, cover thumbnails. | GTA VI site editorial |
| **Compare** | Sticky header + horizontal matrix (the only table worth keeping). | data-table guidance |
| **Locations** | City → district → landmark accordion with counts, no fake map. | MapGenie (structure only) |

**Honesty as a design feature:** every section already carries
`coverage: complete | partial | limited | official-only | empty`. Surface it as a badge
on section cards and an explanatory line in empty states. Almost no fan wiki does this —
it will read as more trustworthy than the competition.

---

## 3. Visual direction

**Keep** (already good in `src/theme/index.tsx` + `src/components/ui.tsx`):
yellow `#FFD23F` on near-black, Russo One display + Chakra Petch body, 16/24 radii,
uppercase micro-labels, `PressableScale` press feedback. It reads as GTA without
cosplaying the logo.

**Add:**
- one full-bleed image on every major screen (you have 2,794 real images — lead with them)
- hairline rules instead of card borders where possible; more negative space around numbers
- tabular numerals for stats and counts
- motion: 180–240 ms, no bounce; hero image parallax; shared-element feel when a row
  opens the record sheet

**Drop:**
- the purple/pink neon + glassmorphism direction in the legacy `src/app/index.tsx` —
  it contradicts the theme and reads as generic 2021 gaming SaaS
- emoji as tab icons (Ionicons is already wired in the tab layout)
- identical text-only tiles for 17 games when cover art exists

---

## 4. Where to keep browsing

Screenshot libraries (real apps, not concepts): **Mobbin** (mobbin.com — filter Gaming),
**Screenlane** (screenlane.com), **Refero** (refero.design). Concept work: Dribbble tags
`game-app`, `cinematic-ui`, `dark-ux`, `pause-menu`; **Godly** (godly.website).

Useful search phrases: *game database app*, *companion app UI*, *Pokédex app redesign*,
*interactive map progress tracker*, *cinematic dark mobile UI*, *pause menu UI*.

---

## 5. Two concrete next moves

1. **Make it visual:** render a 10–12 screen moodboard from these references (screenshots
   + one-line "steal this") into a single local HTML page you can react to.
2. **Build three screens properly** against `src/data/library.json` with the existing
   `ui.tsx` primitives: Saga grid, game detail, section list. That covers ~70% of real
   usage and validates the design system before the rest.

### Cleanup worth doing first

`src/app/index.tsx` is an early mock (fake data, invalid RN style props like
`background` / `backdropFilter`, returns `null`) and `src/app/games/[slug]/[section].tsx`
uses `@react-navigation` hooks + hardcoded sample records. The real data layer is
`src/lib/library.ts` + `src/data/library.json`. `(tabs)/_layout.tsx` also points at
`index`, `games`, `search`, `cheats`, `browse/[section]` and `record/[slug]/[section]/[id]`
screens that don't exist yet. Replacing the mocks is a prerequisite for any of the above.
