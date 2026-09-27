import { readFile, writeFile } from 'node:fs/promises';

const ARENA_RANK = [
  'Training Camp',
  'Goblin Stadium',
  'Bone Pit',
  'Barbarian Bowl',
  "P.E.K.K.A.'s Playhouse",
  'Spell Valley',
  "Builder's Workshop",
  'Royal Arena',
  'Frozen Peak',
  'Jungle Arena',
  'Hog Mountain',
  'Electro Valley',
  'Spooky Town',
  "Rascal's Hideout",
  'Serenity Peak',
  "Miner's Mine",
  "Executioner's Kitchen",
  'Royal Crypt',
  'Silent Sanctuary',
];

const wiki = await readFile(
  'C:/Users/nickz/.cursor/projects/c-Users-nickz-Downloads-random-stuff-cr-deck-organizer/agent-tools/cab949ff-6353-4f50-954b-d6c83e88d2eb.txt',
  'utf8',
);
const catalog = JSON.parse(await readFile('src/data/cards.json', 'utf8'));

function norm(name) {
  return name
    .toLowerCase()
    .replace(/[.]/g, '')
    .replace(/['’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

const wikiByName = new Map();
for (const line of wiki.split(/\r?\n/)) {
  if (!line.startsWith('| | ')) continue;
  const cells = line.split('|').map((s) => s.trim()).filter(Boolean);
  if (cells.length < 6) continue;
  const [name, , , , arena, release] = cells;
  if (!name || name === 'Card' || !/^\d{4}-\d{2}-\d{2}$/.test(release)) continue;
  wikiByName.set(norm(name), { name, arena, release });
}

const lines = [
  '// Unlock-arena + release-date order, matching the in-game collection tie-break.',
  '// Generated from Liquipedia card arenas. Missing cards fall back to a late rank + id.',
  'export const ARENA_ORDER_BY_ID: Readonly<Record<number, number>> = {',
];

const missing = [];
for (const card of catalog.cards) {
  const info = wikiByName.get(norm(card.name));
  let rank;
  if (info) {
    const arenaIndex = ARENA_RANK.indexOf(info.arena);
    const arena = arenaIndex === -1 ? 80 : arenaIndex;
    const day = Date.parse(`${info.release}T00:00:00Z`) / 86400000;
    rank = arena * 100000 + day;
  } else {
    missing.push(card.name);
    rank = 90 * 100000 + card.id / 1e6;
  }
  const note = info ? `${info.arena}, ${info.release}` : 'fallback';
  lines.push(`  ${card.id}: ${rank}, // ${card.name} (${note})`);
}
lines.push('};');
lines.push('');
lines.push('export function arenaOrder(cardId: number): number {');
lines.push('  return ARENA_ORDER_BY_ID[cardId] ?? 90 * 100000 + cardId / 1e6;');
lines.push('}');
lines.push('');

await writeFile('src/lib/arenaOrder.ts', lines.join('\n'), 'utf8');
console.log(`wrote ${catalog.cards.length} entries, missing ${JSON.stringify(missing)}`);
