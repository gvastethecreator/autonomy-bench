# Code map · autonomy-bench

generated: 2026-08-24T15:44:20Z
commit: 2c9c0d8995ad
scope: .

counts: 6 nodes · 3 edges · 0 flows · 0 unknown

## Modules

- `external-dependencies` · `vite.config.ts` · external · External
  callers: vite-config (imports)
  callees: (none)
  tests: (none)
  entry: vite.config.ts:vite-plus

- `repository` · `package.json` · module · Repository
  callers: (none)
  callees: scripts (calls)
  tests: (none)
  entry: package.json:{

- `scripts` · `scripts` · service · Scripts
  callers: repository (calls), workers (imports)
  callees: (none)
  tests: test/contributor.test.ts, test/highlight-html.test.ts, test/iframe-queue.test.ts, test/layout.test.ts, test/model-meta.test.ts
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

- `workers` · `workers` · queue · Workers
  callers: (none)
  callees: scripts (imports)
  tests: (none)
  entry: workers/gallery.ts:json

## Edges

- repository -> scripts · calls
- vite-config -> external-dependencies · imports
- workers -> scripts · imports

## Unknown

- none

## Flows

- none
