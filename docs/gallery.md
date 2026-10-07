# Gallery viewer

Preview the public stage (`gallery/index.html`) with `vp run dev`. Edit the viewer in `scripts/gallery-viewer.html`; `vp run gallery -- --viewer` copies it to `gallery/index.html` and also rebuilds `catalog.json`. After you regenerate `gallery/`, commit and push to `main` so CI validates it. Production deploys are manual through the **CI** workflow's `workflow_dispatch`, or with local `vp run deploy`.

## Landing

The gallery opens on the Landing view. A query without `mode` means landing; clicking the brand mark or the **Home** tab returns to it.

The compact landing hero shows gallery totals and launches a random 2-up or 4-up matchup. Two models open Compare; four open Models with only the drawn set visible. Benchmark cards appear before the live face-off so visitors can choose a task from the first desktop viewport. Each card shows the A/B/C ladder: the raw prompt, then only the words that B and C add, with each level's take count and its confirmed winner or provisional Tier 1 count. **See all** opens Models at that level. The card header holds Open (primary), ABC, and Compare. Rungs stack on narrow screens. The introduction states that repairs are marked on each take.

## Layout

The global title uses 🧪 with `Autonomy Bench`. A selected benchmark uses its desaturated experiment emoji plus `{benchmark} Bench`.

Only the live suite appears in the gallery and ranking. Ant Colony and Fireworks are suspended in [`.archives`](../.archives/README.md), with their definitions and published takes preserved. Historical finalized runs remain intact.

The Astra Light variant keeps the `gpt-6-astra-light` id and records the harness reasoning level as `low`. Token details read the measured Codex session counters, including cached input, without adding cache or reasoning output twice to the total.

The left sidebar holds the A/B/C prompt-level buttons (**A Raw**, **B +Autonomy**, **C +Showcase**; the take count is in the tooltip) and models. Compact (or `[`) collapses the sidebar to an icon rail. On narrow screens it becomes a horizontal model strip above the stage. The model list shows every model with a take in the selected benchmark, grouped by family (Anthropic, OpenAI, Google, xAI, and so on). Rows show only the brand and model name; a model without a take at the current level stays in the list, dimmed. The take's status bar carries its quality tier (`T1`, `T2`, … or `gate` when a required task gate failed), the A/B/C levels the model has, and the **new** badge. The list keeps its scrollbar space reserved, and the thumb shows only on hover or focus, so rows never shift. Changing level keeps the chosen model; the stage says the take did not land instead of switching models. **Search models** (or `/`) filters the list, and Enter opens the first match. A gold **new** badge marks models whose first playable take landed within the last 7 days, in the take status bar, on fresh Landing bench cards, and in Ranking. In Models view, click a model to hide or show it; a dimmed model has nothing to show. In ABC, clicking a model shows its ladder. In Landing, Compare, Ranking, Charts, or Table, clicking a model opens its playable take in Single for the active benchmark and level. Only Single and ABC mark a current model in the list, and the list scrolls to keep it in view. Above the list, a counter plus an **All / Only** button selects every model or collapses the selection to the focused model. Anime.js layout animates models that enter or leave that list.

**Coverage** (`mode=table`) is a matrix with one row per model that has at least one playable take, grouped by family, and one column per benchmark level (A, B, C). Each cell shows the take's state: a dot with its tier (gold for Tier 1), a half dot while it waits for review, a red cross when a required task gate failed, or a dash when there is no take. The Ladder column opens ABC for models with all three levels. A footer counts takes per level. On narrow screens the Ladder column and level names hide so the matrix fits. A gold crown is the unique public vote leader for that prompt-V. A gold star is the staff pick (rollercoaster A prefers `grok-4.6`; other A takes prefer `grok-4.6-xhigh`, then `grok-4.6`; B and C prefer `grok-4.6-high`). Click a cell to open that take at its level. Click the bench name to open the staff pick. Wide matrices use a themed horizontal scrollbar, sticky headings, and an Anime.js scroll cue that dismisses after the first horizontal move.

Each take has a top toolbar: the model name, the prompt in small type, then Vote, Reload, Copy prompt, HTML, and Receipt. In a multi-take view those actions belong to that take. If the toolbar is tight, the actions show as icons. A custom tooltip names each icon. Reload refreshes that take's iframe.

Single view fills the stage. The toolbar sits on the top edge. A status bar on the bottom edge shows duration, approximate output tokens from the HTML (`chars ÷ 4`, marked `≈`), contributor, and harness. On a wide take those values are inline (Duration, Tokens, `@login`, harness name). Tight cards keep icons and use tooltips. Duration and harness come from a short catalog `glance`. Duration and harness token usage stay `—` when the receipt did not capture them. The `≈` count is derived at catalog build time from `index.html`; it is not harness billing.

In Models grid or columns, that toolbar holds the model and its actions; the prompt is not repeated on every card (it is the same for all of them and sits in the level button tooltip). In Single, when the take is narrower than 720px, the actions show as icons with tooltips. The receipt status bar sits on the bottom edge of each card. Opening **Receipt** loads `receipt.json` for that take. The panel starts with the take's **Evaluation**: tier, review state, the four quality facets (0–4), and either all task gates passed or the gates that failed. A gold **fixed** badge means the HTML was repaired after generation so it runs in the public gallery. Multi-take cards also have **Open full size**, which opens that take in Single.

Models view loads every playable take. Chrome may drop older WebGL canvases (`Too many active WebGL contexts`) when many models are on stage at once.

Open HTML or receipt panels stack on the right, one panel per take. If more than one panel is open, the stack scrolls and each panel keeps the same height.

The crown is a public winner vote for that prompt-V (`rollercoaster-A`). It selects a model, not a take date. Gold on the toolbar means your vote. Gold on a take's vote button (Winner) and in Coverage marks the unique leader. A tie shows no public crown. You can move your vote or click the same crown to clear it. Votes use an anonymous `ab_voter` cookie. The API does not store IP. If a vote request fails, that prompt shows no crowns. A later successful request can still load other prompts. Vote buttons stay hidden until at least one request succeeds.

One navigation bar beside the title holds every destination: **Home**, **Explore**, **Compare**, **Ranking**, **Coverage**, and **Charts**. Explore shows a **Single / Models / ABC** switch and returns to the last of those three views. The tools after it are **Bench**, **Filters** (prompt version only when a benchmark has more than one, optional month, and optional run; a badge counts the active month and run filters), **Layout** (Columns, Grid, or Rows, only where a view needs a layout), **Fit** (Fill or Fit), and **?** for the keyboard shortcuts. Icons are filled shapes; arrows, checks, and code marks stay as bold strokes. Bench unhides when the catalog has more than one live experiment. Month defaults to all months for the selected prompt version. Pick a month to narrow. If more than one run matches, Filters also lists those runs. Omit `date` to keep runs combined. Fit is disabled in Table, Landing, Ranking, and Charts.

## Compare

Compare fills the available stage height with 2 or 3 takes side by side. Each slot bar shows the full model name and A/B/C pills; the benchmark picker appears only when more than one benchmark is live, and the actions wrap to a second line when the slot is narrow. In Fit, each slot keeps the take's 16:10 shape and the row centers on the stage. A compact global bar toggles between 2 and 3 views; each slot has its own model, benchmark, and A/B/C level pickers, so you can face two models on the same prompt or one model across the ladder. Each slot keeps the standard take toolbar (Vote, Reload, Copy prompt, HTML, Receipt). The chosen slots serialize to the `slots` query key, so a comparison is a shareable URL. Slots without a landed take typeset the prompt instead of faking a preview.

## Ranking

The gallery generator reads artifact-bound `quality-v2` reviews and writes deterministic `tiered-evidence-v3` results into `catalog.json`. Each `evaluation.json` stays bound to the SHA-256 of the exact published HTML artifact.

The review has two stages. First, a fixed 1440×900 browser run records load success, errors, automatic motion, interaction response, and viewport fit. Required task gates must pass. Second, a blind reviewer compares the initial, automatic, and interaction samples only against current takes from the same benchmark and level. The review records an ordinal preference plus separate clarity, motion and interaction, composition, and craft facets.

Eligible models are grouped into Pareto tiers across task success and the four quality facets. A model moves above another only when it is no worse on every signal and better on at least one. Equal or differently strong profiles remain in the same tier. Blind ordinal preference stays available for audit but cannot change the tier or row order. Stable model id makes tied rows deterministic. Historical attempts are reviewed separately. Incomplete takes with playable HTML are reviewed normally, while delivery stays separate.

One review produces a provisional result. Two independent reviews, including one human review, confirm it. A model receives an aggregate tier only after every current slot in that scope has a review. A winner is published only when every current candidate is confirmed and exactly one eligible model occupies Tier 1.

Task success, quality facets, blind preference, generation time, output size, delivery coverage, showcase repair status, and community votes remain separate. With the default Quality tier sort, the ranking table groups models into tier bands (rows inside a band are listed A → Z), then models that failed a task gate, then models not reviewed yet. Each row shows the four quality facets as values with bars, the task gates passed, average generation time, average output size, audience votes when any exist, and Open. Other sorts show one flat list with a tier chip on each row. On narrow screens rows become cards. No combined score or provisional podium is published.

See [the evaluation protocol](../SKILLS/autonomy-bench/references/evaluation.md) and [the cell evaluation schema](../schemas/cell-evaluation.schema.json).

## Charts

Charts draws every model with matching catalog facts instead of truncating the list. When the top values dwarf the rest, the scale caps near the third-highest value and the longer bars show a small break before their end: approximate output tokens, average generation duration, A → B → C token expansion for complete ladders, and suite completion. Completion counts unique benchmark-level slots, caps at 100%, and shows each model's average captured generation time beside the rate. A benchmark filter narrows every chart. Responsive rows keep labels, values, and bars inside the viewport. Bars animate on draw unless `prefers-reduced-motion` is set.

If a listed model has no playable HTML for the current filters, the stage typesets the prompt instead of faking a preview.

Default experiment order follows the live suite. Rollercoaster is first. The catalog lists every live suite bench, including benches with no published takes yet.

## Motion

Title, toast, Copy/Copied, Compact/Expand, vote labels, stack headings, and the experiment/Filters/View/Fit chips scramble with Anime.js when their copy changes. Shared prefix and suffix stay still. Every view change also animates the stage shell and eligible short text: headings, labels, controls, summary cards, and status items. Dense table cells, long prompts, source code, and receipt JSON stay still for scan speed.

The transition has explicit `exit`, `enter`, `loading`, and `idle` phases. New iframes are rendered with `data-src`. The load queue cannot assign `src` until the exit, title, navigation, stage, text, and chart animations for the current transition have settled. Reload follows the same rule after its loader animation. Source and receipt stacks keep the same panel for a take (`model::level`) so scroll, highlight, and copy state survive chrome updates; they still animate open and closed. Tooltips use the same snap curve. The model list uses Anime.js `createLayout` when a benchmark, month, or run change adds or removes models. Chart bars and the Table scroll cue use the same motion system. `prefers-reduced-motion` skips travel, renders text immediately, and then starts the iframe queue.

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

Shareable keys: `experiment`, `level`, `model`, `mode` (`single`, `models`, `ladder`, `compare`, `landing`, `ranking`, `charts`, `table`), `slots`, `arrange`, `scale`, `prompt`, `month`, `date`, `film` (`compact` or `open`).

A query without `mode` opens the Landing view; `writeQuery` omits the key for landing, so the home URL stays clean. `slots` is only written in Compare mode, as `model~benchmark~level` triplets joined by commas (for example `slots=grok-4.6~rollercoaster~A,glm-5.3-max~rollercoaster~C`), capped at three slots. `arrange` is never written for Single, Landing, Ranking, or Charts.

`date` pins a single run. Multi-take views can be columns, grid, or rows, with Fill or Fit (virtual 1280×800) scale.
