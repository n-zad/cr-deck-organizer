import { useMemo, useState } from 'react';
import { CardPortrait } from '../components/CardPortrait.tsx';
import { Button, Chip, IconBack, IconReverse, IconSearch } from '../components/ui.tsx';
import { catalog } from '../lib/catalog.ts';
import { navigate } from '../lib/hashRoute.ts';
import { cardPickerLayout } from '../lib/layout.ts';
import { variantTabOff, withVariantEnabled, withVariantsEnabled } from '../lib/settings.ts';
import { sortCards, type CardSortKey } from '../lib/sort.ts';
import type { CardRarity, CardType, CatalogCard } from '../lib/types.ts';
import { useElementWidth } from '../lib/useElementWidth.ts';
import { store, useAppState } from '../useAppState.ts';

type FormKind = 'evolution' | 'hero';
type TypeFilter = 'all' | Exclude<CardType, 'tower-troop'>;

const TYPES: Array<{ id: TypeFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'troop', label: 'Troops' },
  { id: 'spell', label: 'Spells' },
  { id: 'building', label: 'Buildings' },
];

const RARITIES: Array<{ id: 'all' | Exclude<CardRarity, 'champion'>; label: string }> = [
  { id: 'all', label: 'Any rarity' },
  { id: 'common', label: 'Common' },
  { id: 'rare', label: 'Rare' },
  { id: 'epic', label: 'Epic' },
  { id: 'legendary', label: 'Legendary' },
];

export function VariantsPage() {
  const settings = useAppState().settings;
  const [form, setForm] = useState<FormKind>('evolution');
  const [query, setQuery] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [rarity, setRarity] = useState<'all' | Exclude<CardRarity, 'champion'>>('all');
  const [sortKey, setSortKey] = useState<CardSortKey>('elixir');
  const [sortReverse, setSortReverse] = useState(false);
  const [gridRef, gridWidth] = useElementWidth<HTMLDivElement>();
  const pickerLayout = cardPickerLayout(gridWidth);

  const cards = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = catalog.cards.filter((card) => {
      if (form === 'evolution' && !card.hasEvolution) return false;
      if (form === 'hero' && !card.hasHero) return false;
      if (type !== 'all' && card.type !== type) return false;
      if (rarity !== 'all' && card.rarity !== rarity) return false;
      if (needle && !card.name.toLowerCase().includes(needle)) return false;
      return true;
    });
    return sortCards(filtered, sortKey, sortReverse);
  }, [form, query, rarity, sortKey, sortReverse, type]);

  const disabledIds = form === 'evolution' ? settings.disabledEvolutionIds : settings.disabledHeroIds;

  function setShown(enabled: boolean): void {
    const next = withVariantsEnabled(
      disabledIds,
      cards.map((card) => card.id),
      enabled,
    );
    store.updateSettings(
      form === 'evolution' ? { disabledEvolutionIds: next } : { disabledHeroIds: next },
    );
  }

  function toggleCard(card: CatalogCard): void {
    const owned = !disabledIds.includes(card.id);
    const next = withVariantEnabled(disabledIds, card.id, !owned);
    store.updateSettings(
      form === 'evolution' ? { disabledEvolutionIds: next } : { disabledHeroIds: next },
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/settings')}>
          <IconBack />
          Settings
        </Button>
      </div>

      <header>
        <p className="text-xs font-semibold tracking-[0.22em] text-gold-400 uppercase">Collection</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-cream-50">
          Evolutions and heroes
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-cream-400">
          Every form starts on. Turn off the ones you do not own. A dimmed tab means that form
          stays off when the card is added to an Evo, Hero, or Wild slot. This list is kept if
          you turn the setting off.
        </p>
      </header>

      <section className="rounded-2xl border border-white/8 bg-navy-800/50 p-4">
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

          <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Variant">
            <button
              type="button"
              role="tab"
              aria-selected={form === 'evolution'}
              onClick={() => setForm('evolution')}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                form === 'evolution'
                  ? 'bg-fuchsia-600 text-white shadow-[0_0_16px_rgba(217,70,239,0.35)]'
                  : 'bg-navy-900 text-fuchsia-200 hover:bg-navy-700'
              }`}
            >
              Evolutions
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={form === 'hero'}
              onClick={() => setForm('hero')}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                form === 'hero'
                  ? 'bg-amber-300 text-navy-950 shadow-[0_0_16px_rgba(252,211,77,0.28)]'
                  : 'bg-navy-900 text-amber-200 hover:bg-navy-700'
              }`}
            >
              Heroes
            </button>
          </div>

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
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
            <p className="text-xs leading-5 text-cream-400">
              Enable shown and Disable shown apply to this filtered list.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button disabled={cards.length === 0} onClick={() => setShown(true)}>
                Enable shown
              </Button>
              <Button disabled={cards.length === 0} onClick={() => setShown(false)}>
                Disable shown
              </Button>
            </div>
          </div>
        </div>

        <div
          ref={gridRef}
          className="grid justify-items-center pt-3"
          style={{
            gridTemplateColumns: `repeat(${pickerLayout.columns}, minmax(0, 1fr))`,
            gap: pickerLayout.gapPx,
          }}
        >
          {cards.map((card) => {
            const owned = !disabledIds.includes(card.id);
            return (
              <CardPortrait
                key={card.id}
                card={card}
                size="sm"
                evoOff={variantTabOff(settings, card.id, 'evolution', true)}
                heroOff={variantTabOff(settings, card.id, 'hero', true)}
                pressed={owned}
                onClick={() => toggleCard(card)}
                label={`${card.name}, ${owned ? 'owned' : 'not owned'}`}
              />
            );
          })}
        </div>
        {cards.length === 0 && (
          <p className="py-10 text-center text-sm text-cream-400">No cards match those filters.</p>
        )}
      </section>
    </div>
  );
}
