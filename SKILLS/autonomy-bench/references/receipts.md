# Receipt Contract

Receipts separate what **happened** from what an evaluator later **thought about it**.

## Cell receipt

Required identity: run id, cell id, benchmark id, prompt level, attempt, requested model, prompt SHA-256.

Execution facts: status, timestamps, duration, adapter, harness (the program that ran the cell: Cursor, Codex, Claude Code, ChatGPT, and similar), effective model when independently visible, reasoning setting when visible, isolation evidence, tools/tokens when visible, output paths and hashes, limitations, errors, external receipt links.

`harness` is not `adapter`. Adapter is how the coordinator dispatched the cell (`manual`, `agent`, `prototype-lab`). Harness is the program the worker used.

Copy wall-clock times and token counts from the harness UI when they are visible. If they are not visible, use `not captured`. Never invent usage numbers.

Never infer hidden routing or usage. Use `not captured`.

## Completion receipt

Created by `bench finalize` only after all planned cells have terminal receipts. It records suite version/hash, run-manifest hash, counts by status, completion time, integrity manifest hash, and run-level limitations.

`complete` means bookkeeping is complete. A cell may be `blocked` or `unavailable` and the run can still be finalized if that state is explicit.

## Integrity

Freeze prompts before execution. Hash suite, manifest, prompt files, receipts, and outputs. Do not rewrite a finalized run; create a new run or a documented amendment.
