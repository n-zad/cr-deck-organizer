import catalogJson from '../data/cards.json';
import {
  CATALOG_SCHEMA_VERSION,
  CARD_RARITIES,
  CARD_TYPES,
  FALLBACK_TOWER_TROOPS,
  type Catalog,
  type CatalogCard,
  type TowerTroop,
} from './types.ts';

export const catalog: Catalog = Object.freeze(normalizeCatalog(catalogJson));

export const cardsById: ReadonlyMap<number, CatalogCard> = new Map(
  catalog.cards.map((card) => [card.id, card]),
);

export const towerTroopsById: ReadonlyMap<number, TowerTroop> = new Map(
  catalog.towerTroops.map((troop) => [troop.id, troop]),
);

export function getCard(id: number | null | undefined): CatalogCard | undefined {
  if (id == null) return undefined;
  return cardsById.get(id);
}

export function getTowerTroop(id: number | null | undefined): TowerTroop | undefined {
  if (id == null) return undefined;
  return towerTroopsById.get(id);
}

export function cardsFromIds(ids: Array<number | null>): Array<CatalogCard | undefined> {
  return ids.map((id) => getCard(id));
}

export function assetUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL;
  const cleaned = relativePath.replace(/^\//, '');
  return `${base}${cleaned}`;
}

function normalizeCatalog(value: unknown): Catalog {
  if (!isRecord(value) || !Array.isArray(value.cards)) {
    throw new Error('Card catalog is missing or malformed. Run npm run scrape-cards.');
  }

  const cards = value.cards.map(parseCard).filter((card): card is CatalogCard => card != null);
  if (cards.length === 0) {
    throw new Error('Card catalog does not contain any cards. Run npm run scrape-cards.');
  }

  const towerTroops = Array.isArray(value.towerTroops)
    ? value.towerTroops
        .map(parseTowerTroop)
        .filter((troop): troop is TowerTroop => troop != null)
    : [...FALLBACK_TOWER_TROOPS];

  return {
    schemaVersion: CATALOG_SCHEMA_VERSION,
    scrapedAt: typeof value.scrapedAt === 'string' ? value.scrapedAt : '',
    source: {
      officialCardCount:
        isRecord(value.source) && typeof value.source.officialCardCount === 'number'
          ? value.source.officialCardCount
          : cards.length,
      clashStrategicCardCount:
        isRecord(value.source) && typeof value.source.clashStrategicCardCount === 'number'
          ? value.source.clashStrategicCardCount
          : null,
    },
    cards,
    towerTroops: towerTroops.length > 0 ? towerTroops : [...FALLBACK_TOWER_TROOPS],
  };
}

function parseCard(value: unknown): CatalogCard | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'number' ||
    typeof value.name !== 'string' ||
    typeof value.image !== 'string'
  ) {
    return null;
  }
  const rarity = typeof value.rarity === 'string' ? value.rarity : 'common';
  const type = typeof value.type === 'string' ? value.type : 'troop';
  return {
    id: value.id,
    name: value.name,
    elixir: typeof value.elixir === 'number' ? value.elixir : null,
    rarity: isRarity(rarity) ? rarity : 'common',
    type: isType(type) ? type : 'troop',
    hasEvolution: value.hasEvolution === true,
    image: value.image,
  };
}

function parseTowerTroop(value: unknown): TowerTroop | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') {
    return null;
  }
  const rarity = typeof value.rarity === 'string' ? value.rarity : 'common';
  return {
    id: value.id,
    name: value.name,
    rarity: isRarity(rarity) ? rarity : 'common',
  };
}

function isRarity(value: string): value is CatalogCard['rarity'] {
  return (CARD_RARITIES as readonly string[]).includes(value);
}

function isType(value: string): value is CatalogCard['type'] {
  return (CARD_TYPES as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}
