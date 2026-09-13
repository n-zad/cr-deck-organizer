import { useState } from 'react';
import { Button } from './ui.tsx';

type ShareLinkFieldProps = {
  onApply: (value: string) => string | null;
};

export function ShareLinkField({ onApply }: ShareLinkFieldProps) {
  const [value, setValue] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  return (
    <form
      className="rounded-2xl border border-white/8 bg-navy-800/70 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const error = onApply(value);
        setOk(error == null);
        setMessage(error ?? 'Deck loaded from the share link.');
        if (error == null) setValue('');
      }}
    >
      <label className="mb-2 block text-sm font-semibold text-cream-200">Paste a share link</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setMessage(null);
          }}
          placeholder="https://link.clashroyale.com/en?clashroyale://copyDeck?deck=..."
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-navy-900 px-4 py-2.5 text-sm outline-none placeholder:text-cream-400/50 focus:border-gold-400/50"
        />
        <Button type="submit" variant="gold">
          Apply
        </Button>
      </div>
      {message && (
        <p className={`mt-2 text-sm ${ok ? 'text-emerald-300' : 'text-red-300'}`}>{message}</p>
      )}
    </form>
  );
}
