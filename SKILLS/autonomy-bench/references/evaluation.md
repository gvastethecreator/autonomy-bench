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
