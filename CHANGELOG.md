# Changelog

## v1.0.6 — 2026-10-09

- Fixed card labels: Goblins now has only a hero form, Electro Giant has its new evolution, and Electro Wizard has its new hero form.
- The card scrape script now gets tower troops from the official API, warns about possible new heroes, and can run through RoyaleAPI's fixed-IP proxy. Clash Strategic data is only a fallback now that its repo is gone.
- Added a GitHub workflow that refreshes the card catalog on the first Wednesday of each month (or on demand) and redeploys when cards change.
- The installed app now checks for new versions and asks before updating, instead of updating silently.

## v1.0.5 — 2026-10-07

- Updated the maskable and Apple touch icons.
- Renamed the installed app to "CR Deck Organizer".
- Added a "Copy in game" button in the deck editor that opens Clash Royale with the deck ready to copy.
- Added a setting (off by default) to show "Copy in game" on each deck in the list. The button is dimmed for incomplete decks.

## v1.0.4 — 2026-10-04

- Added an experimental text matcher in the deck editor to parse card names from the input, including shortened/slang names for cards.

## v1.0.3 — 2026-10-04

- Added a setting to mark which evolutions and heroes you own.

## v1.0.2 — 2026-10-04

- Replaced the generated install icons with the new artwork, including a 32px favicon and a maskable icon.
- Added a setting for the deck editor’s import field: Show, Show on empty deck, or Hide.

## v1.0.1 — 2026-09-27

- Dual-form cards in the wild slot stay on hero form if move from the hero slot
- The selected slot no longer deselects when interacting with card sort/filter options.
- Resized the editor, picker, and home list from available width for a more consistent responsive layout.
- Adjusted Settings, Export backup, and Restore button layout so they appear better on narrow screens.
- Drew the elixir drop above the evo/hero tabs.
- Slot rearranging now works on touch and always shows the card portrait.

## v1.0.0 — 2026-09-27

- Added a settings page for hiding deck names, ignoring folders, choosing a default tower troop, and auto-deleting empty decks.
- Moved folder add, rename, and delete into a dedicated manage page.
- Enforced a 2×4 slot grid in the deck editor.
- Added drag-and-drop rearranging.
- Made the selected-slot highlight easier to tell apart from card glows, and cleared the selection when clicking outside the slots.
- Blocked share link copying when a deck is incomplete or a champion is in an illegal slot.
- Enabled illegal champion placements with a warning that clears once the card is in a legal slot.
- Improved card frames so art is no longer cropped, and restyled rarity glows (common white-blue, rare orange, epic purple, legendary teal, champion gold) plus stronger evo purple and hero/champion gold.
- Added a neon ring in the form color when an evo, hero, or champion is in a legal slot. Illegal champions keep a warning instead of the neon border.
- Replaced the EVO / HERO / CHAMP text tags with small top tabs: a purple gem for evolutions, a gold gem for heroes, or both side by side.
- Added card sorting by elixir, rarity, or name, with a reverse control. Non-alphabetical sorts break ties the way the game does (the other of cost/rarity, then arena unlock order). Added Evo and Hero picker filters.
- Added home-list sorting by last edited, name, or average elixir, with reverse.
- Added the unofficial fan-content notice required by Supercell’s policy.

## v0.1.0 — 2026-09-13

- Shipped the first build of the Clash Royale Deck Organizer as a browser PWA (React, Vite, Tailwind) with hash routing for GitHub Pages.
- Saved decks and folders in local storage, with search, a folder sidebar, and a JSON backup/restore file.
- Added a deck editor for naming a deck, picking eight cards and a tower troop, and pasting or copying a Clash Royale share link.
- Bundled a checked-in card catalog and official portraits, plus a scrape script and GitHub Actions workflow to refresh data and deploy `dist/`.
