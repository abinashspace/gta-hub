/**
 * Single source of truth for the seven per-game sections.
 * Consumed by: table renderer, JSON Schema generator, image manifest, validator, search index.
 */

const img = (kind, w, h) => ({ kind, width: w, height: h });

export const SECTIONS = {
  characters: {
    order: 1,
    title: 'Characters',
    singular: 'Character',
    blurb: 'Named characters with role, affiliations and a short summary.',
    image: img('portrait', 512, 512),
    detail: true,
    sort: { key: 'name', dir: 'asc' },
    columns: [
      { key: 'name', label: 'Name', type: 'text', primary: true },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'affiliations', label: 'Affiliations', type: 'list' },
      { key: 'status', label: 'Status', type: 'text' },
    ],
    fields: {
      name: { type: 'string', required: true },
      role: { type: 'string', required: true },
      affiliations: { type: 'array', items: 'string', required: true },
      status: { type: 'string' },
      summary: { type: 'string', required: true },
      first_appearance: { type: 'string' },
      image: { type: ['string', 'null'] },
      verified: { type: 'boolean', required: true },
      source: { type: 'string' },
    },
    detailFields: ['role', 'affiliations', 'status', 'first_appearance'],
  },

  missions: {
    order: 2,
    title: 'Missions',
    singular: 'Mission',
    blurb: 'Story and side missions in order, with giver, location and reward.',
    image: img('mission', 1280, 720),
    detail: true,
    sort: { key: 'order', dir: 'asc' },
    columns: [
      { key: 'order', label: '#', type: 'number' },
      { key: 'name', label: 'Mission', type: 'text', primary: true },
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'giver', label: 'Giver', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'reward.money', label: 'Reward', type: 'money' },
    ],
    fields: {
      order: { type: 'integer', required: true, minimum: 1 },
      name: { type: 'string', required: true },
      type: { type: 'string', required: true, enum: ['Story', 'Side', 'Asset', 'Heist', 'Contact', 'Strangers & Freaks', 'Business', 'Vehicle', 'Random Event'] },
      giver: { type: 'string', required: true },
      location: { type: 'string', required: true },
      reward: {
        type: 'object',
        required: true,
        properties: { money: { type: 'integer' }, other: { type: 'string' } },
      },
      summary: { type: 'string', required: true },
      requirements: { type: 'array', items: 'string' },
      playable: { type: 'string' },
      image: { type: ['string', 'null'] },
      verified: { type: 'boolean', required: true },
      source: { type: 'string' },
    },
    detailFields: ['type', 'giver', 'playable', 'location', 'reward.other'],
  },

  vehicles: {
    order: 3,
    title: 'Vehicles',
    singular: 'Vehicle',
    blurb: 'Cars, bikes, boats, aircraft and special vehicles with class and capacity.',
    image: img('vehicle', 1024, 576),
    detail: false,
    sort: { key: 'name', dir: 'asc' },
    columns: [
      { key: 'name', label: 'Vehicle', type: 'text', primary: true },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'class', label: 'Class', type: 'text' },
      { key: 'top_speed_kph', label: 'Top speed (km/h)', type: 'number' },
      { key: 'seats', label: 'Seats', type: 'number' },
    ],
    fields: {
      name: { type: 'string', required: true },
      category: { type: 'string', required: true },
      class: { type: 'string' },
      top_speed_kph: { type: ['integer', 'null'] },
      top_speed_mph: { type: ['integer', 'null'] },
      seats: { type: ['integer', 'null'] },
      price: { type: ['integer', 'null'] },
      image: { type: ['string', 'null'] },
      verified: { type: 'boolean', required: true },
      source: { type: 'string' },
    },
    detailFields: ['category', 'class', 'top_speed_mph', 'price'],
  },

  weapons: {
    order: 4,
    title: 'Weapons',
    singular: 'Weapon',
    blurb: 'Weapons by type with damage tier, ammo cap, price and unlock source.',
    image: img('weapon', 512, 256),
    detail: false,
    sort: { key: 'name', dir: 'asc' },
    columns: [
      { key: 'name', label: 'Weapon', type: 'text', primary: true },
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'damage_tier', label: 'Damage tier', type: 'text' },
      { key: 'ammo', label: 'Ammo cap', type: 'text' },
      { key: 'price', label: 'Price', type: 'money' },
      { key: 'unlock', label: 'Unlock', type: 'text' },
    ],
    fields: {
      name: { type: 'string', required: true },
      type: { type: 'string', required: true },
      damage_tier: { type: 'string', enum: ['Very low', 'Low', 'Medium', 'High', 'Very high', 'Lethal'], description: 'Omitted when the game does not tabulate damage.' },
      ammo: { type: 'string', description: 'Omitted when the game does not tabulate an ammo cap.' },
      price: { type: ['integer', 'null'] },
      unlock: { type: 'string', description: 'Where or when the weapon becomes available; omitted when unknown.' },
      image: { type: ['string', 'null'] },
      verified: { type: 'boolean', required: true },
      source: { type: 'string' },
    },
    detailFields: ['type', 'damage_tier', 'ammo', 'price', 'unlock'],
  },

  cheats: {
    order: 5,
    title: 'Cheat codes',
    singular: 'Cheat',
    blurb: 'Effects with the code for each platform and edition.',
    image: img('cheat', 128, 128),
    iconOnly: true,
    detail: false,
    sort: { key: 'effect', dir: 'asc' },
    columns: [
      { key: 'effect', label: 'Effect', type: 'text', primary: true },
      { key: 'codes', label: 'Codes', type: 'codes' },
    ],
    fields: {
      effect: { type: 'string', required: true },
      codes: {
        type: 'array',
        required: true,
        minItems: 1,
        items: {
          type: 'object',
          required: ['platform', 'code'],
          properties: {
            platform: { type: 'string', required: true },
            edition: { type: 'string' },
            code: { type: 'string', required: true },
            input: { type: 'string', enum: ['button', 'keyboard', 'phone', 'touch'] },
          },
        },
      },
      icon: { type: ['string', 'null'] },
      verified: { type: 'boolean', required: true },
      source: { type: 'string' },
    },
    detailFields: ['codes'],
  },

  locations: {
    order: 6,
    title: 'Locations',
    singular: 'Location',
    blurb: 'Cities, districts and landmarks, with parent areas.',
    image: img('location', 1280, 720),
    detail: false,
    sort: { key: 'name', dir: 'asc' },
    columns: [
      { key: 'name', label: 'Location', type: 'text', primary: true },
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'parent', label: 'Parent area', type: 'text' },
    ],
    fields: {
      name: { type: 'string', required: true },
      type: { type: 'string', required: true, enum: ['City', 'Borough', 'District', 'Neighbourhood', 'Town', 'Landmark', 'Interior', 'Island', 'Region', 'State'] },
      parent: { type: ['string', 'null'] },
      summary: { type: 'string' },
      image: { type: ['string', 'null'] },
      verified: { type: 'boolean', required: true },
      source: { type: 'string' },
    },
    detailFields: ['type', 'parent'],
  },

  collectibles: {
    order: 7,
    title: 'Collectibles',
    singular: 'Collectible',
    blurb: 'Collectible sets with totals and completion rewards.',
    image: img('collectible', 256, 256),
    detail: false,
    sort: { key: 'name', dir: 'asc' },
    columns: [
      { key: 'name', label: 'Collectible', type: 'text', primary: true },
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'total', label: 'Total', type: 'number' },
      { key: 'reward', label: 'Reward', type: 'text' },
    ],
    fields: {
      name: { type: 'string', required: true },
      type: { type: 'string', required: true },
      total: { type: 'integer', required: true, minimum: 0, description: '0 means unknown or continuous (not a fixed set).' },
      reward: { type: 'string', required: true },
      image: { type: ['string', 'null'] },
      verified: { type: 'boolean', required: true },
      source: { type: 'string' },
    },
    detailFields: ['type', 'total', 'reward'],
  },
};

export const SECTION_KEYS = Object.keys(SECTIONS).sort((a, b) => SECTIONS[a].order - SECTIONS[b].order);

/** JSON Schema (draft 2020-12) for one section's collection. */
export function sectionSchema(key) {
  const s = SECTIONS[key];
  const props = {
    id: { type: 'string', required: true, pattern: '^[a-z0-9-]+$', description: 'Permanent slug, unique within the game.' },
  };
  for (const [name, def] of Object.entries(s.fields)) props[name] = def;
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `https://abinashspace.github.io/gta-hub/data/schema/${key}.json`,
    title: `${s.singular} record`,
    type: 'object',
    additionalProperties: false,
    required: ['id', ...Object.entries(s.fields).filter(([, d]) => d.required).map(([k]) => k)],
    properties: props,
  };
}

/** Field definition for the game-level record. */
export const GAME_FIELDS = {
  slug: { type: 'string', required: true, pattern: '^[a-z0-9-]+$' },
  title: { type: 'string', required: true },
  short_title: { type: 'string', required: true },
  order: { type: 'integer', required: true },
  year: { type: 'integer', required: true },
  released: { type: 'string' },
  type: { type: 'string', required: true, enum: ['Main', 'Expansion', 'Spin-off', 'Online'] },
  status: { type: 'string', required: true, enum: ['released', 'live', 'upcoming'] },
  platforms: { type: 'array', items: 'string', required: true },
  cities: { type: 'array', items: 'string', required: true },
  setting: { type: 'string' },
  developer: { type: 'string' },
  publisher: { type: 'string' },
  protagonists: { type: 'array', items: 'string' },
  cheats: { type: 'string', enum: ['full', 'limited', 'phone', 'none', 'none-yet'] },
  accent: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
  notes: { type: 'string' },
};
