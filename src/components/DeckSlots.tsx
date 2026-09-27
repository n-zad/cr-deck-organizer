import { useRef, useState } from 'react';
import { getCard, isChampionCard } from '../lib/catalog.ts';
import {
  averageElixir,
  canToggleForms,
  cardFrame,
  formatElixir,
  isLegalFormSlot,
  slotLabel,
} from '../lib/deck.ts';
import type { Deck } from '../lib/types.ts';
import { CardPortrait } from './CardPortrait.tsx';

type DeckSlotsProps = {
  deck: Deck;
  selectedSlot: number | null;
  onSelectSlot: (index: number) => void;
  onClearSlot: (index: number) => void;
  onToggleEvolution: (index: number) => void;
  onToggleHero: (index: number) => void;
  onSwapSlots: (from: number, to: number) => void;
};

export function DeckSlots({
  deck,
  selectedSlot,
  onSelectSlot,
  onClearSlot,
  onToggleEvolution,
  onToggleHero,
  onSwapSlots,
}: DeckSlotsProps) {
  const cards = deck.cardIds.map((id) => getCard(id));
  const elixir = averageElixir(cards.filter(Boolean));
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const skipClickRef = useRef(false);

  return (
    <section
      data-deck-slots
      className="rounded-2xl border border-white/8 bg-navy-800/70 p-4"
    >
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-cream-200 uppercase">Deck</h2>
          <p className="text-xs text-cream-400">
            Tap a slot, then a card. Drag to rearrange. Tap a selected card to remove.
          </p>
        </div>
        <div className="text-sm text-cream-200">
          <span className="font-semibold text-gold-300">{formatElixir(elixir)}</span> avg elixir
        </div>
      </div>
      <div className="mx-auto grid max-w-[34rem] grid-cols-4 gap-3">
        {deck.cardIds.map((id, index) => {
          const card = cards[index];
          const evolved = deck.evolutionSlots[index] === true;
          const heroForm = deck.heroSlots?.[index] === true;
          const role = slotLabel(index);
          const frame = card ? cardFrame(evolved, heroForm, isChampionCard(card)) : 'none';
          const warning = frame !== 'none' && !isLegalFormSlot(index, frame);
          const neon = frame !== 'none' && !warning;
          const selected = selectedSlot === index;
          return (
            <div
              key={index}
              className={`flex flex-col items-center gap-1 rounded-2xl p-1.5 transition ${
                selected
                  ? 'bg-sky-300/10 ring-2 ring-sky-300 ring-offset-2 ring-offset-navy-800'
                  : dragOver === index
                    ? 'bg-white/5 ring-1 ring-dashed ring-cream-200/60'
                    : ''
              }`}
            >
              <span
                className={`text-[10px] font-semibold tracking-wide uppercase ${
                  role === 'Evo'
                    ? 'text-violet-300'
                    : role === 'Hero'
                      ? 'text-amber-300'
                      : role === 'Wild'
                        ? 'text-sky-300'
                        : 'invisible'
                }`}
              >
                {role ?? 'Slot'}
              </span>
              <CardPortrait
                card={card}
                size="md"
                frame={frame}
                warning={warning}
                neon={neon}
                draggable={id != null}
                onDragStart={(event) => {
                  if (id == null) {
                    event.preventDefault();
                    return;
                  }
                  setDragFrom(index);
                  event.dataTransfer.setData('text/plain', String(index));
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={() => {
                  setDragFrom(null);
                  setDragOver(null);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                  if (dragOver !== index) setDragOver(index);
                }}
                onDragLeave={() => {
                  if (dragOver === index) setDragOver(null);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const raw = event.dataTransfer.getData('text/plain');
                  const from = Number(raw);
                  setDragFrom(null);
                  setDragOver(null);
                  if (!Number.isInteger(from) || from === index) return;
                  skipClickRef.current = true;
                  onSwapSlots(from, index);
                  onSelectSlot(index);
                }}
                onClick={() => {
                  if (skipClickRef.current) {
                    skipClickRef.current = false;
                    return;
                  }
                  if (dragFrom != null) return;
                  if (id != null && selectedSlot === index) {
                    onClearSlot(index);
                    return;
                  }
                  onSelectSlot(index);
                }}
                label={card ? `${card.name}, slot ${index + 1}` : `Empty slot ${index + 1}`}
              />
              <div className="flex min-h-5 flex-wrap justify-center gap-1">
                {card?.hasEvolution && (
                  <FormToggle
                    label="Evo"
                    active={evolved}
                    interactive={canToggleForms(card, index)}
                    activeClass="bg-fuchsia-600 text-white"
                    onClick={() => onToggleEvolution(index)}
                  />
                )}
                {card?.hasHero && (
                  <FormToggle
                    label="Hero"
                    active={heroForm}
                    interactive={canToggleForms(card, index)}
                    activeClass="bg-amber-300 text-navy-950"
                    onClick={() => onToggleHero(index)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FormToggle({
  label,
  active,
  interactive,
  activeClass,
  onClick,
}: {
  label: string;
  active: boolean;
  interactive: boolean;
  activeClass: string;
  onClick: () => void;
}) {
  const className = `rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
    active ? activeClass : 'bg-navy-700 text-cream-300'
  } ${interactive ? 'hover:bg-navy-600' : 'cursor-default'}`;

  if (!interactive) {
    return (
      <span className={className} title={`${label} is set automatically for this slot`}>
        {label}
      </span>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {label}
    </button>
  );
}
