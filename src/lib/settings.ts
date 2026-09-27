import type { UserSettings } from './types.ts';

export function defaultSettings(): UserSettings {
  return {
    hideDeckNames: false,
    ignoreFolders: false,
    defaultTowerTroopId: null,
    autoDeleteEmptyDecks: false,
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
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}
