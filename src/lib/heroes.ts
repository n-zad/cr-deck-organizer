export const HERO_CARD_NAMES = new Set<string>([
  'Balloon',
  'Barbarian Barrel',
  'Berserker',
  'Bowler',
  'Dark Prince',
  'Electro Wizard',
  'Giant',
  'Goblins',
  'Ice Golem',
  'Ice Wizard',
  'Knight',
  'Magic Archer',
  'Mega Minion',
  'Mini P.E.K.K.A',
  'Musketeer',
  'Tombstone',
  'Valkyrie',
  'Wizard',
]);

export const HERO_EVOLUTION_NAMES = new Set<string>([
  'Knight',
  'Musketeer',
  'Valkyrie',
  'Wizard',
]);

export function isHeroName(name: string): boolean {
  return HERO_CARD_NAMES.has(name);
}

export function heroHasEvolution(name: string): boolean {
  return HERO_EVOLUTION_NAMES.has(name);
}
