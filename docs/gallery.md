# Gallery viewer

Preview the public stage (`gallery/index.html`) with `vp run dev`. After you regenerate `gallery/`, commit and push to `main` so CI deploys it. Local `vp run deploy` still works.

## Layout

The title is the desaturated experiment emoji plus `{benchmark} Bench` for the selected experiment.

The left sidebar holds A/B/C prompt-level buttons and models. Compact (or `[`) collapses the sidebar to an icon rail. The model list shows only models that have a generated HTML take for the selected benchmark and the current filters. In Models view every listed take is on stage. Click a model to hide or show it. Anime.js layout animates models that enter or leave that list.

**Table** is a coverage matrix: every benchmark against every model that has at least one playable take. A filled square is present for the current A/B/C level. An empty square is missing. A gold crown is the unique public vote leader for that prompt-V. A gold star is the staff pick (rollercoaster A prefers `grok-4.6`; other A takes prefer `grok-4.6-xhigh`, then `grok-4.6`; B and C prefer `grok-4.6-high`). Click a filled cell to open that take. Click the bench name to open the staff pick.

Each take has a top toolbar: the model name, the prompt in small type, then Vote, Reload, Copy prompt, HTML, and Receipt. In a multi-take view those actions belong to that take. If the toolbar is tight, the actions show as icons. A custom tooltip names each icon. Reload refreshes that take's iframe.

Single view fills the stage. The toolbar sits on the top edge. A status bar on the bottom edge shows duration, approximate output tokens from the HTML (`chars ÷ 4`, marked `≈`), contributor, and harness. On a wide take those values are inline (Duration, Tokens, `@login`, harness name). Tight cards keep icons and use tooltips. Duration and harness come from a short catalog `glance`. Duration and harness token usage stay `—` when the receipt did not capture them. The `≈` count is derived at catalog build time from `index.html`; it is not harness billing.

In Models grid or columns, that toolbar is two rows: actions on top, the prompt underneath. The receipt status bar sits on the bottom edge of each card. Opening **Receipt** loads `receipt.json` for that take. A gold **fixed** badge means the HTML was repaired after generation so it runs in the public gallery. Multi-take cards also have **Open full size**, which opens that take in Single.

Models view loads every playable take. Chrome may drop older WebGL canvases (`Too many active WebGL contexts`) when many models are on stage at once.

Open HTML or receipt panels stack on the right, one panel per take. If more than one panel is open, the stack scrolls and each panel keeps the same height.

The crown is a public winner vote for that prompt-V (`rollercoaster-A`). It selects a model, not a take date. Gold on the toolbar means your vote. Gold on the model list and in the Table view marks the unique leader. A tie shows no public crown. You can move your vote or click the same crown to clear it. Votes use an anonymous `ab_voter` cookie. The API does not store IP. If a vote request fails, that prompt shows no crowns. A later successful request can still load other prompts. Vote buttons stay hidden until at least one request succeeds.

The top toolbar groups **Bench**, **Filters** (prompt version, optional month, and optional run), **View** (Single, Models, ABC, Table, plus Columns/Grid/Rows when that view needs a layout), and **Fit** (Fill or Fit). View has previous and next arrows. Bench unhides when the catalog has more than one live experiment. Month defaults to all months for the selected prompt version. Pick a month to narrow. If more than one run matches, Filters also lists those runs. Omit `date` to keep runs combined. Fit is disabled in Table.

If a listed model has no playable HTML for the current filters, the stage typesets the prompt instead of faking a preview.

Default experiment order follows the live suite. Rollercoaster is first. The catalog lists every live suite bench, including benches with no published takes yet.

## Motion

Title, toast, Copy/Copied, Compact/Expand, vote labels, stack headings, and the experiment/Filters/View/Fit chips scramble with Anime.js when their copy changes. Shared prefix and suffix stay still. Source and receipt stacks keep the same panel for a take (`model::level`) so scroll, highlight, and copy state survive chrome updates; they still animate open and closed. Tooltips use the same snap curve. The model list uses Anime.js `createLayout` when a benchmark, month, or run change adds or removes models. `prefers-reduced-motion` skips travel and sets the text immediately.

## Shortcuts

- `1` / `2` / `3` select prompt level A / B / C
- `p` copies the focused take's prompt (toast + Copied)
- `h` toggles that take's HTML panel
- `r` toggles that take's receipt panel

## Query

Shareable keys: `experiment`, `level`, `model`, `mode` (`single`, `models`, `ladder`, `table`), `arrange`, `scale`, `prompt`, `month`, `date`, `film` (`compact` or `open`).

`date` pins a single run. Multi-take views can be columns, grid, or rows, with Fill or Fit (virtual 1280×800) scale.
