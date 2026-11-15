# Orion — Frontend

The web dashboard for the Orion Security Platform: account login, target management,
launching and tracking scans, findings review, reports, and the "Ask Orion"
assistant panel. It talks to the real backend API — there is no mock or demo data.

## Running it

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`). By default it
proxies `/api` to `http://localhost:8000`; set `VITE_API_PROXY_TARGET` to point it
somewhere else.

For the full platform (API, database, task queue) running alongside it, use
`docker compose up --build -d` from the repository root instead — see the
root `README.md`.

## Project structure

```
src/
  components/   Shared UI (app shell, badges, Ask Orion widget, auth shell, ...)
  lib/          API client and formatting helpers
  hooks/        Data-fetching hooks (scans, findings)
  pages/        One file per screen
  state/        Auth session context
```
