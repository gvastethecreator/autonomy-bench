# Code map · autonomy-bench

generated: 2026-09-05T00:31:52Z
commit: 1c56d657bb5b
scope: .

counts: 6 nodes · 4 edges · 0 flows · 0 unknown

## Modules

- `external-dependencies` · `scripts/gallery-review-capture.mjs` · external · External
  callers: scripts (imports), vite-config (imports)
  callees: (none)
  tests: (none)
  entry: scripts/gallery-review-capture.mjs:playwright-core

- `repository` · `package.json` · module · Repository
  callers: (none)
  callees: scripts (calls)
  tests: (none)
  entry: package.json:{

- `scripts` · `scripts` · service · Scripts
  callers: repository (calls), workers (imports)
  callees: external-dependencies (imports)
  tests: test/agent-pack.test.ts, test/brands.test.ts, test/catalog.test.ts, test/cell-id.test.ts, test/cli-args.test.ts
  entry: scripts/agent-pack.mjs:buildAgentPack

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
- scripts -> external-dependencies · imports
- vite-config -> external-dependencies · imports
- workers -> scripts · imports

## Unknown

- none

## Flows

- none
