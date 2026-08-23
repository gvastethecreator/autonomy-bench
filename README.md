# Autonomy Bench

A local-first, receipt-driven benchmark repository for comparing how coding models interpret underspecified browser tasks.

The suite contains **33 single-HTML benchmarks**, each with a controlled three-level prompt ladder:

- **A — Raw:** minimal task statement.
- **B — Autonomous:** same task plus explicit permission to make design and implementation decisions.
- **C — Production-quality:** same task plus a finished-experience quality target without prescribing the solution.

The benchmark is intentionally not a normal coding test. It measures what a model contributes when the prompt leaves important decisions open.

## Why this is separate from Prototype Lab

`prototype-lab-skill` already solves the hard general-purpose experiment problems: independent workers, capability experiments, provenance, receipts, browser proof, comparisons, and portable packaging. Autonomy Bench specializes that model around a stable benchmark suite and reproducible run ledger.

Use Autonomy Bench to **define/freeze/run/index a benchmark matrix**. Use Prototype Lab when you want its richer browser proof, comparison hubs, preflight, and packaging workflow.

## Repository model

```text
suites/                         immutable/versioned benchmark definitions
  browser-autonomy/
    suite.json
    README.md
runs/
  YYYY/MM/DD/<run-id>/          one frozen benchmark execution
    manifest.json               exact matrix + suite hash
    cells/<model>/<prompt-V>/   ledger: prompt, receipt, raw output
    completion-receipt.json     written only by finalize
gallery/
  index.html                    public stage viewer
  catalog.json
  .nojekyll
  <model>/<prompt-V>/<fecha>/index.html
  <model>/<prompt-V>/<fecha>/prompt.md
  <model>/<prompt-V>/<fecha>/receipt.json
exports/
  prototype-lab/<run-id>/       generated Prototype Lab experiment specs
receipts/
  YYYY/MM/DD/                   repository/workflow receipts
SKILLS/autonomy-bench/          Agent Skill
scripts/bench.mjs               planning / status / finalize CLI
scripts/gallery.mjs             copy outputs into the gallery tree
schemas/                        receipt + manifest schemas
vite.config.ts                  Vite+ hub (Vite, Oxlint, Oxfmt, Vitest)
```

`<prompt-V>` is `{benchmark}-{A|B|C}` (`rollercoaster-A`). `<fecha>` is `{YYYY-MM-DD}-{HHMMSS}` from the run id. Attempts after the first append `-a02` on the date folder (gallery) or an `a02/` child (ledger).

## Toolchain

This repo uses **Vite+** (`vp`): Vite, Oxlint, Oxfmt, and Vitest share `vite.config.ts`.

```powershell
vp install
vp check
vp test
vp run bench:doctor
vp run dev
```

VS Code tasks live in `.vscode/tasks.json` (`vp: check`, `vp: test`, `vp: gallery`, and the bench/deploy scripts). Install the Vite Plus extension pack so format-on-save matches `vp fmt`.

## Commands

```powershell
vp run bench -- list
vp run bench -- show rollercoaster --level A
vp run bench -- plan --models gpt-5.6-sol,model-b --benchmarks rollercoaster,solar-system --levels A,B,C --attempts 2 --adapter manual --harness cursor
vp run bench -- status --run <run-id>
vp run bench -- gallery --run <run-id>
vp run bench -- export-prototype-lab --run <run-id>
vp run bench -- finalize --run <run-id>
vp run bench:doctor
```

`plan` never calls a model. It freezes the exact matrix and produces one isolated work packet per cell. The execution layer can then be manual, an agent/CLI, or Prototype Lab.

## Two separate dimensions

### Run mode

- `single`: one benchmark × one prompt level × one model.
- `prompt-ladder`: A/B/C for the same benchmark and model, always in fresh contexts.
- `model-shootout`: multiple models against the same frozen prompt.
- `matrix`: arbitrary benchmarks × levels × models × attempts.
- `suite`: the complete 33 × 3 matrix.

### Execution adapter

- `manual`: packets are copied into model UIs by hand; receipts are filled from visible facts.
- `agent`: each cell is given to a fresh worker/CLI process; isolation evidence is recorded.
- `prototype-lab`: export specs and use Prototype Lab's `experiment --direct-build` path for proof-heavy runs.

A run mode describes **what is compared**. An adapter describes **how cells are executed**. Do not conflate them.

## Methodological rules

1. Freeze suite version and rendered prompt hash before execution.
2. One fresh context/worker per cell. A, B, and C never share a conversation.
3. Never expose sibling outputs or coordinator preferences to a worker.
4. Record requested model separately from effective model; unknown stays `not captured`.
5. Do not invent token counts, tool calls, reasoning settings, or isolation evidence.
6. `n=1` is exploratory. Use at least two independent attempts per cell before claiming a stable model effect.
7. Score **completion, autonomy, technical quality, UX/visual quality, ambition, and coherence** separately.
8. Keep raw output and factual receipts separate from later evaluator opinions.
9. Finalize only when every planned cell has a receipt or an explicit blocked/unavailable receipt.
10. A completion receipt hashes the frozen run inputs and records limitations; it is not a claim that every output is good.

## Gallery

`vp run gallery -- --run <run-id>` copies each take into `gallery/<model>/<prompt-V>/<fecha>/` as `index.html`, `prompt.md`, and `receipt.json`, then writes the public viewer at `gallery/index.html`.

The live HTML is the first thing on the page. Prompt and receipt sit in a paper Script drawer (`s` to toggle). Preview with the same worker that publishes the site:

```powershell
vp run dev
```

The viewer can show one cell, the A/B/C ladder for one model, or the same level across models. Unavailable models stay in the filmstrip; the stage typesets their prompt instead of faking a preview.

The public gallery is **https://benchmark.gvaste.dev**. Redeploy with `vp run deploy` after regenerating `gallery/`.

## Prototype Lab bridge

`export-prototype-lab` intentionally emits **one spec per benchmark + prompt level**. This preserves an invariant prompt across model/attempt variants and matches Prototype Lab's benchmark methodology. A/B/C are therefore separate experiments rather than contaminating one shared brief with three different prompts.

After export, run the generated specs through Prototype Lab's direct-build route and ingest/cross-link its canonical receipts instead of translating undocumented fields.

## Large outputs

HTML, JSON, Markdown, and small evidence images can live directly in Git. For video or large screenshot sets, use Git LFS or external artifact storage and preserve SHA-256 plus a stable locator in the receipt.

## Skill

Install/use `SKILLS/autonomy-bench/SKILL.md` as the coordinator skill. It is deliberately coordinator-only: benchmark workers should receive their frozen cell packet, not the skill's evaluation expectations.

## License

MIT.
