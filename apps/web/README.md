# Web

Vite + React client for Rabbit Hole. It only talks to the API over REST. There is no router in v1.

```bash
npm run dev:web
```

Opens http://localhost:5173. Default API URL is `http://localhost:3000/api/v1`. Override with `VITE_API_URL` (see `.env.example`).

The API must be running. Contract: [`../api/README.md`](../api/README.md).

```bash
npm run lint -w web    # oxlint
npm run build -w web
```

## What it does

One page (`HomePage`):

- Today's topic centered and sticky for the local calendar day
- About popup from the rabbit + sparkles (first empty-pool visit opens About, then Pool)
- Explore → Wikipedia search in a new tab (`Special:Search`)
- Skip (quiet), Finished (checklist that turns green), Next after finish
- Pool drawer (hidden until Pool; click outside or Escape to close)
- Add titles (one per line); duplicate titles toast at the top of the page (warning, auto-dismiss, X)
- List with Lucide status icons, timestamps only in the list, overflow Edit / Delete
- Counts (total / waiting / skipped / done) and a round Select all; click a row to select (light blue), then bulk delete
- Reset all statuses (does not delete rows)
- Edit and delete also from today's three-dot menu (`PATCH` title, `DELETE` id)

Empty pool copy: add something to get today's topic. `localStorage` key `rabbit-hole-about-seen` remembers About.

## Look

Apple-like light only. Custom CSS in `src/styles/index.css` (no Pico, Daisy, or Tailwind). Lucide icons. Tokens on `:root` (`--blue`, `--green`, `--red`, `--muted`, `--ease`). Motion is short; no celebration bursts.

## Layout

```
src/
  main.tsx
  app/App.tsx              composition root
  pages/HomePage.tsx       the only screen
  components/
    AboutDialog.tsx
    EditTitleDialog.tsx
    OverflowMenu.tsx
    PoolNotice.tsx         duplicate-title toast
    StatusIcon.tsx
  api/client.ts            fetch helper (`apiFetch`)
  api/v1/rabbit-holes.ts   one file per API resource
  lib/format-when.ts
  types/rabbit-hole.ts
  styles/index.css
```

Alias: `@/` → `src/`. Put a piece in `components/` only when it is used more than once (or it is a self-contained widget like the toast).
