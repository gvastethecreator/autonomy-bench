# Gallery viewer

The public stage is `gallery/index.html`. Preview it with `vp run dev`. Deploy with `vp run deploy` after you regenerate `gallery/`.

## Layout

The title is `{benchmark} Bench` for the selected experiment. The subtitle is the prompt text.

The left sidebar holds the experiment select, A/B/C, models, Prompt, HTML, and Receipt. Compact (or `[`) collapses it to an icon rail.

Prompt versions, months, and runs are selects in the top toolbar. If a month has more than one run, a second select pins one of them. Omit `date` to keep the month combined.

Unavailable models stay in the sidebar. The stage typesets their prompt instead of faking a preview.

## Motion

Title, prompt, toast, and control labels scramble with Anime.js when their copy changes. Shared prefix and suffix stay still. Source and receipt drawers, plus Compact, animate open and closed. `prefers-reduced-motion` skips travel and sets the text immediately.

## Shortcuts

- `p` copies the current prompt (toast + Copied)
- `h` toggles the source drawer
- `r` toggles the receipt drawer
- `1` / `2` / `3` select A / B / C

HTML and Receipt open independent panels from the right. Both can stay open.

## Query

Shareable keys: `experiment`, `level`, `model`, `mode`, `arrange`, `scale`, `prompt`, `month`, `date`, `film` (`compact` or `open`).

`date` pins a single run. Multi-take views can be columns, grid, or rows, with Fill or Fit (virtual 1280×800) scale.
