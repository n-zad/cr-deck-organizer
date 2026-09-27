import { describe, expect, it } from 'vitest';
import { catalog, getCard, getTowerTroop, isChampionCard, isHeroCard } from './catalog.ts';

describe('catalog', () => {
  it('ships a full official snapshot', () => {
    expect(catalog.cards.length).toBeGreaterThan(100);
    expect(catalog.source.officialCardCount).toBe(catalog.cards.length);
  });

  it('indexes cards and tower troops by id', () => {
    const knight = getCard(26000000);
    expect(knight?.name).toBe('Knight');
    expect(knight?.type).toBe('troop');
    expect(knight?.elixir).toBe(3);
    expect(knight?.hasEvolution).toBe(true);
    expect(knight?.hasHero).toBe(true);
    expect(isHeroCard(knight!)).toBe(true);
    expect(isChampionCard(knight!)).toBe(false);

    const iceWizard = getCard(26000023);
    expect(iceWizard?.name).toBe('Ice Wizard');
    expect(iceWizard?.hasHero).toBe(true);
    expect(iceWizard?.hasEvolution).toBe(false);

    const queen = getCard(26000072);
    expect(queen?.name).toBe('Archer Queen');
    expect(queen?.hasHero).toBe(false);
    expect(isHeroCard(queen!)).toBe(false);
    expect(isChampionCard(queen!)).toBe(true);

    const inferno = getCard(27000003);
    expect(inferno?.name).toBe('Inferno Tower');
    expect(inferno?.type).toBe('building');

    const barrel = getCard(28000004);
    expect(barrel?.name).toBe('Goblin Barrel');
    expect(barrel?.type).toBe('spell');

    const mirror = getCard(28000006);
    expect(mirror?.name).toBe('Mirror');
    expect(mirror?.elixir).toBeNull();

    expect(getTowerTroop(159000000)?.name).toBe('Tower Princess');
  });
});
