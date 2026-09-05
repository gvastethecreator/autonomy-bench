# Astra Max: Browser Autonomy suite

Run: 20260904-183813-gpt-6-astra-max-suite-abc-6535f5cb

Nine fresh worker sessions ran in sequence. Each received one frozen prompt and an output directory. The harness confirms `gpt-6-astra` with reasoning `max` for every cell.

| Benchmark | Level | Worker time | Input tokens | Cached input | Output tokens |
| --- | --- | ---: | ---: | ---: | ---: |
| rollercoaster | A | 1008.629 s | 1291251 | 1202944 | 28658 |
| rollercoaster | B | 1378.640 s | 2613523 | 2546432 | 37208 |
| rollercoaster | C | 1343.015 s | 1240989 | 1000448 | 27899 |
| ant-colony | A | 1097.903 s | 795276 | 715904 | 28457 |
| ant-colony | B | 1164.599 s | 1928605 | 1864960 | 33974 |
| ant-colony | C | 1471.460 s | 1499711 | 1470592 | 41621 |
| fireworks | A | 671.026 s | 524902 | 498944 | 19569 |
| fireworks | B | 717.575 s | 630298 | 602752 | 20556 |
| fireworks | C | 1166.933 s | 1210366 | 1165056 | 32749 |

The receipts copy timestamps and token usage from the Codex session events. Each `execution.json` records the session id and source event names. The HTML and prompt hashes were checked against the receipts and frozen manifest. Worker intervals do not overlap.

Total worker time: 10019.780 s. Total reported tokens: 12005612.

Cached input is part of input tokens. Reasoning output is part of output tokens. Do not add these subsets to the totals. These counts do not estimate a price.

- One attempt per condition. No repeatability claim.
- Token totals include repeated input and cached input; this is not a price estimate.
- Time includes all worker generation, tool calls, and checks.
- Fresh conversation context; shared filesystem and standard harness instructions.
- No model ranking or human review was added.

The local gallery catalog was generated from the committed historical HTML bytes and these raw outputs. This avoids checkout line-ending changes invalidating historical artifact hashes. Historical files and evaluations were not edited.

The local .gitattributes files preserve exact raw HTML bytes, including mixed line endings. Git does not normalize these samples.

Each cell includes the final worker report in `worker-report.md`. The run-level `runtime-verification.json` records coordinator observations and their limits. Worker reports and initial-load checks are not quality scores.

After Rollercoaster B completed, the coordinator moved its two unreferenced temporary files, `fonts.css` and `three.min.js`, into local `.scratch/astra-generation-temporaries/rollercoaster-B`. They were preserved after automatic review rejected deletion. The model-generated HTML was not changed. The worker report describes the earlier state.

Ant Colony C also retained temporary QA files after automatic review rejected profile deletion. After completion, the coordinator moved that profile, the QA script, and both captures into local `.scratch/astra-generation-temporaries/ant-colony-C`. Its raw HTML was unchanged.

The two Fireworks A QA files were likewise preserved under local `.scratch/astra-generation-temporaries/fireworks-A` after the worker reported a deletion block. Its raw HTML was unchanged.

The Fireworks C QA profile was preserved under local `.scratch/astra-generation-temporaries/fireworks-C` after the worker reported a deletion block. Its raw HTML was unchanged.

## Verification limits

- rollercoaster--c--gpt-6-astra-max--a01: mcp__cua_repl.js blocked browser verification under its URL security policy. Only static checks are recorded. No alternate browser route was attempted.

The gallery-verification.json report confirms that all nine published HTML files match their receipts, all 184 historical catalog entries remain unchanged, and the Ant Colony A/B/C ladder loaded three frames at 1440x900 without JavaScript errors. This checks gallery integration only.
