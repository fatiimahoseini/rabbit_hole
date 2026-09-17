# API v1

REST backend for Rabbit Hole. v1 is **closed**: these endpoints are the contract. Do not add resources, auth, or extra fields unless you are starting v2.

The web UI that consumes this contract: [`../web/README.md`](../web/README.md).

Base URL: `http://localhost:3000/api/v1`

```bash
npm run dev:api
```

SQLite file: `apps/api/data/rabbit-hole.sqlite` (created on first start, gitignored). CORS allows `http://localhost:5173`. Port is `process.env.PORT` or `3000`.

## What v1 does

A pool of curiosity topics. One sticky topic per calendar day. Skip, finish, pick another, rename, reset statuses, or delete a row.

Not in v1: login, notes, review, AI, configurable skip length.

## Resource

`RabbitHole`

| Field          | Type                                     | Notes                           |
| -------------- | ---------------------------------------- | ------------------------------- |
| `id`           | UUID                                     |                                 |
| `title`        | string                                   | max 200 on create               |
| `status`       | `NOT_STARTED` \| `SKIPPED` \| `FINISHED` |                                 |
| `skippedUntil` | datetime \| null                         | set on skip                     |
| `lastShownAt`  | datetime \| null                         | set when chosen as today / next |
| `finishedAt`   | datetime \| null                         | set on finish                   |
| `createdAt`    | datetime                                 |                                 |
| `updatedAt`    | datetime                                 |                                 |

### Status rules

- **Eligible** for random pick: `NOT_STARTED`, or `SKIPPED` whose `skippedUntil` is in the past. `FINISHED` never is.
- **Today** (`GET .../today`): if a row has `lastShownAt` today and is not `SKIPPED`, return it. Otherwise pick a random eligible row and set `lastShownAt`.
- **Skip**: `SKIPPED`, `skippedUntil` = now + 4 days. That row is no longer today's sticky topic.
- **Finish**: `FINISHED`, `finishedAt` = now. It stays today's topic until the calendar day changes (or you call next / reset / delete).
- **Next**: pick another eligible row, excluding today's sticky id when it exists.
- **Reset**: every row stays; all become `NOT_STARTED` and date fields above are cleared. Reset does not delete.
- **Create**: skip titles that already exist, case-insensitive, including duplicates inside the same request. Empty body array after skip returns `[]`.

## Endpoints

All paths are under `/api/v1`. JSON in and out unless noted.

### `POST /rabbit-holes`

Create one or more topics. Only new titles are saved.

```json
{ "titles": ["Alexander von Humboldt", "Debian"] }
```

- `titles` must be a non-empty array of non-empty strings (max 200 each).
- **201**: array of created rows (may be empty if everything was a duplicate).

### `GET /rabbit-holes`

All topics, newest first.

### `GET /rabbit-holes/today`

Today's sticky topic.

- **200**: one `RabbitHole`
- **404**: nothing eligible (`No rabbit hole for today`)

### `POST /rabbit-holes/next`

Pick another eligible topic and mark it shown today.

- **200**: one `RabbitHole`
- **404**: none left (`No more rabbit holes right now`)

### `POST /rabbit-holes/reset`

Set every row to `NOT_STARTED`. Keeps the pool.

- **204**: empty body

### `PATCH /rabbit-holes/:id/skip`

- **200**: updated row
- **404**: unknown id

### `PATCH /rabbit-holes/:id/finish`

- **200**: updated row
- **404**: unknown id

### `PATCH /rabbit-holes/:id`

Rename one topic.

```json
{ "title": "Hedy Lamarr" }
```

- **200**: updated row
- **404**: unknown id
- **409**: another topic already has that title (case-insensitive)

### `DELETE /rabbit-holes/:id`

Remove one topic. If it was today's, the next `GET .../today` picks another.

- **204**: empty body
- **404**: unknown id

## Errors

Validation failures are **400**. Missing rows / empty pool are **404**. Duplicate rename is **409**. Nest body:

```json
{
  "statusCode": 404,
  "message": "Rabbit hole <id> not found",
  "error": "Not Found"
}
```

Unknown JSON fields are rejected (`forbidNonWhitelisted`).

## Layout

```
apps/api/src/
  main.ts                         prefix, CORS, ValidationPipe
  app.module.ts                   TypeORM + SQLite
  api/v1/controllers/             HTTP
  api/v1/dto/
  modules/entities/
  modules/services/               rules above
```
