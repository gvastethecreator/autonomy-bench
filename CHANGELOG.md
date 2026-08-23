# Changelog

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
