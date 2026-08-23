# Autonomy Bench

Receipt-driven benchmark for how coding models handle underspecified single-HTML browser tasks.

The suite has 32 tasks. Each task has a frozen v1 A prompt: a minimum statement of the work. B and C remain reserved ladder slots. The model decides design, implementation, and how finished the result should feel.

This is not a typical coding test. It measures what a model adds when the prompt leaves important decisions open.

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
vp run bench -- plan --models grok-4.6 --benchmarks rollercoaster --levels A --adapter agent --harness cursor
vp run bench -- gallery --run <run-id>
vp run deploy
```

`plan` never calls a model. It freezes the matrix and writes one isolated packet per cell. Then you run cells with a manual copy, an agent CLI, or Prototype Lab.

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

- Suite version `1.6.0` in `suites/browser-autonomy/suite.json`.
- Package version `0.7.0`. See [CHANGELOG.md](CHANGELOG.md).
- Prompt A is frozen v1. B and C stay reserved until those prompts are written. Infinite Maze still requires autonomous traversal. Published gallery takes are A.
- `n=1` runs are exploratory. Use at least two independent attempts before claiming a stable model effect.

## License

[MIT](LICENSE).
