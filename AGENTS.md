# Autonomy Bench

Coordinator for frozen browser-autonomy cells. Workers get only their cell packet. Do not send evaluation expectations to a worker.

Root commands, suite files, and receipts: `README.md`, `docs/commands.md`, `SKILLS/autonomy-bench/SKILL.md`.
Suite additions and donated takes: `CONTRIBUTING.md`.
Code map: `docs/codemap/codemap.md`.
Toolchain: Vite+ (`vp`). Keep the declared package manager. Do not rewrite frozen prompts under gallery/ or runs/.

## Hard rules

- Never expand a frozen prompt before dispatch.
- One fresh context per cell. Cells do not share a conversation.
- Record only observable provenance. Unknown stays `not captured`.
- Measure generation time (`startedAt`, `completedAt`, `durationMs`) and token spend (`tokenUsage`) from the harness or CLI. Do not invent those numbers.
- Preserve unrelated dirty-tree changes.
