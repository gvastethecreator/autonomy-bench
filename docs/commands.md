# Commands

Autonomy Bench uses **Vite+** (`vp`) for install, lint, format, test, and npm scripts. The coordinator CLI is `scripts/bench.mjs`.

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
vp run bench -- plan --models gpt-5.6-sol,model-b --benchmarks rollercoaster,solar-system --levels A --attempts 2 --adapter manual --harness cursor --contributor gvastethecreator
vp run bench -- status --run <run-id>
vp run bench -- gallery --run <run-id>
vp run bench -- export-prototype-lab --run <run-id>
vp run bench -- finalize --run <run-id>
```

`plan` never calls a model. It freezes the matrix and writes one isolated work packet per cell. `--contributor` is a GitHub login stored on every cell receipt with that take's avatar URL.

## Run mode and adapter

A run mode describes **what is compared**. An adapter describes **how cells are executed**. Do not mix the two.

Run modes:

- `single`: one benchmark × one model.
- `prompt-ladder`: A/B/C slots stay in the suite. A is frozen; B and C prompts are reserved until written.
- `model-shootout`: several models against the same frozen prompt.
- `matrix`: chosen benchmarks × models × attempts.
- `suite`: the complete 33-benchmark matrix.

Adapters:

- `manual`: copy packets into model UIs by hand. Fill receipts from visible facts.
- `agent`: give each cell to a fresh worker or CLI process. Record isolation evidence.
- `prototype-lab`: export specs and use Prototype Lab `experiment --direct-build`.

## Gallery publish

```powershell
vp run gallery -- --run <run-id>
vp run gallery -- --viewer
vp run dev
vp run deploy
```

`gallery --run` copies each take into `gallery/<model>/<prompt-V>/<fecha>/` as `index.html`, `prompt.md`, and `receipt.json`. It then rebuilds `catalog.json` from the whole published tree and writes `gallery/index.html` plus `gallery/vendor/anime.esm.min.js`.

Local votes need the D1 schema once:

```powershell
npx wrangler d1 migrations apply benchmark-votes --local
```

Production votes need the same command with `--remote` after the first deploy that binds `benchmark-votes`.

`--viewer` rebuilds only the viewer and the Anime.js bundle.

The viewer fetches `catalog.json`. It does not inline the catalog. Prompt revisions come from each cell's frozen `promptSha256`. Cells without a hash are not a separate revision. Dates are folder stamps. Defaults are the latest revision and the latest month.

Do not publish folders that have only `prompt.md`.

Public site: [https://benchmark.gvaste.dev](https://benchmark.gvaste.dev).

Viewer chrome, shortcuts, and query parameters: [gallery.md](gallery.md).

## Prototype Lab export

`export-prototype-lab` emits one spec per benchmark + prompt level. That keeps the prompt invariant across models and attempts.

After export, run those specs through Prototype Lab's direct-build route. Cross-link Prototype Lab receipts from Autonomy Bench cells. Do not invent equivalent fields.

## Large outputs

HTML, JSON, Markdown, and small evidence images can live in Git. For video or large screenshot sets, use Git LFS or external storage. Keep SHA-256 and a stable locator in the receipt.
