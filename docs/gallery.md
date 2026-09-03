# Gallery viewer

Preview the public stage (`gallery/index.html`) with `vp run dev`. After you regenerate `gallery/`, commit and push to `main` so CI deploys it. Local `vp run deploy` still works.

## Landing

The gallery opens on the Landing view. A query without `mode` means landing; clicking the brand mark returns to it. The landing is the home screen, not an entry in the View picker.

The compact landing hero shows gallery totals and launches a random 2-up or 4-up matchup. Two models open Compare; four open Models with only the drawn set visible. Each benchmark card lists its live takes and reviewed level-A quality leader when one exists, with one-click entries into Single, Models, the ABC ladder, and Compare. On ultra-wide screens the live face-off sits beside the hero and benchmark cards use the available width; the layout progressively stacks into one column on narrow screens.

## Layout

The title is the desaturated experiment emoji plus `{benchmark} Bench` for the selected experiment.

The left sidebar holds A/B/C prompt-level buttons and models. Compact (or `[`) collapses the sidebar to an icon rail. On narrow screens it becomes a horizontal model strip above the stage. The model list shows only models that have a generated HTML take for the selected benchmark and the current filters. A gold **new** badge marks models whose first playable take landed within the last 7 days; the same badge marks fresh benchmarks on the Landing bench cards and fresh models in Ranking (podium and table). In Models view, click a model to hide or show it. In Landing, Compare, ABC, Ranking, Charts, or Table, clicking a model opens its playable take in Single for the active benchmark and level. Above the list, a counter plus an **All / Only** button selects every model or collapses the selection to the focused model. Anime.js layout animates models that enter or leave that list.

**Table** is a coverage matrix: every benchmark against every model that has at least one playable take. A filled square is present for the current A/B/C level. An empty square is missing. A gold crown is the unique public vote leader for that prompt-V. A gold star is the staff pick (rollercoaster A prefers `grok-4.6`; other A takes prefer `grok-4.6-xhigh`, then `grok-4.6`; B and C prefer `grok-4.6-high`). Click a filled cell to open that take. Click the bench name to open the staff pick. Wide matrices use a themed horizontal scrollbar, sticky headings, and an Anime.js scroll cue that dismisses after the first horizontal move.

Each take has a top toolbar: the model name, the prompt in small type, then Vote, Reload, Copy prompt, HTML, and Receipt. In a multi-take view those actions belong to that take. If the toolbar is tight, the actions show as icons. A custom tooltip names each icon. Reload refreshes that take's iframe.

Single view fills the stage. The toolbar sits on the top edge. A status bar on the bottom edge shows duration, approximate output tokens from the HTML (`chars ÷ 4`, marked `≈`), contributor, and harness. On a wide take those values are inline (Duration, Tokens, `@login`, harness name). Tight cards keep icons and use tooltips. Duration and harness come from a short catalog `glance`. Duration and harness token usage stay `—` when the receipt did not capture them. The `≈` count is derived at catalog build time from `index.html`; it is not harness billing.

In Models grid or columns, that toolbar is two rows: actions on top, the prompt underneath. The receipt status bar sits on the bottom edge of each card. Opening **Receipt** loads `receipt.json` for that take. A gold **fixed** badge means the HTML was repaired after generation so it runs in the public gallery. Multi-take cards also have **Open full size**, which opens that take in Single.

Models view loads every playable take. Chrome may drop older WebGL canvases (`Too many active WebGL contexts`) when many models are on stage at once.

Open HTML or receipt panels stack on the right, one panel per take. If more than one panel is open, the stack scrolls and each panel keeps the same height.

The crown is a public winner vote for that prompt-V (`rollercoaster-A`). It selects a model, not a take date. Gold on the toolbar means your vote. Gold on the model list and in the Table view marks the unique leader. A tie shows no public crown. You can move your vote or click the same crown to clear it. Votes use an anonymous `ab_voter` cookie. The API does not store IP. If a vote request fails, that prompt shows no crowns. A later successful request can still load other prompts. Vote buttons stay hidden until at least one request succeeds.

The top toolbar groups the report shortcuts **Rank**, **Coverage**, and **Charts** beside the title, then **Bench**, **Filters** (prompt version, optional month, and optional run), **View** (Single, Models, ABC, Compare, plus Columns/Grid/Rows when that view needs a layout), and **Fit** (Fill or Fit). Each report shortcut has its own Tabler-style icon. View has previous and next arrows and is hidden on Landing. Bench unhides when the catalog has more than one live experiment. Month defaults to all months for the selected prompt version. Pick a month to narrow. If more than one run matches, Filters also lists those runs. Omit `date` to keep runs combined. Fit is disabled in Table, Landing, Ranking, and Charts.

## Compare

Compare fills the available stage height with 2 or 3 takes side by side. A compact global bar toggles between 2 and 3 views; each slot has its own model, benchmark, and A/B/C level pickers, so you can face two models on the same prompt or one model across the ladder. Each slot keeps the standard take toolbar (Vote, Reload, Copy prompt, HTML, Receipt). The chosen slots serialize to the `slots` query key, so a comparison is a shareable URL. Slots without a landed take typeset the prompt instead of faking a preview.

## Ranking

The gallery generator reads artifact-bound `quality-v2` reviews and writes deterministic `tiered-evidence-v3` results into `catalog.json`. Each `evaluation.json` stays bound to the SHA-256 of the exact published HTML artifact.

The review has two stages. First, a fixed 1440×900 browser run records load success, errors, automatic motion, interaction response, and viewport fit. Required task gates must pass. Second, a blind reviewer compares the initial, automatic, and interaction samples only against current takes from the same benchmark and level. The review records an ordinal preference plus separate clarity, motion and interaction, composition, and craft facets.

Eligible models are grouped into Pareto tiers across task success and the four quality facets. A model moves above another only when it is no worse on every signal and better on at least one. Equal or differently strong profiles remain in the same tier. Blind ordinal preference stays available for audit but cannot change the tier or row order. Stable model id makes tied rows deterministic. Historical attempts are reviewed separately. Incomplete takes with playable HTML are reviewed normally, while delivery stays separate.

One review produces a provisional result. Two independent reviews, including one human review, confirm it. A model receives an aggregate tier only after every current slot in that scope has a review. A winner is published only when every current candidate is confirmed and exactly one eligible model occupies Tier 1.

Task success, quality facets, blind preference, generation time, output size, delivery coverage, showcase repair status, and community votes remain separate. The compact ranking table shows only tier, model, average generation time, audience signal, and action; the quality profile is available from the tier. No combined score or provisional podium is published.

See [the evaluation protocol](../SKILLS/autonomy-bench/references/evaluation.md) and [the cell evaluation schema](../schemas/cell-evaluation.schema.json).

## Charts

Charts draws every model with matching catalog facts instead of truncating the list: approximate output tokens, average generation duration, A → B → C token expansion for complete ladders, and suite completion. Completion counts unique benchmark-level slots, caps at 100%, and shows each model's average captured generation time beside the rate. A benchmark filter narrows every chart. Responsive rows keep labels, values, and bars inside the viewport. Bars animate on draw unless `prefers-reduced-motion` is set.

If a listed model has no playable HTML for the current filters, the stage typesets the prompt instead of faking a preview.

Default experiment order follows the live suite. Rollercoaster is first. The catalog lists every live suite bench, including benches with no published takes yet.

## Motion

Title, toast, Copy/Copied, Compact/Expand, vote labels, stack headings, and the experiment/Filters/View/Fit chips scramble with Anime.js when their copy changes. Shared prefix and suffix stay still. Every view change also animates the stage shell and eligible short text: headings, labels, controls, summary cards, and status items. Dense table cells, long prompts, source code, and receipt JSON stay still for scan speed.

The transition has explicit `exit`, `enter`, `loading`, and `idle` phases. New iframes are rendered with `data-src`. The load queue cannot assign `src` until the exit, title, navigation, stage, text, and chart animations for the current transition have settled. Reload follows the same rule after its loader animation. Source and receipt stacks keep the same panel for a take (`model::level`) so scroll, highlight, and copy state survive chrome updates; they still animate open and closed. Tooltips use the same snap curve. The model list uses Anime.js `createLayout` when a benchmark, month, or run change adds or removes models. Chart bars and the Table scroll cue use the same motion system. `prefers-reduced-motion` skips travel, renders text immediately, and then starts the iframe queue.

## Shortcuts

- `1` / `2` / `3` select prompt level A / B / C
- `p` copies the focused take's prompt (toast + Copied)
- `h` toggles that take's HTML panel
- `r` toggles that take's receipt panel

## Query

Shareable keys: `experiment`, `level`, `model`, `mode` (`single`, `models`, `ladder`, `compare`, `landing`, `ranking`, `charts`, `table`), `slots`, `arrange`, `scale`, `prompt`, `month`, `date`, `film` (`compact` or `open`).

A query without `mode` opens the Landing view; `writeQuery` omits the key for landing, so the home URL stays clean. `slots` is only written in Compare mode, as `model~benchmark~level` triplets joined by commas (for example `slots=grok-4.6~rollercoaster~A,glm-5.3-max~rollercoaster~C`), capped at three slots. `arrange` is never written for Single, Landing, Ranking, or Charts.

`date` pins a single run. Multi-take views can be columns, grid, or rows, with Fill or Fit (virtual 1280×800) scale.
