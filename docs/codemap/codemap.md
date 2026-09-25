# Code map: autonomy-bench

Generated: 2026-09-24T23:37:15Z | Commit: `c931abb0bc6f` | Schema: 2
Generation: `784fc5b5413a4bdca492347583e4aa8b83bfd216f5b94a04209d76e0e74fca00`
Scope: . | Inventory: working-tree
Nodes: 68 | Edges: 310 | Flows: 0

## Coverage

- Analysis: **partial**; 59 analyzed of 60 included files.
- Configuration files: 1; omitted untracked files: 0.
- Unresolved references and analysis limits: 5.
- Static references and call paths do not prove runtime execution or test coverage.

## Modules

- `SKILLS/autonomy-bench/SKILL.md` | module | Repository | callers: none | callees: none | tests: 0 | entry: none
- `external:javascript:node:crypto` | external | External | callers: scripts/gallery-publish.mjs, scripts/gallery-publish.mjs, scripts/gallery-review-capture.mjs, scripts/gallery-review-capture.mjs | callees: none | tests: 1 | entry: none
- `external:javascript:node:fs` | external | External | callers: scripts/gallery-publish.mjs, scripts/gallery-publish.mjs, scripts/gallery-review-capture.mjs, scripts/gallery-review-capture.mjs | callees: none | tests: 9 | entry: none
- `external:javascript:node:os` | external | External | callers: test/agent-pack.test.ts, test/agent-pack.test.ts, test/gallery-publish.test.ts, test/gallery-publish.test.ts | callees: none | tests: 5 | entry: none
- `external:javascript:node:path` | external | External | callers: scripts/bench.mjs, scripts/bench.mjs, scripts/gallery-publish.mjs, scripts/gallery-publish.mjs | callees: none | tests: 10 | entry: none
- `external:javascript:node:url` | external | External | callers: scripts/bench.mjs, scripts/bench.mjs, scripts/gallery.mjs, scripts/gallery.mjs | callees: none | tests: 7 | entry: none
- `external:javascript:playwright-core` | external | External | callers: scripts/gallery-review-capture.mjs, scripts/gallery-review-sheets.mjs | callees: none | tests: 0 | entry: none
- `external:javascript:pngjs` | external | External | callers: scripts/gallery-review-capture.mjs | callees: none | tests: 0 | entry: none
- `external:javascript:vite-plus` | external | External | callers: test/agent-pack.test.ts, test/agent-pack.test.ts, test/brands.test.ts, test/brands.test.ts | callees: none | tests: 25 | entry: none
- `package.json` | module | Repository | callers: none | callees: none | tests: 0 | entry: none
- `scripts/agent-pack.mjs` | module | Repository | callers: scripts/gallery-publish.mjs, scripts/gallery-publish.mjs, test/agent-pack.test.ts, test/agent-pack.test.ts | callees: none | tests: 1 | entry: none
- `scripts/bench.mjs` | module | Repository | callers: none | callees: external:javascript:node:path, external:javascript:node:path, external:javascript:node:url, external:javascript:node:url | tests: 0 | entry: none
- `scripts/brands.mjs` | module | Repository | callers: test/brands.test.ts, test/brands.test.ts | callees: none | tests: 1 | entry: none
- `scripts/catalog.mjs` | module | Repository | callers: scripts/gallery-publish.mjs, scripts/gallery-publish.mjs, test/catalog.test.ts, test/catalog.test.ts | callees: scripts/gallery-evaluation.mjs, scripts/gallery-evaluation.mjs, scripts/layout.mjs, scripts/model-meta.mjs | tests: 1 | entry: none
- `scripts/cell-id.mjs` | module | Repository | callers: scripts/gallery-publish.mjs, scripts/gallery-publish.mjs, scripts/plan.mjs, scripts/plan.mjs | callees: scripts/layout.mjs, scripts/layout.mjs | tests: 1 | entry: none
- `scripts/cli-args.mjs` | module | Repository | callers: scripts/bench.mjs, scripts/bench.mjs, scripts/gallery-publish.mjs, scripts/gallery-publish.mjs | callees: none | tests: 1 | entry: none
- `scripts/contributor.mjs` | module | Repository | callers: scripts/gallery-publish.mjs, scripts/gallery-publish.mjs, scripts/plan.mjs, scripts/plan.mjs | callees: none | tests: 1 | entry: none
- `scripts/gallery-evaluation.mjs` | module | Repository | callers: scripts/catalog.mjs, scripts/catalog.mjs, test/catalog.test.ts, test/catalog.test.ts | callees: none | tests: 1 | entry: none
- `scripts/gallery-publish.mjs` | module | Repository | callers: scripts/gallery.mjs, scripts/gallery.mjs, test/agent-pack.test.ts, test/agent-pack.test.ts | callees: external:javascript:node:crypto, external:javascript:node:crypto, external:javascript:node:fs, external:javascript:node:fs | tests: 2 | entry: none
- `scripts/gallery-query.mjs` | module | Repository | callers: test/gallery-query.test.ts, test/gallery-query.test.ts | callees: none | tests: 1 | entry: none
- Showing 20 of 68 nodes. Query `impact --module <path>` or open the HTML hierarchy for the rest.

## Edges

- `scripts/bench.mjs` -> `external:javascript:node:path` | calls
- `scripts/bench.mjs` -> `external:javascript:node:path` | imports
- `scripts/bench.mjs` -> `external:javascript:node:url` | calls
- `scripts/bench.mjs` -> `external:javascript:node:url` | imports
- `scripts/bench.mjs` -> `scripts/cli-args.mjs` | calls
- `scripts/bench.mjs` -> `scripts/cli-args.mjs` | imports
- `scripts/bench.mjs` -> `scripts/gallery.mjs` | calls
- `scripts/bench.mjs` -> `scripts/gallery.mjs` | imports
- `scripts/bench.mjs` -> `scripts/plan.mjs` | calls
- `scripts/bench.mjs` -> `scripts/plan.mjs` | imports
- `scripts/bench.mjs` -> `scripts/prototype-lab.mjs` | calls
- `scripts/bench.mjs` -> `scripts/prototype-lab.mjs` | imports
- `scripts/bench.mjs` -> `scripts/suite.mjs` | calls
- `scripts/bench.mjs` -> `scripts/suite.mjs` | imports
- `scripts/catalog.mjs` -> `scripts/gallery-evaluation.mjs` | calls
- `scripts/catalog.mjs` -> `scripts/gallery-evaluation.mjs` | imports
- `scripts/catalog.mjs` -> `scripts/layout.mjs` | imports
- `scripts/catalog.mjs` -> `scripts/model-meta.mjs` | calls
- `scripts/catalog.mjs` -> `scripts/model-meta.mjs` | imports
- `scripts/catalog.mjs` -> `scripts/receipt.mjs` | calls
- `scripts/catalog.mjs` -> `scripts/receipt.mjs` | imports
- `scripts/catalog.mjs` -> `scripts/run-month.mjs` | calls
- `scripts/catalog.mjs` -> `scripts/run-month.mjs` | imports
- `scripts/catalog.mjs` -> `scripts/staff-picks.mjs` | calls
- `scripts/catalog.mjs` -> `scripts/staff-picks.mjs` | imports
- `scripts/cell-id.mjs` -> `scripts/layout.mjs` | calls
- `scripts/cell-id.mjs` -> `scripts/layout.mjs` | imports
- `scripts/gallery-publish.mjs` -> `external:javascript:node:crypto` | calls
- `scripts/gallery-publish.mjs` -> `external:javascript:node:crypto` | imports
- `scripts/gallery-publish.mjs` -> `external:javascript:node:fs` | calls
- `scripts/gallery-publish.mjs` -> `external:javascript:node:fs` | imports
- `scripts/gallery-publish.mjs` -> `external:javascript:node:path` | calls
- `scripts/gallery-publish.mjs` -> `external:javascript:node:path` | imports
- `scripts/gallery-publish.mjs` -> `scripts/agent-pack.mjs` | calls
- `scripts/gallery-publish.mjs` -> `scripts/agent-pack.mjs` | imports
- `scripts/gallery-publish.mjs` -> `scripts/catalog.mjs` | calls
- `scripts/gallery-publish.mjs` -> `scripts/catalog.mjs` | imports
- `scripts/gallery-publish.mjs` -> `scripts/cell-id.mjs` | calls
- `scripts/gallery-publish.mjs` -> `scripts/cell-id.mjs` | imports
- `scripts/gallery-publish.mjs` -> `scripts/cli-args.mjs` | calls
- `scripts/gallery-publish.mjs` -> `scripts/cli-args.mjs` | imports
- `scripts/gallery-publish.mjs` -> `scripts/contributor.mjs` | calls
- `scripts/gallery-publish.mjs` -> `scripts/contributor.mjs` | imports
- `scripts/gallery-publish.mjs` -> `scripts/layout.mjs` | calls
- `scripts/gallery-publish.mjs` -> `scripts/layout.mjs` | imports
- `scripts/gallery-publish.mjs` -> `scripts/output-tokens.mjs` | calls
- `scripts/gallery-publish.mjs` -> `scripts/output-tokens.mjs` | imports
- `scripts/gallery-publish.mjs` -> `scripts/receipt.mjs` | calls
- `scripts/gallery-publish.mjs` -> `scripts/receipt.mjs` | imports
- `scripts/gallery-publish.mjs` -> `scripts/run-io.mjs` | calls
- Showing 50 of 310 edges; JSON contains every edge and its evidence.

## Unknown

- `scripts/gallery-review-capture.mjs:324`: object-member-call-not-resolved (chromium)
- `scripts/gallery-review-sheets.mjs:176`: object-member-call-not-resolved (chromium)
- `test/catalog.test.ts:133`: object-member-call-not-resolved (expect)
- `test/catalog.test.ts:396`: object-member-call-not-resolved (expect)
- `test/catalog.test.ts:402`: object-member-call-not-resolved (expect)

## Flows

- no source-backed call path from a recognized trigger

## Architecture changes

- Nodes: +0 / -0; edges: +0 / -0.
- Boundary changes: 0; new cycles: 0.

## Read next

- Use `status` before relying on this generation.
- Use `impact --changed` for possible impact and related test evidence.
- Use `diff --before <model> --after <model>` for architecture changes.
