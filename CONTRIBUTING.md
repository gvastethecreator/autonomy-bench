# Contributing

Read [docs/METHODOLOGY.md](docs/METHODOLOGY.md) and [docs/commands.md](docs/commands.md) first.

There are two contribution paths. Do not mix them.

## Submit a take

Published takes live under `gallery/<model>/<benchmark>-<A|B|C>/<fecha>/` as `index.html`, `prompt.md`, and `receipt.json`. `contributions/` is only a drop folder for donated HTML.

1. Name the file `<benchmark>-<model>.html` (example: `rollercoaster-qwen-3.8-27b.html`).
2. Plan a cell with the frozen prompt level for that benchmark. Do not rewrite, improve, summarize, or expand the generated `prompt.md`.
3. Copy the HTML to the cell `output/index.html`.
4. Fill `receipt.json` from the template. Record what is known. Use `not captured` for the rest. Never invent timings or token counts.
5. Set `contributor.github` to the submitter's GitHub login. The avatar URL is `https://github.com/<login>.png`.
6. Publish with `vp run bench -- gallery --run <run-id>`. That copies the cell into `gallery/` and rebuilds `catalog.json`.

Until another login is passed, new planned cells default to `gvastethecreator`. The imported Qwen 3.8 27B and Ornith 1.5 35B rollercoaster A takes are `franky47`.

## Add or revise a suite benchmark

`suites/browser-autonomy/suite.json` is the source of truth. The suite README table must stay in sync.

Browser Autonomy v2 uses a controlled prompt ladder. A benchmark-specific prompt should only define the raw A task. B and C must use the suite-wide fixed suffixes exactly:

- B = A + the 20-word `autonomousSuffix`.
- C = B + the 20-word `showcaseSuffix`.

The suite tests verify those exact constructions and word deltas.

1. Add a new `id`. Never reuse an existing id.
2. Write a Raw A prompt that follows [docs/METHODOLOGY.md](docs/METHODOLOGY.md): enough to make the task clear without prescribing architecture, visual treatment, interaction design, optional polish, or unnecessary quality adjectives.
3. Preserve interaction wording only when interaction is part of the benchmark's semantic identity. Showcase-first is an evaluator lens, not text that must be appended to every A prompt.
4. Derive B and C with the fixed suite suffixes. Do not write benchmark-specific B/C guidance.
5. Set `category`, `title`, `ordinal`, and `outputContract` (`index.html`, `singleHtml: true`).
6. Bump the suite version, update the suite README, add a changelog note, and update tests for deliberate prompt-byte changes.
7. Do not silently edit prompts in a released suite version. A typo fix that changes prompt bytes still needs a version bump.
8. Run `vp check`, `vp test`, and `vp run bench:doctor`.

Rollercoaster A is a deliberate historical anchor and must remain exactly:

> Create a first-person rollercoaster with continuous playback in a single HTML file using Three.js.

Agents coordinating a run should load [SKILLS/autonomy-bench/SKILL.md](SKILLS/autonomy-bench/SKILL.md). That skill is for executing cells, not for inventing new prompts.

## Receipts

Keep worker receipts factual and evaluator scores separate. See [SKILLS/autonomy-bench/references/receipts.md](SKILLS/autonomy-bench/references/receipts.md).
