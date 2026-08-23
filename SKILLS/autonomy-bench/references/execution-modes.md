# Execution Modes

## Run shapes

- **single** — one cell.
- **prompt-ladder** — A/B/C for the same benchmark and model. A is Raw, B adds exactly 20 words of autonomy permission, and C adds exactly 20 further words of showcase pressure.
- **model-shootout** — same benchmark prompt across models.
- **matrix** — arbitrary Cartesian selection.
- **suite** — complete configured suite.

## Adapters

### manual

Copy `prompt.md` into a clean model conversation. Save the returned code/files exactly as produced. Fill only facts visible in the UI. If the UI does not expose the effective route, tokens, or tools, record `not captured`.

### agent

One new worker or CLI process per cell. Packet-only context is preferred. Record the isolation adapter and evidence. Record `harness` as the program that ran the worker. Do not pass this coordinator skill unless it is itself under test.

### prototype-lab

Use when browser evidence, comparison hubs, proof loops, or portable packs justify the extra machinery. Export one spec per benchmark + prompt level so model/attempt variants share one invariant prompt.

## Repetition

`attempts=1` is exploratory. For repeatability claims use at least 2 attempts per condition; 3–5 is better when generation variance is high. Repetitions must also use fresh contexts.
