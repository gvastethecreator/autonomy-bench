# Changelog

## 0.7.0 — 2026-08-23

- Browser Autonomy Suite v2.0.0 keeps all 33 benchmark concepts while refactoring Raw A prompts around controlled under-specification. Rollercoaster A remains byte-for-byte unchanged.
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
