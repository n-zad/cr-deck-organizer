# Clash Royale Deck Organizer

A Progressive Web App for saving Clash Royale decks and keeping them organized.

Add a deck by manually selecting cards or pasting a Clash Royale deck share link. Organize decks into folders. Everything lives in the browser and local storage (there is no account or cloud sync). Export a single master backup file whenever you want a copy you can store elsewhere or restore later.

---

## Software stack

The app is a static frontend, built so it can be installed as a PWA and hosted on GitHub Pages.

| Layer | Choice |
| --- | --- |
| Language | TypeScript |
| UI | React |
| Bundler | Vite |
| PWA | `vite-plugin-pwa` (Workbox) |
| Styling | Tailwind CSS |
| Persistence | Browser local storage, plus a JSON master backup |
| Routing | Hash-based routes, so GitHub Pages refreshes work |
| Hosting | GitHub Pages (`dist/` from `npm run build`) |

Card catalog updates are a separate scrape step, not a runtime API call. The official Clash Royale API is IP-locked and cannot be called from the browser, so the PWA ships a checked-in snapshot of card data and images.

## Repository layout

```text
.
├── public/
│   ├── cards/                 # Official card art downloaded by the scrape script
│   └── icons/                 # PWA install icons
├── src/
│   ├── components/
│   ├── data/                  # Processed card catalog (cards.json)
│   ├── lib/                   # Catalog, storage, backup, share-link parse
│   ├── pages/
│   ├── App.tsx
│   └── main.tsx
├── scripts/
│   └── scrape-cards.ts        # Re-fetch cards and images after a game update
├── .github/workflows/         # Test, build, and deploy dist/ to GitHub Pages
├── index.html
├── vite.config.ts
└── package.json
```

User decks and folders stay in the browser. `src/data/` and `public/cards/` are the shared game catalog, refreshed only when the scrape script is run.

## Local development

Needs Node 20+. Copy `.env.example` to `.env` and add a Clash Royale developer token only if you are refreshing the catalog.

```bash
npm install
npm run dev
```

The app is at `http://localhost:5173`. Decks are stored in this browser's local storage.

```bash
npm test               # unit tests (no live API calls)
npm run build          # production bundle in dist/
npm run scrape-cards   # refresh src/data/cards.json and public/cards/
```

`scrape-cards` calls the official API with `CLASH_ROYALE_API_TOKEN` from `.env`, then joins Clash Strategic stats for card type and tower troops. Existing portraits are skipped unless you pass `--force`.

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` runs tests, builds, and publishes `dist/`. In the GitHub repo: **Settings → Pages → Source → GitHub Actions**. The build sets `BASE_PATH` to `/<repo-name>/`, which matches a project site at `https://<user>.github.io/<repo-name>/`.

## Card data and images

Two sources cover what this app needs: official IDs and art for share links, plus elixir/rarity/type for the picker UI.

### Official Clash Royale API (primary)

- Portal: [developer.clashroyale.com](https://developer.clashroyale.com)
- Endpoint: `GET https://api.clashroyale.com/v1/cards`
- Images: each card’s `iconUrls.medium` on Supercell’s CDN, `https://api-assets.clashroyale.com/cards/300/...`

This is the list that updates with the game. It provides the numeric card IDs used in deck share links and the official card portraits.

The typical in-game share link wraps a `copyDeck` deep link:

`https://link.clashroyale.com/en?clashroyale://copyDeck?deck=id1;id2;...&slots=...&tt=...&id=...`

A simpler HTTP form also exists: `https://link.clashroyale.com/deck/en?deck=id1;id2;...`

A developer token is required and is locked to specific IPs, so this is only used by `scripts/scrape-cards.ts`. After a balance patch or new card, run that script: it pulls `/cards`, writes the catalog into `src/data/`, and downloads each portrait into `public/cards/`.

### Clash Strategic stats (enrichment)

- Repo: [github.com/ClashStrategic/stats](https://github.com/ClashStrategic/stats)
- Snapshot: [cdn.jsdelivr.net/gh/ClashStrategic/stats/data/cards.json](https://cdn.jsdelivr.net/gh/ClashStrategic/stats/data/cards.json)

Community-maintained JSON joined to official cards by `id`. Used for elixir cost, rarity, type, and evolution flags that the official `/cards` payload does not always include. No card art here.

---

Clash Royale assets belong to Supercell. This project is an unofficial fan tool and should follow [Supercell’s Fan Content Policy](https://supercell.com/en/fan-content-policy/).
