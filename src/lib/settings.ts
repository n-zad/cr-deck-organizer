import type { OwnedForms } from './deck.ts';
import type { CatalogCard, ImportDeckVisibility, UserSettings } from './types.ts';

export function defaultSettings(): UserSettings {
  return {
    hideDeckNames: false,
    ignoreFolders: false,
    defaultTowerTroopId: null,
    autoDeleteEmptyDecks: false,
    importDeck: 'empty',
    textDeck: 'show',
    copyInGameOnTiles: false,
    trackOwnedVariants: false,
    disabledEvolutionIds: [],
    disabledHeroIds: [],
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
    textDeck: parseTextDeck(value.textDeck),
    copyInGameOnTiles: value.copyInGameOnTiles === true,
    trackOwnedVariants: value.trackOwnedVariants === true,
    disabledEvolutionIds: parseIdList(value.disabledEvolutionIds),
    disabledHeroIds: parseIdList(value.disabledHeroIds),
  };
}

/** Active only while the owned-variants setting is on. The id lists stay either way. */
export function ownedFormsForSettings(settings: UserSettings): OwnedForms | undefined {
  if (!settings.trackOwnedVariants) return undefined;
  return {
    disabledEvolutionIds: new Set(settings.disabledEvolutionIds),
    disabledHeroIds: new Set(settings.disabledHeroIds),
  };
}

export function variantTabOff(
  settings: UserSettings,
  cardId: number,
  kind: 'evolution' | 'hero',
  preview = false,
): boolean {
  if (!preview && !settings.trackOwnedVariants) return false;
  const ids = kind === 'evolution' ? settings.disabledEvolutionIds : settings.disabledHeroIds;
  return ids.includes(cardId);
}

export function ownedFormActive(
  settings: UserSettings,
  card: Pick<CatalogCard, 'id' | 'hasEvolution' | 'hasHero'> | undefined,
  kind: 'evolution' | 'hero',
  flagged: boolean,
): boolean {
  if (!flagged || !card) return false;
  if (kind === 'evolution' && !card.hasEvolution) return false;
  if (kind === 'hero' && !card.hasHero) return false;
  return !variantTabOff(settings, card.id, kind);
}

export function withVariantEnabled(ids: readonly number[], cardId: number, enabled: boolean): number[] {
  return withVariantsEnabled(ids, [cardId], enabled);
}

export function withVariantsEnabled(
  ids: readonly number[],
  cardIds: readonly number[],
  enabled: boolean,
): number[] {
  const next = new Set(ids);
  for (const id of cardIds) {
    if (enabled) next.delete(id);
    else next.add(id);
  }
  return [...next];
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

function parseTextDeck(value: unknown): ImportDeckVisibility {
  if (value === 'show' || value === 'empty' || value === 'hide') return value;
  return 'show';
}

function parseIdList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const ids: number[] = [];
  const seen = new Set<number>();
  for (const item of value) {
    if (typeof item !== 'number' || !Number.isInteger(item) || seen.has(item)) continue;
    seen.add(item);
    ids.push(item);
  }
  return ids;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}
