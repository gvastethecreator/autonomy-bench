# Suspended benchmarks

Ant Colony (🐜) and Fireworks (🎆) are suspended at the user's request. They are outside the live suite, gallery, and ranking. The archive preserves their definitions and published takes for later review or restoration.

- [Ant Colony definition](ant-colony/benchmark.json): the unchanged benchmark entry.
- [Frozen suite v2.2.0](ant-colony/suite-v2.2.0.json): the exact suite bytes before suspension.
- [Archive record](ant-colony/archive.json): source commit, original paths, archive paths, and SHA-256 hashes for all 200 preserved files in 53 gallery folders.
- `gallery/<model>/ant-colony-<level>/<date>/`: published HTML, prompts, receipts, and existing evaluations.
- [Fireworks definition](fireworks/benchmark.json): the unchanged benchmark entry.
- [Frozen suite v2.3.0](fireworks/suite-v2.3.0.json): the exact suite bytes before suspension.
- [Fireworks archive record](fireworks/archive.json): source commit, original paths, archive paths, and SHA-256 hashes for all 223 preserved files in 61 gallery folders.
- `gallery/<model>/fireworks-<level>/<date>/`: published HTML, prompts, receipts, and existing evaluations.

Finalized mixed runs remain under `runs/` to preserve their integrity manifests. Planned Ant Colony cells in the Astra Light and Medium runs were cancelled before dispatch. Their terminal receipts say `blocked` with the suspension reason; no model time, tokens, or failure are claimed.

Restoring a benchmark is an explicit scope change. Restore the exact definition and archived gallery folders, then regenerate the gallery. Do not rewrite frozen prompts or historical runs.
