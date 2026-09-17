# Rabbit Hole

A small app that picks **one** curiosity topic per day. Not a curriculum: a pool, a random surface, Explore / Skip / Finished.

<img width="1846" height="912" alt="image" src="https://github.com/user-attachments/assets/a1b26718-5634-4c5e-8a6a-bf2b75affc89" />
> Don't build a curriculum. Build a pool of curiosity.

One git repo, two apps, REST only. The web app never talks to the database.

```
rabbit_hole/
  apps/api    NestJS + SQLite — REST API v1 (closed)
  apps/web    Vite + React — one-page light UI
  docs/       local notes (gitignored)
```

- API contract: [`apps/api/README.md`](apps/api/README.md)
- Frontend: [`apps/web/README.md`](apps/web/README.md)
- Agent notes: [`AGENTS.md`](AGENTS.md)

## Dev

From the repo root:

```bash
npm install
npm run dev:api
npm run dev:web
```

- API: http://localhost:3000/api/v1
- Web: http://localhost:5173

```bash
npm run format
```

SQLite lives at `apps/api/data/rabbit-hole.sqlite` and is gitignored.
