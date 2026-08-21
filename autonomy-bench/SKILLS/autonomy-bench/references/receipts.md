# Receipt Contract

Receipts separate what **happened** from what an evaluator later **thought about it**.

## Cell receipt

Required identity: run id, cell id, benchmark id, prompt level, attempt, requested model, prompt SHA-256.

Execution facts: status, timestamps, adapter, effective model when independently visible, reasoning setting when visible, isolation evidence, tools/tokens when visible, output paths and hashes, limitations, errors, external receipt links.

Never infer hidden routing or usage. Use `not captured`.

## Completion receipt

Created by `bench finalize` only after all planned cells have terminal receipts. It records suite version/hash, run-manifest hash, counts by status, completion time, integrity manifest hash, and run-level limitations.

`complete` means bookkeeping is complete. A cell may be `blocked` or `unavailable` and the run can still be finalized if that state is explicit.

## Integrity

Freeze prompts before execution. Hash suite, manifest, prompt files, receipts, and outputs. Do not rewrite a finalized run; create a new run or a documented amendment.
