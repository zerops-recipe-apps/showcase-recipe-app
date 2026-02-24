# Bun Hello World Recipe App

<!-- #ZEROPS_EXTRACT_START:intro# -->
Basic example of running [Bun](https://bun.sh) applications on [Zerops](https://zerops.io). Simple Bun HTTP server connected to PostgreSQL, with health check verifying database connectivity and data seeded by the migration.
Used within [Bun Hello World recipe](https://app.zerops.io/recipes/bun-hello-world) for [Zerops](https://zerops.io) platform.
<!-- #ZEROPS_EXTRACT_END:intro# -->

⬇️ **Full recipe page and deploy with one-click**

[![Deploy on Zerops](https://github.com/zeropsio/recipe-shared-assets/blob/main/deploy-button/light/deploy-button.svg)](https://app.zerops.io/recipes/bun-hello-world?environment=small-production)

![bun cover](https://github.com/zeropsio/recipe-shared-assets/blob/main/covers/svg/cover-bun.svg)

## Integration Guide

<!-- #ZEROPS_EXTRACT_START:integration-guide# -->

### 1. Adding `zerops.yaml`
The main application configuration file you place at the root of your repository, it tells Zerops how to build, deploy and run your application.

```yaml
zerops:
  # Production setup — bundle TypeScript into self-contained artifacts, deploy minimal footprint.
  # Bun's bundler inlines all dependencies, so no node_modules needed at runtime.
  - setup: prod
    build:
      base: bun@1.2

      # BUN_INSTALL redirects Bun's global package cache into the project tree so
      # Zerops can cache it between builds (default ~/.bun is outside build container scope).
      envVariables:
        BUN_INSTALL: ./.bun

      buildCommands:
        # --frozen-lockfile validates bun.lock for reproducible production builds
        - bun install --frozen-lockfile
        # Bundle app and migration into standalone artifacts — pg and all imports inlined
        - bun build src/index.ts --outfile dist/index.js --target bun
        - bun build migrate.ts --outfile dist/migrate.js --target bun

      deployFiles:
        # Bundled artifacts only — Bun inlines all deps at build time, no node_modules needed
        - ./dist

      cache:
        - node_modules
        - .bun/install/cache  # Must match BUN_INSTALL path above

    # Readiness check: verifies the container passes health before project balancer routes traffic
    deploy:
      readinessCheck:
        httpGet:
          port: 3000
          path: /

    run:
      base: bun@1.2

      # Run migration once per deploy (execOnce). In initCommands — not
      # buildCommands — so migration and code deploy atomically.
      initCommands:
        - zsc execOnce ${appVersionId} -- bun run dist/migrate.js

      ports:
        - port: 3000
          httpSupport: true

      envVariables:
        # Enables production optimizations and disables dev warnings
        NODE_ENV: production
        DB_NAME: db
        DB_HOST: ${db_hostname}
        DB_PORT: ${db_port}
        DB_USER: ${db_user}
        DB_PASS: ${db_password}

      start: bun run dist/index.js

  # Development setup — deploy full source for live editing via SSH.
  # The developer SSHs in after deploy and runs 'bun run dev' (hot reload).
  - setup: dev
    build:
      base: bun@1.2

      envVariables:
        BUN_INSTALL: ./.bun

      buildCommands:
        # bun install (not --frozen-lockfile) — lockfile may not exist in fresh forks
        - bun install

      deployFiles:
        # Deploy everything — developer runs TypeScript source directly via SSH
        - ./

      cache:
        - node_modules
        - .bun/install/cache

    run:
      base: bun@1.2

      # Migration runs once at deploy — DB schema is ready when developer SSHs in
      initCommands:
        - zsc execOnce ${appVersionId} -- bun run migrate.ts

      ports:
        - port: 3000
          httpSupport: true

      envVariables:
        NODE_ENV: development
        DB_NAME: db
        DB_HOST: ${db_hostname}
        DB_PORT: ${db_port}
        DB_USER: ${db_user}
        DB_PASS: ${db_password}

      # Container stays idle — developer starts 'bun run dev' (hot reload) manually via SSH
      start: zsc noop --silent
```

<!-- #ZEROPS_EXTRACT_END:integration-guide# -->
