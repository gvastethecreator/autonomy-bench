# Autonomy Bench

Receipt-driven benchmark for how coding models handle underspecified single-HTML browser tasks.

The suite has 33 tasks and a frozen A/B/C prompt ladder. A is the raw minimum task statement. B adds exactly 20 words granting explicit autonomy over unspecified decisions. C adds exactly 20 more words asking for stronger presentation quality. The model still decides architecture, interaction, visual direction, scope, and implementation details.

This is not a typical coding test. It measures what a model adds when the prompt leaves important decisions open, and how that behavior changes when autonomy and showcase pressure are introduced in controlled increments.

The suite is **showcase-first, interaction-optional** as an evaluation lens: a strong result should communicate and demonstrate its idea from the initial state, while interaction may still enrich the experience. This is not a hidden implementation requirement unless the prompt itself says so.

Live gallery: [benchmark.gvaste.dev](https://benchmark.gvaste.dev).

## Quick start

Requires [Vite+](https://viteplus.dev) (`vp`) and `pnpm@11.22.0`.

```powershell
vp install
vp check
vp test
vp run bench:doctor
vp run dev
```

`vp run dev` serves `gallery/` at the Wrangler local URL. Install the Vite Plus VS Code pack so format-on-save matches `vp fmt`.

## Usage

```powershell
vp run bench -- list
vp run bench -- show rollercoaster --level C
vp run bench -- plan --models grok-4.6 --benchmarks rollercoaster --levels A,B,C --attempts 2 --adapter agent --harness cursor
vp run bench -- gallery --run <run-id>
vp run deploy
```

`plan` never calls a model. It freezes the matrix and writes one isolated packet per cell. Then you run cells with a manual copy, an agent CLI, or Prototype Lab. Pass `--levels` explicitly when you do not want every currently frozen prompt level.

Full CLI, run modes, and gallery publish steps: [docs/commands.md](docs/commands.md).

## Documentation

- Commands and gallery publish: [docs/commands.md](docs/commands.md)
- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Methodology: [docs/METHODOLOGY.md](docs/METHODOLOGY.md)
- Suite prompts: [suites/browser-autonomy/README.md](suites/browser-autonomy/README.md)
- Coordinator skill: [SKILLS/autonomy-bench/SKILL.md](SKILLS/autonomy-bench/SKILL.md)
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)
- Security: [SECURITY.md](SECURITY.md)

## Status

- Suite version `2.0.0` in `suites/browser-autonomy/suite.json`.
- Package version `0.7.0`. See [CHANGELOG.md](CHANGELOG.md).
- All 33 v1.5 concepts remain in the suite. Raw A prompts are neutralized where wording unnecessarily prescribed interaction or quality; Rollercoaster A remains byte-for-byte unchanged.
- B and C are now frozen and runnable across the full suite. Gallery publishing accepts A/B/C takes.
- `n=1` runs are exploratory. Use at least two independent attempts before claiming a stable model effect.

## License

[MIT](LICENSE).
