import { getCard } from '../lib/catalog.ts';
import { averageElixir, formatElixir } from '../lib/deck.ts';
import type { Deck } from '../lib/types.ts';
import { CardPortrait } from './CardPortrait.tsx';

type DeckSlotsProps = {
  deck: Deck;
  selectedSlot: number | null;
  onSelectSlot: (index: number) => void;
  onClearSlot: (index: number) => void;
  onToggleEvolution: (index: number) => void;
};

export function DeckSlots({
  deck,
  selectedSlot,
  onSelectSlot,
  onClearSlot,
  onToggleEvolution,
}: DeckSlotsProps) {
  const cards = deck.cardIds.map((id) => getCard(id));
  const elixir = averageElixir(cards.filter(Boolean));

  return (
    <section className="rounded-2xl border border-white/8 bg-navy-800/70 p-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-cream-200 uppercase">Deck</h2>
          <p className="text-xs text-cream-400">Tap a slot, then a card. Tap again to remove.</p>
        </div>
        <div className="text-sm text-cream-200">
          <span className="font-semibold text-gold-300">{formatElixir(elixir)}</span> avg elixir
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {deck.cardIds.map((id, index) => {
          const card = cards[index];
          return (
            <div key={index} className="flex flex-col items-center gap-1">
              <CardPortrait
                card={card}
                size="md"
                selected={selectedSlot === index}
                evolved={deck.evolutionSlots[index]}
                onClick={() => {
                  if (id != null && selectedSlot === index) {
                    onClearSlot(index);
                    return;
                  }
                  onSelectSlot(index);
                }}
                label={card ? `${card.name}, slot ${index + 1}` : `Empty slot ${index + 1}`}
              />
              {card?.hasEvolution && (
                <button
                  type="button"
                  onClick={() => onToggleEvolution(index)}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                    deck.evolutionSlots[index]
                      ? 'bg-gold-400 text-navy-950'
                      : 'bg-navy-700 text-cream-300 hover:bg-navy-600'
                  }`}
                >
                  Evo
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
