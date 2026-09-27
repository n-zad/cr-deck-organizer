import { useMemo, useState } from 'react';
import { catalog } from '../lib/catalog.ts';
import { cardPickerLayout } from '../lib/layout.ts';
import { sortCards, type CardSortKey } from '../lib/sort.ts';
import { useElementWidth } from '../lib/useElementWidth.ts';
import type { CardRarity, CardType, CatalogCard } from '../lib/types.ts';
import { CardPortrait } from './CardPortrait.tsx';
import { Chip, IconReverse, IconSearch } from './ui.tsx';

type TypeFilter = 'all' | CardType | 'evo' | 'hero';

const TYPES: Array<{ id: TypeFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'troop', label: 'Troops' },
  { id: 'spell', label: 'Spells' },
  { id: 'building', label: 'Buildings' },
  { id: 'evo', label: 'Evo' },
  { id: 'hero', label: 'Hero' },
];

const RARITIES: Array<{ id: 'all' | CardRarity; label: string }> = [
  { id: 'all', label: 'Any rarity' },
  { id: 'common', label: 'Common' },
  { id: 'rare', label: 'Rare' },
  { id: 'epic', label: 'Epic' },
  { id: 'legendary', label: 'Legendary' },
  { id: 'champion', label: 'Champion' },
];

type CardPickerProps = {
  selectedIds: Array<number | null>;
  onPick: (card: CatalogCard) => void;
};

export function CardPicker({ selectedIds, onPick }: CardPickerProps) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [rarity, setRarity] = useState<'all' | CardRarity>('all');
  const [elixir, setElixir] = useState<number | 'unknown' | 'all'>('all');
  const [sortKey, setSortKey] = useState<CardSortKey>('elixir');
  const [sortReverse, setSortReverse] = useState(false);
  const [gridRef, gridWidth] = useElementWidth<HTMLDivElement>();
  const pickerLayout = cardPickerLayout(gridWidth);
  const selected = useMemo(
    () => new Set(selectedIds.filter((id): id is number => id != null)),
    [selectedIds],
  );

  const cards = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = catalog.cards.filter((card) => {
      if (type === 'evo' && !card.hasEvolution) return false;
      if (type === 'hero' && !card.hasHero) return false;
      if (type !== 'all' && type !== 'evo' && type !== 'hero' && card.type !== type) return false;
      if (rarity !== 'all' && card.rarity !== rarity) return false;
      if (elixir === 'unknown' && card.elixir != null) return false;
      if (typeof elixir === 'number' && card.elixir !== elixir) return false;
      if (needle && !card.name.toLowerCase().includes(needle)) return false;
      return true;
    });
    return sortCards(filtered, sortKey, sortReverse);
  }, [elixir, query, rarity, sortKey, sortReverse, type]);

  return (
    <section
      data-keep-selection
      className="rounded-2xl border border-white/8 bg-navy-800/50 p-4"
    >
      <div className="mb-4 flex flex-col gap-3">
        <label className="relative block">
          <span className="sr-only">Search cards</span>
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-cream-400">
            <IconSearch />
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search cards"
            className="w-full rounded-full border border-white/10 bg-navy-900 py-2.5 pr-4 pl-10 text-sm outline-none placeholder:text-cream-400/70 focus:border-gold-400/50"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Chip active={sortKey === 'elixir'} onClick={() => setSortKey('elixir')}>
            Elixir
          </Chip>
          <Chip active={sortKey === 'rarity'} onClick={() => setSortKey('rarity')}>
            Rarity
          </Chip>
          <Chip active={sortKey === 'name'} onClick={() => setSortKey('name')}>
            A–Z
          </Chip>
          <Chip
            active={sortReverse}
            title={sortReverse ? 'Show original order' : 'Reverse order'}
            onClick={() => setSortReverse((current) => !current)}
          >
            <IconReverse />
            Reverse
          </Chip>
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((item) => (
            <Chip key={item.id} active={type === item.id} onClick={() => setType(item.id)}>
              {item.label}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {RARITIES.map((item) => (
            <Chip key={item.id} active={rarity === item.id} onClick={() => setRarity(item.id)}>
              {item.label}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip active={elixir === 'all'} onClick={() => setElixir('all')}>
            Any elixir
          </Chip>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((cost) => (
            <Chip key={cost} active={elixir === cost} onClick={() => setElixir(cost)}>
              {cost}
            </Chip>
          ))}
          <Chip active={elixir === 'unknown'} onClick={() => setElixir('unknown')}>
            ?
          </Chip>
        </div>
      </div>
      <div
        ref={gridRef}
        className="grid justify-items-center pt-2"
        style={{
          gridTemplateColumns: `repeat(${pickerLayout.columns}, minmax(0, 1fr))`,
          gap: pickerLayout.gapPx,
        }}
      >
        {cards.map((card) => (
          <CardPortrait
            key={card.id}
            card={card}
            size="sm"
            dimmed={selected.has(card.id)}
            onClick={() => onPick(card)}
            label={card.name}
          />
        ))}
      </div>
      {cards.length === 0 && (
        <p className="py-10 text-center text-sm text-cream-400">No cards match those filters.</p>
      )}
    </section>
  );
}
