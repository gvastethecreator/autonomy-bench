# Domain docs

How engineering skills consume this repo's domain docs when exploring.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root, or
- **`CONTEXT-MAP.md`** at the repo root if it exists. It points at one `CONTEXT.md` per context. Read each relevant to the topic.
- **`docs/adr/`**: ADRs that touch the area you are about to work in.

If any of these files do not exist, **proceed silently**. Do not flag absence or suggest creating them. `/grill-with-docs` creates them lazily when terms or decisions resolve.

This repo is single-context. Do not add `CONTEXT-MAP.md` unless a second bounded domain appears.

## File structure

```
/
├── CONTEXT.md
├── docs/adr/
└── suites/
```

## Use the glossary's vocabulary

When output names a domain concept (issue title, refactor proposal, hypothesis, test name), use the `CONTEXT.md` term. Do not drift to synonyms the glossary avoids.

Project terms already in public docs: suite, cell, prompt (frozen v1), run, receipt, gallery take, harness, adapter, prompt revision.

If the concept is missing from the glossary: inventing language the project does not use (reconsider), or a real gap (note it for `/grill-with-docs`).

## Flag ADR conflicts

If output contradicts an existing ADR, surface it; don't silently override.
