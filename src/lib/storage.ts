import {
  APP_SCHEMA_VERSION,
  STORAGE_KEY,
  type AppState,
  type Deck,
  type Folder,
} from './types.ts';
import { createDeck, createFolder, normalizeCardSlots, normalizeEvolutionSlots } from './deck.ts';

export function emptyState(): AppState {
  return {
    schemaVersion: APP_SCHEMA_VERSION,
    folders: [],
    decks: [],
  };
}

export function loadState(storage: Storage): AppState {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return emptyState();
  try {
    return parseState(JSON.parse(raw));
  } catch {
    return emptyState();
  }
}

export function saveState(state: AppState, storage: Storage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function parseState(value: unknown): AppState {
  if (!isRecord(value)) return emptyState();
  const folders = Array.isArray(value.folders)
    ? value.folders.map(parseFolder).filter((folder): folder is Folder => folder != null)
    : [];
  const decks = Array.isArray(value.decks)
    ? value.decks.map(parseDeck).filter((deck): deck is Deck => deck != null)
    : [];
  const folderIds = new Set(folders.map((folder) => folder.id));

  return {
    schemaVersion: APP_SCHEMA_VERSION,
    folders: uniqueById(folders),
    decks: uniqueById(decks).map((deck) =>
      deck.folderId && !folderIds.has(deck.folderId) ? { ...deck, folderId: null } : deck,
    ),
  };
}

function parseFolder(value: unknown): Folder | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') {
    return null;
  }
  return createFolder(value.name, {
    id: value.id,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : undefined,
  });
}

function parseDeck(value: unknown): Deck | null {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return null;
  }
  const cardIds = Array.isArray(value.cardIds) ? (value.cardIds as Array<number | null>) : undefined;
  return createDeck({
    id: value.id,
    name: typeof value.name === 'string' ? value.name : undefined,
    cardIds: cardIds ? normalizeCardSlots(cardIds) : undefined,
    evolutionSlots: Array.isArray(value.evolutionSlots)
      ? normalizeEvolutionSlots(value.evolutionSlots as boolean[], cardIds)
      : undefined,
    towerTroopId: typeof value.towerTroopId === 'number' ? value.towerTroopId : null,
    folderId: typeof value.folderId === 'string' ? value.folderId : null,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : undefined,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : undefined,
  });
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}
