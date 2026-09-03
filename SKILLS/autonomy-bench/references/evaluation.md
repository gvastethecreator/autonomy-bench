# Evaluation Protocol

## Separate validity from quality

First establish whether the output loaded and whether the requested core experience exists. Then score quality.

Browser Autonomy is evaluated **showcase-first, interaction-optional**. A reviewer should be able to understand what the model chose to build from the initial state and short observation window, but this is not a hidden autoplay requirement unless the dispatched prompt explicitly requires autonomous behavior. Interaction can improve a take and is inherent to some tasks.

## Eight axes (0–5)

| Axis              | 0                              | 3                                        | 5                                                     |
| ----------------- | ------------------------------ | ---------------------------------------- | ----------------------------------------------------- |
| Completion        | unusable/missing               | core task works                          | complete and resilient                                |
| Autonomy          | no useful inference            | sensible unspecified decisions           | strong independent product/technical initiative       |
| Judgment          | arbitrary/counterproductive    | mostly appropriate priorities            | excellent scope, defaults, and decision selection     |
| Technical quality | broken/fragile                 | competent                                | robust, efficient, well-structured for scope          |
| UX/Visual quality | confusing/raw                  | usable and coherent                      | highly finished and responsive                        |
| Showcase quality  | idea is unclear without effort | core idea demonstrates itself adequately | immediately legible, engaging, and self-demonstrating |
| Ambition          | bare minimum                   | meaningful extras                        | unusually capable without losing focus                |
| Coherence         | contradictory/noisy            | mostly consistent                        | every major choice reinforces the experience          |

Autonomy and judgment are separate. A model can make many unsolicited choices while choosing the wrong things to build. Do not reward feature count by itself.

UX/visual quality and showcase quality are also separate. A visually attractive result may still be a weak showcase if its core behavior is hidden behind an empty state, opaque interaction, or unclear presentation. Conversely, a technically simple result can showcase its concept very effectively.

## Blind review

When comparing models, hide model labels during the first qualitative pass. Keep viewport, browser, starting state, observation window, and permitted interaction policy equal. Do not normalize away the model's own design decisions.

For showcase-first review, inspect the initial state before interacting. Record whether the take establishes the requested idea, whether meaningful behavior develops on its own, and whether optional interaction improves rather than merely unlocks the experience. Treat those observations as evidence for the scoring axes, not as extra pass/fail requirements.

## Prompt-ladder interpretation

- A measures natural interpretation and unsolicited quality decisions.
- A→B measures response to exactly 20 additional words granting explicit autonomy permission.
- B→C measures response to exactly 20 further words of presentation/showcase pressure.
- A→C is the combined ladder effect.

Do not interpret a single pair or triplet as a stable effect; repeated independent attempts are required for claims about typical behavior.

Useful derived summaries may include `B - A`, `C - B`, and `C - A` per scoring axis, but keep the underlying per-cell evaluations available. Avoid collapsing everything into one number when the profile is more informative.

## Evidence

Store evaluator scores separately from worker receipts. Include concise evidence pointers (file, screenshot, observed behavior) and caveats; never request hidden reasoning traces.

## Published quality ranking

Put `evaluation.json` beside the published take. Bind the evaluation to the exact `index.html` bytes with `artifactSha256`. Use `schemas/cell-evaluation.schema.json`.

The public ranking reads artifact-bound `quality-v2` reviews and aggregates them with `tiered-evidence-v3`:

1. Capture every playable take with the same browser viewport and observation sequence: initial state, two automatic samples, one deterministic interaction, page errors, console errors, failed requests, motion deltas, and viewport fit.
2. Apply four required task gates before comparative ranking: the page loads, the core experience exists, the prompt's expected behavior is visible, and no blocking runtime error occurs. Viewport fit contributes to the separate task score but is not a winner gate.
3. Compare only current takes from the same benchmark and level. Record both an ordinal preference and clarity, motion and interaction, composition, and craft as separate 0–4 facets.
4. Assign Pareto tiers across task success and the four quality facets. One model can move above another only when it is no worse on every signal and better on at least one. This preserves real ties and avoids hidden weights.
5. Keep blind ordinal preference in the audit record, but do not let it change a tier or the order inside one. Stable model id makes tied rows deterministic without presenting a finer quality judgment.
6. Review historical and incomplete playable takes too, but do not let historical attempts enter the current winner cohort. Delivery status remains visible and does not change the experience review.
7. Mark one review as provisional. Require two independent reviews, including one human review, for a confirmed result.
8. Do not assign an aggregate tier until the model has a reviewed current take for every slot in that scope. Publish a winner only when the whole cohort is confirmed and exactly one eligible model occupies Tier 1.

Task success, quality facets, blind preference, generation time, output size, public votes, delivery coverage, and showcase repairs remain separate fields. No combined score is published.

This method follows two useful findings from published benchmark work. Functional browser tests provide reproducible evidence for requested behavior. Human review remains necessary to validate visual ranking. See [WebGen-Bench](https://arxiv.org/abs/2505.03733) and [Design2Code](https://arxiv.org/abs/2403.03163). Recent judge studies also show that open-ended web and visual judgments still differ from expert review. See [WebDevJudge](https://arxiv.org/abs/2510.18560) and [Visual Aesthetic Benchmark](https://arxiv.org/abs/2605.12684).
