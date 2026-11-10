# AGENTS.md

EOMS: Node.js + TypeScript backend (Express 5, Prisma 7/PostgreSQL, Vitest). The project has its base infrastructure in place: env validation (Zod), HTTP logging (Pino), centralized error handling, Helmet/CORS, `/health` and `/ready` endpoints, centralized Prisma client, and unit/HTTP tests. README/roadmap describe the target architecture (Kafka, GraphQL, auth), not current code.

## Commands

Use pnpm (pinned `pnpm@12.18.0`); do not use npm/yarn. Single package — `pnpm-workspace.yaml` only allowlists build scripts, it is not a monorepo.

- Install: `pnpm install`
- Dev server: `pnpm dev` (tsx watch on `src/server.ts`)
- Verify before finishing: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`
- Single test file: `pnpm vitest run src/app.spec.ts`
- Format: `pnpm format` (check with `pnpm format:check`)
- Build/run: `pnpm build` then `pnpm start` (compiles to `dist/`)
- Database: `pnpm db:generate`, `pnpm db:validate`, `pnpm db:check`

`typescript` is pinned to `~6.0.3` because typescript-eslint 8.x does not support TS 7.x (the native compiler lacks the JS API used by the tooling; tracking issue typescript-eslint#10940). When typescript-eslint ships TS 7 support, the version can be raised again without code changes.

## Setup and env gotchas

- Copy `.env.example` to `.env` and set `DATABASE_URL` (e.g. `postgresql://postgres:postgres@localhost:5432/eoms`).
- Start Postgres with `docker compose up -d postgres` (postgres:18.6 on port 5432). `pnpm db:check` verifies connectivity.
- `src/config/env.ts` parses `process.env` at import time and requires `DATABASE_URL`; anything importing `app.ts`/logger fails fast without it. Vitest's `src/test/setup.ts` supplies an `eoms_test` fallback, so tests run without a database.
- Prisma has no models or migrations yet. After editing `prisma/schema.prisma`, run `pnpm prisma migrate dev` and `pnpm db:generate`. Prisma 7 uses the `@prisma/adapter-pg` driver adapter (`src/infrastructure/database/prisma-client.ts`), which now reads `env.DATABASE_URL` from the validated `env` object; creating the client does not open connections (lazy pool). `pnpm db:generate` must be re-run whenever the pnpm store hash changes (e.g. after TypeScript version changes), or PrismaClient will fail to resolve.

## Architecture and conventions

- Real entrypoint is `src/server.ts`; `src/index.ts` is empty. `src/app.ts` exports the Express app so tests can use supertest without listening.
- ESM with NodeNext: relative imports must include the `.js` extension in TypeScript sources (e.g. `import app from './app.js'`).
- Layers: `src/config` (env schema), `src/common/errors`, `src/middlewares`, `src/infrastructure/{database,logger}`, `src/modules/health`, `src/scripts`. Business modules (products, customers, orders, inventory, auth) do not exist yet.
- Tests are colocated as `src/**/*.spec.ts`. `tsconfig.json` excludes tests, so `pnpm typecheck` does not check spec files; rely on `pnpm test` for those.
- Strict TS flags include `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals/Parameters`, and `verbatimModuleSyntax` (use `import type`).
- Style: Prettier (single quotes, semicolons, trailing commas, width 100) + ESLint with `eslint-config-prettier`. Documentation and code comments are written in Spanish; keep that convention.
- Prisma skills are duplicated under `.agents/`, `.claude/`, `.cursor/`, and `.devin/`; update all copies or none.

## Git workflow

Manual Git Flow: branch from `develop` (`feature/*`, `bugfix/*`), open PRs into `develop`; `main` is release-only. The working branch is `feature/project-setup`.
