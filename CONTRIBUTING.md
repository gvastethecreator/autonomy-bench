# Contributing

Benchmark changes are methodology changes. Do not silently edit prompts in a released suite version.

- Fix typos only with an explicit version bump and changelog note when prompt bytes change.
- Add new benchmarks as new ids; never repurpose an existing id.
- Keep A/B/C deltas controlled.
- Keep worker receipts factual and evaluator scores separate.
- Run `node scripts/bench.mjs doctor` before committing.
