# Browser Autonomy Benchmark Suite

Version `2.2.0` · live benches: Rollercoaster, Ant Colony, Pinball, Fireworks · frozen A/B/C prompt ladder

The live suite is Rollercoaster plus three benches added in v2.2.0: Ant Colony, Pinball, and Fireworks. Thirty-one additional v2.0.0 benches are shelved with frozen prompts. Adding a bench is the same path as before: put it in `suite.json`, publish takes, rebuild the viewer. The experiment picker stays in the viewer and unhides once a second live experiment has published takes in the catalog.

- **A — Raw:** minimum task statement.
- **B — Autonomous:** A plus exactly 20 words granting explicit authority over unspecified decisions.
- **C — Showcase:** B plus exactly 20 additional words asking for stronger presentation quality without prescribing concrete features.

Rollercoaster A is intentionally unchanged from v1.5.0:

> Create a first-person rollercoaster with continuous playback in a single HTML file using Three.js.

The fixed B suffix is exactly 20 words:

> Make design, pacing, composition, and implementation decisions yourself wherever details are unspecified, turning the idea into a coherent finished experience.

The fixed C-only suffix is exactly 20 words:

> Push toward presentation-ready quality with stronger art direction, motion, depth, transitions, atmosphere, and meaningful detail while preserving clarity and coherence.

The suite is evaluated **showcase-first, interaction-optional**. That is an evaluation lens, not a hidden requirement added to A or B.

## Raw prompts

|   # | Benchmark                           | Category             | A — Raw prompt                                                                                     |
| --: | ----------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------- |
|   1 | **Rollercoaster** (`rollercoaster`) | `3d-interactive`     | Create a first-person rollercoaster with continuous playback in a single HTML file using Three.js. |
|   2 | **Ant Colony** (`ant-colony`)       | `physics-simulation` | Create an ant colony simulation in a single HTML file.                                             |
|   3 | **Pinball** (`pinball`)             | `games`              | Create a pinball game in a single HTML file.                                                       |
|   4 | **Fireworks** (`fireworks`)         | `minimal-creative`   | Create a fireworks display in a single HTML file.                                                  |

## Evaluation profile

The default axes are `completion`, `autonomy`, `judgment`, `technicalQuality`, `uxVisualQuality`, `showcaseQuality`, `ambition`, and `coherence`.

A→B measures response to explicit autonomy permission. B→C measures response to additional presentation pressure. C→A is the combined ladder effect. Keep per-axis scores visible rather than treating one aggregate number as the only result.

See [../../docs/METHODOLOGY.md](../../docs/METHODOLOGY.md) and [../../SKILLS/autonomy-bench/references/evaluation.md](../../SKILLS/autonomy-bench/references/evaluation.md).
