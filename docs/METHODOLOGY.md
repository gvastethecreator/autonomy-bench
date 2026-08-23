# Methodology

The suite is designed around **controlled under-specification**. The model is given enough information to make the task unambiguous, but not enough to prescribe architecture, visual style, interaction design, or optional polish.

Each benchmark has a frozen v1 A prompt: the minimum task statement. That prompt measures natural interpretation and unsolicited quality decisions. B and C remain reserved ladder slots until those prompts are written.

For fair model comparisons, keep prompt bytes, browser/runtime conditions, allowed tools, and attempt count constant. Record deviations rather than correcting them after the fact.

## Rules

1. Freeze suite version and rendered prompt hash before execution.
2. One fresh context or worker per cell. Cells never share a conversation.
3. Never expose sibling outputs or coordinator preferences to a worker.
4. Record requested model separately from effective model. Unknown stays `not captured`.
5. Do not invent token counts, tool calls, reasoning settings, or isolation evidence.
6. `n=1` is exploratory. Use at least two independent attempts per cell before claiming a stable model effect.
7. Score completion, autonomy, technical quality, UX/visual quality, ambition, and coherence separately.
8. Keep raw output and factual receipts separate from later evaluator opinions.
9. Finalize only when every planned cell has a receipt or an explicit blocked or unavailable receipt.
10. A completion receipt hashes frozen run inputs and records limitations. It is not a claim that every output is good.

Do not silently edit prompts in a released suite version. See [CONTRIBUTING.md](../CONTRIBUTING.md).
