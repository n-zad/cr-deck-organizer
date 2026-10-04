import { describe, expect, it } from 'vitest';
import { defaultSettings, parseSettings, showsImportField } from './settings.ts';

describe('parseSettings', () => {
  it('defaults import visibility to empty decks', () => {
    expect(defaultSettings().importDeck).toBe('empty');
    expect(parseSettings({}).importDeck).toBe('empty');
    expect(parseSettings({ importDeck: 'always' }).importDeck).toBe('empty');
  });

  it('keeps a known import visibility', () => {
    expect(parseSettings({ importDeck: 'show' }).importDeck).toBe('show');
    expect(parseSettings({ importDeck: 'hide' }).importDeck).toBe('hide');
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
