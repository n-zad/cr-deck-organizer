import { describe, expect, it } from 'vitest';
import {
  defaultSettings,
  parseSettings,
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

describe('showsImportField', () => {
  it('shows the field for every deck, only empty decks, or never', () => {
    expect(showsImportField('show', 3)).toBe(true);
    expect(showsImportField('empty', 0)).toBe(true);
    expect(showsImportField('empty', 1)).toBe(false);
    expect(showsImportField('hide', 0)).toBe(false);
  });
});
