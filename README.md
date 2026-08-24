# Autonomy Bench

Receipt-driven benchmark for how coding models handle underspecified single-HTML browser tasks.

32 tasks with a frozen A/B/C prompt ladder. A is the raw task. B adds 20 words of autonomy. C adds 20 words of showcase pressure. The model still chooses architecture, interaction, look, and scope.

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

`vp run dev` serves the gallery locally.

## Usage

```powershell
vp run bench -- list
vp run bench -- plan --models grok-4.6 --benchmarks rollercoaster --levels A,B,C --attempts 2 --adapter agent --harness cursor
vp run bench -- gallery --run <run-id>
```

CLI, run modes, and publish: [docs/commands.md](docs/commands.md).

## Docs

- [Commands](docs/commands.md)
- [Methodology](docs/METHODOLOGY.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Suite prompts](suites/browser-autonomy/README.md)
- [Contributing](CONTRIBUTING.md)

## License

[MIT](LICENSE).
