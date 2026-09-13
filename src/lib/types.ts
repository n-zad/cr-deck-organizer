export const CATALOG_SCHEMA_VERSION = 1;
export const APP_SCHEMA_VERSION = 1;
export const DECK_SIZE = 8;
export const MAX_EVOLUTIONS = 2;
export const STORAGE_KEY = 'cr-deck-organizer/state';
export const BACKUP_APP_ID = 'cr-deck-organizer';
export const UNTITLED_DECK_NAME = 'Untitled deck';

export const CARD_RARITIES = [
  'common',
  'rare',
  'epic',
  'legendary',
  'champion',
] as const;

export const CARD_TYPES = ['troop', 'building', 'spell', 'tower-troop'] as const;

export type CardRarity = (typeof CARD_RARITIES)[number];
export type CardType = (typeof CARD_TYPES)[number];

export type CatalogCard = {
  id: number;
  name: string;
  elixir: number | null;
  rarity: CardRarity;
  type: CardType;
  hasEvolution: boolean;
  image: string;
};

export type TowerTroop = {
  id: number;
  name: string;
  rarity: CardRarity;
};

export type Catalog = {
  schemaVersion: typeof CATALOG_SCHEMA_VERSION;
  scrapedAt: string;
  source: {
    officialCardCount: number;
    clashStrategicCardCount: number | null;
  };
  cards: CatalogCard[];
  towerTroops: TowerTroop[];
};

export type Folder = {
  id: string;
  name: string;
  createdAt: string;
};

export type Deck = {
  id: string;
  name: string;
  cardIds: Array<number | null>;
  evolutionSlots: boolean[];
  towerTroopId: number | null;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AppState = {
  schemaVersion: typeof APP_SCHEMA_VERSION;
  folders: Folder[];
  decks: Deck[];
};

export type BackupFile = {
  app: typeof BACKUP_APP_ID;
  schemaVersion: typeof APP_SCHEMA_VERSION;
  exportedAt: string;
  folders: Folder[];
  decks: Deck[];
};

export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export const FALLBACK_TOWER_TROOPS: readonly TowerTroop[] = [
  { id: 159000000, name: 'Tower Princess', rarity: 'common' },
  { id: 159000001, name: 'Cannoneer', rarity: 'epic' },
  { id: 159000002, name: 'Dagger Duchess', rarity: 'legendary' },
  { id: 159000004, name: 'Royal Chef', rarity: 'legendary' },
];
