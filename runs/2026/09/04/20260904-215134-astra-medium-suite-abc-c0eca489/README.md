# gpt-6-astra-medium execution record

Run: 20260904-215134-astra-medium-suite-abc-c0eca489

6 fresh worker sessions ran in sequence with reasoning medium. 3 Ant Colony cells were cancelled before dispatch after the user suspended the benchmark.

| Benchmark | Level | Worker time | Input tokens | Cached input | Output tokens |
| --- | --- | ---: | ---: | ---: | ---: |
| rollercoaster | A | 197.864 s | 162417 | 118272 | 5816 |
| rollercoaster | B | 233.736 s | 202671 | 177792 | 6765 |
| rollercoaster | C | 420.415 s | 1047888 | 1016320 | 10453 |
| fireworks | A | 153.741 s | 159053 | 153856 | 4091 |
| fireworks | B | 219.008 s | 360282 | 341120 | 6013 |
| fireworks | C | 393.821 s | 220688 | 206720 | 12321 |

Total worker time: 1618.585 s. Total reported tokens: 2198458.

The receipt timestamps, model, reasoning level, and token counters come from Codex session events. Each execution.json names its source events and session id. Prompts and raw HTML are hash checked. The unchanged suite.snapshot.json preserves the v2.2.0 suite bytes frozen by this run, before the live suite changed to v2.3.0.

Each cell has a worker-report.md with the final worker message. runtime-verification.json records the coordinator's initial load observations and limits. Each completed output directory contains only index.html.

- One attempt per cell in this run. The Max run is an explicit independent rerun; the previous take is retained.
- Cached input is included in input, and reasoning output is included in output. These counts are not prices.
- Time covers task_started through task_complete, including worker tools and checks; process duration is recorded separately.
- Fresh conversation context; shared filesystem and standard harness instructions.
- Initial runtime observations and worker reports do not establish a task-success score or a visual quality grade.
- Ant Colony was suspended by the user. Its cancelled cells are outside the live six-cell scope and are not model failures.

The gallery catalog uses committed historical HTML bytes plus these raw outputs. This preserves historical artifact hashes despite local checkout line-ending differences. Archived Ant Colony takes are outside the current gallery. No ranking grade or human confirmation was added.
