# Contributing

Read [docs/METHODOLOGY.md](docs/METHODOLOGY.md) and [docs/commands.md](docs/commands.md) first.

There are two contribution paths. Do not mix them.

## Submit a take

Published takes live under `gallery/<model>/<benchmark>-A/<fecha>/` as `index.html`, `prompt.md`, and `receipt.json`. `contributions/` is only a drop folder for donated HTML.

1. Name the file `<benchmark>-<model>.html` (example: `rollercoaster-qwen-3.8-27b.html`).
2. Plan a cell with the frozen v1 prompt for that benchmark. Do not rewrite the prompt.
3. Copy the HTML to the cell `output/index.html`.
4. Fill `receipt.json` from the template. Record what is known. Use `not captured` for the rest. Never invent timings or token counts.
5. Set `contributor.github` to the submitter's GitHub login. The avatar URL is `https://github.com/<login>.png`.
6. Publish with `vp run bench -- gallery --run <run-id>`. That copies the cell into `gallery/` and rebuilds `catalog.json`.

Until another login is passed, new planned cells default to `gvastethecreator`. The imported Qwen 3.8 27B and Ornith 1.5 35B rollercoaster A takes are `franky47`.

## Add a suite benchmark

`suites/browser-autonomy/suite.json` is the source of truth. The suite README table must stay in sync.

1. Add a new `id`. Never reuse an existing id.
2. Write one frozen v1 A prompt that follows [docs/METHODOLOGY.md](docs/METHODOLOGY.md): a minimum task statement. The model decides the rest. Leave B and C empty until those prompts are written.
3. Set `category`, `title`, `ordinal`, and `outputContract` (`index.html`, `singleHtml: true`).
4. Bump the suite version, update the suite README, and add a changelog note.
5. Do not silently edit prompts in a released suite version. A typo fix that changes prompt bytes still needs a version bump.
6. Run `vp check`, `vp test`, and `vp run bench:doctor`.

Agents coordinating a run should load [SKILLS/autonomy-bench/SKILL.md](SKILLS/autonomy-bench/SKILL.md). That skill is for executing cells, not for inventing new prompts.

## Receipts

Keep worker receipts factual and evaluator scores separate. See [SKILLS/autonomy-bench/references/receipts.md](SKILLS/autonomy-bench/references/receipts.md).
