# Architecture

Autonomy Bench has five layers:

1. **Suite** — versioned benchmark definitions and prompt levels.
2. **Planner** — expands benchmark × level × model × attempt into immutable cells.
3. **Adapter** — manual, isolated agent, or Prototype Lab execution.
4. **Ledger** — per-cell factual receipts plus output hashes.
5. **Evaluation** — optional blind scores/reviews stored separately from execution provenance.

This separation allows the benchmark method to stay stable while model providers and execution tools change.

## Stable IDs

A cell id is derived from benchmark, level, normalized model id, and attempt. A run id adds a UTC timestamp and a short hash of the planned matrix.

## Date layout

Runs use the coordinator's explicit timestamp but are stored as `runs/YYYY/MM/DD/<run-id>/`. Inside a run, cells are `cells/<model>/<prompt-V>/`, where `<prompt-V>` is `{benchmark}-{A|B|C}`. The public gallery drops the run wrapper and uses `gallery/<model>/<prompt-V>/<fecha>/`, with `<fecha>` taken from the run id (`YYYY-MM-DD-HHMMSS`).

## Finalization

Finalization is append-oriented: validate terminal receipts, hash the complete run tree excluding the completion receipt itself, write `integrity-manifest.json`, then hash that file into `completion-receipt.json`. A finalized run should not be mutated.
