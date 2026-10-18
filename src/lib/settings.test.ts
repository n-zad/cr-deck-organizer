import { describe, expect, it } from 'vitest';
import {
  defaultSettings,
  parseSettings,
  reconcileKnownVariants,
  showsImportField,
  withVariantEnabled,
  withVariantsEnabled,
} from './settings.ts';

describe('parseSettings', () => {
  it('defaults import visibility to empty decks', () => {
    expect(defaultSettings().importDeck).toBe('empty');
    expect(defaultSettings().textDeck).toBe('show');
    expect(parseSettings({}).importDeck).toBe('empty');
    expect(parseSettings({}).textDeck).toBe('show');
    expect(parseSettings({ importDeck: 'always' }).importDeck).toBe('empty');
    expect(parseSettings({ textDeck: 'always' }).textDeck).toBe('show');
  });

  it('keeps a known import visibility', () => {
    expect(parseSettings({ importDeck: 'show' }).importDeck).toBe('show');
    expect(parseSettings({ importDeck: 'hide' }).importDeck).toBe('hide');
    expect(parseSettings({ textDeck: 'show' }).textDeck).toBe('show');
    expect(parseSettings({ textDeck: 'empty' }).textDeck).toBe('empty');
    expect(parseSettings({ textDeck: 'hide' }).textDeck).toBe('hide');
  });

  it('hides the home-list copy in game button by default', () => {
    expect(defaultSettings().copyInGameOnTiles).toBe(false);
    expect(parseSettings({}).copyInGameOnTiles).toBe(false);
    expect(parseSettings({ copyInGameOnTiles: 'yes' }).copyInGameOnTiles).toBe(false);
    expect(parseSettings({ copyInGameOnTiles: true }).copyInGameOnTiles).toBe(true);
  });

  it('starts with every evolution and hero owned', () => {
    expect(defaultSettings().trackOwnedVariants).toBe(false);
    expect(defaultSettings().disabledEvolutionIds).toEqual([]);
    expect(parseSettings({}).disabledHeroIds).toEqual([]);
  });

  it('keeps disabled forms when the feature is off and drops invalid ids', () => {
    const parsed = parseSettings({
      trackOwnedVariants: false,
      disabledEvolutionIds: [1, 1, 1.5, '2', 3],
      disabledHeroIds: [4],
    });
    expect(parsed.trackOwnedVariants).toBe(false);
    expect(parsed.disabledEvolutionIds).toEqual([1, 3]);
    expect(parsed.disabledHeroIds).toEqual([4]);
  });
});

describe('variant id lists', () => {
  it('enables or disables one card and a filtered set', () => {
    expect(withVariantEnabled([1, 2], 2, true)).toEqual([1]);
    expect(withVariantEnabled([1], 2, false)).toEqual([1, 2]);
    expect(withVariantsEnabled([1], [2, 3], false)).toEqual([1, 2, 3]);
    expect(withVariantsEnabled([1, 2, 3], [2, 3], true)).toEqual([1]);
  });
});

describe('reconcileKnownVariants', () => {
  const cards = [
    { id: 1, hasEvolution: true, hasHero: false },
    { id: 2, hasEvolution: true, hasHero: true },
    { id: 3, hasEvolution: false, hasHero: true },
  ];

  it('treats new forms as unowned by default and keeps that choice parseable', () => {
    expect(defaultSettings().newVariantsOwned).toBe(false);
    expect(parseSettings({}).knownEvolutionIds).toBeNull();
    expect(parseSettings({ knownHeroIds: [3, 3] }).knownHeroIds).toEqual([3]);
  });

  it('takes a first snapshot without disabling anything', () => {
    const settings = { ...defaultSettings(), trackOwnedVariants: true };
    const next = reconcileKnownVariants(settings, cards);
    expect(next.knownEvolutionIds).toEqual([1, 2]);
    expect(next.knownHeroIds).toEqual([2, 3]);
    expect(next.disabledEvolutionIds).toEqual([]);
    expect(next.disabledHeroIds).toEqual([]);
  });

  it('marks forms added later as unowned while tracking is on', () => {
    const settings = {
      ...defaultSettings(),
      trackOwnedVariants: true,
      disabledHeroIds: [3],
      knownEvolutionIds: [1],
      knownHeroIds: [3],
    };
    const next = reconcileKnownVariants(settings, cards);
    expect(next.knownEvolutionIds).toEqual([1, 2]);
    expect(next.knownHeroIds).toEqual([3, 2]);
    expect(next.disabledEvolutionIds).toEqual([2]);
    expect(next.disabledHeroIds).toEqual([3, 2]);
  });

  it('leaves new forms owned when that is preferred or tracking is off', () => {
    const base = { ...defaultSettings(), knownEvolutionIds: [1], knownHeroIds: [2, 3] };
    const owned = reconcileKnownVariants(
      { ...base, trackOwnedVariants: true, newVariantsOwned: true },
      cards,
    );
    expect(owned.knownEvolutionIds).toEqual([1, 2]);
    expect(owned.disabledEvolutionIds).toEqual([]);
    const untracked = reconcileKnownVariants(base, cards);
    expect(untracked.knownEvolutionIds).toEqual([1, 2]);
    expect(untracked.disabledEvolutionIds).toEqual([]);
  });

  it('returns the same object when nothing is new', () => {
    const settings = { ...defaultSettings(), knownEvolutionIds: [1, 2], knownHeroIds: [2, 3] };
    expect(reconcileKnownVariants(settings, cards)).toBe(settings);
  });
});

describe('showsImportField', () => {
  it('shows the field for every deck, only empty decks, or never', () => {
    expect(showsImportField('show', 3)).toBe(true);
    expect(showsImportField('empty', 0)).toBe(true);
    expect(showsImportField('empty', 1)).toBe(false);
    expect(showsImportField('hide', 0)).toBe(false);
  });
});
