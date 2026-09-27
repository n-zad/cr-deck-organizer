import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getCard, isChampionCard } from '../lib/catalog.ts';
import {
  averageElixir,
  canToggleForms,
  cardFrame,
  formatElixir,
  isLegalFormSlot,
  slotLabel,
} from '../lib/deck.ts';
import { deckSlotLayout, formToggleClass } from '../lib/layout.ts';
import { useElementWidth } from '../lib/useElementWidth.ts';
import type { Deck } from '../lib/types.ts';
import { CardPortrait } from './CardPortrait.tsx';

const DRAG_THRESHOLD_PX = 10;

type DeckSlotsProps = {
  deck: Deck;
  selectedSlot: number | null;
  onSelectSlot: (index: number) => void;
  onClearSlot: (index: number) => void;
  onToggleEvolution: (index: number) => void;
  onToggleHero: (index: number) => void;
  onSwapSlots: (from: number, to: number) => void;
};

type DragGhost = {
  src: string;
  width: number;
  height: number;
  x: number;
  y: number;
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
  const [ghost, setGhost] = useState<DragGhost | null>(null);
  const ignoreClicksUntilRef = useRef(0);
  const pointerDragRef = useRef<{
    from: number;
    pointerId: number;
    startX: number;
    startY: number;
    active: boolean;
    src: string;
    width: number;
    height: number;
  } | null>(null);
  const [areaRef, areaWidth] = useElementWidth<HTMLDivElement>();
  const layout = deckSlotLayout(areaWidth);
  const toggleClass = formToggleClass(layout.cardPx);

  function slotAtPoint(x: number, y: number): number | null {
    const node = document.elementFromPoint(x, y);
    const slot = node?.closest('[data-slot-index]');
    if (!slot) return null;
    const index = Number(slot.getAttribute('data-slot-index'));
    return Number.isInteger(index) ? index : null;
  }

  function endPointerDrag(x: number, y: number): void {
    const session = pointerDragRef.current;
    pointerDragRef.current = null;
    setDragFrom(null);
    setDragOver(null);
    setGhost(null);
    if (!session?.active) return;
    ignoreClicksUntilRef.current = performance.now() + 400;
    const to = slotAtPoint(x, y);
    if (to == null || to === session.from) return;
    onSwapSlots(session.from, to);
    onSelectSlot(to);
  }

  return (
    <section className="rounded-2xl border border-white/8 bg-navy-800/70 p-4">
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
      <div ref={areaRef} className="w-full">
        <div
          className="mx-auto grid grid-cols-4"
          style={{ width: layout.gridWidth, gap: layout.gapPx }}
        >
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
                data-keep-selection
                data-slot-index={index}
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
                  widthPx={layout.cardPx}
                  frame={frame}
                  warning={warning}
                  neon={neon}
                  onPointerDown={
                    id == null
                      ? undefined
                      : (event) => {
                          if (event.button !== 0) return;
                          const img = event.currentTarget.querySelector('img');
                          const box = (img ?? event.currentTarget).getBoundingClientRect();
                          pointerDragRef.current = {
                            from: index,
                            pointerId: event.pointerId,
                            startX: event.clientX,
                            startY: event.clientY,
                            active: false,
                            src: img?.currentSrc || img?.src || '',
                            width: box.width,
                            height: box.height,
                          };
                          try {
                            event.currentTarget.setPointerCapture(event.pointerId);
                          } catch {
                            // Untrusted or already-released pointers still continue the gesture.
                          }
                        }
                  }
                  onPointerMove={(event) => {
                    const session = pointerDragRef.current;
                    if (!session || session.pointerId !== event.pointerId) return;
                    const dx = event.clientX - session.startX;
                    const dy = event.clientY - session.startY;
                    if (
                      !session.active &&
                      dx * dx + dy * dy >= DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX
                    ) {
                      session.active = true;
                      setDragFrom(session.from);
                    }
                    if (!session.active) return;
                    event.preventDefault();
                    setGhost({
                      src: session.src,
                      width: session.width,
                      height: session.height,
                      x: event.clientX,
                      y: event.clientY,
                    });
                    setDragOver(slotAtPoint(event.clientX, event.clientY));
                  }}
                  onPointerUp={(event) => {
                    if (pointerDragRef.current?.pointerId !== event.pointerId) return;
                    endPointerDrag(event.clientX, event.clientY);
                  }}
                  onPointerCancel={() => {
                    pointerDragRef.current = null;
                    setDragFrom(null);
                    setDragOver(null);
                    setGhost(null);
                  }}
                  onClick={() => {
                    if (performance.now() < ignoreClicksUntilRef.current) return;
                    if (dragFrom != null) return;
                    if (id != null && selectedSlot === index) {
                      onClearSlot(index);
                      return;
                    }
                    onSelectSlot(index);
                  }}
                  label={card ? `${card.name}, slot ${index + 1}` : `Empty slot ${index + 1}`}
                />
                <div className="flex min-h-5 flex-nowrap justify-center gap-1">
                  {card?.hasEvolution && (
                    <FormToggle
                      label="Evo"
                      active={evolved}
                      interactive={canToggleForms(card, index)}
                      sizeClass={toggleClass}
                      activeClass="bg-fuchsia-600 text-white"
                      onClick={() => onToggleEvolution(index)}
                    />
                  )}
                  {card?.hasHero && (
                    <FormToggle
                      label="Hero"
                      active={heroForm}
                      interactive={canToggleForms(card, index)}
                      sizeClass={toggleClass}
                      activeClass="bg-amber-300 text-navy-950"
                      onClick={() => onToggleHero(index)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {ghost &&
        createPortal(
          <img
            src={ghost.src}
            alt=""
            className="pointer-events-none fixed z-50 rounded-[13%] opacity-90 shadow-lg"
            style={{
              width: ghost.width,
              height: ghost.height,
              left: ghost.x - ghost.width / 2,
              top: ghost.y - ghost.height / 2,
            }}
          />,
          document.body,
        )}
    </section>
  );
}

function FormToggle({
  label,
  active,
  interactive,
  sizeClass,
  activeClass,
  onClick,
}: {
  label: string;
  active: boolean;
  interactive: boolean;
  sizeClass: string;
  activeClass: string;
  onClick: () => void;
}) {
  const className = `rounded-full font-semibold tracking-wide uppercase ${sizeClass} ${
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
