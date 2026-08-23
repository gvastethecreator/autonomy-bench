# Gallery viewer

The public stage is `gallery/index.html`. Preview it with `vp run dev`. Deploy with `vp run deploy` after you regenerate `gallery/`.

## Layout

The title is `{benchmark} Bench` for the selected experiment.

The left sidebar holds the experiment select, A/B/C prompt-level buttons, and models. Compact (or `[`) collapses it to an icon rail. The experiment menu shows a desaturated emoji beside the name. The model list shows only models that have a generated HTML take for the selected benchmark and the current month or run. Anime.js layout animates models that enter or leave that list.

Each take has a top toolbar: the model name with a crown, the prompt in small type, then Copy prompt, HTML, and Receipt. In a multi-take view those actions belong to that take. If the toolbar is tight, the actions show as icons. A custom tooltip names each icon. Open HTML or receipt panels stack on the right, one panel per take. If more than one panel is open, the stack scrolls and each panel keeps the same height.

The crown is a public winner vote for that prompt-V (`rollercoaster-A`). It selects a model, not a take date. Gold on the toolbar means your vote. Gold on the model list means that model is the unique leader. A tie shows no public crown. You can move your vote or click the same crown to clear it. Votes use an anonymous `ab_voter` cookie. The API does not store IP. If `/api/votes` is down, the crowns stay hidden.

Prompt versions, months, and runs are selects in the top toolbar. If a month has more than one run, a second select pins one of them. Omit `date` to keep the month combined.

If a listed model has no playable HTML for the current filters, the stage typesets the prompt instead of faking a preview.

Default experiment order: Rollercoaster, Endless Driving, Medieval City, Procedural Biped, Infinite Maze.

## Motion

Title, toast, Copy/Copied, Compact/Expand, vote labels, and the experiment/prompt/month/run chips scramble with Anime.js when their copy changes. Shared prefix and suffix stay still. Source and receipt stacks, plus Compact, animate open and closed. Tooltips use the same snap curve. The model list uses Anime.js `createLayout` when a benchmark, month, or run change adds or removes models. `prefers-reduced-motion` skips travel and sets the text immediately.

## Shortcuts

- `1` / `2` / `3` select prompt level A / B / C
- `p` copies the focused take's prompt (toast + Copied)
- `h` toggles that take's HTML panel
- `r` toggles that take's receipt panel

## Query

Shareable keys: `experiment`, `level`, `model`, `mode`, `arrange`, `scale`, `prompt`, `month`, `date`, `film` (`compact` or `open`).

`date` pins a single run. Multi-take views can be columns, grid, or rows, with Fill or Fit (virtual 1280×800) scale.
