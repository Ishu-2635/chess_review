# Chess Game Review — Frontend

## Setup

```bash
cd frontend
npm install
npm run dev
```

Opens at http://localhost:5173. Your FastAPI backend should be running
separately at http://127.0.0.1:8000 with CORS allowing this origin.

## What's here right now (steps 1-2 of the build plan)

- Vite + React + Tailwind v4 (via `@tailwindcss/vite`, no separate config file needed)
- Zustand store (`src/store/useGameStore.js`) holding the analysis JSON and
  current move index, with `setMove`, `nextMove`, `prevMove`, `goToStart`, `goToEnd`
- Mock data (`src/data/mockAnalysis.js`) shaped exactly like a real
  `POST /analyze` response, so the UI can be built without a live backend call
- `App.jsx` is a temporary smoke test: it loads the mock data and renders a
  clickable move list + prev/next buttons, proving the store's navigation
  actions work end to end

## Not yet built (next steps)

- `api/analyzeGame.js` — real fetch call to `POST /analyze`
- `components/PgnUploader.jsx` — file input replacing the mock data load
- `lib/chessHelpers.js` — chess.js PGN replay to get a FEN per move
- `components/Board.jsx`, `MoveList.jsx`, `EvalBar.jsx`, `StatsPanel.jsx`,
  `NavigationControls.jsx` as their own real components (currently inlined
  in `App.jsx` for the smoke test)
