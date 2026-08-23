# Code map · autonomy-bench

generated: 2026-08-23T19:30:00Z
commit: efc97193722d
scope: .

counts: 6 nodes · 3 edges · 0 flows · 0 unknown

## Modules

- `external-dependencies` · `.wrangler/tmp/bundle-G5l4jd/middleware-insertion-facade.js` · external · External
  callers: vite-config (imports), wrangler (imports)
  callees: (none)
  tests: (none)
  entry: .wrangler/tmp/bundle-G5l4jd/middleware-insertion-facade.js:X:\\autonomy-bench\\node_modules\\.pnpm\\wrangler@4.125.0\\node_modules\\wrangler\\templates\\no-op-worker.js

- `repository` · `package.json` · module · Repository
  callers: (none)
  callees: scripts (calls)
  tests: (none)
  entry: package.json:{

- `scripts` · `scripts` · service · Scripts
  callers: repository (calls)
  callees: (none)
  tests: test/highlight-html.test.ts, test/iframe-queue.test.ts, test/layout.test.ts, test/model-meta.test.ts, test/run-month.test.ts
  entry: scripts/bench.mjs:sha256

- `skills` · `SKILLS` · module · Skills
  callers: (none)
  callees: (none)
  tests: (none)
  entry: SKILLS/autonomy-bench/SKILL.md:Autonomy Bench

- `vite-config` · `vite.config.ts` · module · Vite.Config
  callers: (none)
  callees: external-dependencies (imports)
  tests: (none)
  entry: vite.config.ts:generated

- `wrangler` · `.wrangler` · module · .Wrangler
  callers: (none)
  callees: external-dependencies (imports)
  tests: (none)
  entry: .wrangler/tmp/bundle-G5l4jd/middleware-insertion-facade.js:MIDDLEWARE_TEST_INJECT

## Edges

- repository -> scripts · calls
- vite-config -> external-dependencies · imports
- wrangler -> external-dependencies · imports

## Unknown

- none

## Flows

- none
