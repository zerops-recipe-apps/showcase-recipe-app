# Showcase Recipe App

<!-- #ZEROPS_EXTRACT_START:intro# -->
Full-stack image processing pipeline built with [Bun](https://bun.sh) and [React](https://react.dev), featuring real-time WebSocket updates, a live architecture visualization dashboard, and integrations with PostgreSQL, Valkey, NATS, and S3-compatible object storage on [Zerops](https://zerops.io).
Used within [Showcase Recipe](https://app.zerops.io/recipes/showcase-recipe) for [Zerops](https://zerops.io) platform.
<!-- #ZEROPS_EXTRACT_END:intro# -->

⬇️ **Full recipe page and deploy with one-click**

[![Deploy on Zerops](https://github.com/zeropsio/recipe-shared-assets/blob/main/deploy-button/light/deploy-button.svg)](https://app.zerops.io/recipes/showcase-recipe?environment=small-production)

## Integration Guide

<!-- #ZEROPS_EXTRACT_START:integration-guide# -->

### 1. Adding `zerops.yaml`
The main application configuration file you place at the root of your repository, it tells Zerops how to build, deploy and run your application.

```yaml
zerops:
  # Production setup — build React frontend + bundle
  # Bun backend into optimized artifacts.
  # Bun's bundler inlines all deps, no node_modules
  # needed at runtime.
  - setup: prod
    build:
      base: bun@1.2

      # BUN_INSTALL redirects Bun's global package cache
      # into the project tree so Zerops can cache it
      # between builds (~/.bun is outside build scope).
      envVariables:
        BUN_INSTALL: ./.bun

      buildCommands:
        # --frozen-lockfile validates bun.lock for
        # reproducible production builds
        - bun install --frozen-lockfile
        # Build React frontend (Vite + Tailwind) — output lands in frontend/dist
        - cd frontend && bun install --frozen-lockfile && bun run build && cd ..
        # Bundle backend — Bun inlines all deps
        # (hono, postgres, ioredis, nats, aws-sdk)
        - bun build src/index.ts --outfile dist/index.js --target bun

      deployFiles:
        # Bundled backend + compiled frontend + DB schema for init
        - ./dist
        - ./frontend/dist
        - ./src/db/schema.sql

      cache:
        - node_modules
        - frontend/node_modules
        - .bun/install/cache  # Must match BUN_INSTALL path above

    # Readiness check: verifies the container is
    # healthy before the balancer routes traffic.
    # /api/health checks PG, Valkey, NATS, and S3.
    deploy:
      readinessCheck:
        httpGet:
          port: 3000
          path: /api/health

    run:
      base: bun@1.2

      ports:
        - port: 3000
          httpSupport: true

      envVariables:
        NODE_ENV: production
        # Database — auto-generated from 'db' service
        DB_HOST: ${db_hostname}
        DB_PORT: ${db_port}
        DB_USER: ${db_user}
        DB_PASS: ${db_password}
        DB_NAME: ${db_dbName}
        # Valkey cache — referenced by 'redis' service hostname
        REDIS_HOST: ${redis_hostname}
        REDIS_PORT: ${redis_port}
        # NATS message queue — referenced by 'queue' service hostname
        NATS_HOST: ${queue_hostname}
        NATS_PORT: ${queue_port}
        NATS_USER: ${queue_user}
        NATS_PASS: ${queue_password}
        # S3-compatible object storage
        S3_ENDPOINT: ${storage_apiUrl}
        S3_ACCESS_KEY: ${storage_accessKeyId}
        S3_SECRET_KEY: ${storage_secretAccessKey}
        S3_BUCKET: ${storage_bucketName}

      start: bun run dist/index.js

  # Development setup — deploy full source for live editing via SSH.
  # Developer SSHs in after deploy and starts
  # the dev server with hot reload.
  - setup: dev
    build:
      base: bun@1.2

      envVariables:
        BUN_INSTALL: ./.bun

      buildCommands:
        # No --frozen-lockfile — lockfile may not
        # exist in fresh forks
        - bun install
        - cd frontend && bun install && cd ..

      deployFiles:
        # Deploy everything — developer runs TypeScript source directly via SSH
        - ./

      cache:
        - node_modules
        - frontend/node_modules
        - .bun/install/cache

    run:
      base: bun@1.2

      ports:
        - port: 3000
          httpSupport: true

      envVariables:
        NODE_ENV: development

      # Container stays idle — developer starts server manually via SSH
      start: zsc noop --silent
```

<!-- #ZEROPS_EXTRACT_END:integration-guide# -->
