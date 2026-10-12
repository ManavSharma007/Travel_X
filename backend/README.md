# Travel_X — Backend

Portable Express + TypeScript API. Postgres + PostGIS for geospatial, Prisma ORM,
storage adapter that runs on local disk in dev and flips to Cloudflare R2 / AWS S3
in production by changing one env var.

## Prerequisites (install once)

- Node.js 20+
- Docker Desktop (runs Postgres + PostGIS locally)

## Run it locally (first time)

From inside the `backend/` folder:

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and keep the dev defaults
cp .env.example .env
#    (.env already works as-is for local dev)

# 3. Start Postgres + PostGIS in Docker
docker compose up -d

# 4. Wait ~10s for the DB to be ready, then apply the migration
#    (creates tables + the PostGIS geom column + spatial index)
npx prisma migrate deploy

# 5. Generate the Prisma client
npx prisma generate

# 6. Start the API (hot reload)
npm run dev
```

You should see:

```
✅ Database connection OK
🚀 Travel_X API running on http://localhost:4000
```

## Every day after that

```bash
docker compose up -d     # start the database (if not already running)
npm run dev              # start the API
```

Stop the database when done: `docker compose down` (data is kept in a volume).

## Smoke test (in a second terminal)

```bash
# health
curl http://localhost:4000/health

# register (save the token from the response)
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"me@test.com","username":"aakash","password":"password123"}'

# search a place (free OpenStreetMap)
curl "http://localhost:4000/places/search?q=kyoto"

# log a visit (paste your token)
curl -X POST http://localhost:4000/visits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"place":{"name":"Kyoto","country":"Japan","latitude":35.0116,"longitude":135.7681},"rating":5,"note":"Beautiful"}'

# see pins on your map (whole-world bbox)
curl "http://localhost:4000/users/aakash/map?bbox=-180,-90,180,90"

# your diary
curl "http://localhost:4000/users/aakash/visits"
```

## API surface (MVP)

| Method | Path                          | Auth | Purpose                        |
|--------|-------------------------------|------|--------------------------------|
| GET    | /health                       | no   | liveness                       |
| POST   | /auth/register                | no   | create account → token         |
| POST   | /auth/login                   | no   | login → token                  |
| GET    | /auth/me                      | yes  | current user                   |
| GET    | /users/:username              | no   | public profile + visit count   |
| PATCH  | /users/me                     | yes  | update own profile             |
| GET    | /users/:username/visits       | no   | diary (paginated)              |
| GET    | /users/:username/map?bbox=    | no   | visited pins in viewport       |
| GET    | /places/search?q=             | no   | OpenStreetMap place search     |
| POST   | /visits                       | yes  | log a visited place            |
| GET    | /visits/:id                   | no   | single visit                   |
| DELETE | /visits/:id                   | yes  | delete own visit               |
| POST   | /visits/photos/presign        | yes  | get upload URL                 |
| POST   | /visits/:id/photos            | yes  | attach uploaded photo          |

## Switching storage to R2/S3 later

1. `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
2. In `.env`: set `STORAGE_PROVIDER=r2` (or `s3`) and fill the `S3_*` vars.

No application code changes — that's the point of the adapter.

## Project shape

```
src/
  config/env.ts        validated environment config (fails fast)
  lib/                 prisma client, jwt, http errors, async wrapper
  adapters/            storage interface + local + s3/r2 implementations
  middleware/          auth, validation, error handling
  modules/
    auth/              register, login, me
    users/             profile, diary
    places/            OSM search proxy + place upsert (keeps geom in sync)
    visits/            core visit CRUD + photo upload flow
    map/               PostGIS bounding-box pin query
  app.ts               wires everything together
  server.ts            entry point (checks DB, starts listening)
prisma/
  schema.prisma        models
  migrations/          hand-authored init migration WITH PostGIS
```
