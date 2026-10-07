import { catalog, getTowerTroop } from '../lib/catalog.ts';
import { navigate } from '../lib/hashRoute.ts';
import { store, useAppState } from '../useAppState.ts';
import { Button, IconBack } from '../components/ui.tsx';

export function SettingsPage() {
  const state = useAppState();
  const settings = state.settings;
  const defaultTower = getTowerTroop(settings.defaultTowerTroopId);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <IconBack />
          Decks
        </Button>
      </div>

      <header>
        <p className="text-xs font-semibold tracking-[0.22em] text-gold-400 uppercase">
          Preferences
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-cream-50">Settings</h1>
        <p className="mt-2 text-sm leading-6 text-cream-400">
          These options stay in this browser and apply across your decks.
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-navy-800/70 p-4">
        <ToggleRow
          title="Hide deck names"
          description="Show only cards and stats on the home grid."
          checked={settings.hideDeckNames}
          onChange={(hideDeckNames) => store.updateSettings({ hideDeckNames })}
        />
        <ToggleRow
          title="Ignore folders"
          description="Hide the folder sidebar and treat every deck as one list."
          checked={settings.ignoreFolders}
          onChange={(ignoreFolders) => store.updateSettings({ ignoreFolders })}
        />
        <ToggleRow
          title="Delete empty decks"
          description="Automatically remove decks that have no cards when you return home."
          checked={settings.autoDeleteEmptyDecks}
          onChange={(autoDeleteEmptyDecks) => store.updateSettings({ autoDeleteEmptyDecks })}
        />
        <ToggleRow
          title="Copy in-game from the deck list"
          description="Add a 'Copy in-game' button to each deck listed. It is dimmed for incomplete decks."
          checked={settings.copyInGameOnTiles}
          onChange={(copyInGameOnTiles) => store.updateSettings({ copyInGameOnTiles })}
        />
        <label className="flex flex-col gap-2 border-t border-white/8 pt-4">
          <span className="text-sm font-semibold text-cream-50">Import a deck</span>
          <span className="text-xs leading-5 text-cream-400">
            When the share-link field appears in the deck editor. An empty deck has no cards.
          </span>
          <select
            value={settings.importDeck}
            onChange={(event) => {
              const importDeck = event.target.value;
              if (importDeck !== 'show' && importDeck !== 'empty' && importDeck !== 'hide') return;
              store.updateSettings({ importDeck });
            }}
            className="w-full rounded-2xl border border-white/10 bg-navy-900 px-3 py-3 text-sm outline-none focus:border-gold-400/50"
          >
            <option value="show">Show</option>
            <option value="empty">Show on empty deck</option>
            <option value="hide">Hide</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 border-t border-white/8 pt-4">
          <span className="text-sm font-semibold text-cream-50">Match cards from text</span>
          <span className="text-xs leading-5 text-cream-400">
            When the experimental text matcher appears in the deck editor. An empty deck has no
            cards.
          </span>
          <select
            value={settings.textDeck}
            onChange={(event) => {
              const textDeck = event.target.value;
              if (textDeck !== 'show' && textDeck !== 'empty' && textDeck !== 'hide') return;
              store.updateSettings({ textDeck });
            }}
            className="w-full rounded-2xl border border-white/10 bg-navy-900 px-3 py-3 text-sm outline-none focus:border-gold-400/50"
          >
            <option value="show">Show</option>
            <option value="empty">Show on empty deck</option>
            <option value="hide">Hide</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 border-t border-white/8 pt-4">
          <span className="text-sm font-semibold text-cream-50">Default tower troop</span>
          <span className="text-xs leading-5 text-cream-400">
            New decks start with this tower troop
            {defaultTower ? ` (currently ${defaultTower.name})` : ''}.
          </span>
          <select
            value={settings.defaultTowerTroopId ?? ''}
            onChange={(event) =>
              store.updateSettings({
                defaultTowerTroopId: event.target.value ? Number(event.target.value) : null,
              })
            }
            className="w-full rounded-2xl border border-white/10 bg-navy-900 px-3 py-3 text-sm outline-none focus:border-gold-400/50"
          >
            <option value="">None</option>
            {catalog.towerTroops.map((troop) => (
              <option key={troop.id} value={troop.id}>
                {troop.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-4 border-t border-white/8 pt-4">
          <ToggleRow
            title="Owned evolutions and heroes"
            description="Dim variants you do not own, and leave those forms off when you add the card to an Evo, Hero, or Wild slot."
            checked={settings.trackOwnedVariants}
            onChange={(trackOwnedVariants) => store.updateSettings({ trackOwnedVariants })}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-md text-xs leading-5 text-cream-400">
              Choose which evolutions and heroes you own. Disabled forms are still preserved when the option is turned off.
            </p>
            <Button onClick={() => navigate('/settings/variants')}>Choose cards</Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-semibold text-cream-50">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-cream-400">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 accent-gold-400"
      />
    </label>
  );
}
