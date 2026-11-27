import library from '@/data/library.json';

export type SectionKey =
  | 'characters'
  | 'missions'
  | 'vehicles'
  | 'weapons'
  | 'cheats'
  | 'locations'
  | 'collectibles';

export type RecordItem = {
  id: string;
  name?: string;
  effect?: string;
  role?: string;
  status?: string;
  affiliations?: string[];
  summary?: string;
  source?: string;
  verified?: boolean;
  type?: string;
  category?: string;
  order?: number;
  giver?: string;
  location?: string;
  playable?: string;
  reward?: string | Record<string, string>;
  total?: number;
  parent?: string | null;
  codes?: { platform: string; code: string; input?: string }[];
  image?: string;
  [key: string]: unknown;
};

export type Game = {
  slug: string;
  order: number;
  title: string;
  shortTitle: string;
  year: number;
  released: string;
  type: string;
  status: string;
  platforms: string[];
  cities: string[];
  setting: string;
  developer: string;
  publisher: string;
  protagonists: string[];
  accent: string;
  notes: string;
  images: { cover?: string; banner?: string; map?: string };
  counts: Partial<Record<SectionKey, number>>;
  coverage: Partial<Record<SectionKey, 'complete' | 'partial' | 'empty'>>;
  sections: Partial<Record<SectionKey, { coverage: string; items: RecordItem[] }>>;
};

type Library = {
  generated: string;
  baseUrl: string;
  title: string;
  tagline: string;
  games: Game[];
};

export const lib = library as unknown as Library;
export const games = lib.games;
export const gamesBySlug: Record<string, Game> = Object.fromEntries(
  games.map((game) => [game.slug, game])
);

export const SECTIONS: {
  key: SectionKey;
  label: string;
  singular: string;
  icon: string;
  blurb: string;
}[] = [
  {
    key: 'characters',
    label: 'Characters',
    singular: 'Character',
    icon: 'people',
    blurb: 'Protagonists, bosses and everyone in between.',
  },
  {
    key: 'missions',
    label: 'Missions',
    singular: 'Mission',
    icon: 'flag',
    blurb: 'Story beats in canonical order.',
  },
  {
    key: 'vehicles',
    label: 'Vehicles',
    singular: 'Vehicle',
    icon: 'car-sport',
    blurb: 'Cars, bikes, aircraft and boats.',
  },
  {
    key: 'weapons',
    label: 'Weapons',
    singular: 'Weapon',
    icon: 'flash',
    blurb: 'Every gun, throwable and melee tool.',
  },
  {
    key: 'cheats',
    label: 'Cheats',
    singular: 'Cheat',
    icon: 'keypad',
    blurb: 'Platform codes, ready to copy.',
  },
  {
    key: 'locations',
    label: 'Locations',
    singular: 'Location',
    icon: 'map',
    blurb: 'Cities, districts and landmarks.',
  },
  {
    key: 'collectibles',
    label: 'Collectibles',
    singular: 'Collectible',
    icon: 'trophy',
    blurb: 'Everything worth hunting down.',
  },
];

export const sectionMeta = Object.fromEntries(SECTIONS.map((s) => [s.key, s])) as Record<
  SectionKey,
  (typeof SECTIONS)[number]
>;

export function isSectionKey(value: string | undefined): value is SectionKey {
  return !!value && SECTIONS.some((section) => section.key === value);
}

export function gameSection(game: Game, section: SectionKey) {
  return game.sections[section];
}

export function sectionItems(game: Game, section: SectionKey): RecordItem[] {
  return game.sections[section]?.items ?? [];
}

export function recordName(item: RecordItem, section: SectionKey) {
  if (section === 'cheats') return item.effect ?? item.name ?? 'Untitled cheat';
  return item.name ?? 'Untitled record';
}

export function recordSubtitle(item: RecordItem, section: SectionKey): string {
  switch (section) {
    case 'characters':
      return [item.role, item.status].filter(Boolean).join('  ·  ');
    case 'missions':
      return [item.type, item.giver].filter(Boolean).join('  ·  ');
    case 'vehicles':
      return [item.category, item.type].filter(Boolean).join('  ·  ');
    case 'weapons':
      return item.type ?? 'Weapon';
    case 'cheats':
      return item.codes?.length ? `${item.codes.length} platforms` : 'Cheat code';
    case 'locations':
      return [item.type, item.parent].filter(Boolean).join('  ·  ') || 'Location';
    case 'collectibles':
      return [item.type, typeof item.total === 'number' ? `${item.total} total` : null]
        .filter(Boolean)
        .join('  ·  ');
    default:
      return '';
  }
}

export type Fact = { label: string; value: string };

export function recordFacts(item: RecordItem, section: SectionKey): Fact[] {
  const facts: Fact[] = [];
  const push = (label: string, value?: string | number | null) => {
    if (value !== undefined && value !== null && `${value}`.trim() !== '') {
      facts.push({ label, value: `${value}` });
    }
  };
  const rewardText = (reward: RecordItem['reward']) => {
    if (!reward) return undefined;
    if (typeof reward === 'string') return reward;
    const entries = Object.entries(reward).filter(([, v]) => v);
    return entries.map(([k, v]) => `${k === 'other' ? '' : `${k}: `}${v}`).join(' · ');
  };

  switch (section) {
    case 'characters':
      push('Role', item.role);
      push('Affiliations', item.affiliations?.join(', '));
      push('Status', item.status);
      break;
    case 'missions':
      push('Type', item.type);
      push('Giver', item.giver);
      push('Location', item.location);
      push('Playable', item.playable);
      push('Reward', rewardText(item.reward));
      break;
    case 'vehicles':
      push('Class', item.category);
      push('Type', item.type);
      break;
    case 'weapons':
      push('Weapon type', item.type);
      break;
    case 'locations':
      push('Type', item.type);
      push('Part of', item.parent);
      break;
    case 'collectibles':
      push('Type', item.type);
      push('How many', item.total);
      push('Reward', rewardText(item.reward));
      break;
    case 'cheats':
      push(
        'Platforms',
        [...new Set(item.codes?.map((c) => c.platform) ?? [])].join(', ')
      );
      break;
  }
  return facts;
}

/** Remote art for record thumbnails and detail heroes. */
export function imageUrl(path?: string): string | undefined {
  if (!path || /\.svg$/i.test(path)) return undefined;
  return `${lib.baseUrl}/${path.replace(/^\/+/, '')}`;
}

export function sectionFacet(item: RecordItem, section: SectionKey): string | undefined {
  switch (section) {
    case 'characters':
      return item.role;
    case 'missions':
      return item.type;
    case 'vehicles':
      return item.category;
    case 'weapons':
      return item.type;
    case 'locations':
      return item.type;
    case 'collectibles':
      return item.type;
    default:
      return undefined;
  }
}

export function facetsFor(game: Game, section: SectionKey): string[] {
  const values = new Set<string>();
  for (const item of sectionItems(game, section)) {
    const value = sectionFacet(item, section);
    if (value) values.add(value);
  }
  return [...values].sort((a, b) => a.localeCompare(b));
}

export function cheatPlatforms(game: Game): string[] {
  const platforms = new Set<string>();
  for (const cheat of sectionItems(game, 'cheats')) {
    for (const code of cheat.codes ?? []) platforms.add(code.platform);
  }
  return [...platforms];
}

export function sortRecords(items: RecordItem[], section: SectionKey): RecordItem[] {
  return [...items].sort((a, b) => {
    if (section === 'missions') {
      return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
    }
    return recordName(a, section).localeCompare(recordName(b, section), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });
}

export const totalRecords = games.reduce(
  (sum, game) =>
    sum + SECTIONS.reduce((count, section) => count + sectionItems(game, section.key).length, 0),
  0
);

export const totalRealImages = 2794;

export type SearchHit = {
  key: string;
  game: Game;
  section: SectionKey;
  item: RecordItem;
  name: string;
  subtitle: string;
  haystack: string;
};

export const searchIndex: SearchHit[] = games.flatMap((game) =>
  SECTIONS.flatMap((section) =>
    sectionItems(game, section.key).map((item) => {
      const name = recordName(item, section.key);
      const subtitle = recordSubtitle(item, section.key);
      return {
        key: `${game.slug}:${section.key}:${item.id}`,
        game,
        section: section.key,
        item,
        name,
        subtitle,
        haystack: [
          name,
          subtitle,
          item.summary,
          item.role,
          item.status,
          item.type,
          item.category,
          item.giver,
          item.location,
          item.effect,
          item.affiliations?.join(' '),
          game.title,
          game.shortTitle,
          game.year,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase(),
      };
    })
  )
);

export function searchRecords(
  query: string,
  options: { section?: SectionKey | 'all'; limit?: number } = {}
): SearchHit[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const limit = options.limit ?? 80;
  const terms = needle.split(/\s+/).filter(Boolean);
  const results: SearchHit[] = [];
  for (const hit of searchIndex) {
    if (options.section && options.section !== 'all' && hit.section !== options.section) continue;
    let score = 0;
    if (hit.name.toLowerCase().startsWith(needle)) score = 3;
    else if (hit.name.toLowerCase().includes(needle)) score = 2;
    if (score === 0) {
      const matchesAllTerms = terms.every((term) => hit.haystack.includes(term));
      if (!matchesAllTerms) continue;
      score = 1;
    }
    results.push(hit);
    if (results.length >= limit * 3) break;
  }
  return results.sort((a, b) => b.name.toLowerCase().indexOf(needle) - a.name.toLowerCase().indexOf(needle)).slice(0, limit);
}

export type Universe = {
  key: 'originals' | '3d' | 'hd' | 'next';
  label: string;
  short: string;
  range: string;
};

export const UNIVERSES: Universe[] = [
  { key: 'originals', label: 'The Originals', short: 'Originals', range: '1997 — 1999' },
  { key: '3d', label: 'The 3D Era', short: '3D Era', range: '2001 — 2006' },
  { key: 'hd', label: 'The HD Era', short: 'HD Era', range: '2008 — 2013' },
  { key: 'next', label: 'The Next Era', short: 'Next Era', range: '2026 —' },
];

export function universeOf(game: Game): Universe {
  if (game.year < 2000) return UNIVERSES[0];
  if (game.year < 2007) return UNIVERSES[1];
  if (game.year < 2020) return UNIVERSES[2];
  return UNIVERSES[3];
}

export function eraLabel(year: number) {
  return universeOf({ year } as Game).label;
}

export function recordKey(gameSlug: string, section: SectionKey, id: string) {
  return `${gameSlug}:${section}:${id}`;
}

export type FoundRecord = {
  key: string;
  game: Game;
  section: SectionKey;
  item: RecordItem;
  name: string;
  subtitle: string;
};

export function findRecord(key: string): FoundRecord | null {
  const [slug, section, ...rest] = key.split(':');
  const id = rest.join(':');
  const game = gamesBySlug[slug];
  if (!game || !isSectionKey(section)) return null;
  const item = sectionItems(game, section).find((entry) => entry.id === id);
  if (!item) return null;
  return {
    key,
    game,
    section,
    item,
    name: recordName(item, section),
    subtitle: recordSubtitle(item, section),
  };
}

export function sectionCount(game: Game, section: SectionKey) {
  return game.sections[section]?.items.length ?? 0;
}

export const sectionTotals = Object.fromEntries(
  SECTIONS.map((section) => [
    section.key,
    games.reduce((sum, game) => sum + sectionCount(game, section.key), 0),
  ])
) as Record<SectionKey, number>;

export function recordsWithArt(section?: SectionKey) {
  return searchIndex.filter(
    (hit) =>
      (!section || hit.section === section) &&
      !!hit.item.image &&
      !/\.svg$/i.test(hit.item.image)
  );
}

export function featuredGames(): Game[] {
  const order = ['gta-vi', 'gta-v', 'gta-san-andreas', 'gta-vice-city'];
  return order.map((slug) => gamesBySlug[slug]).filter(Boolean);
}
