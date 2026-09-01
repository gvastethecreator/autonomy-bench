# Changelog

## 0.7.6 — 2026-09-01

- Browser Autonomy Suite v2.2.0: add three live benches with new ids: Ant Colony (`ant-colony`, `physics-simulation`), Pinball (`pinball`, `games`), and Fireworks (`fireworks`, `minimal-creative`). Each Raw A prompt is a minimum task statement. B and C use the fixed suite-wide suffixes. Rollercoaster A stays byte-for-byte unchanged. The 31 shelved v2.0.0 benches stay shelved.
- Suite tests lock the new Raw A prompts, the live id list, and the suite version.
- Rebuild `agent.json`, `llms.txt`, and the viewer so the published prompt pack and experiment marks include the new benches.

## 0.7.5 — 2026-08-27

- Share CLI argv, suite doctor, run listing, Prototype Lab export, vote allow/store, viewer query, compact token counts, iframe settle, and gallery finish behind named modules.
- Publish frozen live-suite prompts for coding agents at `llms.txt` and `agent.json`. The gallery UI does not show those files.
- Register WebMCP tools on `document.modelContext` so a browser agent can list benches, read frozen prompts, list takes, show a take, and load a receipt. A small polyfill installs the API when the browser does not ship it yet.

## 0.7.4 — 2026-08-24

- Single view fills the stage: no outer gap around the take. The toolbar spans the top edge. A receipt status bar sits on the bottom edge in Single and on compact Models cards (duration, ≈ tokens, contributor, harness). On a wide take those fields are labeled inline.

## 0.7.3 — 2026-08-24

- Show vendor brand marks for models and harnesses in the gallery (Gemini, DeepSeek, GLM/Z.ai, Kimi, Qwen, Hunyuan, Meta, OpenCode, Antigravity). Fallback stays the generic brain when no mark exists.
- Sort gallery model lists alphabetically (sidebar, Models view, and Table).
- Move **Vote for this** next to **Reload** and **Copy prompt** on each take toolbar. Reload refreshes that take.
- Deploy the gallery Worker from GitHub Actions on push to `main` after CI validates.
- Catalog cells are an index plus `glance`. Prompt text lives on prompt revisions. The receipt panel loads `receipt.json` on demand. Takes repaired after generation show a **fixed** badge from `receipt.showcaseFixed`.
- Models view loads every playable take. Extra WebGL canvases may go blank when Chrome hits its context limit.
- Scope the live suite to Rollercoaster. Other v2.0.0 benches and their published takes leave the public tree so they can be restored locally later. Hide the experiment picker until a second live experiment exists.
- Share run IO, cell identity, receipt status, planner, catalog query, and viewer ESM helpers behind smaller modules.

## 0.7.2 — 2026-08-24

- Estimate output size for each published take as HTML `chars ÷ 4`. Show `≈` tokens on the take status bar and in the receipt panel. Do not write the estimate into `receipt.tokenUsage`.
- Require cell receipts to record generation time (`startedAt`, `completedAt`, `durationMs`) and token spend (`tokenUsage`) from observable harness or CLI output.
- Add **Open full size** on multi-take cards so a take can open in Single.
- Add previous and next arrows on the View dropdown.
- Show the experiment emoji, desaturated, beside the gallery title. The emoji slot stays reserved and scrambles with the title.

## 0.7.1 — 2026-08-24

- Add a Table view: every benchmark against every published model, with present and missing cells for the current A/B/C level.
- Show the public vote crown on unique leaders in Table as well as on the model list.
- Mark a staff-chosen take on each benchmark in Table with a gold star. Rollercoaster A stays on `grok-4.6`. Other A takes prefer `grok-4.6-xhigh`, then `grok-4.6`. B and C prefer `grok-4.6-high`. Click the bench name to open that take.
- Models view shows every playable take. Click a model to hide or show it.
- Compact model cards use a two-row toolbar (actions, then prompt) and a receipt status bar for duration, tokens, contributor, and harness.
- Group the gallery chrome into Filters, View, and Fit dropdowns.

## 0.7.0 — 2026-08-23

- Browser Autonomy Suite v2.0.0: 32 benchmarks with a frozen A/B/C prompt ladder. Rollercoaster A remains byte-for-byte unchanged.
- Remove Terrain Explorer (`terrain-explorer`) from the suite. Frozen run cells stay in the ledger. Gallery publish drops retired benchmark folders.
- Drop the published `ox-alpha-free` gallery take. Frozen run cells stay in the ledger.
- Activate the full A/B/C prompt ladder. B appends one universal 20-word autonomy suffix to A; C appends one universal 20-word showcase suffix to B. Suite tests lock both constructions and word deltas.
- Remove unnecessary `interactive`, `polished`, `exceptional`, `playable`, `playful`, `explorable`, and similar pressure from Raw prompts where it is not semantically essential. Cursor Experiment intentionally remains interactive; Infinite Maze remains explicitly self-navigating.
- Adopt showcase-first, interaction-optional evaluation as a review lens rather than a hidden worker requirement.
- Add `judgment` and `showcaseQuality` to the default evaluation profile, separating decision quality from autonomy and presentation quality from general UX/visual finish.
- Publish and index A/B/C gallery takes instead of deleting or filtering B/C as reserved levels.
- Update methodology, contribution rules, CLI docs, coordinator skill, suite README, and evaluation guidance for the live prompt ladder.

## 0.6.0 — 2026-08-23

- Add anonymous gallery winner votes. One vote per visitor per prompt-V (`rollercoaster-A`). The vote targets a model, not a take date.
- Identity is an `ab_voter` cookie. The store does not record IP or User-Agent.
- A crown button sits next to the model name in place of the take status badge. Gold means your vote. A gold crown on the model list marks the unique leader. Ties show no public crown.
- Keep the experiment emoji beside its label in the sidebar dropdown. Filter the model list to the current month or run and animate models that enter or leave.
- Votes live in Cloudflare D1 (`benchmark-votes`) behind `GET`/`PUT`/`DELETE /api/votes`. They are not evaluation scores and do not belong in receipts.

## 0.5.0 — 2026-08-23

- Keep A/B/C as prompt-level slots. A is the frozen v1 prompt. B and C stay reserved until those prompts are written.
- Remove published B/C gallery takes and run cells. The public stage still exposes A/B/C buttons; B and C show empty until takes land.
- Default experiment order: Rollercoaster, then Endless Driving, Medieval City, Procedural Biped, Infinite Maze.
- Move the prompt, Copy prompt, HTML, and Receipt onto a toolbar on each take. Multi-take views stack HTML and receipt panels per take.
- Gallery sidebar lists only models that have a generated HTML take for the selected benchmark. Anime.js layout animates models that enter or leave the list.
- Multi-take toolbars collapse actions and the status badge to icons with custom tooltips. HTML and receipt stacks scroll as equal-height cards. The experiment menu shows a desaturated emoji before the name.
- Suite version `1.5.0`.

## 0.4.0 — 2026-08-23

- Cell receipts record the GitHub contributor (login + avatar). The gallery stamps missing contributors as `gvastethecreator`. Imported Qwen 3.8 27B and Ornith 1.5 35B rollercoaster A takes are `franky47`.
- Published C and Infinite Maze takes keep a single prompt revision (v1). The current showcase C prompts and the current autonomous maze prompts are v1. Stub folders without `promptSha256` are not a second revision.
- Add `SECURITY.md`, slim the README, and split CLI plus gallery viewer detail into `docs/`.
- Browser Autonomy Suite v1.2.0: prompt C is a finished automatic showcase instead of a polished interactive experience. Published C takes and ledger C cells were removed and must be re-run.
- Gallery title follows the selected benchmark (`Rollercoaster Bench`).
- Catalog indexes every published take: prompt revisions from `promptSha256`, execution dates, defaulting to the latest of each.
- Replace the evidence modal with independent source and receipt drawers, prompt copy + toast, HTML syntax highlighting, and column/grid/row + fill/fit layouts.
- Move the catalog filmstrip into a left sidebar that can compact to an icon rail (`[` or Compact).
- Animate gallery text changes with Anime.js scrambleText (only the glyphs that differ) and drive source/receipt drawers plus the compact rail with Anime.js (drawer curve on panels, ease-in-out on the sidebar).
- Restyle prompt, month, run, and experiment dropdowns as the same outlined chips as the rest of the chrome, with an in-app menu instead of the OS select.
- Cover take swaps with a stage loader; scramble chrome first, then replace iframes so project changes do not stutter.
- Load take HTML behind a loader and assign iframe `src` one at a time so Models and A/B/C do not boot every WebGL take at once.
- Group gallery takes by month so a month can show every model that landed in it; when a month has more than one run, a second select switches between those runs.

## 0.3.1 — 2026-08-23

- Update toolchain and dependencies: `pnpm@11.22.0`, `vitest@4.1.11`.
- Clean residual folders, obsolete migration scripts, and scratch drafts.
- Harden `.gitignore` with `.wrangler/`, logs, and OS/local overrides.
- Redesign `.vscode/tasks.json` with concise names and emojis (`⚡ dev`, `🔍 check`, `🧪 test`, `🚀 deploy`, etc.).
- Update documentation and repository toolchain references.

## 0.3.0 — 2026-08-23

- Adopt Vite+ (`vp`) for Vite, Oxlint, Oxfmt, and Vitest; VS Code tasks live in `.vscode/tasks.json`.
- Store takes as `model/prompt-V/date` (`gallery/grok-4.6/rollercoaster-A/2026-08-21-021413/`). Ledger cells use `cells/<model>/<prompt-V>/` under each run.

## 0.2.0 — 2026-08-21

- Browser Autonomy Suite v1.1.0: add `medieval-city`, `infinite-maze`, and `procedural-biped`.
- Cell receipts record `harness` (program) separately from `adapter` (dispatch path).
- Plan accepts `--harness`. Copy visible times and token counts; never invent them.
- CLI resolves its repo root with `fileURLToPath` so Windows plans land in the right folder.
- `bench gallery` copies HTML, prompts, and receipts into `gallery/<run-id>/<model>/<benchmark>/<A|B|C>/` and writes a public stage viewer for GitHub Pages.

## 0.1.0 — 2026-08-21

- Initial repository architecture.
- Browser Autonomy Suite v1: 30 benchmarks × A/B/C prompts.
- Dependency-free planning/status/finalization CLI.
- Manual, agent, and Prototype Lab execution adapters.
- Versioned cell and completion receipt contracts.
- Prototype Lab export bridge.
- Agent Skill package.
