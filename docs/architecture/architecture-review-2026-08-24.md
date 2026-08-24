# Architecture improvement report — Autonomy Bench

Date: 2026-08-24
Mode: Execution
Status: Completed
Language: English (operator chat in Spanish)

## Executive summary

Ten deepenings landed. Planner, receipt, publish, catalog, and viewer query now share smaller interfaces.

Strongest result: `catalog.json` is an index plus `glance`. 726 cells. Serialized size fell from ~1495 KB to ~635 KB. The viewer still paints duration, contributor, and harness on Models cards. Receipts load from `receiptSrc`.

Final gates: `vp check` pass. `vp test` 109 pass. `bench doctor` OK. Viewer checked on `wrangler dev` at `http://127.0.0.1:8787`.

## Benefits and value delivered

- **Users:** Catalog loads less data. First paint still shows take chrome. Receipts open on demand. No direct change to take HTML.
- **Maintainers:** Run IO, cell identity, receipt status, plan/finalize, path layout, catalog query, and publish live in named modules with tests.
- **Delivery / operations:** `gallery.mjs` without flags still publishes every run. `bench gallery` still requires `--run`.
- **Evidence:** catalog key inventory before/after; 109 tests; browser Single, Receipt, Models.
- **Confidence:** measured catalog size and field keys. Browser proof on one local Wrangler session. Independent review omitted.

## Ticket outcomes

Parent: https://github.com/gvastethecreator/autonomy-bench/issues/3

| ID     | Issue                                           | Status    |
| ------ | ----------------------------------------------- | --------- |
| ARC-01 | #4 Share run ledger IO                          | Completed |
| ARC-02 | #5 Share cell identity                          | Completed |
| ARC-03 | #6 Share receipt status rules                   | Completed |
| ARC-10 | #7 Make planner and finalize testable           | Completed |
| ARC-05 | #8 Split path layout from catalog               | Completed |
| ARC-04 | #9 Publish playable gallery takes               | Completed |
| ARC-08 | #10 Add thinking fields without renaming models | Completed |
| ARC-09 | #11 Import viewer helpers as ESM                | Completed |
| ARC-07 | #12 Use shared catalog query in the viewer      | Completed |
| ARC-06 | #13 Slim catalog first-paint payload            | Completed |

### ARC-01. Shared run IO

Implemented `scripts/run-io.mjs`. Both CLIs call `findRun(root, id)`. Test uses a temp tree.

### ARC-02. Cell identity

Implemented `scripts/cell-id.mjs`. Gallery fallback uses `attemptFromDateFolder`. Votes parse prompt-V through `parsePromptVersion`.

### ARC-03. Receipt module

Implemented `scripts/receipt.mjs`. `assertReceipt` has no schema library. Finalize asserts terminal receipts. Publish status can be `pending` without writing that into `receipt.json`.

### ARC-10. Planner test seam

Implemented `scripts/plan.mjs` `planRun` / `statusRun` / `finalizeRun` with an injected clock and root. Tests never write under repo `runs/`.

### ARC-05. Path layout vs catalog

`scripts/layout.mjs` keeps paths. `scripts/catalog.mjs` builds indexes and `findCell`.

### ARC-04. Publish policy

Implemented `scripts/gallery-publish.mjs`. Fixtures cover complete HTML, html-only pending, receipt without HTML, retired folder strip, and CLI parse (`all` / `run` / `viewer`).

### ARC-08. Additive thinking

`applyModelThinking` runs inside `buildCatalogFromCells`. `models[].id` stays the requested model id. Cells also have `thinking` and `modelKey`.

### ARC-09. Viewer ESM

`gallery/vendor/*.mjs` keep `export`. The viewer imports them. Anime.js copy is unchanged.

### ARC-07. Shared query

No `cellAt` copy. Viewer uses `findCell`, `formatDateStamp`, `resolveContributor`, `formatTokenUsage`.

### ARC-06. Slim catalog

Written cells have no `prompt` and no `receipt`. They have `glance`, `promptSrc`, `receiptSrc`. Prompt text lives on `promptRevisions`. Receipt panel fetches `receipt.json`.

## Integration verification

- `vp check` — pass (after omitting unused destructure names)
- `vp test` — 109 passed
- `node scripts/bench.mjs doctor` — OK, suite 2.0.0, 32 × 3
- `node scripts/gallery.mjs --viewer` — 21 models, 32 experiments, 96 prompt revisions
- Browser: Single rollercoaster A, Receipt panel, Models grid durations/contributors. Favicon 404 only.
- Codemap rebuilt (`docs/codemap/*`). Still groups most scripts as one node.

Skipped: production deploy.

## Decisions and trade-offs

Accepted: slim `glance`; additive `modelKey`; all-runs `gallery.mjs` CLI; no `ajv`; vendor ESM copies.

Rejected: fetch-only first paint; replacing public model ids; restoring `runner-isolated.mjs`.

## Residual risks

- Unknown catalog clients outside this repo.
- Codemap still too coarse to list each new module as its own node.
- Issues may still show open if GitHub close did not finish.

Contract: `.scratch/planning/2026-08-24-architecture-batch/execution-contract.md`
