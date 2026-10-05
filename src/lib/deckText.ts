import { catalog, getCard } from './catalog.ts';
import {
  EVO_SLOT,
  HERO_SLOT,
  WILD_SLOT,
  emptyEvolutionSlots,
  emptyHeroSlots,
  emptySlots,
  filledCardIds,
} from './deck.ts';
import { DECK_SIZE, err, ok, type Deck, type Result } from './types.ts';

export type ParsedTextCard = {
  cardId: number;
  evolution: boolean;
  hero: boolean;
};

export type ParsedDeckText = {
  cards: ParsedTextCard[];
  warning: string | null;
};

export type PlacedTextCards = {
  cardIds: Array<number | null>;
  evolutionSlots: boolean[];
  heroSlots: boolean[];
  warning: string | null;
  placed: number;
};

const CONFLICT = -1;
const MAX_WORDS = 4;

const SHORT_WORDS: Readonly<Record<string, readonly string[]>> = {
  goblin: ['gob'],
  goblins: ['gob', 'gobs'],
  barbarian: ['barb'],
  barbarians: ['barb', 'barbs'],
  skeleton: ['skel', 'skelly'],
  skeletons: ['skel', 'skellies'],
  dragon: ['drag'],
  dragons: ['drag', 'drags'],
  wizard: ['wiz'],
};

/** Names players type that are not a shortened official name. */
const SLANG: Readonly<Record<string, string>> = {
  ebarbs: 'Elite Barbarians',
  ebarb: 'Elite Barbarians',
  'e barbs': 'Elite Barbarians',
  'elite barbs': 'Elite Barbarians',
  barbs: 'Barbarians',
  hog: 'Hog Rider',
  hogs: 'Royal Hogs',
  pigs: 'Royal Hogs',
  'royal pigs': 'Royal Hogs',
  nado: 'Tornado',
  eq: 'Earthquake',
  fb: 'Fireball',
  mk: 'Mega Knight',
  'mini p': 'Mini P.E.K.K.A',
  'mini pekka': 'Mini P.E.K.K.A',
  mp: 'Mini P.E.K.K.A',
  gs: 'Giant Skeleton',
  'giant skelly': 'Giant Skeleton',
  skarmy: 'Skeleton Army',
  'skel army': 'Skeleton Army',
  skellies: 'Skeletons',
  skeles: 'Skeletons',
  doots: 'Skeletons',
  skeleton: 'Skeletons',
  gg: 'Goblin Gang',
  gb: 'Goblin Barrel',
  barrel: 'Goblin Barrel',
  bb: 'Barbarian Barrel',
  'barb barrel': 'Barbarian Barrel',
  idrag: 'Inferno Dragon',
  idragon: 'Inferno Dragon',
  'inferno drag': 'Inferno Dragon',
  edrag: 'Electro Dragon',
  edragon: 'Electro Dragon',
  'e dragon': 'Electro Dragon',
  'electro drag': 'Electro Dragon',
  ewiz: 'Electro Wizard',
  'e wiz': 'Electro Wizard',
  'electro wiz': 'Electro Wizard',
  'ice wiz': 'Ice Wizard',
  iwiz: 'Ice Wizard',
  'baby d': 'Baby Dragon',
  babyd: 'Baby Dragon',
  bdrag: 'Baby Dragon',
  'baby drag': 'Baby Dragon',
  loon: 'Balloon',
  gy: 'Graveyard',
  mm: 'Mega Minion',
  horde: 'Minion Horde',
  '3m': 'Three Musketeers',
  '3musk': 'Three Musketeers',
  'three m': 'Three Musketeers',
  pump: 'Elixir Collector',
  collector: 'Elixir Collector',
  itower: 'Inferno Tower',
  'i tower': 'Inferno Tower',
  it: 'Inferno Tower',
  'x bow': 'X-Bow',
  rg: 'Royal Giant',
  recruits: 'Royal Recruits',
  ghost: 'Royal Ghost',
  delivery: 'Royal Delivery',
  drill: 'Goblin Drill',
  cage: 'Goblin Cage',
  gang: 'Goblin Gang',
  gobs: 'Goblins',
  valk: 'Valkyrie',
  musk: 'Musketeer',
  ig: 'Ice Golem',
  lj: 'Lumberjack',
  lumber: 'Lumberjack',
  dp: 'Dark Prince',
  aq: 'Archer Queen',
  sk: 'Skeleton King',
  lp: 'Little Prince',
  gk: 'Golden Knight',
  fish: 'Fisherman',
  exe: 'Executioner',
  cart: 'Cannon Cart',
  tomb: 'Tombstone',
  stein: 'Goblinstein',
  demo: 'Goblin Demolisher',
  demolisher: 'Goblin Demolisher',
  bush: 'Suspicious Bush',
  'sus bush': 'Suspicious Bush',
  empress: 'Spirit Empress',
  se: 'Spirit Empress',
  zerk: 'Berserker',
  nw: 'Night Witch',
  mw: 'Mother Witch',
  wb: 'Wall Breakers',
  fm: 'Flying Machine',
  ma: 'Magic Archer',
  dg: 'Dart Goblin',
  'dart gob': 'Dart Goblin',
  eg: 'Electro Giant',
  egiant: 'Electro Giant',
  'e giant': 'Electro Giant',
  egolem: 'Elixir Golem',
  'e golem': 'Elixir Golem',
  lh: 'Lava Hound',
  hound: 'Lava Hound',
  lava: 'Lava Hound',
  sb: 'Giant Snowball',
  snowball: 'Giant Snowball',
  fc: 'Firecracker',
  healer: 'Battle Healer',
  'gob machine': 'Goblin Machine',
  'gob giant': 'Goblin Giant',
  'gob hut': 'Goblin Hut',
  'gob cage': 'Goblin Cage',
  'gob drill': 'Goblin Drill',
  'gob curse': 'Goblin Curse',
  curse: 'Goblin Curse',
};

const phraseAlias = new Map<string, number>();
const multisetAlias = new Map<string, number>();

type Atom =
  | { kind: 'mod'; mod: 'evo' | 'hero'; text: string }
  | { kind: 'word'; text: string };

type SpanMatch = {
  start: number;
  end: number;
  cardId: number;
  evolution: boolean;
  hero: boolean;
  words: string[];
};

type Step = {
  unmatched: number;
  cards: number;
  next: number;
  match: SpanMatch | null;
};

buildAliases();

export function parseDeckText(input: string): Result<ParsedDeckText> {
  const atoms = tokenize(input);
  if (atoms.length === 0) return err('Enter card names to match a deck.');

  const spans = literalSpans(atoms);
  const resolved = resolveOverlong(spans);
  const { cards, duplicates } = uniqueCards(resolved);
  const unmatched = unmatchedSpans(atoms, spans);

  if (cards.length === 0) {
    return err(unmatchedSentence(unmatched) ?? 'Could not match any cards in that text.');
  }
  if (cards.length > DECK_SIZE) {
    return err(`That text matches ${cards.length} cards, and a deck holds ${DECK_SIZE}.`);
  }

  const warning = [duplicateSentence(duplicates), unmatchedSentence(unmatched)]
    .filter((part): part is string => part != null)
    .join(' ');

  return ok({
    cards,
    warning: warning || null,
  });
}

/** A full deck is replaced. Any open slot keeps the current cards and receives the new ones. */
export function placeParsedCards(
  deck: Pick<Deck, 'cardIds' | 'evolutionSlots' | 'heroSlots'>,
  incoming: readonly ParsedTextCard[],
  parserWarning: string | null,
): PlacedTextCards {
  const board = emptyBoard();
  const replacing = filledCardIds(deck.cardIds).length >= DECK_SIZE;
  if (!replacing) {
    for (let index = 0; index < DECK_SIZE; index += 1) {
      board.cardIds[index] = deck.cardIds[index] ?? null;
      board.evolutionSlots[index] = deck.evolutionSlots[index] === true;
      board.heroSlots[index] = deck.heroSlots?.[index] === true;
    }
  }

  const present = new Set(board.cardIds.filter((id): id is number => id != null));
  const duplicates: string[] = [];
  const overflow: string[] = [];
  let placed = 0;
  for (const card of incoming) {
    const name = getCard(card.cardId)?.name ?? 'card';
    if (present.has(card.cardId)) {
      duplicates.push(name);
      continue;
    }
    const slot = board.cardIds.findIndex((id) => id == null);
    if (slot === -1) {
      overflow.push(name);
      continue;
    }
    board.cardIds[slot] = card.cardId;
    board.evolutionSlots[slot] = card.evolution;
    board.heroSlots[slot] = card.hero;
    present.add(card.cardId);
    placed += 1;
  }

  if (placed > 0) settleForms(board);

  const warning = [parserWarning, alreadySentence(duplicates), overflowSentence(overflow)]
    .filter((part): part is string => part != null)
    .join(' ');

  return {
    cardIds: board.cardIds,
    evolutionSlots: board.evolutionSlots,
    heroSlots: board.heroSlots,
    warning: warning || null,
    placed,
  };
}

function buildAliases(): void {
  for (const card of catalog.cards) {
    const normalized = normalizeText(card.name);
    const words = contentWords(normalized);
    addPhrase(normalized, card.id);
    const content = words.join(' ');
    if (content !== normalized) addPhrase(content, card.id);
    if (words.length >= 2) claim(multisetAlias, [...words].sort().join(' '), card.id);
    addShortPhrases(words, card.id);
  }

  for (const [alias, name] of Object.entries(SLANG)) {
    const card = catalog.cards.find((item) => item.name === name);
    if (!card) throw new Error(`Slang alias points at an unknown card: ${name}`);
    addPhrase(alias, card.id);
  }
}

function addPhrase(phrase: string, cardId: number): void {
  const normalized = normalizeText(phrase);
  if (!normalized) return;
  claim(phraseAlias, normalized, cardId);
  const compact = normalized.replace(/ /g, '');
  if (compact !== normalized) claim(phraseAlias, compact, cardId);
}

function addShortPhrases(words: string[], cardId: number): void {
  if (words.length < 2) return;
  for (let index = 0; index < words.length; index += 1) {
    const shorts = SHORT_WORDS[words[index] ?? ''];
    if (!shorts) continue;
    for (const short of shorts) {
      const next = [...words];
      next[index] = short;
      addPhrase(next.join(' '), cardId);
    }
  }
}

function claim(map: Map<string, number>, key: string, cardId: number): void {
  const existing = map.get(key);
  if (existing == null) {
    map.set(key, cardId);
    return;
  }
  if (existing !== cardId) map.set(key, CONFLICT);
}

function normalizeText(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/p\.e\.k\.k\.a/g, 'pekka')
    .replace(/x-bow/g, 'xbow')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/ +/g, ' ');
}

function contentWords(normalized: string): string[] {
  return normalized.split(' ').filter((word) => word && word !== 'the');
}

function lookup(words: readonly string[]): number | null {
  if (words.length === 0) return null;
  const exact = lookupExact(words);
  if (exact != null) return exact;

  const flexible = words
    .map((word, index) => (words.length >= 2 || word.length >= 4 ? index : -1))
    .filter((index) => index >= 0);
  if (flexible.length === 0 || flexible.length > MAX_WORDS) return null;

  const hits = new Set<number>();
  const variants = 1 << flexible.length;
  for (let mask = 1; mask < variants; mask += 1) {
    const next = [...words];
    for (let bit = 0; bit < flexible.length; bit += 1) {
      if ((mask & (1 << bit)) === 0) continue;
      const index = flexible[bit];
      if (index == null) continue;
      next[index] = togglePlural(next[index] ?? '');
    }
    const hit = lookupExact(next);
    if (hit != null) hits.add(hit);
  }
  if (hits.size !== 1) return null;
  const [cardId] = hits;
  return cardId ?? null;
}

function lookupExact(words: readonly string[]): number | null {
  const ids = new Set<number>();
  const consider = (id: number | undefined) => {
    if (id == null || id === CONFLICT) return;
    ids.add(id);
  };
  consider(phraseAlias.get(words.join(' ')));
  if (words.length >= 2) consider(multisetAlias.get([...words].sort().join(' ')));
  if (ids.size !== 1) return null;
  const [cardId] = ids;
  return cardId ?? null;
}

function togglePlural(word: string): string {
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return `${word}s`;
}

function tokenize(input: string): Atom[] {
  const normalized = normalizeText(input);
  if (!normalized) return [];
  const atoms: Atom[] = [];
  for (const token of normalized.split(' ')) {
    if (!token || token === 'the') continue;
    if (token === 'evo' || token === 'evolution' || token === 'evolved') {
      atoms.push({ kind: 'mod', mod: 'evo', text: token });
      continue;
    }
    if (token === 'hero') {
      atoms.push({ kind: 'mod', mod: 'hero', text: token });
      continue;
    }
    const glued = splitGlued(token);
    if (glued) {
      atoms.push({ kind: 'mod', mod: glued.mod, text: glued.prefix });
      atoms.push({ kind: 'word', text: glued.rest });
      continue;
    }
    atoms.push({ kind: 'word', text: token });
  }
  return atoms;
}

function splitGlued(token: string): { mod: 'evo' | 'hero'; prefix: string; rest: string } | null {
  const prefixes: Array<{ prefix: string; mod: 'evo' | 'hero' }> = [
    { prefix: 'evolution', mod: 'evo' },
    { prefix: 'evolved', mod: 'evo' },
    { prefix: 'evo', mod: 'evo' },
    { prefix: 'hero', mod: 'hero' },
  ];
  for (const { prefix, mod } of prefixes) {
    if (!token.startsWith(prefix) || token.length <= prefix.length) continue;
    const rest = token.slice(prefix.length);
    if (lookup([rest]) != null) return { mod, prefix, rest };
  }
  return null;
}

function matchesAt(atoms: Atom[], start: number): SpanMatch[] {
  let cursor = start;
  let evolution = false;
  let hero = false;
  while (cursor < atoms.length && atoms[cursor]?.kind === 'mod') {
    const atom = atoms[cursor];
    if (atom?.kind !== 'mod') break;
    if (atom.mod === 'evo') evolution = true;
    else hero = true;
    cursor += 1;
  }
  if (cursor === start && atoms[start]?.kind === 'mod') return [];

  if (evolution && hero) {
    for (let index = cursor - 1; index >= start; index -= 1) {
      const atom = atoms[index];
      if (atom?.kind !== 'mod') continue;
      evolution = atom.mod === 'evo';
      hero = atom.mod === 'hero';
      break;
    }
  }

  const matches: SpanMatch[] = [];
  const words: string[] = [];
  for (let end = cursor; end < atoms.length; end += 1) {
    const atom = atoms[end];
    if (!atom || atom.kind === 'mod') break;
    words.push(atom.text);
    if (words.length > MAX_WORDS) break;
    const cardId = lookup(words);
    if (cardId == null) continue;
    matches.push({
      start,
      end: end + 1,
      cardId,
      evolution,
      hero,
      words: [...words],
    });
  }
  return matches;
}

function literalSpans(atoms: Atom[]): SpanMatch[] {
  const steps: Step[] = Array.from({ length: atoms.length + 1 }, () => ({
    unmatched: 0,
    cards: 0,
    next: atoms.length,
    match: null,
  }));

  for (let index = atoms.length - 1; index >= 0; index -= 1) {
    const skipped = steps[index + 1];
    if (!skipped) continue;
    let best: Step = {
      unmatched: skipped.unmatched + 1,
      cards: skipped.cards,
      next: index + 1,
      match: null,
    };
    for (const match of matchesAt(atoms, index)) {
      const rest = steps[match.end];
      if (!rest) continue;
      const candidate: Step = {
        unmatched: rest.unmatched,
        cards: rest.cards + 1,
        next: match.end,
        match,
      };
      if (prefer(candidate, best)) best = candidate;
    }
    steps[index] = best;
  }

  const spans: SpanMatch[] = [];
  let index = 0;
  while (index < atoms.length) {
    const step = steps[index];
    if (!step || step.next <= index) break;
    if (step.match) spans.push(step.match);
    index = step.next;
  }
  return spans;
}

/** Fewer unmatched words, then more separate cards so a name stays split until a deck would pass 8. */
function prefer(candidate: Step, current: Step): boolean {
  if (candidate.unmatched !== current.unmatched) return candidate.unmatched < current.unmatched;
  return candidate.cards > current.cards;
}

function resolveOverlong(spans: SpanMatch[]): SpanMatch[] {
  if (uniqueCards(spans).cards.length <= DECK_SIZE) return spans;

  const options: SpanMatch[][] = [];
  for (let index = 0; index < spans.length - 1; index += 1) {
    const left = spans[index];
    const right = spans[index + 1];
    if (!left || !right) continue;
    const merged = mergePair(left, right);
    if (!merged) continue;
    const next = [...spans.slice(0, index), merged, ...spans.slice(index + 2)];
    if (uniqueCards(next).cards.length <= DECK_SIZE) options.push(next);
  }
  if (options.length !== 1) return spans;
  return options[0] ?? spans;
}

function mergePair(left: SpanMatch, right: SpanMatch): SpanMatch | null {
  const words = [...left.words, ...right.words];
  if (words.length < 2) return null;
  const cardId = multisetAlias.get([...words].sort().join(' '));
  if (cardId == null || cardId === CONFLICT) return null;
  let evolution = left.evolution || right.evolution;
  let hero = left.hero || right.hero;
  if (evolution && hero) {
    evolution = !(right.hero && !right.evolution);
    hero = right.hero && !right.evolution;
  }
  return {
    start: left.start,
    end: right.end,
    cardId,
    evolution,
    hero,
    words,
  };
}

function uniqueCards(spans: SpanMatch[]): { cards: ParsedTextCard[]; duplicates: string[] } {
  const seen = new Set<number>();
  const cards: ParsedTextCard[] = [];
  const duplicates: string[] = [];
  for (const span of spans) {
    if (seen.has(span.cardId)) {
      duplicates.push(getCard(span.cardId)?.name ?? 'card');
      continue;
    }
    seen.add(span.cardId);
    cards.push({
      cardId: span.cardId,
      evolution: span.evolution,
      hero: span.hero,
    });
  }
  return { cards, duplicates };
}

function unmatchedSpans(atoms: Atom[], spans: SpanMatch[]): string[] {
  const covered = new Set<number>();
  for (const span of spans) {
    for (let index = span.start; index < span.end; index += 1) covered.add(index);
  }
  const pending: string[] = [];
  const result: string[] = [];
  const flush = () => {
    if (pending.length === 0) return;
    result.push(pending.join(' '));
    pending.length = 0;
  };
  for (let index = 0; index < atoms.length; index += 1) {
    if (covered.has(index)) {
      flush();
      continue;
    }
    const atom = atoms[index];
    if (atom) pending.push(atom.text);
  }
  flush();
  return result;
}

function duplicateSentence(names: string[]): string | null {
  if (names.length === 0) return null;
  if (names.length === 1) return `Skipped a duplicate ${names[0]}.`;
  return `Skipped duplicates ${names.join(', ')}.`;
}

function unmatchedSentence(spans: string[]): string | null {
  if (spans.length === 0) return null;
  const quoted = spans.map((span) => `"${span}"`).join(', ');
  return `Could not match: ${quoted}.`;
}

type Board = {
  cardIds: Array<number | null>;
  evolutionSlots: boolean[];
  heroSlots: boolean[];
};

function emptyBoard(): Board {
  return {
    cardIds: emptySlots(),
    evolutionSlots: emptyEvolutionSlots(),
    heroSlots: emptyHeroSlots(),
  };
}

function settleForms(board: Board): void {
  claimSlot(board, EVO_SLOT, 'evo');
  claimSlot(board, HERO_SLOT, 'hero');
  claimWild(board);
  const stranded = strandedForm(board);
  if (stranded !== -1) moveSlot(board, stranded, WILD_SLOT);
}

function claimSlot(board: Board, slot: number, kind: 'evo' | 'hero'): void {
  if (slotHasForm(board, slot, kind)) return;
  const from = firstFlagged(board, kind, slot);
  if (from === -1) return;
  moveSlot(board, from, slot);
}

function claimWild(board: Board): void {
  if (board.cardIds[WILD_SLOT] != null && (board.evolutionSlots[WILD_SLOT] || board.heroSlots[WILD_SLOT])) {
    return;
  }
  const from = board.cardIds.findIndex((id, index) => {
    if (id == null || index <= WILD_SLOT) return false;
    return board.evolutionSlots[index] === true || board.heroSlots[index] === true;
  });
  if (from === -1) return;
  moveSlot(board, from, WILD_SLOT);
}

function strandedForm(board: Board): number {
  if (wildTaken(board)) return -1;
  if (board.heroSlots[EVO_SLOT] && !board.evolutionSlots[EVO_SLOT]) return EVO_SLOT;
  if (board.evolutionSlots[HERO_SLOT] && !board.heroSlots[HERO_SLOT]) return HERO_SLOT;
  return -1;
}

function wildTaken(board: Board): boolean {
  return (
    board.cardIds[WILD_SLOT] != null &&
    (board.evolutionSlots[WILD_SLOT] === true || board.heroSlots[WILD_SLOT] === true)
  );
}

function slotHasForm(board: Board, slot: number, kind: 'evo' | 'hero'): boolean {
  if (board.cardIds[slot] == null) return false;
  return kind === 'evo' ? board.evolutionSlots[slot] === true : board.heroSlots[slot] === true;
}

function firstFlagged(board: Board, kind: 'evo' | 'hero', skip: number): number {
  return board.cardIds.findIndex((id, index) => {
    if (id == null || index === skip) return false;
    if (kind === 'evo') return board.evolutionSlots[index] === true && board.heroSlots[index] !== true;
    return board.heroSlots[index] === true && board.evolutionSlots[index] !== true;
  });
}

function moveSlot(board: Board, from: number, to: number): void {
  if (from === to) return;
  if (board.cardIds[to] != null) {
    [board.cardIds[from], board.cardIds[to]] = [board.cardIds[to], board.cardIds[from]];
    [board.evolutionSlots[from], board.evolutionSlots[to]] = [
      board.evolutionSlots[to] ?? false,
      board.evolutionSlots[from] ?? false,
    ];
    [board.heroSlots[from], board.heroSlots[to]] = [
      board.heroSlots[to] ?? false,
      board.heroSlots[from] ?? false,
    ];
    return;
  }
  board.cardIds[to] = board.cardIds[from] ?? null;
  board.evolutionSlots[to] = board.evolutionSlots[from] ?? false;
  board.heroSlots[to] = board.heroSlots[from] ?? false;
  board.cardIds[from] = null;
  board.evolutionSlots[from] = false;
  board.heroSlots[from] = false;
}

function alreadySentence(names: string[]): string | null {
  if (names.length === 0) return null;
  if (names.length === 1) return `Already in the deck: ${names[0]}.`;
  return `Already in the deck: ${names.join(', ')}.`;
}

function overflowSentence(names: string[]): string | null {
  if (names.length === 0) return null;
  if (names.length === 1) return `No open slot for ${names[0]}.`;
  return `No open slot for ${names.join(', ')}.`;
}
