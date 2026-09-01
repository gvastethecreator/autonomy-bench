# Methodology

The suite uses **controlled under-specification**. The model is given enough information to make the task unambiguous, but not enough to prescribe architecture, visual style, interaction design, optional polish, or how much product judgment it should contribute.

Browser Autonomy v2 uses a frozen three-level prompt ladder:

- **A — Raw:** the minimum task statement. It measures natural interpretation, unsolicited judgment, and how finished the model chooses to make the result without additional direction.
- **B — Autonomous:** A plus exactly 20 words granting explicit authority over unspecified design, pacing, composition, and implementation decisions.
- **C — Showcase:** B plus exactly 20 more words asking for stronger presentation quality without prescribing concrete features or interaction patterns.

The fixed B suffix is:

> Make design, pacing, composition, and implementation decisions yourself wherever details are unspecified, turning the idea into a coherent finished experience.

The fixed C-only suffix is:

> Push toward presentation-ready quality with stronger art direction, motion, depth, transitions, atmosphere, and meaningful detail while preserving clarity and coherence.

Both suffixes are exactly 20 whitespace-delimited words. B is always A + the B suffix. C is always B + the C-only suffix. Do not create benchmark-specific variants of either suffix inside the same released suite version.

## Showcase-first, interaction-optional

The evaluation is **showcase-first** rather than interaction-first. A strong output should communicate and demonstrate its core idea from the initial state, so a reviewer can understand what the model chose to build before relying on substantial user input. Interaction is allowed and may improve the result; some tasks such as a cursor experiment are inherently interactive.

This is an evaluation lens, **not a hidden implementation requirement**. Do not fail an A or B take merely because it waits for interaction when the prompt does not require autonomous playback. Instead, score how well the model's decision supports the relevant quality dimensions, especially judgment and showcase quality. C explicitly adds presentation pressure, but still does not prescribe autoplay, demo data, camera motion, controls, or any other concrete feature.

The suite currently ships **Rollercoaster**, **Ant Colony**, and **Fireworks** as the live tasks. Familiar v2.0.0 anchors such as Solar System, Asteroids, Physics Sandbox, Automated Factory, and Medieval City remain frozen locally and can return without rewriting prompts.

Rollercoaster A remains byte-for-byte identical to the original v1 prompt because continuous first-person playback is part of that benchmark's identity.

## Prompt-ladder interpretation

For replicated runs:

- **A** approximates natural autonomy and unsolicited product judgment.
- **B − A** measures response to explicit permission to make unspecified decisions.
- **C − B** measures response to additional presentation/showcase pressure.
- **C − A** is the total prompt-ladder effect.

Do not interpret a single A/B/C triplet as a stable model characteristic. Prompt effects can interact with sampling variance, tool use, browser behavior, and implementation choices. Use repeated independent attempts before making typical-behavior claims.

## Evaluation dimensions

Score dimensions independently. The default suite axes are:

- `completion`: the requested core experience exists and works end-to-end.
- `autonomy`: useful decisions were contributed without being specified.
- `judgment`: the model chose appropriate priorities, defaults, scope, and additions rather than merely adding more features.
- `technicalQuality`: correctness, robustness, performance, and implementation quality appropriate to the task.
- `uxVisualQuality`: usability, legibility, interaction feel, and visual finish.
- `showcaseQuality`: how effectively the result communicates and demonstrates itself from its initial state and over time.
- `ambition`: meaningful scope beyond the minimum without rewarding feature spam.
- `coherence`: major decisions reinforce one another and complexity remains purposeful.

Autonomy and judgment are deliberately separate. A model can make many unsolicited decisions and still exercise poor judgment. Likewise, visual quality and showcase quality are separate: an attractive static composition can look excellent while doing a weak job of demonstrating the requested system or experience.

## Rules

1. Freeze suite version and rendered prompt hash before execution.
2. One fresh context or worker per cell. Cells never share a conversation.
3. Never expose sibling outputs, evaluator criteria beyond the actual worker prompt, or coordinator preferences to a worker.
4. Record requested model separately from effective model. Unknown stays `not captured`.
5. Measure generation time (`durationMs`) and token spend (`tokenUsage`) from observable harness or CLI output. Do not invent token counts, timings, tool calls, reasoning settings, or isolation evidence.
6. `n=1` is exploratory. Use at least two independent attempts per cell before claiming a stable model effect.
7. Score completion, autonomy, judgment, technical quality, UX/visual quality, showcase quality, ambition, and coherence separately.
8. Keep raw output and factual receipts separate from later evaluator opinions.
9. Finalize only when every planned cell has a receipt or an explicit blocked or unavailable receipt.
10. A completion receipt hashes frozen run inputs and records limitations. It is not a claim that every output is good.
11. Do not turn showcase-first expectations into secret pass/fail checks that are absent from the dispatched prompt.
12. Do not silently edit prompts in a released suite version. Any prompt-byte change requires a suite version bump.

See [CONTRIBUTING.md](../CONTRIBUTING.md) for suite changes.
