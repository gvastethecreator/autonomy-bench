# Autonomy Bench

Coordinator for frozen browser-autonomy cells. Workers get only their cell packet. Do not send evaluation expectations to a worker.

Root commands, suite files, and receipts: `README.md`, `docs/commands.md`, `SKILLS/autonomy-bench/SKILL.md`.
Suite additions and donated takes: `CONTRIBUTING.md`.

## Agent skills

### Issue tracker

GitHub Issues and the linked GitHub Project hold live state. `.scratch/` holds synchronized local mirrors. See `docs/agents/issue-tracker.md`.

### Triage labels

One category label (`bug` or `enhancement`) and one triage label (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` plus `docs/adr/` when those files exist. See `docs/agents/domain.md`. `/grill-with-docs` creates them when terms or decisions resolve.

## Hard rules

- Never expand a frozen prompt before dispatch.
- One fresh context per cell. Cells do not share a conversation.
- Record only observable provenance. Unknown stays `not captured`.
- Measure generation time (`startedAt`, `completedAt`, `durationMs`) and token spend (`tokenUsage`) from the harness or CLI. Do not invent those numbers.
- Preserve unrelated dirty-tree changes.
