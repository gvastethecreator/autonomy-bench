# Gallery viewer

Preview the public stage (`gallery/index.html`) with `vp run dev`. Edit the viewer in `scripts/gallery-viewer.html`; `vp run gallery -- --viewer` copies it to `gallery/index.html` and also rebuilds `catalog.json`. After you regenerate `gallery/`, commit and push to `main` so CI validates it. Production deploys are manual through the **CI** workflow's `workflow_dispatch`, or with local `vp run deploy`.

## Navigation

The gallery opens the selected take in Single. The main navigation has only **Explore** and **Compare**. Clicking the brand mark returns to Single. Home, Ranking, Coverage, and Charts are no longer navigation destinations. The original Departure Mono typography, colors, layout, controls, and Anime.js motion remain unchanged.

The viewer has four modes: Single, Models, ABC, and Compare. It does not load voting data. The existing `/api/votes` service and stored votes remain available independently of the viewer.

## Layout

The global title uses 🧪 with `Autonomy Bench`. A selected benchmark uses its desaturated experiment emoji plus `{benchmark} Bench`.

Only the live suite appears in the gallery. Ant Colony and Fireworks are suspended in [`.archives`](../.archives/README.md), with their definitions and published takes preserved. Historical finalized runs remain intact.

The Astra Light variant keeps the `gpt-6-astra-light` id and records the harness reasoning level as `low`. Token details read the measured Codex session counters, including cached input, without adding cache or reasoning output twice to the total.

The left sidebar holds the A/B/C prompt-level buttons (**A Raw**, **B +Autonomy**, **C +Showcase**; the take count is in the tooltip) and models. Compact (or `[`) collapses the sidebar to an icon rail. On narrow screens it becomes a horizontal model strip above the stage. The model list shows every model with a take in the selected benchmark, grouped by family (Anthropic, OpenAI, Google, xAI, and so on), with the newest public releases first inside each family. The comparison selectors and model navigation use the same order. Release dates and source links live in `scripts/model-meta.mjs`; reasoning variants share their base model date, ties use the model name, and models without a confirmed date go last in their family. Rows show only the brand and model name; a model without a take at the current level stays in the list, dimmed. The take's status bar carries its quality tier (`T1`, `T2`, … or `gate` when a required task gate failed), the A/B/C levels the model has, and the **new** badge. The list keeps its scrollbar space reserved, and the thumb shows only on hover or focus, so rows never shift. Changing level keeps the chosen model; the stage says the take did not land instead of switching models. **Search models** (or `/`) filters the list, and Enter opens the first match. A gold **new** badge marks models whose first playable take landed within the last 7 days, in the take status bar. In Models view, click a model to hide or show it; a dimmed model has nothing to show. In ABC, clicking a model shows its ladder. In Compare, clicking a model opens its playable take in Single for the active benchmark and level. Only Single and ABC mark a current model in the list, and the list scrolls to keep it in view. Above the list, a counter plus an **All / Only** button selects every model or collapses the selection to the focused model. Anime.js layout animates models that enter or leave that list.

Each take has a top toolbar: the model name, the prompt in small type, then Reload, Copy prompt, HTML, and Receipt. In a multi-take view those actions belong to that take. If the toolbar is tight, the actions show as icons. A custom tooltip names each icon. Reload refreshes that take's iframe.

Single view fills the stage. The toolbar sits on the top edge. A status bar on the bottom edge shows duration, approximate output tokens from the HTML (`chars ÷ 4`, marked `≈`), contributor, and harness. On a wide take those values are inline (Duration, Tokens, `@login`, harness name). Tight cards keep icons and use tooltips. Duration and harness come from a short catalog `glance`. Duration and harness token usage stay `—` when the receipt did not capture them. The `≈` count is derived at catalog build time from `index.html`; it is not harness billing.

In Models grid or columns, that toolbar holds the model and its actions; the prompt is not repeated on every card (it is the same for all of them and sits in the level button tooltip). In Single, when the take is narrower than 720px, the actions show as icons with tooltips. The receipt status bar sits on the bottom edge of each card. Opening **Receipt** loads `receipt.json` for that take. The panel starts with the take's **Evaluation**: tier, review state, the four quality facets (0–4), and either all task gates passed or the gates that failed. A gold **fixed** badge means the HTML was repaired after generation so it runs in the public gallery. Multi-take cards also have **Open full size**, which opens that take in Single.

Post-generation repairs use an amendment run with the original generation statistics and source hashes. The frozen source run stays intact. Publish the amendment or rebuild with `--viewer` to keep the repaired take; publishing the source run restores its raw output.

Models view loads every playable take. Chrome may drop older WebGL canvases (`Too many active WebGL contexts`) when many models are on stage at once.

Open HTML or receipt panels stack on the right, one panel per take. If more than one panel is open, the stack scrolls and each panel keeps the same height.

The navigation bar beside the title holds **Explore** and **Compare**. Explore shows a **Single / Models / ABC** switch and returns to the last of those three views. The tools after it are **Bench**, **Filters** (prompt version only when a benchmark has more than one, optional month, and optional run; a badge counts the active month and run filters), **Layout** (Columns, Grid, or Rows, only where a view needs a layout), **Fit** (Fill or Fit), and **?** for the keyboard shortcuts. Icons are filled shapes; arrows, checks, and code marks stay as bold strokes. Bench unhides when the catalog has more than one live experiment. Month defaults to all months for the selected prompt version. Pick a month to narrow. If more than one run matches, Filters also lists those runs. Omit `date` to keep runs combined.

## Compare

Compare fills the available stage height with 2 or 3 takes side by side. Each slot bar shows the full model name and A/B/C pills; the benchmark picker appears only when more than one benchmark is live, and the actions wrap to a second line when the slot is narrow. In Fit, each slot keeps the take's 16:10 shape and the row centers on the stage. A compact global bar toggles between 2 and 3 views; each slot has its own model, benchmark, and A/B/C level pickers, so you can face two models on the same prompt or one model across the ladder. Each slot keeps the standard take toolbar (Reload, Copy prompt, HTML, Receipt). The chosen slots serialize to the `slots` query key, so a comparison is a shareable URL. Slots without a landed take typeset the prompt instead of faking a preview.

If a listed model has no playable HTML for the current filters, the stage typesets the prompt instead of faking a preview.

Default experiment order follows the live suite. Rollercoaster is first. The catalog lists every live suite bench, including benches with no published takes yet.

## Motion

Title, toast, Copy/Copied, Compact/Expand, stack headings, and the experiment/Filters/View/Fit chips scramble with Anime.js when their copy changes. Shared prefix and suffix stay still. Every view change also animates the stage shell and eligible short text: headings, labels, controls, summary cards, and status items. Long prompts, source code, and receipt JSON stay still for scan speed.

The transition has explicit `exit`, `enter`, `loading`, and `idle` phases. New iframes are rendered with `data-src`. The load queue cannot assign `src` until the exit, title, navigation, stage, and text animations for the current transition have settled. Reload follows the same rule after its loader animation. Source and receipt stacks keep the same panel for a take (`model::level`) so scroll, highlight, and copy state survive chrome updates; they still animate open and closed. Tooltips use the same snap curve. The model list uses Anime.js `createLayout` when a benchmark, month, or run change adds or removes models. `prefers-reduced-motion` skips travel, renders text immediately, and then starts the iframe queue.

## Shortcuts

- `←` / `→` step to the previous or next model in Single and ABC
- `1` / `2` / `3` select prompt level A / B / C
- `/` searches models
- `p` copies the focused take's prompt (toast + Copied)
- `h` toggles that take's HTML panel
- `r` toggles that take's receipt panel
- `[` toggles the compact sidebar
- `?` opens the shortcut list

Shortcuts still work while a closed picker button has focus.

## Query

Shareable keys: `experiment`, `level`, `model`, `mode` (`single`, `models`, `ladder`, `compare`), `slots`, `arrange`, `scale`, `prompt`, `month`, `date`, `film` (`compact` or `open`).

A query without `mode` opens Single; `writeQuery` omits the key for Single. Removed destinations also open Single. `slots` is only written in Compare mode, as `model~benchmark~level` triplets joined by commas (for example `slots=grok-4.6~rollercoaster~A,glm-5.3-max~rollercoaster~C`), capped at three slots. `arrange` is never written for Single.

`date` pins a single run. Multi-take views can be columns, grid, or rows, with Fill or Fit (virtual 1280×800) scale.
