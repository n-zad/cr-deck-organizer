import { DECK_SIZE, err, ok, type Result } from './types.ts';

export type ParsedShareLink = {
  cardIds: number[];
  evolutionSlots: boolean[];
  towerTroopId: number | null;
};

const DECK_ID_PATTERN = /^\d+$/;

export function parseShareLink(input: string): Result<ParsedShareLink> {
  const raw = unwrapPastedText(input);
  if (!raw) {
    return err('Paste a Clash Royale deck link or a list of eight card IDs.');
  }

  const deckValue = findQueryValue(raw, 'deck') ?? (looksLikeIdList(raw) ? raw : null);
  if (!deckValue) {
    return err('Could not find a deck list in that text.');
  }

  const cardIds = splitIds(deckValue);
  if (cardIds.length !== DECK_SIZE) {
    return err(`A deck needs ${DECK_SIZE} cards. Found ${cardIds.length}.`);
  }
  if (cardIds.some((id) => !Number.isInteger(id) || id <= 0)) {
    return err('The deck list contains an invalid card ID.');
  }

  const slotsValue = findQueryValue(raw, 'slots');
  const evolutionSlots = parseEvolutionSlots(slotsValue);
  const towerValue = findQueryValue(raw, 'tt');
  const towerTroopId = parseOptionalId(towerValue);

  return ok({
    cardIds,
    evolutionSlots,
    towerTroopId,
  });
}

export function serializeShareLink(parsed: ParsedShareLink): string {
  const deck = parsed.cardIds.join(';');
  const slots = parsed.evolutionSlots
    .slice(0, DECK_SIZE)
    .map((enabled) => (enabled ? '1' : '0'))
    .join(';');
  const params = [`deck=${deck}`, `slots=${slots}`];
  if (parsed.towerTroopId != null) {
    params.push(`tt=${parsed.towerTroopId}`);
  }
  return `https://link.clashroyale.com/en?clashroyale://copyDeck?${params.join('&')}`;
}

export function serializeSimpleShareLink(cardIds: number[]): string {
  return `https://link.clashroyale.com/deck/en?deck=${cardIds.join(';')}`;
}

function unwrapPastedText(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  try {
    return decodeURIComponent(trimmed.replace(/\+/g, '%20'));
  } catch {
    return trimmed;
  }
}

function looksLikeIdList(value: string): boolean {
  return /^\d+(?:[;\s,]+\d+){7}$/.test(value.trim());
}

function findQueryValue(raw: string, key: string): string | null {
  const pattern = new RegExp(`(?:^|[?&#/])${key}=([^&?#]*)`, 'i');
  const match = raw.match(pattern);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function splitIds(value: string): number[] {
  return value
    .split(/[;\s,]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (DECK_ID_PATTERN.test(part) ? Number(part) : NaN));
}

function parseEvolutionSlots(value: string | null): boolean[] {
  const slots = Array.from({ length: DECK_SIZE }, () => false);
  if (!value) return slots;
  const parts = value.split(/[;\s,]+/);
  for (let i = 0; i < DECK_SIZE; i += 1) {
    slots[i] = parts[i] === '1';
  }
  return slots;
}

function parseOptionalId(value: string | null): number | null {
  if (!value || !DECK_ID_PATTERN.test(value)) return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
