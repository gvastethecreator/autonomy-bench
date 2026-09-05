# A ranking that reports what the evidence supports

Decision: the user selected verified task success as the main value, with visual quality kept separate. The implementation plan below remains a proposal. This analysis does not change scores or approve existing reviews.

The current ranking is deterministic given its inputs, but some inputs overstate what was observed. Fix the evidence writer before changing the sorting formula. A stable calculation cannot make an unsupported judgment accurate.

## Findings in the current code

| Finding                                                   | Evidence                                                                                                                     | Effect                                                                                                                              |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Loading implies task success.                             | `scripts/gallery-review-write.mjs`, `evaluationForTake`: `coreExperience` and `expectedBehavior` default to `runtime.loads`. | A page can pass the core task gates without evidence that the requested experience works.                                           |
| Relative placement creates absolute-looking grades.       | `placementFacet` sets a 0–4 grade from the candidate percentile; `evaluationForTake` copies it into composition and craft.   | The best result in a weak group still receives 4/4. Its grade can change when the other candidates change.                          |
| Motion magnitude partly becomes motion quality.           | `motionFacet` combines pixel change with the placement grade.                                                                | Busy or irrelevant animation can raise a grade without improving the requested behavior.                                            |
| Tier 1 means non-dominated within the group.              | `scripts/gallery-evaluation.mjs`, `assignQualityTiers`.                                                                      | Tier 1 has no absolute quality floor. It does not mean excellent.                                                                   |
| Functionality depends on a visual review being present.   | `buildScope` fills `taskScore` only when every slot has a comparative review.                                                | Functional evidence cannot stand alone, which increases evaluation work.                                                            |
| Review confirmation counts identities and reviewer types. | `summarizeCellEvaluation` checks unique reviewer ids and the presence of a human.                                            | This validates the record shape. It does not establish reviewer independence or verify that an evidence pointer supports its claim. |

At commit `e925a6d`, the catalog had 193 takes and 157 evaluation files. Of those files, 127 yielded a task score of 100. In 150, clarity, composition, and craft were identical in every recorded review. No current benchmark-level cohort had confirmed candidates. These are metadata observations, not a new judgment of the rendered projects.

A synthetic probe through the existing review CLI illustrates the failure. Given only a successful-load fixture and one candidate, the writer gives an empty task placeholder all five task checks, 100 task points, and facets 4/3/4/4. The probe uses synthetic capture metadata; it does not claim a browser run. The [probe result](ranking-probe.json) preserves the writer output and its limits.

## Recommended public value

Show **verified task success** as the main numeric value and keep visual quality separately labeled. Prefer a fraction, such as **5/6 passed**, with the percentage available beside it. Do not label this percentage “quality.” Ant Colony is now suspended, so the live scope is six cells per model. The 193-take audit above records the earlier snapshot, before suspension.

For a selected scope:

1. Select the latest take for each model, benchmark, prompt level, and prompt revision. Show the attempt count and keep earlier attempts available for audit. Never select the highest-scoring attempt.
2. Freeze a small set of observable requirements derived from that prompt. Do not add hidden requirements, such as mandatory autoplay when the prompt allows interaction. The evaluator contract must not be sent to a worker.
3. Record each requirement as `pass`, `fail`, or `not verified`, with a matching evidence pointer. A load event establishes only loading.
4. A take passes when all required behaviors have direct support and no blocking error occurs. A known failure is a failure. Missing evidence remains unknown.
5. Report the number of passed takes over all expected takes. Keep failures and unknowns explicit. With unknowns, show a provisional fraction such as **4 passed, 1 failed, 1 not verified** instead of a complete-looking rank.
6. Once every expected slot has a result, sort by the passed fraction. Preserve ties. A stable model id controls display order within a tie, not quality order.

The denominator must include the full selected scope. Do not average only the successful or reviewed subset. With six live cells, report the fraction rather than unnecessary decimal precision. Suspended cells are outside this scope; they are not model failures. One attempt per cell measures this run; it is not a probability that the model will succeed next time.

This value answers “how much of the task suite was demonstrated?” It does not distinguish two fully working outputs by visual finish. That distinction needs the quality profile below.

## Visual quality without automatic high grades

Keep clarity, motion and interaction, composition, and craft independent. Review each against fixed anchors, not placement among current competitors:

| Grade | Required observation                                                                                              |
| ----- | ----------------------------------------------------------------------------------------------------------------- |
| 0     | The dimension is absent or blocks the experience.                                                                 |
| 1     | Serious defects make the experience hard to understand or use.                                                    |
| 2     | The dimension works, with clear limitations recorded in the evidence.                                             |
| 3     | The dimension is clear, consistent, and reliable in the fixed observation protocol.                               |
| 4     | The result meets the highest predefined examples and criteria for this dimension; the review cites that evidence. |

These anchors need benchmark-specific examples before use. A top placement never implies 4. Pixel change is a diagnostic, not a grade. A result with missing evidence gets no grade for that dimension.

Keep the quality profile separate from the verified-success value. Do not introduce a weighted 0–100 blend of functionality, appearance, speed, and votes.

Machine judgments remain provisional. Seek human review for disagreements, candidate winners, and a small calibration sample. Human review is evidence of an assessment, not a claim of mathematical objectivity. Existing winner confirmation must not be inferred from old machine grades.

## Keep evaluation efficient

- Cache the browser evidence by HTML hash, prompt hash, evaluator protocol version, browser version, viewport, controlled state, and external resource fingerprints when the take uses remote dependencies. The same HTML can behave differently if a CDN response changes. A catalog rebuild must not launch browsers or call a judge.
- Test only changed hashes. Reuse a valid capture for several calculations and views. Do not silently repair model HTML or alter its random behavior for a capture.
- Start with load and blocking-error checks. Then run the few prompt-specific behaviors that can falsify completion. Stop a failed take before an expensive quality review when further review cannot change its eligibility.
- Use browser interactions through public controls. Avoid DOM snapshots, pixel percentages, or source inspection as substitutes for the requested behavior.
- Bound the observation window and interaction script. Record their actual cost. Some animated tasks need observations over time, so one screenshot is insufficient.
- Review quality only when the task evidence is complete. Use fixed anchors per take rather than all-pairs comparisons. Cache the review by artifact and rubric version.
- Keep generation time, input/output/cache token counts, evaluation time, and public votes separate. Do not mix dollars, speed, popularity, or HTML size into quality.

The deterministic guarantee is the calculation from a fixed evidence record. Browser randomness, network failures, and reviewer variation remain observable inputs. Record an environment-blocked check as not verified, and distinguish it from a demonstrated defect in the take.

## Implementation order

1. Remove the load-to-success defaults and the placement-to-facet conversion. Require explicit conclusions and supporting evidence.
2. Version the new evidence contract. Preserve old records for audit, but do not treat them as certified under the new method. Do not convert old grades into new evidence.
3. Decouple functional results from visual reviews. Add the verified-success fraction and explicit unknown state to the catalog and ranking view.
4. Add one regression at the current review-writing seam: a load-only record must not establish core behavior or high quality. Extend existing ranking tests for unknown evidence and the full-scope denominator.
5. Re-evaluate the current takes once with the new protocol, then use hash-based invalidation. Measure browser and reviewer time before claiming savings.

The main-value decision is settled: verified task success, with quality separate. The requested analysis identifies the code changes and evidence contract needed before replacing the public ranking.

## Research context

[WebGen-Bench](https://arxiv.org/abs/2505.03733) evaluates stated website functionality through operation-and-result test cases. This supports checking requested behavior rather than treating loading as success.

[Design2Code](https://arxiv.org/abs/2403.03163) complements automatic metrics with human evaluation. Its screenshot-reconstruction metrics do not directly define quality for these open-ended prompts.

[WebDevJudge](https://arxiv.org/abs/2510.18560) reports a gap between model judges and human experts on web tasks. This supports bounded claims and calibration; it does not supply an objective score for Autonomy Bench.
