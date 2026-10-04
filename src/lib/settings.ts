import type { ImportDeckVisibility, UserSettings } from './types.ts';

export function defaultSettings(): UserSettings {
  return {
    hideDeckNames: false,
    ignoreFolders: false,
    defaultTowerTroopId: null,
    autoDeleteEmptyDecks: false,
    importDeck: 'empty',
  };
}

export function parseSettings(value: unknown): UserSettings {
  const defaults = defaultSettings();
  if (!isRecord(value)) return defaults;
  return {
    hideDeckNames: value.hideDeckNames === true,
    ignoreFolders: value.ignoreFolders === true,
    defaultTowerTroopId:
      typeof value.defaultTowerTroopId === 'number' && Number.isInteger(value.defaultTowerTroopId)
        ? value.defaultTowerTroopId
        : null,
    autoDeleteEmptyDecks: value.autoDeleteEmptyDecks === true,
    importDeck: parseImportDeck(value.importDeck),
  };
}

export function showsImportField(
  visibility: ImportDeckVisibility,
  filledCardCount: number,
): boolean {
  if (visibility === 'show') return true;
  if (visibility === 'hide') return false;
  return filledCardCount === 0;
}

function parseImportDeck(value: unknown): ImportDeckVisibility {
  if (value === 'show' || value === 'empty' || value === 'hide') return value;
  return 'empty';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}
