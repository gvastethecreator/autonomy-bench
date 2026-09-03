# GPT-6 Astra: full Browser Autonomy suite

Nine original single-HTML outputs: Rollercoaster, Ant Colony, and Fireworks at frozen levels A, B, and C. Suite version 2.2.0; one fresh subagent per cell, one attempt per cell (`exploratory-n1`). Contributor: **robinebers**.

## Provenance

The contributor identifies the selected model as GPT-6 Astra. Each worker session independently records the runtime identifier `vega-alpha` and reasoning effort `high`. The receipts retain this requested/effective distinction; the provider has not independently attested the alias relationship in these records.

Workers were dispatched with `fork_turns=none`, the unchanged frozen prompt, and a neutral file-output/isolation envelope. They shared the machine and filesystem but were directed to their own empty work directories. Standard harness instructions and tools were present. All nine generations ran concurrently. Durations and token usage come from each worker's session metadata. Durations include worker-side checks and shared-machine scheduling and should not be treated as controlled latency measurements.

`execution-evidence.json` in each cell contains selected factual session metadata and the envelope with its local directory redacted. It contains no raw conversation, hidden reasoning, or authentication information. Generated HTML is preserved byte-for-byte from each worker's final output. No coordinator repairs were applied.

## Runtime checks

The repository's `browser-runtime-v2` capture script ran at 1440×900, one take at a time. All nine loaded and showed automatic pixel changes; none raised a JavaScript page exception. Ant Colony A and B exceeded the viewport. Fireworks C registered motion in one of the two measured intervals. Resource 404 console messages were retained in two captures. These are smoke checks, not formal quality scores or a ranking.

| Take | Generation duration | Reported output tokens | Loads | JS exceptions | Fits viewport |
| --- | ---: | ---: | --- | ---: | --- |
| rollercoaster-A | 259.6 s | 12,198 | yes | 0 | yes |
| rollercoaster-B | 394.8 s | 16,603 | yes | 0 | yes |
| rollercoaster-C | 442.7 s | 17,676 | yes | 0 | yes |
| ant-colony-A | 391.0 s | 16,849 | yes | 0 | no |
| ant-colony-B | 348.4 s | 14,937 | yes | 0 | no |
| ant-colony-C | 579.9 s | 25,388 | yes | 0 | yes |
| fireworks-A | 144.8 s | 6,871 | yes | 0 | yes |
| fireworks-B | 269.4 s | 11,572 | yes | 0 | yes |
| fireworks-C | 219.9 s | 10,400 | yes | 0 | yes |

See `browser-checks.json` and the representative screenshots in `evidence/`. Each check is bound to the original HTML SHA-256. Generation receipts are separate from browser observations.

## Validation

- `vp check`: passed, with three existing lint warnings and no errors.
- `vp test`: 164 tests passed across 25 files.
- `vp run bench:doctor`: suite 2.2.0, three benchmarks × three prompt levels.
- All nine frozen prompt hashes and original HTML hashes verified.
- Gallery rebuilt with the repository CLI; nine new published entries verified.

## Generated catalog refresh

The gallery generator recalculates metadata for the whole gallery. Some pre-existing catalog hashes/sizes were stale relative to checked-in HTML (mostly CRLF versus LF), so the rebuild also changes their derived metadata and review eligibility. Existing HTML and evaluation files have not been modified. This is an effect of the unmodified repository generator.
