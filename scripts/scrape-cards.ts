/**
 * Rebuilds the shipped card catalog from the official Clash Royale API,
 * then enriches type / tower-troop data from Clash Strategic stats.
 *
 * Usage: npm run scrape-cards
 * Requires CLASH_ROYALE_API_TOKEN in .env (IP-allowlisted developer token).
 */

import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  CATALOG_SCHEMA_VERSION,
  CARD_RARITIES,
  FALLBACK_TOWER_TROOPS,
  type CardRarity,
  type CardType,
  type Catalog,
  type CatalogCard,
  type TowerTroop,
} from '../src/lib/types.ts';

const OFFICIAL_CARDS_URL = 'https://api.clashroyale.com/v1/cards';
const CLASH_STRATEGIC_URL =
  'https://cdn.jsdelivr.net/gh/ClashStrategic/stats/data/cards.json';
const IMAGE_DIR = path.resolve('public/cards');
const CATALOG_PATH = path.resolve('src/data/cards.json');
const DOWNLOAD_CONCURRENCY = 8;

type OfficialCard = {
  id: number;
  name: string;
  elixirCost?: number;
  rarity?: string;
  maxEvolutionLevel?: number;
  iconUrls?: {
    medium?: string;
  };
};

type OfficialCardsResponse = {
  items?: OfficialCard[];
};

type StrategicCard = {
  id: number;
  name: string;
  type?: string;
  evolution?: boolean;
  elixirCost?: number | null;
  rarity?: string;
};

type StrategicPayload = {
  cards?: StrategicCard[];
  towerCards?: StrategicCard[];
};

function requireToken(): string {
  const token = process.env.CLASH_ROYALE_API_TOKEN?.trim();
  if (!token) {
    throw new Error(
      'Missing CLASH_ROYALE_API_TOKEN. Copy .env.example to .env and paste your developer token.',
    );
  }
  return token;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`${url} failed with HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

function asRarity(value: string | undefined): CardRarity {
  const normalized = value?.trim().toLowerCase();
  if (normalized && (CARD_RARITIES as readonly string[]).includes(normalized)) {
    return normalized as CardRarity;
  }
  return 'common';
}

function typeFromId(id: number): CardType {
  switch (Math.floor(id / 1_000_000)) {
    case 27:
      return 'building';
    case 28:
      return 'spell';
    case 159:
      return 'tower-troop';
    default:
      return 'troop';
  }
}

function asCardType(value: string | undefined, id: number): CardType {
  switch (value?.trim().toLowerCase()) {
    case 'troop':
    case 'building':
    case 'spell':
    case 'tower-troop':
      return value.trim().toLowerCase() as CardType;
    default:
      return typeFromId(id);
  }
}

async function mapPool<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  async function worker(): Promise<void> {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function downloadImage(url: string, dest: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Image download failed (${response.status}): ${url}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  await writeFile(dest, bytes);
}

function toTowerTroop(card: StrategicCard): TowerTroop {
  return {
    id: card.id,
    name: card.name,
    rarity: asRarity(card.rarity),
  };
}

async function main(): Promise<void> {
  const token = requireToken();
  const forceImages = process.argv.includes('--force');

  console.log('Fetching official Clash Royale cards…');
  const official = await fetchJson<OfficialCardsResponse>(OFFICIAL_CARDS_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  const officialCards = official.items ?? [];
  if (officialCards.length === 0) {
    throw new Error('Official /cards endpoint returned no items');
  }

  let strategicCards: StrategicCard[] = [];
  let strategicTowers: StrategicCard[] = [];
  try {
    console.log('Fetching Clash Strategic enrichment…');
    const strategic = await fetchJson<StrategicPayload>(CLASH_STRATEGIC_URL);
    strategicCards = strategic.cards ?? [];
    strategicTowers = strategic.towerCards ?? [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Clash Strategic lookup failed (${message}). Using ID-derived types.`);
  }

  const strategicById = new Map(strategicCards.map((card) => [card.id, card]));
  await mkdir(IMAGE_DIR, { recursive: true });
  await mkdir(path.dirname(CATALOG_PATH), { recursive: true });

  const missingArt: string[] = [];

  const cards: CatalogCard[] = await mapPool(
    officialCards,
    DOWNLOAD_CONCURRENCY,
    async (card) => {
      const imageName = `${card.id}.png`;
      const imagePath = path.join(IMAGE_DIR, imageName);
      const imageUrl = card.iconUrls?.medium;
      if (imageUrl) {
        try {
          if (forceImages || !(await fileExists(imagePath))) {
            await downloadImage(imageUrl, imagePath);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          missingArt.push(`${card.name}: ${message}`);
        }
      } else {
        missingArt.push(`${card.name}: no medium icon URL`);
      }

      const extra = strategicById.get(card.id);
      return {
        id: card.id,
        name: card.name,
        elixir: typeof card.elixirCost === 'number' ? card.elixirCost : null,
        rarity: asRarity(card.rarity ?? extra?.rarity),
        type: asCardType(extra?.type, card.id),
        hasEvolution: (card.maxEvolutionLevel ?? 0) > 0 || extra?.evolution === true,
        image: `cards/${imageName}`,
      };
    },
  );

  cards.sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);

  const towerTroops =
    strategicTowers.length > 0
      ? strategicTowers.map(toTowerTroop).sort((a, b) => a.id - b.id)
      : [...FALLBACK_TOWER_TROOPS];

  const catalog: Catalog = {
    schemaVersion: CATALOG_SCHEMA_VERSION,
    scrapedAt: new Date().toISOString(),
    source: {
      officialCardCount: officialCards.length,
      clashStrategicCardCount: strategicCards.length > 0 ? strategicCards.length : null,
    },
    cards,
    towerTroops,
  };

  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${cards.length} cards to ${path.relative(process.cwd(), CATALOG_PATH)}`);
  console.log(`Portraits directory: ${path.relative(process.cwd(), IMAGE_DIR)}`);
  console.log(`Tower troops: ${towerTroops.map((troop) => troop.name).join(', ')}`);
  if (missingArt.length > 0) {
    console.warn(`Image issues (${missingArt.length}):`);
    for (const line of missingArt) {
      console.warn(`  - ${line}`);
    }
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
}
