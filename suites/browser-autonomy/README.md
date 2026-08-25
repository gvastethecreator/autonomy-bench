# Browser Autonomy Benchmark Suite

Version `2.0.0` · 33 benchmarks · frozen A/B/C prompt ladder

Browser Autonomy v2 keeps all 33 benchmark concepts from v1.5.0 and refactors the prompt ladder around controlled under-specification.

- **A — Raw:** minimum task statement. Unnecessary quality adjectives and interaction-first wording are removed where they are not part of the benchmark's identity.
- **B — Autonomous:** A plus exactly 20 words granting explicit authority over unspecified decisions.
- **C — Showcase:** B plus exactly 20 additional words asking for stronger presentation quality without prescribing concrete features.

Rollercoaster A is intentionally unchanged from v1.5.0:

> Create a first-person rollercoaster with continuous playback in a single HTML file using Three.js.

The fixed B suffix is exactly 20 words:

> Make design, pacing, composition, and implementation decisions yourself wherever details are unspecified, turning the idea into a coherent finished experience.

The fixed C-only suffix is exactly 20 words:

> Push toward presentation-ready quality with stronger art direction, motion, depth, transitions, atmosphere, and meaningful detail while preserving clarity and coherence.

The suite is evaluated **showcase-first, interaction-optional**. That is an evaluation lens, not a hidden requirement added to A or B. Interaction may enrich a take and remains explicit where it is semantically central, such as Cursor Experiment. Infinite Maze remains explicitly self-navigating because autonomous traversal is part of that benchmark's identity.

## Raw prompts

|   # | Benchmark                                            | Category             | A — Raw prompt                                                                                                           |
| --: | ---------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
|   1 | **Rollercoaster** (`rollercoaster`)                  | `3d-interactive`     | Create a first-person rollercoaster with continuous playback in a single HTML file using Three.js.                       |
|   2 | **Solar System** (`solar-system`)                    | `3d-interactive`     | Create a miniature solar system in a single HTML file using Three.js.                                                    |
|   3 | **Procedural City** (`procedural-city`)              | `3d-interactive`     | Create a living procedural city at night in a single HTML file using Three.js.                                           |
|   4 | **Endless Driving** (`endless-driving`)              | `3d-interactive`     | Create an endless night-driving experience in a single HTML file using Three.js.                                         |
|   5 | **Terrain Explorer** (`terrain-explorer`)            | `3d-interactive`     | Create a procedural terrain explorer in a single HTML file using Three.js.                                               |
|   6 | **Cloth Simulation** (`cloth-simulation`)            | `physics-simulation` | Create a cloth simulation in a single HTML file.                                                                         |
|   7 | **Fluid Simulation** (`fluid-simulation`)            | `physics-simulation` | Create a colorful fluid simulation in a single HTML file.                                                                |
|   8 | **Ecosystem** (`ecosystem`)                          | `physics-simulation` | Create a self-sustaining ecosystem simulation in a single HTML file.                                                     |
|   9 | **Traffic Simulation** (`traffic-simulation`)        | `physics-simulation` | Create a city traffic simulation in a single HTML file.                                                                  |
|  10 | **Music Player** (`music-player`)                    | `ui-product`         | Create a desktop music player in a single HTML file.                                                                     |
|  11 | **Node Editor** (`node-editor`)                      | `ui-product`         | Create a visual node editor in a single HTML file.                                                                       |
|  12 | **Image Editor** (`image-editor`)                    | `ui-product`         | Create an image editor in a single HTML file.                                                                            |
|  13 | **Music Sequencer** (`music-sequencer`)              | `ui-product`         | Create a music sequencer in a single HTML file using the Web Audio API.                                                  |
|  14 | **Shader Playground** (`shader-playground`)          | `ui-product`         | Create a shader playground in a single HTML file using WebGL.                                                            |
|  15 | **Asteroids** (`asteroids`)                          | `games`              | Create an Asteroids-style arcade game in a single HTML file.                                                             |
|  16 | **Tower Defense** (`tower-defense`)                  | `games`              | Create a tower defense game in a single HTML file.                                                                       |
|  17 | **Dungeon Crawler** (`dungeon-crawler`)              | `games`              | Create a procedural dungeon crawler in a single HTML file.                                                               |
|  18 | **Physics Sandbox** (`physics-sandbox`)              | `games`              | Create a 2D physics sandbox in a single HTML file.                                                                       |
|  19 | **System Monitoring Dashboard** (`system-dashboard`) | `data-visualization` | Create a real-time system monitoring dashboard in a single HTML file using simulated data.                               |
|  20 | **Network Visualization** (`network-visualization`)  | `data-visualization` | Create a visualization of a complex computer network in a single HTML file.                                              |
|  21 | **Warehouse** (`warehouse`)                          | `system-reasoning`   | Create a warehouse simulation where workers move packages from incoming trucks to outgoing trucks in a single HTML file. |
|  22 | **Elevator** (`elevator`)                            | `system-reasoning`   | Create a simulation of elevators serving a busy office building in a single HTML file.                                   |
|  23 | **Airport** (`airport`)                              | `system-reasoning`   | Create a live airport operations simulation in a single HTML file.                                                       |
|  24 | **Crowd Evacuation** (`crowd-evacuation`)            | `system-reasoning`   | Create a crowd evacuation simulation in a single HTML file.                                                              |
|  25 | **Automated Factory** (`automated-factory`)          | `system-reasoning`   | Create an automated factory simulation in a single HTML file.                                                            |
|  26 | **Clock** (`clock`)                                  | `minimal-creative`   | Create a clock in a single HTML file.                                                                                    |
|  27 | **Loading Screen** (`loading-screen`)                | `minimal-creative`   | Create a loading screen in a single HTML file.                                                                           |
|  28 | **Satisfying Button** (`satisfying-button`)          | `minimal-creative`   | Create a satisfying button in a single HTML file.                                                                        |
|  29 | **Cursor Experiment** (`cursor-experiment`)          | `minimal-creative`   | Create an interactive cursor experiment in a single HTML file.                                                           |
|  30 | **Interactive 404** (`interactive-404`)              | `minimal-creative`   | Create a 404 page in a single HTML file.                                                                                 |
|  31 | **Medieval City** (`medieval-city`)                  | `3d-interactive`     | Create a living procedural medieval city in a single HTML file using Three.js.                                           |
|  32 | **Infinite Maze** (`infinite-maze`)                  | `3d-interactive`     | Create a continuously self-navigating infinite first-person maze in a single HTML file using Three.js.                   |
|  33 | **Procedural Biped** (`procedural-biped`)            | `3d-interactive`     | Create a biped creature with a procedural walking animation in a single HTML file using Three.js.                        |

## Evaluation profile

The default axes are `completion`, `autonomy`, `judgment`, `technicalQuality`, `uxVisualQuality`, `showcaseQuality`, `ambition`, and `coherence`.

A→B measures response to explicit autonomy permission. B→C measures response to additional presentation pressure. A→C is the combined ladder effect. Keep per-axis scores visible rather than treating one aggregate number as the only result.

See [../../docs/METHODOLOGY.md](../../docs/METHODOLOGY.md) and [../../SKILLS/autonomy-bench/references/evaluation.md](../../SKILLS/autonomy-bench/references/evaluation.md).
