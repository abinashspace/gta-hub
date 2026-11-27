import type { Game, SearchHit } from '@/lib/library';
import { games, recordsWithArt, sectionItems } from '@/lib/library';

/** Days since the Unix epoch, in local time — the seed for every daily rotation. */
export function dayIndex(date = new Date()) {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(local.getTime() / 86_400_000);
}

/** Small deterministic hash so the same day always produces the same pick. */
export function seeded(seed: number, salt: number) {
  let value = (seed ^ (salt * 0x9e3779b1)) >>> 0;
  value ^= value << 13;
  value >>>= 0;
  value ^= value >> 17;
  value ^= value << 5;
  return value >>> 0;
}

export function pickFrom<T>(items: T[], seed: number): T | null {
  if (!items.length) return null;
  return items[seed % items.length] ?? null;
}

/**
 * A record for "From the archive". Weighted towards records that have real art
 * and are marked verified, so a random draw never lands on a placeholder stub.
 */
export function archivePick(date = new Date()): SearchHit | null {
  const pool = recordsWithArt().filter(
    (hit) => hit.section !== 'cheats' && hit.item.verified !== false
  );
  const seed = seeded(dayIndex(date), 7);
  return pickFrom(pool, seed);
}

export type OnThisDay = {
  kind: 'day' | 'week' | 'month' | 'none';
  games: Game[];
  yearsAgo: number | null;
  /** Only set for kind === 'week' — how long ago the game actually landed. */
  daysAgo: number | null;
  day: string;
  month: string;
};

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function releaseParts(game: Game) {
  const [year, month, day] = (game.released ?? '').split('-').map(Number);
  return { year, month, day };
}

/**
 * Release anniversaries for today. Most days have none, so it walks outward:
 * exact day → within the last week → this month → nothing at all.
 */
export function onThisDay(date = new Date()): OnThisDay {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const today = new Date(date.getFullYear(), month - 1, day).getTime();

  const exact = games
    .filter((game) => {
      const parts = releaseParts(game);
      return parts.month === month && parts.day === day;
    })
    .sort((a, b) => b.year - a.year);

  if (exact.length) {
    return {
      kind: 'day',
      games: exact,
      yearsAgo: date.getFullYear() - exact[0].year,
      daysAgo: 0,
      day: String(day).padStart(2, '0'),
      month: MONTHS[month - 1],
    };
  }

  // A launch inside the last week is a bigger story than a general anniversary.
  const recent = games
    .map((game) => {
      const parts = releaseParts(game);
      const stamp = new Date(date.getFullYear(), parts.month - 1, parts.day).getTime();
      return { game, days: Math.round((today - stamp) / 86_400_000) };
    })
    .filter((entry) => entry.days > 0 && entry.days <= 7)
    .sort((a, b) => a.days - b.days);

  if (recent.length) {
    return {
      kind: 'week',
      games: recent.map((entry) => entry.game),
      yearsAgo: 0,
      daysAgo: recent[0].days,
      day: String(day).padStart(2, '0'),
      month: MONTHS[month - 1],
    };
  }

  const monthly = games
    .filter((game) => {
      const parts = releaseParts(game);
      return parts.month === month && parts.day <= day;
    })
    .sort((a, b) => b.year - a.year);

  return {
    kind: monthly.length ? 'month' : 'none',
    games: monthly,
    yearsAgo: monthly.length ? date.getFullYear() - monthly[0].year : null,
    daysAgo: null,
    day: String(day).padStart(2, '0'),
    month: MONTHS[month - 1],
  };
}

export type Spotlight = {
  game: Game;
  section: 'characters' | 'missions' | 'vehicles' | 'weapons';
  name: string;
  blurb: string;
};

/** One marquee record per day, used on Home and in empty states. */
export function spotlight(date = new Date()): Spotlight | null {
  const seed = seeded(dayIndex(date), 3);
  const order = [seed % 4, (seed + 1) % 4, (seed + 2) % 4, (seed + 3) % 4];
  const sections = ['characters', 'vehicles', 'weapons', 'missions'] as const;

  for (const index of order) {
    const section = sections[index];
    const pool = games.flatMap((game) =>
      sectionItems(game, section)
        .filter((item) => item.image && !/\.svg$/i.test(item.image))
        .map((item) => ({ game, section, item }))
    );
    const hit = pickFrom(pool, seed + index);
    if (hit) {
      return {
        game: hit.game,
        section,
        name: hit.item.name ?? 'Untitled',
        blurb: hit.item.summary ?? hit.item.role ?? hit.item.type ?? '',
      };
    }
  }
  return null;
}
