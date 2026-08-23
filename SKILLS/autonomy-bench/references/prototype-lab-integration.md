# Prototype Lab Integration

Prototype Lab already provides independent-worker experiment routes, canonical receipts, browser proof, comparison hubs, and packaging. Autonomy Bench should reuse those concepts instead of copying its full workspace manager.

## Export rule

Generate one Prototype Lab spec for each **benchmark + prompt level**. Model and attempt are variants inside that spec. This keeps the prompt invariant across the compared cells.

## Mapping

- Autonomy Bench benchmark/level prompt → Prototype Lab `sharedBrief`.
- Core output requirement → `fixedOutcomes`.
- Model-owned implementation/design choices → `openDecisions`.
- Single HTML/browser requirements → `constraints`.
- Model + attempt → Prototype Lab variant.
- Autonomy Bench cell id → variant id/cross-link metadata.

## Provenance

Prototype Lab's canonical worker receipt remains authoritative for its execution. Store its path/hash in the Autonomy Bench cell receipt under `externalReceipts`; do not silently translate missing fields.

## Isolation

Prototype Lab is coordinator-only. A benchmark worker receives the frozen prompt and execution envelope, not Prototype Lab's visual system, hub styling, workspace memory, or sibling variants.
