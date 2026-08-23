# Changelog

## 0.4.0 — 2026-08-23

- Browser Autonomy Suite v1.3.0: every C prompt now defines a benchmark-specific, self-running animated showcase. Replace all Infinite Maze prompts with autonomous traversal and invalidate its previous A/B/C takes.
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
