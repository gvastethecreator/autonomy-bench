# Evaluation Protocol

## Separate validity from quality

First establish whether the output loaded and whether the requested core experience exists. Then score quality.

## Six axes (0–5)

| Axis              | 0                   | 3                              | 5                                             |
| ----------------- | ------------------- | ------------------------------ | --------------------------------------------- |
| Completion        | unusable/missing    | core task works                | complete and resilient                        |
| Autonomy          | no useful inference | sensible unspecified decisions | strong independent product/technical judgment |
| Technical quality | broken/fragile      | competent                      | robust, efficient, well-structured for scope  |
| UX/Visual quality | confusing/raw       | usable and coherent            | highly finished and responsive                |
| Ambition          | bare minimum        | meaningful extras              | unusually capable without losing focus        |
| Coherence         | contradictory/noisy | mostly consistent              | every major choice reinforces the experience  |

## Blind review

When comparing models, hide model labels during the first qualitative pass. Keep viewport, browser, and starting state equal. Do not normalize away the model's own design decisions.

## Prompt-ladder interpretation

A→B measures response to explicit autonomy permission. B→C measures response to a higher finish target. Do not interpret a single pair as a stable effect; repeated attempts are required for claims about typical behavior.

## Evidence

Store evaluator scores separately from worker receipts. Include concise evidence pointers (file, screenshot, observed behavior) and caveats; never request hidden reasoning traces.
