# Changelog

## v1.0.1 — 2026-09-27

- Dual-form cards in the wild slot stay evo or hero: placing one or dragging it from a generic slot turns evo on, dragging from the hero slot keeps hero, and toggling one selects the other.
- Slot selection survives the card picker, still clears when clicking empty space around the slots, and works on the first click after a drag.
- Sized the editor, picker, and home list from available width. Folders stay above the decks, wide screens get larger home margins, and deck tiles keep a fixed card gap.
- Tightened and right-aligned Settings, Export backup, and Restore so they wrap less on narrow screens.
- Drew the elixir drop above the evo/hero tabs. Slot rearranging now works on touch and shows the portrait from the first drag.

## v1.0.0 — 2026-09-27

- Added a settings page for hiding deck names, ignoring folders, choosing a default tower troop, and auto-deleting empty decks. Name and folder fields in the editor follow those same options.
- Moved folder add, rename, and delete into a dedicated manage page. The home sidebar is now for filtering only. Folders can still be created from the deck editor.
- Enforced a 2×4 slot grid in the editor, added drag-and-drop rearranging, made the selected-slot highlight easier to tell apart from card glows, and cleared the selection when clicking outside the slots.
- Relabeled and moved the share-link field so it reads as a deck import. Made Copy share link more visible, and blocked copying when a deck is incomplete or a champion is in an illegal slot, with a reason shown.
- Inset the chevrons on folder and tower troop dropdowns. Reset page scroll to the top when navigating between screens (without jumping the picker when a new deck gets an id).
- Treated slot 0 as evolution, slot 1 as hero, and slot 2 as wild. Allowed illegal evo, hero, and champion placements with a warning that clears once the card is in a legal slot.
- Limited manual evo/hero toggling to dual-form cards in the wild slot. Other slots auto-select the form that fits. Champions stay distinct from heroes, and hero-only cards no longer show a false evolution toggle.
- Improved card frames so art is no longer cropped, and restyled rarity glows (common white-blue, rare orange, epic purple, legendary teal, champion gold) plus stronger evo purple and hero/champion gold.
- Added a neon ring in the form color when an evo, hero, or champion is in a legal slot. Illegal champions keep a warning instead of the neon border. Tuned the side gap separately for the editor and the home list, and tightened horizontal spacing on deck tiles.
- Replaced the EVO / HERO / CHAMP text tags with small top tabs: a purple gem for evolutions, a gold gem for heroes, or both side by side. Seated the tabs on the card edge and sized the pip closer to the in-game champion gem.
- Overlaid a pink elixir drop on cards in the editor, picker, and home list, with slightly different offsets for large slots versus smaller list cards.
- Added card sorting by elixir, rarity, or name, with a reverse control. Non-alphabetical sorts break ties the way the game does (the other of cost/rarity, then arena unlock order). Added Evo and Hero picker filters.
- Added home-list sorting by last edited, name, or average elixir, with reverse.
- Added the unofficial fan-content notice required by Supercell’s policy.

## v0.1.0 — 2026-09-13

- Shipped the first build of the Clash Royale Deck Organizer as a browser PWA (React, Vite, Tailwind) with hash routing for GitHub Pages.
- Saved decks and folders in local storage, with search, a folder sidebar, and a JSON backup/restore file. Nothing is uploaded.
- Added a deck editor for naming a deck, picking eight cards and a tower troop, and pasting or copying a Clash Royale share link.
- Bundled a checked-in card catalog and official portraits, plus a scrape script and GitHub Actions workflow to refresh data and deploy `dist/`.
