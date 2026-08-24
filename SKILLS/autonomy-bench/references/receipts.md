# Receipt Contract

Receipts separate what **happened** from what an evaluator later **thought about it**.

## Cell receipt

Required identity: run id, cell id, benchmark id, prompt level, attempt, requested model, prompt SHA-256.

Execution facts: status, timestamps, generation duration, token spend, adapter, harness (the program that ran the cell: Cursor, Codex, Claude Code, ChatGPT, and similar), contributor GitHub login and avatar, effective model when independently visible, reasoning setting when visible, isolation evidence, tool visibility, output paths and hashes, limitations, errors, external receipt links.

`showcaseFixed` is optional. Record it when published HTML was repaired after generation so the take runs in the gallery. Do not invent generation time or token counts for that amendment.

`contributor` is the person who submitted the take, not the model. Record `contributor.github` and `contributor.avatarUrl` (`https://github.com/<login>.png`). If the login is unknown, use the planned default. Do not invent a name.

`harness` is not `adapter`. Adapter is how the coordinator dispatched the cell (`manual`, `agent`, `prototype-lab`). Harness is the program the worker used.

## Generation time and tokens

Every cell must record generation cost. Fill these fields from observable harness or CLI output:

- `startedAt`: clock time when generation starts (prompt sent, or worker process start).
- `completedAt`: clock time when generation ends (HTML saved, or worker process exit).
- `durationMs`: wall-clock generation time in milliseconds (`completedAt` minus `startedAt`). Use a number, not a string.
- `tokenUsage`: copy the harness usage report. Prefer the object the CLI or UI prints (`input_tokens`, `output_tokens`, `total_tokens`, cache and reasoning counts when present). A single total number is allowed when that is all the harness shows.

Prefer the harness-reported generation duration when it is visible. Otherwise use wall-clock times you observed.

Do not leave these fields blank. Use `not captured` only when the harness did not expose the value and you could not observe a clock. Never invent timings or token counts. Never infer hidden routing or usage.

HTML length estimates (`chars ÷ 4`) are gallery display only. Do not write them into `tokenUsage`.

## Completion receipt

Created by `bench finalize` only after all planned cells have terminal receipts. It records suite version/hash, run-manifest hash, counts by status, completion time, integrity manifest hash, and run-level limitations.

`complete` means bookkeeping is complete. A cell may be `blocked` or `unavailable` and the run can still be finalized if that state is explicit.

## Integrity

Freeze prompts before execution. Hash suite, manifest, prompt files, receipts, and outputs. Do not rewrite a finalized run; create a new run or a documented amendment.
