# showcase-recipe-app

Full-stack image-processing pipeline: Bun/Hono backend + React/Vite frontend, wired to PostgreSQL, Valkey, NATS, and S3-compatible object storage on Zerops. Requires companion `showcase-recipe-worker` for async processing.

## Zerops service facts

- HTTP port: `3000`
- Siblings:
  - `db` (PostgreSQL) — env: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
  - `redis` (Valkey) — env: `REDIS_HOST`, `REDIS_PORT`
  - `queue` (NATS) — env: `NATS_HOST`, `NATS_PORT`, `NATS_USER`, `NATS_PASS`
  - `storage` (S3-compatible) — env: `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`
- Runtime base: `bun@1.2`

## Zerops dev

`setup: dev` idles on `zsc noop --silent`; the agent starts the dev server.

- Dev command: `bun --watch run src/index.ts` (= `bun run dev`; `bun run start` for no watch)
- In-container rebuild without deploy: `bun build src/index.ts --outfile dist/index.js --target bun` (backend bundle) and `cd frontend && bun run build` (frontend assets)

**All platform operations (start/stop/status/logs of the dev server, deploy, env / scaling / storage / domains) go through the Zerops development workflow via `zcp` MCP tools. Don't shell out to `zcli`.**

## Notes

- `BUN_INSTALL: ./.bun` redirects Bun's package cache into the project tree so Zerops can cache `.bun/install/cache` between builds.
- Prod deploys a single bundled `dist/index.js` with all deps inlined — no `node_modules` in the runtime container; dev deploys the full source so the agent runs TypeScript directly.
- Readiness check hits `/api/health`, which verifies PostgreSQL, Valkey, NATS, and S3 connectivity.
- Requires `showcase-recipe-worker` deployed in the same project to consume NATS `pipeline.uploaded` events.
