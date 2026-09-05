# Astra variants, suspended Ant Colony, and gallery verification

Baseline: `e925a6d`. The working tree was clean when this phase began. No commit or deployment was performed.

## Scope and execution

Ant Colony is suspended in [.archives](../.archives/README.md). All 200 archived files in 53 gallery folders retain their original hashes. The live v2.3.0 suite has Rollercoaster and Fireworks at A/B/C. Finalized historical runs remain intact.

Thirteen fresh Astra sessions ran without overlap: the requested Max rerun, six Light cells at low reasoning, and six Medium cells. The six Ant Colony packets already frozen in the Light and Medium manifests were cancelled before dispatch. They have blocked receipts with the user suspension reason, not model failures or invented zero-cost runs.

| Run | Generated | Cancelled before dispatch | Worker time | Reported tokens |
| --- | ---: | ---: | ---: | ---: |
| [gpt-6-astra-max](../runs/2026/09/04/20260904-215132-astra-max-rollercoaster-a-rerun-02025da9/README.md) | 1 | 0 | 1170.194 s | 1568656 |
| [gpt-6-astra-light](../runs/2026/09/04/20260904-215133-astra-light-suite-abc-bcd32a5f/README.md) | 6 | 3 | 2027.528 s | 1075898 |
| [gpt-6-astra-medium](../runs/2026/09/04/20260904-215134-astra-medium-suite-abc-c0eca489/README.md) | 6 | 3 | 1618.585 s | 2198458 |

Model, reasoning, time, and tokens come from Codex session events. Each run preserves its exact suite snapshot, prompt hashes, execution records, worker reports, and raw HTML. Cached input is part of input; reasoning output is part of output. These counts are not prices. Finalization certifies terminal records and hashes, not task success or visual quality.

## Observed runtime limits

12 initial browser captures were recorded at 1440×900. 11 loaded without JavaScript errors in that window. 1 browser verification was blocked. This does not establish full task completion, continuous playback, all controls, or a quality grade.

- **light / rollercoaster--c--gpt-6-astra-light--a01**: `Cannot read properties of undefined (reading 'distanceToSquared')`. The original HTML is preserved, and its receipt records the failed runtime check.
- **medium / fireworks--b--gpt-6-astra-medium--a01**: mcp__cua_repl.js rejected the local artifact under its browser URL security policy. Only static verification is recorded. No alternate browser route was attempted. This is unknown runtime behavior, not a model failure.

Light Rollercoaster C showed its interface without the 3D scene during the capture. Its generation-complete status only means an HTML file and receipt were produced.

## Gallery and source checks

- The local catalog has 153 takes across 36 model variants and two live benchmarks: 13 new takes and 140 retained historical takes. Suspended Ant Colony asset routes return 404.
- Every new published HTML response matches its receipt and raw output hash. The local catalog preserves committed historical hashes. Eleven pre-existing historical checkouts differ from committed bytes due to line endings; no historical HTML was rewritten.
- One desktop flow verifies the global 🧪 title, the selected 🎢 title, the two live benchmark choices, and the measured token details in an Astra Light receipt. Browser page errors: none on that gallery flow.
- `vp test`: 166 tests passed in 25 files.
- `vp check --no-fmt`: passed with three existing warnings in the review capture/writer files.
- Formatting passed for the touched source and documentation. Full `vp check` stopped on existing formatting in `.vscode/tasks.json`; that file is unchanged.
- No separate build was run: these benchmark outputs are single HTML files without a build step. Local Wrangler served the gallery for integration checks. No production check or deployment was performed.

The [ranking analysis](ranking-analysis.md) and [synthetic writer probe](ranking-probe.json) record the decision to make demonstrated task success the main value, with quality separate. The scoring implementation remains a proposal; no current score was converted or approved.
