# Commands

Use **Vite+** (`vp`) for install, lint, format, test, and npm scripts. The coordinator CLI is `scripts/bench.mjs`.

## Toolchain

```powershell
vp install
vp check
vp test
vp run bench:doctor
vp run dev
```

VS Code tasks live in `.vscode/tasks.json`. Install the Vite Plus extension pack so format-on-save matches `vp fmt`.

## Coordinator CLI

```powershell
vp run bench -- list
vp run bench -- show rollercoaster --level A
vp run bench -- show rollercoaster --level B
vp run bench -- show rollercoaster --level C
vp run bench -- plan --models gpt-5.6-sol,model-b --benchmarks rollercoaster --levels A,B,C --attempts 2 --adapter manual --harness cursor --contributor gvastethecreator
vp run bench -- status --run <run-id>
vp run bench -- gallery --run <run-id>
vp run bench -- export-prototype-lab --run <run-id>
vp run bench -- finalize --run <run-id>
```

`plan` never calls a model. It freezes the matrix and writes one isolated work packet per cell. `--contributor` is a GitHub login stored on every cell receipt with that take's avatar URL.

All A/B/C prompts are frozen in Browser Autonomy v2. Because the planner defaults to every fully populated prompt level, omitting `--levels` currently selects `A,B,C`. Pass `--levels A`, `--levels B`, `--levels C`, or another explicit subset when you want to control run size and cost.

## Run mode and adapter

A run mode describes **what is compared**. An adapter describes **how cells are executed**. Do not mix the two.

Run modes:

- `single`: one benchmark × one model.
- `prompt-ladder`: A/B/C for the same benchmark and model. A is Raw, B adds exactly 20 words of autonomy permission, and C adds exactly 20 further words of showcase pressure.
- `model-shootout`: several models against the same frozen prompt.
- `matrix`: chosen benchmarks × models × attempts.
- `suite`: every live suite benchmark. The live set is Rollercoaster and Fireworks. Ant Colony is suspended in [`.archives`](../.archives/README.md).

Adapters:

- `manual`: copy packets into model UIs by hand. Fill receipts from visible facts, including generation time and token spend.
- `agent`: give each cell to a fresh worker or CLI process. Record isolation evidence, generation time, and token usage.
- `prototype-lab`: export specs and use Prototype Lab `experiment --direct-build`.

## Gallery publish

```powershell
vp run bench -- gallery --run <run-id>
vp run gallery
vp run gallery -- --run <run-id>
vp run gallery -- --viewer
vp run dev
vp run deploy
```

A push to `main` deploys after CI validates. Use local `vp run deploy` only when you need to publish without that push. The deploy job needs repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

`vp run bench -- gallery --run <run-id>` publishes one run. `vp run gallery` with no flags publishes every run, then rebuilds the catalog and viewer. `gallery --run` copies each publishable A/B/C take **for live suite benches** into `gallery/<model>/<prompt-V>/<fecha>/` as `index.html`, `prompt.md`, and `receipt.json`. Takes for benches that are not in the live suite are skipped. Leftover published folders for retired or shelved benches leave the public `gallery/` tree so they can be restored locally. It then rebuilds `catalog.json` from the live `gallery/` tree and writes `gallery/index.html` plus helper modules under `gallery/vendor/`.

Local votes need the D1 schema once:

```powershell
npx wrangler d1 migrations apply benchmark-votes --local
```

Production votes need the same command with `--remote` after the first deploy that binds `benchmark-votes`.

`--viewer` rebuilds `catalog.json` from the published gallery tree, then rewrites the viewer, helper `.mjs` files, and the Anime.js bundle.

### Local quality review

With the local gallery already running at `http://127.0.0.1:8093/`:

```powershell
vp run gallery:review:capture
vp run gallery:review:sheets
vp run gallery:review:write
vp run gallery -- --viewer
```

Capture uses the fixed `browser-runtime-v2` sequence for every playable take. Sheets hide model names and separate current candidates from historical attempts. Write validates that every blind id appears exactly once in its benchmark-level order before it writes artifact-bound `quality-v2` files. Saved machine reviews are provisional until an independent human review is added.

The viewer fetches `catalog.json`. It does not inline the catalog. Catalog cells are an index plus a short `glance` (duration, harness, contributor, limitations). Prompt text lives on `promptRevisions`. The receipt panel loads `receipt.json` on demand. Prompt revisions come from each cell's frozen `promptSha256`. Cells without a hash are not a separate revision. Dates are folder stamps. Defaults are the latest prompt revision across every month. Month is an optional filter.

Do not publish folders that have only `prompt.md` or a receipt and no `index.html`. The gallery command removes those folders when it rebuilds.

Public site: [https://benchmark.gvaste.dev](https://benchmark.gvaste.dev).

Viewer chrome, shortcuts, and query parameters: [gallery.md](gallery.md).

## Prototype Lab export

`export-prototype-lab` emits one spec per benchmark + prompt level. That keeps the prompt invariant across models and attempts.

After export, run those specs through Prototype Lab's direct-build route. Cross-link Prototype Lab receipts from Autonomy Bench cells. Do not invent equivalent fields.

## Large outputs

HTML, JSON, Markdown, and small evidence images can live in Git. For video or large screenshot sets, use Git LFS or external storage. Keep SHA-256 and a stable locator in the receipt.
