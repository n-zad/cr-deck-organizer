import { useState } from 'react';
import { Button } from './ui.tsx';

type TextDeckFieldProps = {
  replacesDeck: boolean;
  onApply: (
    value: string,
  ) =>
    | { ok: true; message: string; tone: 'ok' | 'warn'; clear: boolean }
    | { ok: false; error: string };
};

export function TextDeckField({ replacesDeck, onApply }: TextDeckFieldProps) {
  const [value, setValue] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<'ok' | 'warn' | 'error'>('ok');

  return (
    <form
      className="rounded-2xl border border-white/8 bg-navy-800/70 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const result = onApply(value);
        if (!result.ok) {
          setTone('error');
          setMessage(result.error);
          return;
        }
        setTone(result.tone);
        setMessage(result.message);
        if (result.clear) setValue('');
      }}
    >
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <label className="text-sm font-semibold text-cream-200">Match cards from text</label>
        <span className="rounded-full border border-gold-400/40 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-gold-400 uppercase">
          Experimental
        </span>
      </div>
      <p className="mb-2 text-xs text-cream-400">
        Type card names, including short names like ebarbs or log. A singular name such as wall
        breaker still matches. Cards are added while this deck has open slots.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setMessage(null);
          }}
          placeholder="evo gob barrel, hero knight, ice spirit, log"
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-navy-900 px-4 py-2.5 text-sm outline-none placeholder:text-cream-400/50 focus:border-gold-400/50"
        />
        <Button type="submit" variant="gold">
          Match
        </Button>
      </div>
      {message && (
        <p
          className={`mt-2 text-sm ${
            tone === 'ok' ? 'text-emerald-300' : tone === 'warn' ? 'text-amber-300' : 'text-red-300'
          }`}
        >
          {message}
        </p>
      )}
      {replacesDeck && (
        <p className="mt-2 text-sm text-amber-300">
          This deck is full. Matching will replace it with the cards from this text.
        </p>
      )}
    </form>
  );
}
