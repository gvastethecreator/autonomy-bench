---
name: autonomy-bench
description: 'Plan, execute, record, compare, and finalize reproducible model-autonomy benchmarks from versioned prompt suites. Use for single-HTML coding benchmarks, frozen A/B/C prompt ladders, model shootouts, repeated trials, receipt-driven run histories, and Prototype Lab export.'
---

# Autonomy Bench

Autonomy Bench is a **benchmark coordinator**, not a design treatment. It freezes prompts, creates isolated cells, records factual execution, and finalizes auditable runs.

## Core contract

- Never improve, clarify, or secretly expand a benchmark prompt before dispatch.
- Never let one benchmark cell see sibling outputs, scores, critiques, or coordinator preferences.
- Browser Autonomy v2 has frozen A/B/C prompts for every benchmark. A is Raw; B is A plus the fixed 20-word autonomy suffix; C is B plus the fixed 20-word showcase suffix.
- Do not continue a conversation from one cell into another.
- Record only observable provenance. Unknown values stay `not captured`.
- Do not request or store hidden chain-of-thought. Evaluation records conclusions, evidence, and concise rationales only.
- One cell = one benchmark + one prompt level + one requested model + one attempt.
- `n=1` is `exploratory-n1`; do not make stability claims from it.
- Finalization requires one factual receipt or explicit blocked/unavailable record per planned cell.

## Prompt ladder

- **A — Raw:** minimum task statement; measures natural interpretation and unsolicited decisions.
- **B — Autonomous:** A plus exactly 20 words explicitly granting authority over unspecified design, pacing, composition, and implementation choices.
- **C — Showcase:** B plus exactly 20 more words applying presentation pressure without prescribing concrete features.

Do not alter the prompt ladder during execution. Use the exact `prompt.md` generated for the cell.

The suite is **showcase-first, interaction-optional** as an evaluation lens. Reward results that clearly demonstrate the requested idea from their initial state, but do not invent a hidden autoplay or no-input requirement when the dispatched prompt does not contain one. Interaction can still be valuable or essential to a task.

## Choose the run shape

| Goal                      | Shape            |
| ------------------------- | ---------------- |
| Smoke-test one task       | `single`         |
| See prompt sensitivity    | `prompt-ladder`  |
| Compare models fairly     | `model-shootout` |
| Run selected combinations | `matrix`         |
| Run everything            | `suite`          |

Then choose an execution adapter: `manual`, `agent`, or `prototype-lab`.

## Workflow

1. Inspect the suite with `bench list` / `bench show`.
2. Freeze a run with `bench plan`. Keep the generated `manifest.json` immutable. Pass `--levels` explicitly when controlling ladder scope matters.
3. Dispatch every cell in a fresh context using only its `prompt.md` and permitted execution envelope.
4. Save model-produced files under that cell's `output/` directory.
5. Fill `receipt.json` from the supplied template. Preserve requested/effective model distinction, harness (program), contributor GitHub login, timing, token usage when visible, isolation evidence, tool visibility, limitations, and output hashes. Unknown stays `not captured`.
6. Evaluate only after raw outputs are frozen. Prefer blind evaluation when comparing models.
7. Run `bench status`; resolve missing receipts or record blockers explicitly.
8. Run `bench gallery --run <run-id>` to copy HTML, prompts, and receipts into `gallery/<model>/<prompt-V>/<fecha>/` and rebuild the public catalog from that tree. Serve `gallery/` (`vp run dev`) and publish that folder.
9. Run `bench finalize`; this writes `completion-receipt.json` and a SHA-256 integrity manifest.

## Prototype Lab route

When richer browser verification/comparison is needed, export with:

```text
bench export-prototype-lab --run <run-id>
```

The exporter creates one Prototype Lab benchmark spec per benchmark + prompt level, keeping each model/attempt comparison on an invariant prompt. Execute those with Prototype Lab's `experiment --direct-build` flow. Preserve Prototype Lab receipts as canonical provenance and cross-link them from Autonomy Bench cells rather than fabricating equivalent fields.

Read `references/prototype-lab-integration.md`.

## Evaluation

Score dimensions independently on a 0–5 scale:

- `completion`: requested experience works end-to-end.
- `autonomy`: useful decisions contributed without being specified.
- `judgment`: unsolicited choices are appropriate, well-prioritized, and proportionate to the task.
- `technicalQuality`: correctness, robustness, performance, maintainability appropriate to the task.
- `uxVisualQuality`: usability, legibility, interaction feel, visual finish.
- `showcaseQuality`: the result communicates and demonstrates itself effectively from its initial state and over time.
- `ambition`: meaningful scope beyond the minimum, without rewarding feature spam.
- `coherence`: decisions reinforce one another; complexity remains purposeful.

A large feature count is not automatically autonomy or ambition. Penalize poor prioritization under `judgment`, incoherent additions under `coherence`, and defects under the relevant dimension.

Read `references/evaluation.md`.

## Receipts

Each cell receipt is factual. Evaluations live separately. The run completion receipt certifies bookkeeping/integrity, not model quality.

Read `references/receipts.md` and `references/execution-modes.md`.
