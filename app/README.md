# Orion — Frontend

The web dashboard for the Orion Security Platform: organization setup, role-aware
access, scan management, findings review, network mapping, reporting, and the
"Ask Orion" assistant panel.

## Running it

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`).

For the full platform (API, database, task queue) running alongside it, use
`docker compose up --build -d` from the repository root instead — see the
root `README.md`.

## Project structure

```
src/
  components/   Shared UI (app shell, badges, Ask Orion widget, auth shell, ...)
  data/         Fixture data used in local/demo mode
  pages/        One file per screen
  state/        Session context and role-based permission checks
```
