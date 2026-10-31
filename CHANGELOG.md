# Changelog

## [Unreleased]

### Added

- `status-grid` cells take an `emphasis` — `invert` (a cell filled with its tone), `hatch`, `blink`, or `stamp` (a heavy frame; a cell
  is too small for a stamp's text) — the second channel besides colour that `status-card`, `stat-list` and the other state-coloured
  widgets already draw. A cell with an emphasis word the widget does not know is drawn without one, as before.

- `callout` takes `options.live`: `"auto"` (the default — a `warn` or `alarm` callout is announced at once, the other tones at
  the next pause, as before) or `"off"`, which draws it as a plain `note` that is not announced. A host that shows content
  already written — a saved report, an earlier conversation — is not telling the user anything new, and a screen reader
  broke off for every warning callout in it. The look of the tone is unchanged.
- `metric` and `stat-group` items take `polarity`, `changeUnit` and `target`. The change was coloured by direction —
  a rise green, a fall red — so a defect rate, a lead time or a cost that went up read as good news. `polarity` says
  which way is good: `higher-better`, `lower-better` (a rise is drawn in the negative colour, the arrow still points
  up) or `neutral` (the direction without a judgement). Without it a metric looks as before. `changeUnit` replaces
  the `%` written after `change` (`"pt"`, or `""` for an absolute amount). `target` is the comparison value, written
  under the figure in the value's format and unit («Target 2.5 %», «목표 2.5 %» in Korean — new locale string
  `metricTarget`).
- A `meter` takes `target`: a bar draws a mark across the track at that value — a bullet graph, the value and what it is
  measured against — and announces it («72 %, Target 85 %»). On a `metric`, a meter of the figure itself takes the
  metric's `target`. `metric` and `status-card` both draw it; a ring draws no mark.
- A `format` can be a spreadsheet number-format code — `"#,##0.00"`, `"0.0%"`, `"#,##0;[Red](#,##0)"` — once
  `@iyulab/u-widgets/components` is imported. It is read by `applyNumberFormat` of `@iyulab/components`, the engine its
  table and sheet read their column `format` with, so one code writes one text in a table, a sheet and a widget (and
  never a signed zero). A code the engine does not support, or any code without the import, is shown as the plain value
  with a console warning; the format words (`number:2`, `compact`, `currency:EUR`, …) are unchanged. A `format` is typed as any string for this.

### Changed

- The optional peer `@iyulab/components` is `>=2.36.0` (was `>=2.8.0`) — the `u-widgets/components` entry now imports its
  number-format engine, which 2.36.0 introduced. A package that does not import `u-widgets/components` does not need
  `@iyulab/components` at all; one that does should move to 2.36 or later.

### Fixed

- Number formats never write a signed zero. A negative value that rounds to zero (`-0.00001` at `number:2`, a tiny
  negative percentage, currency or compact value) read `-0.00`; it is now `0.00`. A value that does not round to
  zero keeps its sign.
- `number` without digits no longer writes a small nonzero value as `0`. Its default (at most three decimals) turned
  every value below 0.0005 — data in a small unit — into a column of zeros. Such a value now keeps four significant
  digits in scientific notation (`7.729E-8`, `7,729E-8` in German). `number:N` is unchanged: fixed decimals, as
  asked.
- A chart drawn wholly through `options.echarts` (`data: []`, its axes and series declared there) reads its numbers
  in the widget locale too. The locale default for value axes and the tooltip ran before the passthrough was merged,
  so an axis or a tooltip only the passthrough declared wrote `10,000` and `0.5` on a German page. It now also runs on
  the merged option — still only where no formatter is set, so one given through `options.echarts` keeps winning.
- A spreadsheet number-format code the shared engine cannot write no longer stops a widget drawing. A code with more integer digit
  placeholders than the platform's number formatter takes (about twenty) made the engine throw a `RangeError` out of the render; the
  value is now shown as it is, with the console warning an unsupported code already gets.
- `gauge`: a band label cut with «…» to fit the arc keeps its full text on the page — the subtitle now sits in a group
  whose `<title>` carries the whole label, shown on hover. A short label gets no title. (A screen reader already read
  the whole label from the meter's `aria-valuetext`.)

## [0.44.0] - 2026-10-29

### Added

- `setMediaOrigins(origins)` and `getMediaOrigins()` — say which origins media may load from. `image`, `gallery`,
  `video` (source, poster, subtitle tracks), the `status-card` picture and the `list` avatar request the URL the spec
  gives as soon as they are drawn, which lets a spec from an untrusted source put what it knows in a URL and have the
  browser send it out. They now all pass one check: with origins set, a URL outside them is not requested and the
  widget draws its `alt` text instead (`part="blocked"`); `'self'` is the page's own origin and `[]` allows nothing.
  Nothing is restricted until it is called. `checkSpec` warns of each `image`, `gallery` and `video` URL the
  restriction refuses. An inline `data:image/…` in a `status-card` or an avatar still draws, as it always did.

### Fixed

- The page theme (`<html data-theme>` or `<html theme>`) now reaches a `<u-widget>` that sits inside another element's
  shadow root. The sync looked widgets up with `document.querySelectorAll`, which does not cross a shadow boundary, so
  a widget there kept the light tokens on a dark page. A widget in a shadow tree now reports itself when it connects
  and follows every later change of the page's declaration; one that disconnects is no longer written to.

### Changed

- The MCP server (`@iyulab/u-widgets-mcp` 0.7.8) follows `^0.44.0`.

## [0.43.0] - 2026-10-27

### Fixed

- `gauge` reads `data.min` and `data.max` in every form. The arc and the level forms took the scale from `options`
  only — a capacity the source gave in `data.max` was ignored and the scale stayed at 100 — while `progress` already
  read `data.max`. The data now wins over the options, in `gauge` and `progress` alike; a value that is not a number
  (text that does not read as one, `null`, a boolean) is not a scale.

- With the components bridge (`themes/components.css`), the `warn` tone follows the app again: its text and mark take
  `--u-warning-color-strong`. Since 0.42.0 gave `warn` a colour of its own, the bridge set only `--u-widget-warning`,
  which nothing read, so a themed app kept the widget's `#b45309`.

### Removed

- `--u-widget-warning`. Nothing has read it since 0.42.0 — setting it changed nothing. Set `--u-widget-tone-warn` for
  the `warn` tone's colour.

### Changed

- README: the install section names the components bridge.
- The skill's widget catalog lists `status-card`, `status-grid`, `bar-list` and `header` (with their `uw-*` elements);
  it called `header` inline, without a tag.
- The MCP server (`@iyulab/u-widgets-mcp` 0.7.7) follows `^0.43.0`.

## [0.42.0] - 2026-10-24

### Added

- A toned value takes its own mark in place of its tone's (✓ ▲ ✕ …), so a state an app names its own way keeps its own
  mark: `glyph` on a `status-card`'s, a `header`'s, a `kv` item's and a `status` item's data, and `mapping.glyph` — the
  field holding each row's mark — on a `table` and a `list`. `toneMark(tone, glyph)` is the same for a host's own drawing.
  A `table` lists `mapping.tone` among its mapping keys, as it already read it.

### Fixed

- The `warn` tone reads on a light page: its text and mark are `#b45309` (5.0:1 on the page, 3.8:1 on its own badge),
  where they took the warning colour `#d97706` (3.2:1, and 2.5–2.8:1 on a badge). `--u-widget-warning` — a fill, a chart's
  series — is unchanged, and the dark theme keeps `#fbbf24`. Every tone is now checked at 4.5:1 on the page and 3:1 on
  its own badge, in both themes.

### Changed

- The MCP server (`@iyulab/u-widgets-mcp` 0.7.6) follows `^0.42.0`.

## [0.41.1] - 2026-10-23

### Changed

- Chart text follows the widget's type tokens: axis labels and the chart's own text at `--u-widget-font-size-caption`,
  the legend at `--u-widget-font-size-label` (the compact layout of a small chart keeps its smaller sizes). With the
  defaults this is the same 12px for axes; the legend goes from 12px to 13px.
- `themes/components.css` also bridges the four font sizes to the steps of the same names (`--u-text-body-size`,
  `-label-`, `-caption-`, `-overline-`), so a page that rescales its type — a large-text wall display — rescales the
  widgets and their charts with it. Under the house ladder the label step is 12px where the widget default was 13px.

### Removed

- `--u-widget-duration-normal` — nothing has read it since the form widget moved to `<formdown-ui>` (0.40.0), so
  setting it had no effect. Transitions read `--u-widget-duration-fast` and `--u-widget-duration-slow`.

## [0.41.0] - 2026-10-23

MCP server 0.7.5 follows `^0.41.0`.

### Added

- `table` rows and cells with a state: `mapping.tone` names a field with each row's tone (a stripe, a tint and the
  tone's mark, named, in the first cell; `past` dims a row, `now` picks it out) and a column's `toneField` a field with
  its cell's own tone. A column takes a `unit`, and `cell: "bar"` (the value as a bar against the column's `max`, else
  its largest value) or `cell: "tone"` (the value read as a tone — its mark and name). `options.interactive: false` is a
  table only to be looked at — no search, sorting, pages, row focus or picking a row — and `options.maxItems` shows the
  first rows of a table that is not paged and says how many more. A list's columns take the same.
- The tools list `sortable` among a table's options.

- `gauge` forms and scale marks: `options.form` draws the reading as an `arc` (as before) or a level rising in a
  `vertical` column, a `tank` or a `thermometer`; `options.band: { lo, hi }` draws the acceptable range beside the
  scale, `options.marks: [{ at, label? }]` labelled lines on it. A gauge's colour can be a state — `data.tone`, or a
  `tone` instead of a `color` on a threshold step (on `progress` too).

- `bar-list` widget: items compared as bars, without a chart's axes — `[{ label, value, max?, unit?, format?, tone?,
  note? }]`, each row its label, written value and a bar in its tone, on one scale (`options.max`, else the largest
  value) or an item's own `max`. `options.form: "pictogram"` draws a row of glyphs instead (`options.glyph`, one per
  `options.glyphValue`), `options.maxItems` shows the first rows and says how many more.

- `metric` (and each `stat-group` item) takes a `meter` — its value against a range, the way `status-card` has one —
  and a `note` under the value. A meter's `form` is `bar` or `ring` (on `status-card` too), and it is announced as a
  meter of its own range (`aria-valuemin` · `aria-valuemax`, the written value as its text) rather than as a
  percentage.

- `status-grid` widget: many small cells, each with a state — `[{ label?, tone, value?, unit?, format? }]`, the cells
  `square`, `chip` or `dot` (`options.cell`), `options.columns` to a row, and with `options.counts` a key of how many
  cells are in each tone. Each cell is spoken as its label, value and tone.

- `kv` is a stat list: an array item takes `unit`, `format` (the value formatted), `tone` (its colour and mark) and a
  `note` under the value.

- `header` is a title block: besides `text` and `level`, a `kicker` above, a `subtitle` under, the `date` and `time` it
  is for or a running `clock: true`, `aside` label · value pairs (formatted, toned) and the state as a `tone` badge with
  `status` words. It is drawn by its own element, `<uw-header>` (the heading keeps `role="heading"` and its level).

- `list` rows as a board shows them: `mapping.tone` (each row's tone — its mark and colour; `past` dims a row, `now`
  picks it out), `mapping.time` (a time first in each row, a date-time as its time of day), `mapping.columns` (values
  after the text, each formatted, under a caption row when labelled), `options.maxItems` (then «+N more», new locale
  key `moreItems`) and `options.layout: "tiles"`.
- The JSON schema names the `status-card` widget, and the list's `time` and `tone` mapping fields.

- `status-card` widget: one asset or place — `title`, `subtitle`, its state as a `tone` (a stripe and a badge with the
  tone's mark and the `status` words, or the tone's name in the widget's locale), `emphasis` (`stamp`: the words as a
  stamp), `readings` (label · value pairs, each formatted with `format` and `unit` and optionally toned), a `meter`
  against its range, a picture (`image` — a URL or an inline `data:image/…` — or an `icon`) and a `note`. It fits boxes
  from about 130px wide (narrow, the badge goes under the name and the readings stack), and `options.overflow` clips
  (default), fades or scrolls what does not fit.

- Tones: one vocabulary of eleven for every widget that colours a value by its state — `ok` · `info` · `watch` · `warn`
  · `alarm` · `off` · `idle` · `accent` · `past` · `now` · `next` (`watch` is the early sign before a warning, `off` is
  switched off and `idle` waiting for work, `past` · `now` · `next` are places in a sequence). Each has a mark (✓ ● ◆ ▲ ✕
  – ○ ★ ✓ ▶ ›), a name in the widget's locale (new keys `toneOk` … `toneNext`, in Korean too) and a colour token,
  `--u-widget-tone-<tone>`, in light and dark; `info` is a blue of its own rather than the accent. `TONES`, `isTone`,
  `toneLabel(tone, strings)`, `TONE_GLYPHS`, `EMPHASES`, `isEmphasis` and the types `Tone`, `Emphasis` are exported.
- `emphasis` on a `status` item and a `metric` value — `invert` (a fill of its tone), `hatch`, `stamp` (the value, or
  for a metric the tone's name, as a rubber stamp) or `blink` (a steady outline instead under reduced motion): a second
  channel besides colour for a state that must not be missed.
- A `status` item may have a `tone` and no `value`; it shows the tone's name.
- `options.frame` on any widget draws it, with its title, in a panel — `card` · `flat` · `glow` · `plate` · `ticket`
  (scalloped edges) · `postage` (perforated) · `tape` (askew) — of the page's palette tokens, so a page need not draw a
  panel under a chart. `FRAMES`, `isFrame` and the type `Frame` are exported.
- Typeface tokens: `--u-widget-font-display` (titles, the `header` widget, a stamp) and `--u-widget-font-numeric` (a
  metric's value, a gauge's reading, a right-aligned table column — with digits of one width); both are the body face
  unless set. Charts now draw their text in `--u-widget-font-family`, so a page's face reaches them too.
- A bar, line or area chart whose x values are all dates or times as ISO text labels them in the widget's locale — the
  time of day when they are on one day, the date when they are all midnights, both otherwise — instead of the raw text,
  on the axis and in the tooltip. An x format, `categoryAxisFormat` or `xAxisType` in the spec takes over.
- The tooltip writes values with the value axis format (`yFormat`, or `valueAxisFormat`) when the spec gives one —
  `3.00 kg` in the tooltip as on the axis.

### Changed

- **Breaking:** a format is written one way everywhere. A chart's `xFormat` · `yFormat` · `valueAxisFormat` ·
  `categoryAxisFormat` is a format string, as a value's `format` and a column's are — the object is not read, and
  `validate` names it:

  | Was | Now |
  |---|---|
  | `{ type: 'time' }` (any `type` alone) | `'time'` |
  | `{ type: 'number', decimals: 1 }` | `'number:1'` |
  | `{ type: 'currency', currency: 'KRW' }` | `'currency:KRW'` |
  | `{ type: 'number', compact: true }` · with `currency` | `'compact'` · `'compact:KRW'` |
  | `{ suffix: '%' }` | `'percent'` |
  | `{ suffix: ' kg' }` | `options.unit: 'kg'` (the value axis and the tooltip) |

  A percent on an axis is written as the widget's locale writes one (`50 %` in German). The grammar gains `compact`
  (`1.2M`), `compact:2` and `compact:KRW` (`₩1.2억`) for every widget's values too.

- The JSON schema's table column is the column as it is: `tone` (one of the eleven) where it still named the old
  `variant` — a column with a `tone` failed it; `format` takes the forms with a suffix (`number:2`, `currency:EUR`);
  and the new `unit`, `toneField`, `cell` and `max`.

- **Breaking:** the closed five-level vocabularies are replaced by `tone`:

  | Was | Now |
  |---|---|
  | `status` item `level` | `tone` |
  | `metric` / `stat-group` item `variant` | `tone` |
  | `table` column `variant` | `tone` |
  | `callout` `level` | `tone` (`warn` and `alarm` are announced, as `warning` and `error` were) |
  | `success` · `warning` · `error` / `danger` · `info` · `neutral` | `ok` · `warn` · `alarm` · `info` · `idle` |

  The rename is mechanical; the old words are not read. A word that is not a tone draws as no tone and warns once in
  the console, naming the tones. A `status` item with no tone is drawn plainly — no colour, no mark — where it was
  `info` before. The parts and their names (`status-icon`, `status-value`, …) are as before; the attribute a page can
  style by is `data-tone` (was `data-level` / `data-variant`).
- **Breaking:** the line under a `metric` value is `note` (was `description`) — the word `kv` and `status-card` use for
  it. The part is `note` (was `description`); `validate` warns about an item that still has `description`.
- **Breaking:** a `kv` array item is `{ label, value }` (was `{ key, value }`) — the same `label` · `value` the other
  widgets use. An item with `key` is not drawn, and `validate` says it was renamed.
- **Breaking:** `options.card: true` is `options.frame: "card"` — on a `compose` (each child in a card, as before) and on
  any widget. The panel's look is the frame's: the `.child-card` class is gone; a child in a frame carries
  `data-frame`.

## [0.40.0] - 2026-10-23

MCP server 0.7.4 follows `^0.40.0`.

### Changed

- **Breaking:** the `form` widget's fields are drawn, checked and offered suggestions by `<formdown-ui>`
  (`@formdown/ui`, now a dependency, with `@formdown/core` pinned to the same version). The spec does not change —
  `fields` (or `formdown`), `data`, `fieldStates`, `actions` and the events are as before — but what the fields are
  made of is formdown's:
  - The fields sit in `<formdown-ui>`'s shadow root. A page styles them as before through the parts the widget passes
    on (`uw-form::part(field|label|input|field-error|suggestion|decline|field-note|radio-group|checkbox-group|description)`);
    a `multiselect` is a `<select multiple>`, a `toggle` a switch checkbox.
  - Every rule a field declares is checked on submit — required, length, range, number, email, URL, phone, date and
    `pattern`, which now has to match the whole value. Each failing field shows why under it, is marked
    `aria-invalid`, and the first one takes focus. The sentences are the widget locale's (new keys `invalidNumber`,
    `invalidTel`, `invalidDate`, `dateMin`, `dateMax`).
  - Enter in a field moves to the next field; a form is submitted through its `submit` action. A form with no actions
    is no longer submitted by Enter.
  - A `submit` or action event carries the spec's `data` with the fields' values over it, a number or range field's
    value as a number; a `change` event's value is typed the same way.
  - A field's `message` is its own sentence for whichever rule its value breaks first — not only `required` — as
    `setCustomValidity` gives one sentence a control. In formdown text it is `error-message="…"`, and a form read from
    formdown keeps it as `message`.
  - A suggestion button of a field with options shows the option's label, says with `aria-pressed` whether it is the
    field's value now, and the buttons of a field are a group named for it.
  - A checkbox, radio or switch label is at least 24px tall (WCAG 2.2 target size); an option's label is the part
    `option-label`.
  - `u-widgets/components` draws date and datetime fields with `<u-date-picker>` as a formdown field type, so every
    `<formdown-ui>` on the page draws it, not only the form widget's. A datetime is still sent as
    `YYYY-MM-DDTHH:mm` in local time.
  - `<formdown-ui>` and the formdown core it reads with load when the first form is drawn, so a page that shows no
    form does not carry them (about 70 KB gzipped). An action pressed before they have loaded waits for them.
  - The package can be imported in Node again — `@formdown/ui` 0.24 no longer bundles a second copy of Lit's base
    class (an MCP server that reads specs in Node failed to start).

## [0.39.0] - 2026-10-21

MCP server 0.7.3 follows `^0.39.0`.

### Changed

- A chart with axes (bar, line, area, scatter, box, histogram, waterfall, gantt, heatmap) lays itself out to its canvas
  at every size, not only a small one: the axis labels and names are kept inside the canvas, with room above the plot
  only for a legend (now placed on top) or a reference line's label. ECharts' own margins — 60px above and below and
  a tenth of the width each side — drew the plot in about half of a chart a few hundred pixels tall. A spec that puts
  the legend at the foot through `options.echarts.legend.bottom` gets its room there instead; a spec's own
  `options.echarts.grid` still lays the chart out as before.

## [0.38.2] - 2026-10-21

MCP server 0.7.2 follows `^0.38.0` and takes this release as it is.

### Fixed

- A funnel stage far narrower than the widest (under 30 % of it) is named beside it, on the right with a leader line,
  instead of inside — the name ran past the stage's edges when a funnel narrowed sharply (visits 61,700 → orders
  2,184).
- A y reference line's label is drawn where no bar reaches it: above the line's right end as before, its left end when
  the data at the right end reaches the line, and past the plot's right end — with room made for it on a small
  chart — when the data reaches it at both ends. It was drawn over the last bar.

## [0.38.1] - 2026-10-21

MCP server 0.7.2 follows `^0.38.0` and takes this release as it is.

### Fixed

- A box the `echarts` passthrough places by one side now sits there: its `bottom` replaces a generated `top`, its
  `right` a generated `left` (and the other way round) — a pie legend given `bottom` was drawn across the pie, at the
  `top: 'middle'` a small chart's layout gives it. Both sides given, both are kept.
- A reference line's label no longer reads doubled on a dark board: it is drawn without the outline ECharts gives a label
  inside the plot, in the line's colour when the line has one and in the theme's secondary text colour otherwise.
- A metric with a sparkline in a host shorter than it would grow keeps inside the host: the sparkline gives up its
  room first, instead of the card running past its box onto what is below it.

## [0.38.0] - 2026-10-20

MCP server 0.7.2 follows `^0.38.0`.

### Added

- `metric` and `stat-group` draw `data.sparkline` — the recent values, oldest first — as a small line under the value, scaled to its own range, in the variant's colour.

### Changed

- Every chart lists `echarts` among its options (an object, described in the editor metadata) — `checkSpec` warned that the documented raw ECharts passthrough was not an option.
- `checkSpec` names a field a reference line or a series does not have, and one of the wrong kind — `lineStyle` on a reference line (it takes `style`), `axis: 'z'`. The chart dropped them without a sign.
- A reference line's `axis` may be left out: it means `'y'`, as the chart already drew it — and a line past the data now widens the value axis to reach it without `axis` too.

### Fixed

- `chart.area` lists `referenceLines` among its options — an area chart draws them as a line chart does, but `checkSpec` and `./tools` said it did not take them. The chart options table documents `referenceLines`.
- `chart.bar` with `horizontal`: a reference line's label is drawn at the line's top — it sat at the bottom, over the value axis labels, since the categories run top to bottom.

## [0.37.0] - 2026-10-20

MCP server 0.7.1 follows `^0.37.0`.

### Added

- `form`: a toggle has formdown syntax — `@notify: c[switch]` (formdown 0.22, a single checkbox shown as a switch).

### Changed

- Needs `@formdown/core` `^0.22.0`. Its parser no longer brings a YAML reader, so a bundle with the form is about
  30 KB (gzip) lighter. Front matter in formdown text is reported as unread (a warning); the form never took values
  from it.

## [0.36.0] - 2026-10-20

MCP server 0.7.0 follows `^0.36.0` — `help('form')` and `validate` know `fieldStates`.

### Added

- `form`: `fieldStates` — what the host suggests for each field, by field name: `{ suggestions?, note?, decline? }`,
  the shape `@formdown/ui`'s `<formdown-ui>` takes. The first suggestion shows in the empty field as its placeholder;
  each suggestion is a button under the field beside the note, and picking one puts it in the field
  (`suggestion-pick`, then `change`). `decline` adds a button that sends `suggestion-decline` and changes nothing. A
  new `fieldStates` keeps what the user typed. Parts `suggestions`, `suggestion`, `note`, `decline`.

### Fixed

- Date text with a short offset (`2026-10-09T19:00:00+09`, ISO 8601's `±hh`) reads as that moment; it read as no date.

### Changed

- **Breaking — `formdown` is read by `@formdown/core`, now a dependency (`^0.21.0`).** The built-in subset parser is
  gone, so a form's `formdown` text means what it means to formdown itself. Moving an existing form:
  - Attributes are separated by spaces, not commas: `R[min=0,max=100]` → `R[min=0 max=100]`.
  - `ms[]` (multiselect) → `s[multiple]`.
  - `@[cancel "Reset"]` → `@[reset "Reset"]` (still the `cancel` action); any other action is a named button —
    `@[delete "Delete" danger]` → `@delete: [button label="Delete" style="danger"]`.
  - `^[]` (toggle) has no formdown syntax yet; write that form as a `fields` array.
  - A field written without a label now shows formdown's label made from its name (`@first_name` → «First Name»).
- **Breaking — the `@iyulab/u-widgets/forms` entry is removed**, with `registerFormdownParser`, `getFormdownParser`
  and the `FormdownParser` type: there is one parser, so there is nothing to swap. Drop the
  `import '@iyulab/u-widgets/forms'` line. `parseFormdown(text)` takes no data argument and also returns
  `diagnostics`.
- Bundle size: an app's bundle now carries formdown's parser — about 43 KB gzip, most of it `yaml` (front matter). Only
  the parser is imported (`@formdown/core/parser`, not `FormManager`).
- `validate()` reports each formdown line the parser cannot read — a line that looks like a field but is not one, an
  unclosed `[` — as a warning with its line number. It reported nothing for such a line before, and the line was dropped
  without a word.
- The CDN bundle (`u-widgets.global.js`) carries `@formdown/core`, so a `formdown` form reads the same there.

## [0.35.3] - 2026-10-17

### Security

- `markdown`: a quote in a link URL can no longer close the `href` attribute and add an event handler attribute —
  `[x](https://a/" onmouseover="…)` rendered an `<a>` with an `onmouseover`. Markdown text is now escaped for attribute
  context too (`"` and `'`). Specs are often written by a language model; treat this as a fix to take.
- `chart.heatmap`: the tooltip escapes the row and column names — they went into ECharts' HTML tooltip as markup
  (`chart.gantt` already escaped its names). The cell value is written in the widget locale.

### Fixed

- `markdown`: emphasis marks inside a link URL or inline code stay literal — `[a](https://x/*y*)` put an `<em>` inside
  the `href`, and a link inside inline code became a link. Link text keeps its emphasis.
- Charts: a value axis with no `xFormat` / `yFormat` (or `valueAxisFormat`) writes its numbers in the widget locale, and
  so does the tooltip — a German page read `50,000` (fifty) on the axis where the table below wrote `50.000`. English
  pages look as before. Category and time axes are unchanged; a formatter from `options.echarts` still wins.

### Changed

- Development: `npm run check` runs lint, build (with typecheck), unit and browser tests in CI's order — one command to
  chain a push on (`npm run check && git push`), with no pipe between a step and its exit code.

## [0.35.2] - 2026-10-17

### Fixed

- `help()` / `./tools`: a mapping key's description names every widget that reads it — a Gantt's `color` (bars of a
  group share a colour) and `label`, and a histogram's `value`, were described as the scatter's and the pie's only, and
  read as not available to them.
- `chart.radar` lists its mapping keys as `axis` and `y`, the ones it reads — it listed `value`, which it ignores.
- `docs/widgets.md`: the mapping column for `chart.radar`, `chart.box` and `chart.treemap` matches what they read.

## [0.35.1] - 2026-10-16

### Changed

- `@formdown/core` 0.16 – 0.19 is accepted (optional peer `>=0.15.0 <0.20.0`, was `<0.17.0`) — an app on 0.17 or later no
  longer gets a peer conflict. 0.17 – 0.19 only add to the parser's public types; the forms entry behaves the same.

## [0.35.0] - 2026-10-16

MCP server 0.6.2 follows `^0.35.0` — its option lists gain `format` (gauge · progress · metric · stat-group) and `xAxisType` (line · area).

### Added

- `chart.line` · `chart.area` `options.xAxisType: 'value'` — each point at its numeric `x` on a value axis: a profile over
  uneven times or distances, which a category axis spaced evenly. Reference lines work as before.
- Format hints `number:N` and `percent:N` — a fixed number of decimals (0–20), in the widget's locale: `number:4` shows
  `0.9744` (`0,9744` on a German page). Table columns, metric and stat-group values take them; a table still sorts on the
  raw value.
- `gauge` · `progress` `options.format` — the shown value goes through the same format hints.

### Changed

- `options.echarts` passthrough merges `series`, `xAxis` and `yAxis` arrays element by element onto the generated ones
  (they replaced them whole). `series: [{ type: 'line' }]` on a scatter chart drew an empty chart — the generated data
  and the reference-line markLine were gone. A full series given there still sets its own `data`.
- `checkSpec`: an option of the widget written at the top level of a spec (`{ widget: "list", compact: true }`) is
  named as such — move it into `options` — instead of only as a key no widget reads.

### Fixed

- `gauge` · `progress` show their value in the widget's locale — a German page read `79.17` where every other widget
  wrote `79,17`. The value is the default `number` format; `aria-valuetext` and a progress label's `{value}` follow it.

- Docs: Theming said the `--u-widget-*` tokens could be set on any ancestor element — an inherited value never beats the
  defaults a widget declares on its own host, so such a setting did nothing. It now says to set them on the widget element
  (`u-widget { … }`, or its `style`), with the dark-mode example to match, and which tokens an accent colour runs through.

- MCP server 0.6.1: the tools' open-object inputs (`spec`, `data`) are written `additionalProperties: true` instead of the
  empty schema `{}` — a widely used open-model tool-call parser rewrote the values under the empty schema, so arrays
  reached the server as objects. A test keeps `{}` out of every tool input.

## [0.34.0] - 2026-10-16

### Added

- **`checkSpec(spec)`** in `./tools` — `validate` plus what the catalog knows, for a spec written by hand (an editor,
  an AI tool) before it is shown: a widget the library does not have is an error (`widget-unknown`, with a "did you
  mean" warning for a near spelling), and a top-level key no widget reads, an option the widget does not have and an
  option value of the wrong type are warnings naming what that place takes. Every example the catalog gives passes it
  with no warning.

### Changed

- `UWidgetLocaleStrings` has `specErrorWidgetUnknown` (English and `./locales/ko` carry it) — a host that registers
  a full locale adds it.
- `validate` moved from the core entry into a chunk shared with `./tools` (the core entry is 1.3 KB smaller, the
  shared chunk 1.8 KB).
- MCP server 0.6.0: `validate` uses `checkSpec` — a widget that does not exist is an error, and keys, options and
  option types the catalog does not know are warnings.

## [0.33.2] - 2026-10-15

### Fixed

- A **reference line**’s label on the value axis is drawn inside the plot, above the line’s right end. It sat outside
  the plot’s right edge, where the chart leaves little room, so a label longer than a few characters was cut off — on a
  short chart, down to its first letter.

## [0.33.1] - 2026-10-15

### Fixed

- A **horizontal** bar, line or scatter chart lists its categories top to bottom in the data's order — a ranking's
  first entry on top, where it was drawn last. The category axis of a vertical chart is unchanged.
- A **reference line** on the value axis that the data does not reach — a contract limit, a target ahead — is drawn:
  the axis now reaches past it to a round number, where the line used to fall outside the axis and not show at all.
- **`status`** keeps its rows together at the top of a host taller than its items, where the rows were spread over
  the extra height.

## [0.33.0] - 2026-10-15

### Added

- **`valueAxisZero`** for bar, line and area charts. `false` spans the value axis over the data instead of always
  reaching zero, so values that move far from zero — a control chart around its centre line, a temperature near 180 °C
  — are drawn as a trend rather than a flat line. Default `true` (unchanged). It follows the value axis of a horizontal
  chart, reaches both axes of a two-axis chart, and is listed in the `./tools` option metadata (`값 축을 0부터` in Korean).

### Fixed

- **`series[].lineStyle`** takes the line style keyword `referenceLines[].style` already uses — `'solid'`, `'dashed'`,
  `'dotted'` — besides an ECharts `lineStyle` object. Before, a keyword was spread into the series as if it were an
  object and the line stayed solid with no sign why; a value it cannot read is now ignored with a console warning.
  The option metadata, `docs/widgets.md` and the README name both forms.

### Changed

- Console diagnostics begin with `[@iyulab/u-widgets]`, so a message in a console shared by several packages says which one wrote it (several also say what to do next).
- The published declarations keep each element's own `HTMLElementTagNameMap` merge instead of one block written by hand
  in the build config, through the shared `@iyulab/components` declaration step. The types a consumer sees are the same
  (`u-widget`, `uw-chart` and `uw-math` keep their classes, composed-only elements stay `HTMLElement`), and a merge added
  in source can no longer be left out of the published types.

## [0.32.0] - 2026-10-14

### Fixed

- **Widgets draw with `--u-widget-font-family`.** The token had a default and a bridge (`themes/components.css` maps it
  to `--u-font-base`), but every widget set `font-family: system-ui, …` on its own host, so neither the bridge nor an
  override such as `u-widget { --u-widget-font-family: … }` changed the text. Both now do.

### Added

- `--u-widget-font-mono` — the monospace stack for code (`uw-code`) and inline code in markdown (`uw-content`), which
  used two different hard-coded stacks. The components bridge maps it to `--u-font-mono`.

### Removed

- `--u-widget-shadow-hover`. Nothing read it — widget cards are not interactive and do not lift on hover — so setting
  it had no effect.

## [0.31.1] - 2026-10-14

### Changed

- `u-widgets/forms` accepts `@formdown/core` 0.16 (optional peer range `>=0.15.0 <0.17.0`). An app that had installed
  0.16 could not install u-widgets next to it: the range stopped below 0.16. 0.16 adds an HTML-escaping option for
  rendered form bodies, which u-widgets does not use (it reads the fields and actions and draws its own controls), and
  fixes checkbox defaults given as a list.

## [0.31.0] - 2026-10-13

### Added

- **`time` format.** The time of day alone (`14:30`, in the locale's words when one is given) — for a chart axis
  of hours (`xFormat: { type: 'time' }`), where `datetime` repeats the date on every label, or a table column. It
  reads the same forms as `date` and `datetime`; a date with no time of day is shown as written.

### Fixed

- **A page's theme switch reaches charts already drawn.** The theme sync carried only `<html data-theme>` to widgets,
  and a chart redrew only when its widget's own theme changed — so a page that switched with `@iyulab/components`'
  `Theme` (`<html theme="dark">`), a `dark` class or the system colour scheme turned its cards dark while the charts
  kept the light grid and axis text they were drawn with (white lines on a dark card). The sync now also reads
  `<html theme>` (`data-theme` wins when both are set), and a chart re-reads the tokens it draws with when an attribute
  on `<html>` or `<body>` or the colour scheme changes, redrawing only when they moved.
- A searchable table does not filter on a syllable still being composed with an IME (Korean, Japanese, Chinese).
  Typing «서울» with a Korean IME emptied the table at «ㅅ» and showed «성남» at «성»; it now filters when the
  composition ends.
- The Korean hidden new-tab hint reads `, 새 탭에서 열림` instead of `(새 탭에서 열림)`. NVDA's Korean symbol table speaks
  parentheses at the default punctuation level, so a citation or content link that opens a new tab was announced
  with «여는 괄호 … 닫는 괄호»; a comma is only a pause there.
- **`chart.gantt` places a date alone at its local midnight.** A start or end like `2026-01-01` was read as UTC
  midnight, while the time axis puts its day ticks at local midnight — so a bar began nine hours into its day in
  Seoul and on the evening before west of UTC. Dates on the time axis now go through the same reader as the
  `date` and `datetime` formats: a date alone is local midnight, a date-time without an offset is local wall clock,
  one with an offset is that moment.

## [0.30.1] - 2026-10-10

### Fixed

- **`date` and `datetime` read dates as APIs write them.** Compact digits (`202501151430`, `20250115`,
  `20250115 1430`) and a space or dots between the parts (`2025-01-15 14:30`, `2025.01.15`) are formatted — on a
  chart axis (`xFormat: { type: 'datetime' }`), in a table column, in a metric — where they were shown as written.
  A date alone (`2025-01-15`) formatted in a locale stays on its own day west of UTC (it was read as UTC midnight,
  the day before there). Digits that are not a valid date are shown as written.

### Documentation

- `docs/widgets.md` lists the charts' `series` option — `label` names a series in the legend and tooltip where the
  field name would show (a source's code such as `PM`).

## [0.30.0] - 2026-10-09

### Added

- **`data` as an API returns it.** A widget that takes an array of records now also reads *columns* — one array per
  field, all of one length (`{ "time": [...], "temp": [...] }`), the usual shape of a time series — as one row per
  index; it was rejected with `"chart.line" expects "data" to be an array, got object`. A chart's or table's rows with
  nested fields (GeoJSON `properties`) are read by dotted path, `"mapping": { "y": "properties.mag" }`, and a table
  without `columns` shows them as `properties.mag` columns instead of `[object Object]`. `validate`, `infer` and
  `suggestMapping` read `data` the same way.
- **Validation errors as data.** `validate()` returns `issues` — `{ code, params, path }` for each error, in the order of
  `errors` — and `specErrorMessage(issue, strings)` gives its text in a locale. The "Invalid widget spec" card now lists
  its errors in the widget's locale (only its heading was translated); `@iyulab/u-widgets/locales/ko` includes them.
  `errors` keeps its English text.

### Fixed

- **A gauge's label is fitted once it can be measured.** A gauge first drawn while hidden (inside a closed tab or
  `display: none`) measured its label as 0 wide and left it uncut, so a long label ran past the dial once shown; one
  drawn before a web font loaded was cut for the fallback font. The label is now measured again when the gauge is
  shown and when the page's fonts are ready.
- **No warning for an entry point that is loading.** A host that imports `@iyulab/u-widgets/charts` (or `/math`)
  lazily, so it loads beside the app, rendered its first charts before the entry registered and got
  `"chart.line" needs import '@iyulab/u-widgets/charts'` in the console on every page load, although nothing was
  wrong. The warning now waits five seconds and is given only if the entry has still not registered. The "Widget
  module not loaded" card and the re-render once the entry arrives are unchanged.

## [0.29.0] - 2026-10-09

### Changed

- **Media scales down to fit a host height instead of scrolling.** When the host is given a `height` or `max-height`
  smaller than an `image`, `video` or `gauge`, the media now shrinks whole with its aspect ratio kept; before, it kept
  its natural size and the box around it scrolled, so a gauge in a 120px cell hid a third of its dial. Without a host
  height nothing changes.
- **`gauge` draws its value, unit and label inside the SVG**, so they scale with the dial (they were an HTML overlay of
  fixed size, which a smaller dial would have left spilling out). The `value`, `unit` and `subtitle` parts are now SVG
  `<text>`: colour them with `fill`, not `color`. A label wider than the dial's inner span ends in an ellipsis, as
  before.

### Fixed

- **Small charts keep a readable plot.** Below about 320×260px a chart switches to a compact layout — margins that
  still contain the axis labels, fewer value ticks, overlapping category labels dropped, a smaller legend (none on a
  canvas under 140px tall), the heatmap colour scale hidden, and pie labels moved off the outside of the pie. Before, a
  140px-tall line chart kept ECharts' default 65px top and 80px bottom margins and drew a plot about 0px high with its
  value labels on top of each other. Larger charts are unchanged, and `options.echarts` still overrides the layout.

### Added

- `toEChartsOption(spec, size)` takes the canvas size (`{ width, height }`) to lay the option out for it, and
  `chartLayoutKey(size)` tells a host whether a resize changes that layout.

## [0.28.1] - 2026-10-09

### Fixed

- **A theme a framework gives a widget is kept.** On a page that declares `<html data-theme>`, a `<u-widget>`
  rendered by React (`@lit/react`, which sets the `theme` property right after adding the element and before it
  reflects to the attribute) had its theme replaced by the page's: the theme sync saw no attribute yet and wrote
  the declared one. The sync now reads the widget's property too, so `theme="dark"` given that way stays dark.

### Changed

- The build strips style comments with the shared transform from `@iyulab/components`
  (`plugins/vite-plugin-strip-css-comments`) instead of its own copy. The published output is unchanged.

## [0.28.0] - 2026-10-09

### Added

- **Korean ships with the package.** `import '@iyulab/u-widgets/locales/ko'` registers Korean for the text widgets
  write themselves (table pagination and search, form validation, region names, the code block's copy button, the
  fallback card); the module also exports the table as `ko`. The table is typed as complete, so a string added later
  cannot stay English unnoticed. Docs gain a Locale section.
- **Short, localizable names for editors.** `OptionInfo.label` and `DataFieldInfo.label` name each option and data
  field for a form label ("Minimum", where the description reads "Minimum range value"), and `WidgetInfo.label` names
  each widget ("Bar chart"). `getWidgetOptions(widget, locale)`, the new `getWidgetDataFields(widget, locale)` and
  `getWidgetLabel(widget, locale)` give them in a language — resolved as a widget's locale is (`locale`, else
  `setDefaultLocale()`, else `<html lang>`). Korean ships as `@iyulab/u-widgets/tools/locales/ko`; another language
  registers its names with `registerToolLabels(lang, labels)`, anything left out staying English. A key that means
  something narrower in one widget has its own name there (`rating` `max` is "Icons").

### Changed

- `DataFieldInfo` has a required `label`. Code that builds `DataFieldInfo` values itself supplies one.

## [0.27.0] - 2026-10-08

### Added

- **Option value types for editors.** `OPTION_TYPES` gives every option in `OPTION_DOCS` a value type (in the notation
  of `DataFieldInfo.type`), with `enum` for a fixed set of choices and `default` where the widget's code fixes one;
  `getWidgetOptions(widget)` returns the options a widget reads with their description, type, choices and default,
  adjusted per widget (gauge `min`/`max` default to 0/100, `kv` layouts, `rating` `max` is the number of icons). A
  property panel can build its controls from these instead of keeping its own table. A test checks every option
  the library's own examples set against the widget's list and type.
- `DataFieldInfo.enum` — the values of a data field typed as a union of string literals (`status` `level`,
  `metric` `trend`, …).

### Changed

- **`help(widget).options`** (`OptionInfo[]`: key, description, type, choices, default) replaces `optionDocs`
  (key → description).
- Releases are published from the commit CI has verified — only after lint, types, build and tests pass on it — and
  carry npm provenance (`npm view @iyulab/u-widgets dist.attestations`), as does the MCP server.

### Fixed

- **A `status` item without a `label` is drawn** — as a badge showing its value and level ("● Running"), with no
  label and no colon. It used to be dropped silently, so `{ data: { value, level } }` drew nothing at all. An item
  still needs a `value`; `validate()` now warns about one that has none. The widget table in the docs names the
  fields `status` actually reads (`value`, `label?`, `level`), and `WIDGET_DATA_FIELDS` no longer marks `label`
  required.
- `WIDGET_OPTIONS` lists what the widgets read: `compose` no longer lists `layout` and `columns` (they are top-level
  spec fields of compose, not options), and `divider` lists `label` and `spacing`, which it reads.
- **A page that declares no theme gets auto mode.** The global theme sync read a missing `<html data-theme>` as
  "light" and wrote `theme="light"` on every `<u-widget>` — the attribute the dark tokens' selector excludes — so a
  visitor whose system was dark saw light widgets on a dark page (secondary text at 3.26:1). It now propagates only a
  declared `data-theme="dark" | "light"`, writes nothing otherwise, and takes back what it wrote when the
  declaration goes away.
- **A `theme` the page sets on a widget is kept.** The sync no longer overwrites (or removes) a `theme` attribute it
  did not write itself.

## [0.26.3] - 2026-10-08

### Fixed

- **`hidden` hides a widget.** Every widget element sets its own host `display`, which outranked the browser's
  `[hidden]` rule — a widget given `hidden` (by the page, or by a container that switches between views) kept drawing.
  The shared theme sheet now carries `:host([hidden]) { display: none !important }`.

## [0.26.2] - 2026-10-08

### Fixed

- `uw-citation` and `uw-content` keep their visually hidden "opens in a new tab" hint inside the element — the
  absolutely positioned hint escaped an unpositioned scroll container and could stretch the document.

## [0.26.1] - 2026-10-07

### Fixed

- **The "Unknown widget" fallback title goes through the locale table** (new key `unknownWidget`) — the last chrome
  string that was English in every locale.

## [0.26.0] - 2026-10-07

### Added

- **Switching the locale at runtime reaches widgets on screen.** `setDefaultLocale()` (to another value) and
  `registerLocale()` now notify, and every connected `<u-widget>` re-renders; one detached during the switch catches up
  when attached again. `onLocaleChange(listener)` (returns the unsubscribe function) and `getLocaleRevision()` for your
  own code.
- **`@iyulab/u-widgets/components` follows the `@iyulab/components` locale** — u-widgets' default locale becomes
  `Locale.get()` and moves with every `Locale.set()`, so one call switches the app. A widget's own `locale` still wins.
  The optional peer is now `@iyulab/components` `>=2.8.0`.

### Fixed

- **A re-render of `<u-widget>` no longer wipes a form's input.** `u-widget` builds a new spec object on every render
  and `uw-form` reset its data and errors on any new spec, so a theme switch threw away what the user had typed. Only
  new `data` or `fields` from the caller starts a new form now; an error on screen is rewritten when the locale changes.
- **Chrome strings that bypassed the locale table now go through it** — the accessible names of the actions, citations,
  gallery, key-value, rating, status and steps regions (when the spec has no title), the code block's language fallback
  and Copy/Copied! button, and the fallback and error cards. They were English in every locale. New
  `UWidgetLocaleStrings` keys: `actions`, `citations`, `gallery`, `keyValuePairs`, `status`, `steps`, `ratingOutOf`,
  `code`, `copy`, `copied`, `moduleNotLoaded`, `addImportHint`, `didYouMean`, `invalidSpec`.

## [0.25.3] - 2026-10-06

### Documentation

- The React example that sets `spec` through a ref typed the ref as `null`, so `ref.current.spec` did not type-check. It now types the ref as the `<u-widget>` element (`HTMLElementTagNameMap['u-widget']`) and the prop as `UWidgetSpec`.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.25.2] - 2026-10-06

### Fixed

- **The `u-widget-event` typing now reaches the published types.** 0.25.1 declared it in source, but
  the build replaces every global declaration in the bundled `.d.ts` with its own block, which did not
  carry the event map — so consumers still saw a plain `Event`. The block now includes it, and a build
  test checks that every global key declared in source is present in the published `.d.ts`.

## [0.25.1] - 2026-10-06

### Fixed

- **`u-widget-event` is typed for TypeScript listeners.** The event is now declared on the global event
  map as `CustomEvent<UWidgetEvent>`, so `el.addEventListener('u-widget-event', (e) => e.detail.type)`
  — on the element, `document` or any ancestor — type-checks without a cast. Before, `e` was a plain
  `Event` and reading `e.detail` failed under `strict`.

### Documentation

- **Quick Start** — a first page (a metric and a bar chart) that builds, type-checks and renders as
  written. The installation example no longer shows a Lit property binding inside plain HTML (it
  rendered nothing when copied); it says `spec` is a property and how to set it. The Next.js guide
  drops its casts.

## [0.25.0] - 2026-10-06

### Added

- **Field options can submit a value other than the text they show.** `options` on a select,
  multiselect, radio or checkbox field takes `{ "value": "hw", "label": "Hardware" }` alongside plain
  strings (a string is still a value shown as itself). Formdown writes the same option as
  `@kind{hw=Hardware,sw=Software}: s[]` — the built-in parser now reads that grammar exactly as
  `@formdown/core` does, `\,` and `\=` included. New type: `UWidgetFieldOption`.
- **`u-widgets/components` — date fields with `<u-date-picker>`.** An app that uses
  `@iyulab/components` imports this entry and `uw-form` draws `date` and `datetime` fields with its
  date picker (typed entry, calendar, the app's locale) instead of the browser's native inputs.
  Submitted values keep the native shape — `YYYY-MM-DD`, and `YYYY-MM-DDTHH:mm` in local time — so
  opting in changes how the field looks, not what the form sends. Without the import nothing
  changes and u-widgets still runs without `@iyulab/components`.

### Changed

- **`u-widgets/forms` requires `@formdown/core` 0.15** (optional peer `>=0.15.0 <0.16.0`, was
  `>=0.4.0 <0.11.0`). 0.15 reports options as `{ value, label? }`; they reach the form as above, so a
  `value=Label` option no longer shows as `hw=Hardware`.
- **The optional `@iyulab/components` peer starts at 1.58** (was 1.41) — the first release whose
  `u-date-picker` takes a typed date and time with the chosen time's UTC offset. The theme bridge
  (`themes/components.css`) works with it unchanged.

### Fixed

- **A pre-filled select shows its value on first render.** The select got its value before its
  options existed, so a form with `data` for a select field showed `--` and submitted nothing for it
  until changed.

## [0.24.1] - 2026-10-05

### Changed

- **The optional `katex` peer accepts 0.19** (`>=0.17.0 <0.20.0`, was `<0.19.0`). `uw-math` renders
  MathML only, which the 0.19 change (characters without metrics reported through `strict`) does not
  touch.

## [0.24.0] - 2026-10-03

### Added

- **Motion tokens `--u-widget-duration-fast` / `-normal` / `-slow`, and reduced motion is honoured.**
  Every widget transition (hover lift, focus ring, rating icons, gauge fill, form controls) now reads
  these tokens instead of fixed durations, and they drop to `0ms` under
  `prefers-reduced-motion: reduce` — standalone, with the `themes/components.css` bridge alone, and with
  the `@iyulab/components` sheet (the bridge links them to its `--u-duration-*` axis). Durations stay
  what they were (150 / 200 / 300 ms) unless the bridge links them to the house scale.

## [0.23.0] - 2026-09-30

### Added

- **`video` takes subtitle / caption tracks** — `data.tracks: [{ src, srclang?, label?, kind?, default? }]`
  (WebVTT; `kind` defaults to `subtitles`). The `<video>` is inside the widget's shadow tree, so the spec
  is the only place a `<track>` can come from. Track URLs go through the same filter as `src`.

### Fixed

- **Links that open a new tab now say so to screen readers.** Citation cards (`citation`) and links
  in `markdown` open in a new tab; their accessible name now ends with "(opens in a new tab)",
  visually hidden. The text is the new `opensInNewTab` locale string — register a translation with
  `registerLocale(lang, { opensInNewTab })`; it is inserted as text, never as HTML.

### Documentation

- README: the Accessibility section links the KWCAG 2.2 table in `@iyulab/components`.

## [0.22.1] - 2026-09-30

### Fixed

- **`u-widgets/forms`: the submit and reset buttons of a formdown form are recognized again.**
  `@formdown/core` names a shorthand button `@[submit "Save"]` `submit_<random>` and puts its kind in
  `attributes.type`; the adapter compared the name, so with `@formdown/core` installed the Save button
  was not styled as primary, and the reset button became an action called `reset_…` instead of
  `cancel`. The kind is now read from `attributes.type` (the name is still used for named buttons).

### Changed

- Peer range of `@formdown/core` is `>=0.4.0 <0.11.0` (was `^0.4.0`, which excluded every release
  after 0.4). The part of `@formdown/core` this package uses behaves the same from 0.4.0 to 0.10.0, and
  the tests now run against the real package.
- Peer range of `@lit/react` is `^1.0.8` (was `^1.0.0 || ^2.0.0` — there is no 2.x to test against).

## [0.22.0] - 2026-09-28

### Added

- **`themes/components.css` bridges the chart palette.** Charts drew the widgets' own palette
  even with the components theme loaded, because the components tokens had no chart axis. With
  `@iyulab/components` 1.47 or later, series colours now follow its `--u-chart-color-1…8`, slot
  for slot and in order; with an older version the widgets' palette is kept.

### Fixed

- **A theme applied to `<u-widget>` now reaches the widget it renders.** `<u-widget spec>` draws
  its `uw-*` inside its own shadow root, and each of those declared the default tokens on its own
  `:host` again. A value inherited from the outer element can never beat that declaration, so a
  theme sheet (`themes/components.css`, `themes/shadcn.css`) or a brand rule on `u-widget` stopped
  at the shadow boundary: the outer element had the right colours and the chart, metric or table
  inside it drew the defaults — primary colour, text, secondary text, font family and radius all
  reverted. The inner element is now marked `nested` and declares no defaults, so it inherits what
  the outer element resolved. A `uw-*` used on its own still carries the defaults.

## [0.21.0] - 2026-09-16

### Fixed

- **`themes/shadcn.css` never applied.** It set the widget tokens on `:root`, and a custom
  property set on `:root` reaches a widget as an *inherited* value — which can never beat a
  declaration on the element itself, and the token sheet writes exactly that
  (`:host { --u-widget-*: … }`). Importing the theme therefore changed nothing, silently: no
  error, no warning, just the defaults. The selector is now the element list, wrapped in
  `:where()` so an application's own rules still win. The dark block is scoped the same way.

  Nothing could see this. The unit suite runs on happy-dom, which does not resolve the
  cascade at all, so a sheet that loses and a sheet that wins look identical to it.

### Added

- **`themes/components.css`** — an optional sheet that binds the widget tokens to
  `@iyulab/components`' token axis, so a page using both stops rendering two palettes, two
  type families and two radii. Measured before this release: five axes disagreed on a single
  screen (primary color, body text, secondary text, font family, corner radius).

  It is a **bridge, not a copy**. Every declaration is
  `var(<the components token>, <this package's default>)`, which means the widgets follow that
  sheet as it changes rather than freezing a snapshot of it — and when the sheet is absent, the
  fallback keeps the standalone defaults exactly as they were. That fallback is load-bearing,
  not defensive: omitting it would make the token guaranteed-invalid rather than falling back to
  `:host`, because the outer declaration has already won.

  Dark mode needs no separate block here, which is the point of a bridge: the referenced tokens
  are themselves redefined for dark by the sheet being followed.

  Left unmapped on purpose: the **chart palette** (eight colors whose ordering and mutual
  distinctness are a design in themselves — approximating them from four role colors would
  collide adjacent series) and the **font sizes** (the other axis is a four-tier scale carrying
  size, weight, leading and tracking per tier, while this package has a single size per role, so
  pairing them would mean choosing tiers on the consumer's behalf). The font *family* has no such
  choice, so it is mapped.

- **A browser (chromium) test project**, because the half of this package's theming contract that
  is *cascade* cannot be judged by happy-dom — which is why the `shadcn.css` defect above lived
  for as long as it did. 23 cases pin the three layers (`:host` default → theme sheet → the
  application's own rule), the `var()` fallback, and — as a negative control — the fact that a
  `:root` override loses.

### Changed

- The build's theme copy step now copies everything in the theme source directory instead of one
  hard-coded filename, so adding a sheet no longer requires remembering to add it here too.

## [0.20.0] - 2026-09-15

### Added

- **`chart.gantt` — interval (Gantt) charts.** Rows × `[start, end]` segments on a value axis
  (numbers) or a time axis (date-like strings or timestamps), for schedules, shift plans and
  project timelines. Map `y` (row), `start`, `end`, and optionally `label` (written inside a
  segment when it fits) and `color` (one series and legend entry per value); the mapping is
  inferred when omitted. Rows stay top to bottom in the order they first appear, and
  `options.categories` fixes that order and keeps rows that have no intervals. Adjacent segments on
  a row are separated by a gap, a zero-length interval is still drawn, and `referenceLines` on `x`
  mark a value or a date. `suggestMapping()` proposes it for data whose fields are named as an
  interval (`start`/`end`, `from`/`to`, …). The catalog, JSON schema and MCP `help` describe it.
- **Chart `select` events carry `_index` where `dataIndex` cannot identify the row** — the same key
  `table` and `list` already use for the row's index in `spec.data`. `dataIndex` is the mark's index
  within its series, so on `chart.gantt` (series per `color`, skipped rows) and `chart.scatter` with
  a `color` mapping (series per group) it did not say which row was clicked. `dataIndex` is
  unchanged. In the generated ECharts option, grouped scatter points are `{ value, rowIndex }`
  objects instead of bare arrays.
- **Every `u-widget-event` payload is documented** (Widget Reference → Events): which widget emits
  each `type`, and what `action` and `data` carry.
- **JSON schema: `mapping.total`, `mapping.start`, `mapping.end`.** `total` (waterfall) was
  accepted by the renderer and `validate()` but rejected by the schema's closed mapping object.

### Fixed

- **A table's `select` reported the row's position on screen as `_index` after search or sort.**
  Paging was accounted for, but a searched or sorted table reported the index into the filtered,
  sorted rows, so `spec.data[_index]` was a different row. `_index` is now the row's index in
  `spec.data` in every state.
- **`xFormat: { type: 'date' | 'datetime' }` on a time axis printed raw millisecond counts.** A time
  axis labels its ticks with timestamps, which the date formats passed through unchanged; they are
  now read as local wall-clock time, and overlapping labels are hidden.

## [0.19.0] - 2026-09-15

### Added

- **`widgetEntry(type)`** returns the entry point a widget type needs beyond the core import
  (`chart.*` → `@iyulab/u-widgets/charts`, `math` → `@iyulab/u-widgets/math`), or `undefined`, so a
  build step can check that every rendered widget type has its entry imported.

### Fixed

- **A known `chart.*` or `math` widget whose entry was not imported rendered as a silent JSON dump.**
  The fallback card used the spec's title as its label, so it read like a rendered chart, and nothing
  was logged. It now reads "Widget module not loaded: chart.waterfall", names the import to add, and
  warns once per widget type. When the entry is imported later (a dynamic `import()`), the widget
  re-renders on its own. Unknown types such as `chart.barr` keep the "Unknown widget" card and its
  suggestion.
- **"Did you mean" could not suggest `chart.histogram` or `math`** — the typo list had drifted from
  the widget catalog. It now matches the catalog, and a test keeps it that way.
- **Citation links could not be reached from the keyboard.** A linked citation was a clickable
  `div`: it took no focus, could not be opened with Enter, and was not announced as a link. It is now
  a real anchor (`target="_blank"`, `rel="noopener noreferrer"`) with a visible focus ring, still
  reporting the `navigate` action. Items whose URL is unsafe render as plain cards, as before.
- **The interactive `rating` could not be used from the keyboard, and its icons were below 24px.**
  The icons are now one tab stop (on the current value): arrow keys, Home and End move a preview,
  Enter or Space submits. Exactly one icon is `aria-checked` — the committed value — where previously
  every filled icon was. Each interactive icon is at least 24×24 CSS px (WCAG 2.2 SC 2.5.8); the
  glyph size is unchanged, so the icons sit slightly further apart. Display-only ratings are not
  affected.

## [0.18.3] - 2026-09-12

### Fixed

- **Compact table cells could fall under the 24px pointer-target minimum on Linux.** In the
  narrow (`≤ 30rem`) layout the header cells and rows used `line-height: normal`, which follows
  the font's metrics: 24px with Windows fonts, 22px with the default Linux fonts. Both now carry an
  explicit `line-height: 1.5`, so the WCAG 2.2 SC 2.5.8 floor holds on every platform (the e2e
  gate caught it the first time it ran on Linux CI).

## [0.18.2] - 2026-09-12

### Fixed

- **A height given to `<u-widget>` never reached the widget inside it.** The router element laid its
  delegated widget out as a block, so the widget kept its own height while the host box shrank to the
  height that was asked for — and because no widget clips, the content painted *outside* that box and
  over whatever followed it. Measured: every `chart.*` overhung a 200px host by 100px (the chart was
  pinned to its 300px default), a 40-row `table` by 1234px, and a 120-line `code` block by 2203px.
  Constraints now travel from the host through the card wrapper into the widget, where the chart
  canvas, the table's row area and the code body take the remaining space. Unconstrained hosts render
  exactly as before — the defaults are defaults, not caps. `--u-widget-chart-height` keeps its value
  and now means "height when the host is free to grow".

- **The same break existed in every other widget, and they are fixed too.** A host constraint now
  reaches each widget's own scroll area: the item area of `list`, `citation`, `steps` and `status`, the
  prose box of `markdown` and `callout`, the thumbnail grid of `gallery`, the field area of `form`, the
  layout area of `compose` (its title stays put), the cell area of `stat-group` — where the horizontal
  clip that hides the leading divider is deliberately kept — and the box around `image`, `video` and
  `gauge`. Media is never squashed to fit, since that would change its aspect ratio; the box scrolls
  instead. Measured overhang before the fix, against a 200px host: 4254px for `citation`, 2501px for
  `markdown`, 2119px for `list`, 1929px for `steps`, 1422px for `gallery`, 858px for `video`, 717px for
  `callout`, 343px for `stat-group`, 234px for `status`, 324px for `form`, 204px for `image`. `compose`
  and `gauge` needed a tighter constraint to show it at all — 72px and 36px against a 120px host —
  which is why a widget that fits its constraint is recorded as untested rather than passing.

### Documentation

- **`## Sizing`** in `docs/widgets.md` (and a short form in the README) states which element owns a
  widget's height, what a host `height`/`max-height` reaches, and what each widget does when nothing
  constrains it.
- **`## Code Options`** documents `lineNumbers`, `wrap`, `maxHeight` and `highlight`, which the `code`
  widget has always read but which appeared in no document.

### Build

- **Comments inside `css` templates no longer ship in the bundles.** A tagged template is a string
  to the minifier, so every design note written inside one was delivered to consumers — the
  `charts` entry alone carried 574 gzip bytes of them and crossed its size budget. The build now
  strips block comments from `css` templates in shipped source; nothing else in the output changes.

## [0.18.1] - 2026-09-10

### Fixed

- **Two pointer targets were below the 24×24 CSS px minimum** (WCAG 2.2 SC 2.5.8). The form's
  checkbox and radio rows measured 343×19 — the pointer target is the wrapping label, not the
  13×13 native input, so the fix is a minimum row height and the check glyph is untouched. The
  copy button grew from 21px to the floor; its width is unchanged.

### Changed

- **The optional `katex` peer range widens to `>=0.17 <0.19`** (was `^0.17.0`). An optional peer
  is a statement that the consumer picks the version, and narrowing to a single minor works
  against that. The range stops below 0.19 because that break is a CSS class prefix: the
  stylesheet is loaded by the consuming app, so pulling only the JavaScript forward would break
  rendering silently whenever the two disagree.

- **The lockfile is no longer committed.** It had exactly one consumer — the demo deploy's
  `npm ci` — and that is where it broke: once the lock drifted from the manifest, `npm ci`
  failed outright while CI stayed green, because CI installs with `npm install`. The deploy now
  installs the same way every other path here does. This is internal to the repository and does
  not affect consumers of the published package.

## [0.18.0] - 2026-09-08

### Changed

- **`katex` is now declared as `^0.17.0` (was `^0.16.0`) in `peerDependencies`.** The old
  range did not include the version this package is actually built and tested against:
  `devDependencies` has specified `^0.17.0`, and semver treats a `0.x` minor as a major, so
  `^0.16.0` excludes `0.17.0`. A consumer that satisfied the declared range therefore ran
  `uw-math` against a version this package had never exercised. The range also failed to
  overlap `@iyulab/chat-components`, which depends on `katex ^0.17.0` — an application using
  both could not resolve a single shared install. `katex` remains an optional peer
  dependency; nothing changes for consumers who do not use the `math` widget.

## [0.17.1] - 2026-08-30

### Fixed

- **`chart.histogram`'s `referenceLines` landed on the wrong position, or overlapped
  regardless of their actual value.** The histogram's X axis is a category axis
  (each category is a bin-range label), but a reference line's raw domain value was
  passed straight through as the axis coordinate — on a category axis, ECharts reads
  a numeric coordinate as a bin **index**, not a data value, so lines landed at
  effectively arbitrary positions and any line whose value exceeded the bin count
  clamped onto the same trailing index. Reference line values are now converted to
  their fractional bin-index position, and the bin domain is extended to cover any
  reference line outside the data's own range so it still appears on the axis. Also
  widened bin-label decimal precision for narrow bins, which previously rounded to a
  fixed one decimal place and could render identical start/end labels (e.g. "9.7–9.7").

## [0.17.0] - 2026-08-30

### Added

- `getPrimaryDataField(widgetType)` — names the single data field that holds a widget's
  headline/live value, for widget types where that's unambiguous (`metric`/`gauge`/`progress`/
  `status`/`stat-group`, all `→ "value"`). `required: true` on a widget's data fields can't
  answer this alone — `status`/`stat-group` each have more than one required field, and the
  non-value ones (e.g. `status.label`) are typically static captions rather than a bound live
  value. Returns `undefined` for widget types with free-form user-defined mapping (`chart.*`,
  `table`, `list`, ...), which have no single fixed headline field.

## [0.16.2] - 2026-08-25

### Added

- Agent-skill reference docs (`skills/iyulab-u-widgets/`) — the `<u-widget spec="...">` usage
  pattern, the full widget catalog (`widget` value → element → description), events, and the
  complete `--u-widget-*` CSS Custom Properties token sheet.

## [0.16.1] - 2026-08-12

### Fixed

- **Published `.d.ts` declarations were broken for 16 of the 17 registered custom elements,
  across all 6 build entries.** The dts bundler strips `declare global` blocks (which hold each
  element's `HTMLElementTagNameMap` entry) and a build-time patch step was meant to restore
  them, but its guard only recognized the one element it had originally been written for and
  silently skipped the rest, leaving orphaned/broken global declarations behind. The patch now
  detects and restores every stripped block (brace-depth aware, not a single string match),
  covers all 17 elements, and runs against every build entry. `uw-chart` and `uw-math` are now
  typed with their real exported classes instead of a generic `HTMLElement`.

## [0.16.0] - 2026-08-11

### Added

- **A rem-based typography scale**: `--u-widget-font-size-label` (0.8125rem), `-caption`
  (0.75rem), `-overline` (0.6875rem), alongside the existing `--u-widget-font-size` (body,
  0.875rem). Every element previously hardcoded one of these four values directly in dozens of
  places; they now reference the shared tokens, so a host page can retune the whole scale (or
  a single tier) by setting one custom property instead of overriding each element's internal
  selectors. Values are unchanged — this is purely additive, no visual difference at defaults.
  The scale stays local to this package (not a reference to any other package's tokens), so
  `u-widgets` remains installable and themeable without any other design-system package
  present.

### Fixed

- **`@iyulab/components` is no longer a required peer dependency.** It was declared in 0.15.0
  but nothing in this package's source actually imports it or references its tokens — this
  package has always styled itself through its own local `--u-widget-*` custom properties.
  Installing `u-widgets` no longer requires installing (or satisfying a version range for) a
  package it does not use.

## [0.15.0] - 2026-08-05

### Changed

- ⚠**`@iyulab/components` is now a required peer dependency (`>=1.24.0`).** The token
  sheet is a runtime premise rather than a nicety — the styles reference it in 58 places,
  and installing without it lets the fallback literals quietly stand in for the theme.

  Consumers pinned to `@iyulab/components@1.23.x` will see an `ERESOLVE` on install.

### Fixed

- **`sideEffects` no longer misses part of the emitted entry points.** The declaration
  named four output files, but with multiple entries the bundler splits shared code —
  custom-element registrations included — into hash-named chunks that were not listed. A
  consumer's bundler could drop them and the widgets would never register, with no build
  error. It now covers `./dist/*.js`.

- **The `./themes/shadcn.css` subpath points back at the built output.** It had been
  rewritten to a source path, which does not exist in the published package.

## [0.14.1] - 2026-08-03

### Fixed

- **포커스 링·강조 배경이 브랜드 색을 따라가지 않던 문제** — 세 곳이 인디고 값을
  `rgba(79, 70, 229, …)` 리터럴로 굽고 있었다. `--u-widget-primary` 는 **테마마다 다른
  값**(라이트 `#4f46e5` / 다크 `#818cf8`)인데 리터럴은 그것을 모르므로, 다크에서
  테두리와 포커스 링이 서로 다른 인디고가 됐다. 소비자가 브랜드를 덮어도 따라오지 않았다.
  `color-mix()` 로 토큰에서 파생하도록 고쳤다(무효 오류 배경도 `--u-widget-negative` 기준).

## [0.14.0] - 2026-08-02

### Fixed

- ★**채움 버튼의 글자가 다크 테마에서 읽히지 않던 문제.** `[data-style="primary"]` ·
  `[data-style="danger"]` · 완료된 단계(`uw-steps`)가 `color: white` 를 유채색 면 위에
  칠하는데, 다크 팔레트는 그 색들을 **밝게** 만든다(다크 페이지에서 *글자*로 읽히게 하려고):

  ```
  흰 글자 대비 —  primary #818cf8  2.98 ✗   ·  negative #f87171  2.77 ✗
                 positive #4ade80  1.74 ✗            (AA 기준 4.5)
  ```

  한 토큰이 **면**과 **글자**를 겸할 수 없어서 생긴 결함이다. 전경을 토큰으로 분리하고
  테마에 따라 뒤집는다 — 아래 Added 참조. 라이트는 종전대로 흰색이다(6.29 / 4.83 / 5.02).

- **`--u-widget-positive` 가 라이트에서 AA 미달.** `#16a34a` 는 흰 바탕 대비 **3.30** 인데
  이 토큰은 틴트만이 아니라 **글자**로도 쓰인다(`uw-metric` 값, `uw-code` diff 표시).
  `#15803d`(**5.02**)로 한 단 내렸다.

- **`--u-widget-text-secondary` 가 표면 위에서 AA 미달.** `#64748b` 는 `--u-widget-bg`
  위에서는 4.76 으로 통과하지만 `--u-widget-surface`(`#f1f5f9`) 위에서는 **4.34** 였고,
  보조 텍스트는 표면 위에 놓이는 경우가 그만큼 많다. `#5b6777`(**5.25** / 바탕 5.75).

### Added

- **`--u-widget-on-primary` · `--u-widget-on-negative` · `--u-widget-on-positive`** —
  채움 면 위의 전경색. 라이트 `#ffffff` / 다크 `#1e1e2e`.
  브랜드를 바꿀 때 `--u-widget-primary` 와 **함께** 조정하면 된다. 종전에는 전경이
  리터럴이라 조정할 방법이 없었다.

### Known issues

- `--u-widget-border` 가 바탕 대비 **1.23**(라이트) · **1.59**(다크)로 WCAG 1.4.11(3.0)에
  미달한다. 무엇이 "UI 컴포넌트 경계"인지의 판단이 선행돼야 한다.

## [0.13.0] - 2026-07-16

### Added
- `chart.waterfall`: **행 단위 총계(total) 막대** 지원 — `mapping.total`(필드명)로 지정한 행은 절대 총계 막대로 `base=0`에서 그려지고 누적(running total)을 자기 값으로 리셋한다(선행 총계=개시 잔액, 후행 총계=마감 잔액). 지금까지 모든 행이 예외 없이 델타(증감)로 누적되어, 표준 waterfall 관례(첫·마지막 행은 절대 총계)를 따라 데이터를 넘기면 **마지막 총계 행이 `2×total` 높이로 그려지던** 결함(프로덕션 실재현 — 같은 지표가 게이지에서는 81.2%, waterfall 에서는 ~162 로 어긋남)을 해소. 총계 행 미지정 시 3-시리즈 출력이 byte-identical하게 유지되어 파괴적 변경이 없다. 총계 막대는 중립색(slate)으로 증감 막대와 시각 구분. schema mapping 검증 allowlist에도 `total` 반영. 실사용에서 관측.

### Fixed
- `echarts-adapter`: 축 config를 `options` 최상위(`options.xAxis`/`yAxis`)에 두면 조용히 무시되던 문제에 **dev 경고**를 추가 — `options.echarts.xAxis`(생성된 축 위에 재귀 deep-merge)로 유도한다. 축 라벨 제어(`axisLabel.interval`/`rotate` 등 긴 라벨 자동 소실 방지)는 `options.echarts` passthrough로 **이미 지원**되고 있었으나(문서·회귀 테스트로 명시), 최상위 경로로 넘기던 기존 소비자(`energy/transformer-loss` 등)의 값이 버려지고 있었다. `docs/widgets.md`에 waterfall total 매핑 + 축 라벨 제어 레시피 문서화, adapter의 "one level" 주석을 실제 재귀 deep-merge로 정정.

### Build
- `@microsoft/api-extractor`를 명시적 devDependency로 추가 — `vite-plugin-dts` v5에서 `bundleTypes`(선언 파일 번들)는 `@microsoft/api-extractor`를 optional peerDependency로 요구한다. 표준 `npm ci`(단독 저장소)에서 자동 설치되지 않아 번들이 조용히 per-file로 폴백(그리고 `afterBuild` 훅이 stale toolchain 조합에서 `dist/u-widgets.d.ts` 미생성으로 실패)하던 릴리스 정합 문제를 해소. 이제 v4 시절과 동일한 번들된 엔트리별 단일 `.d.ts`(`u-widgets.d.ts` 등)를 출력한다.

## [0.12.1] - 2026-07-13

### Fixed
- `chart.treemap`: **계층 데이터에서 부모 노드에 `value`를 생략하면 트리맵 전체가 빈 화면으로 렌더**되던 무음 결함 수정. `toTreeNode`가 `value: Number(item.value ?? 0)`으로 부모에 명시적 0을 주입해 ECharts가 children 합산 대신 면적 0으로 그렸다. value가 있을 때만 전달하고 합산은 ECharts에 맡긴다(leaf는 기존대로 0 기본값). e2e 렌더 커버리지 확장 중 데모 스크린샷 육안 검증에서 발견 — 캔버스 존재 검사로는 못 잡는 결함이라 픽셀 비율 e2e 가드 추가. 회귀 가드: 유닛(RED→GREEN) + e2e 픽셀 검사.
- `uw-metric`(stat-group): **항목 수가 많고 값이 긴 경우(예: 7항목 × 12자리 천단위 값) 값 텍스트가 이웃 셀 위로 겹쳐 판독 불가**하던 표시 결함 수정. 원인은 `flex: 1; min-width: 100px`(콘텐츠 무관 균등분할·shrink 허용) × `white-space: nowrap`(0.11.10) × overflow 미처리 조합. 셀에 `min-width: min(100%, max-content)`를 적용해 값보다 좁아질 수 없게 하고, 넘치는 항목은 다음 행으로 wrap한다. wrap 도입에 따라 `+` 셀렉터 구분선(한 줄 전제)이 둘째 행 선두에도 붙는 동반 결함을 클립 래퍼(음수 마진) 기법으로 함께 해결 — 구분선은 같은 행 인접 셀 사이에만 나타난다. 좁은 폭(≤30rem) 컬럼 모드는 기존 동작 유지. 알려진 한계: 단일 값이 위젯 전체 폭을 넘는 극단(60자+)은 위젯 경계에서 클립. 회귀 가드: e2e 바운딩 검사(7항목 × 12자리, RED→GREEN 검증) + 유닛 CSS 가드 + 데모 스트레스 카드. 실사용에서 관측.
- `README.md` React 예제: `widget: 'stat-group'`에 metric 형태의 객체 `data`를 넘겨 아무것도 렌더되지 않는 예제였던 것을 배열 data로 교정 (stat-group `data`는 배열 필수).
- `e2e/widgets.spec.ts` `deepShadowText` 헬퍼: `title`이 있는 스펙에서 첫 요소(`.widget-title`)만 보고 중첩 shadow 텍스트를 놓쳐 `confirm` 테스트가 오탐 실패하던 것을 호스트+전 shadow 자식 텍스트 합산으로 수정.
- `playwright.config.ts`: webServer 부팅 타임아웃 30s→120s — `vite --force` 콜드 부팅(의존성 사전번들 재생성)이 30s를 초과해 e2e가 서버 기동 단계에서 실패하던 문제.
- `src/types/jsx.ts`: `@typescript-eslint/no-namespace` 린트 에러 해소 — JSX 전역 증강은 namespace 선언만 가능하므로 사유 명시 인라인 disable.

## [0.12.0] - 2026-07-07

### Added
- `chart.*`: ECharts **CustomChart(custom series)** 등록 — `options.series[i].type: "custom"` 또는 `options.echarts` passthrough로 custom `renderItem`(Gantt/타임라인 등)을 주입하면 이제 바로 렌더된다. 기존에는 임의 series `type` 오버라이드를 허용하면서 CustomChart만 미등록이어서 `[ECharts] Series custom is used but not imported` 경고 후 무음 미렌더되던 비대칭을 해소. 실사용에서 관측 — 소비자 앱측 `use([CustomChart])` 워크어라운드 제거 가능.
- `uw-chart`/echarts-adapter: **미등록 series-type 어포던스 가드** 신설 — `options.series[i].type` 오버라이드와 `options.echarts.series[].type` passthrough가 미등록 series(`graph`/`sankey`/`gauge`/`sunburst` 등)를 요청하면, raw ECharts 경고 대신 u-widgets dev 경고 + `@iyulab/flex-chart` 리디렉트를 출력한다. 등록 series는 `bar`/`line`/`pie`/`scatter`/`radar`/`heatmap`/`boxplot`/`funnel`/`treemap`/`custom`. 컴포넌트 키 가드(`dataZoom`/`toolbox` 등)와 대칭 완성 — tree-shakeable 빌드의 false-affordance를 series 클래스까지 확장.
- `uw-table`: **컬럼 강조(`variant`)** — `UWidgetColumnDefinition`에 `variant?: 'success'|'warning'|'danger'|'info'|'neutral'` 추가. 지정 시 해당 컬럼 셀에 `font-weight:600` + `uw-metric`과 동일한 `--u-widget-*` 색 토큰을 적용해 핵심 열을 강조한다. 그동안 stat-group(`uw-metric`)만 `variant` 강조가 가능하고 `table`은 강조 렌더 경로가 없던 카탈로그 내 표현력 비대칭을 해소. 미등록 variant는 warn-once 후 default fallback. schema `columnDefinition`에도 반영. 실사용에서 관측.

### Fixed
- `tests/core/format.test.ts`: `formatValue(null)`이 빈 문자열을 기대하던 stale 테스트를 수정 — 0.11.x의 em-dash(`—`) null 렌더링(의도된 동작, JSDoc 문서화됨)과 불일치했다.

## [0.11.11] - 2026-07-03

### Documentation
- `README.md`에 `## React` 섹션 신설 — `@iyulab/u-widgets/react` 서브패스가 제공하는 공식 래퍼 `UWidget`(객체 `spec` prop·`onWidgetEvent` 타입드 이벤트·`UWidgetSpec/UWidgetEvent/UWidgetAction` 타입 re-export·peerDependency 안내)을 문서화. 그동안 `/react` 서브패스가 존재함에도 README에 전혀 노출되지 않아 소비자가 공식 래퍼를 발견하지 못했다.
- `## Framework Integration`의 Next.js 예제를 공식 래퍼 사용으로 교정 — 기존 예제는 `<u-widget spec={JSON.stringify(spec)} />` 손수 래퍼를 만들도록 안내해, 같은 패키지에 객체 spec·타입드 이벤트를 처리하는 공식 `UWidget` 래퍼가 있는데도 소비자를 수동 직렬화 우회로 유도하고 있었다.

## [0.11.10] - 2026-07-03

### Fixed
- `uw-metric`: 좁은 카드(모바일 2열 stat-group)에서 큰 통화 값(예: `₩5,122,661,618`)이 천단위 그룹 중간에서 줄바꿈되던 문제 수정. `.metric-value`에 `white-space: nowrap`을 지정해 한 줄을 유지하고, 이미 존재하던 `container: uw-metric / inline-size` 기준으로 카드 폭 티어(16rem → 1.25rem, 12rem → 1.05rem) container 쿼리를 추가해 좁은 카드에서 폰트를 줄여 맞춘다. `part="value"`가 노출되지만 `u-widget` 래퍼의 중첩 shadow DOM(exportparts 없음)에 막혀 소비자 `::part(value)` CSS로 도달 불가하므로 업스트림 수정. 실사용에서 관측.

## [0.11.9] - 2026-07-02

### Fixed
- `UWidgetColumnDefinition.format` 타입이 `currency:${string}` 형태를 허용하지 않아 JSDoc·런타임(`formatValue`)이 이미 지원하는 `"currency:KRW"` 같은 값을 지정할 때마다 `as unknown as` 캐스트가 필요했던 문제 수정 — 템플릿 리터럴 타입 추가(하위 호환)
- `uw-metric`의 `variant`가 유효하지 않은 값(예: `'default'`)을 받으면 타입 캐스트만 거쳐 조용히 no-op 렌더링되던 문제 — 알 수 없는 variant 값에 대해 콘솔 경고(값당 1회)를 추가하고 기본 스타일로 폴백

### Documentation
- `docs/widgets.md`에 `installGlobalThemeSync()` auto-run 동작(import 시점 자동 실행, `data-theme` 감시·전파 메커니즘) 문서화 — 기존에 문서화되지 않아 소비자가 동일 기능을 중복 구현하는 사례 발생

## [0.11.8] - 2026-06-11

### Fixed
- `theme-sync`: import 시점 자동 초기화가 SSR DOM shim 환경(@lit-labs/ssr 등)에서 throw하여 소비자 모듈 로드 자체가 실패하던 문제 수정 — `documentElement`/`querySelectorAll`/`MutationObserver` 부재 시 no-op으로 통과

### Added
- `options.echarts` passthrough에 미등록 ECharts 컴포넌트 키(`dataZoom`, `toolbox`, `title` 등)가 전달되면 키당 1회 콘솔 경고 출력 — 옵션은 병합되지만 런타임에 동작하지 않는 false affordance 방지. 헤비 인터랙션(zoom/pan/toolbox)은 `@iyulab/flex-chart`가 담당 예정

## [0.11.4] - 2026-05-07

### Fixed
- `uw-table`: `pageSize` 미설정 시 1,000행 초과 데이터를 자동으로 100건씩 페이지네이션. 기존에는 전체 행을 한 번에 DOM 마운트하여 대용량 데이터에서 성능 저하 발생. `spec.options.pageSize: 0`으로 명시한 기존 소비자는 영향 없음

## [0.4.0] - 2026-02-18

### Added

- **Widget: `code`** — Syntax-highlighted code display with built-in mini highlighter (12 languages), line numbers, line highlighting, copy button, scroll containment
- **Widget: `citation`** — Source/reference cards with title, URL, snippet, source; compact and numbered modes
- **Widget: `status`** — Inline status badges with 7 semantic variants (success, warning, error, info, pending, neutral, custom)
- **Widget: `steps`** — Multi-step progress indicator with vertical/horizontal layouts, 4 statuses (done, active, pending, error), compact mode
- **Widget: `rating`** — Star/heart/thumb rating with display-only and interactive modes, fractional values, hover preview
- **Widget: `video`** — HTML5 video player wrapper with controls, poster, autoplay (muted), loop, playsinline
- **Widget: `gallery`** — CSS Grid image gallery with lazy loading, figure/figcaption semantics, auto-fill responsive grid
- **Widget: `kv`** — Key-value pair display for structured data
- **Widget: `divider`** — Visual separator for compose layouts
- **Widget: `header`** — Section header for compose layouts
- **Compose:** `options.widths` for proportional grid column widths (fr/auto/stretch values)
- **Compose:** `collapsed` property on child specs for progressive disclosure via native `<details>/<summary>`
- **Metric:** Global `actions` support for display widgets
- **MCP Tools:** Full catalog, templates, and examples for all new widgets

### Fixed

- **Security:** `u-citation` now uses sanitized URL in `window.open` and event data
- **Code:** Fixed `highlightJSON` double-advance bug for `true`/`false`/`null` tokens
- **Rating:** Fixed thumb icon half-star rendering (rounds to nearest full/empty)
- **Steps:** Fixed horizontal layout ignoring `compact` option

### Changed

- Tools bundle budget raised from 10 KB to 12 KB (MCP-only, not in core budget)

## [0.3.3] - 2026-02-18

### Added

- **Accessibility:** `aria-invalid` for select, radio, checkbox, multiselect in forms
- **Accessibility:** `scope="col"` on markdown-generated table `<th>` elements
- **Accessibility:** `aria-live="polite"` on callout widgets
- **Accessibility:** `role="radiogroup"` / `role="group"` on form radio/checkbox/multiselect groups
- **Accessibility:** `role="region"` with `aria-label` on compose widget (when title present)
- **Accessibility:** Sortable table headers now keyboard-operable (`tabindex`, Enter/Space)
- **Theme:** CSS theme tokens (`--u-widget-*`) propagated to all 8 elements via shared `themeStyles`
- **i18n:** Intl API locale-aware formatting for percent, date, datetime values
- **Responsive:** Container query for `u-form` (compact layout at narrow widths)
- **DRY:** Common `isDateLikeString` utility extracted to `core/utils.ts`
- **Tests:** Bundle size budget regression tests (6 tests)
- **Tests:** Theme token verification tests (20 tests)

### Changed

- Bundle budget tests enforce: core < 5 KB, charts < 5 KB, tools < 5 KB, forms < 2 KB, shared < 4 KB (all gzip)

## [0.3.2] - 2026-02-18

### Added

- **Tests:** u-chart direct tests, pipeline integration tests, entry point tests
- **Form:** Textarea `minLength`/`maxLength` validation
- **Inference:** Date string detection (`isDateLikeString`) for auto x-axis mapping
- **Suggest:** Non-chart widget suggestions (progress, chart.area recommendations)
- **Image:** Lazy loading optimization (`loading="lazy"`)
- **Schema:** JSON schema `minLength`/`pattern` support
- **Catalog:** Enhanced `help()` with field type details
- **Inference:** Smart `inferPrimaryKey` for table/list
- **Suggest:** Mapping suggestions for all chart types

## [0.3.1] - 2026-02-18

### Fixed

- **Security:** XSS vulnerability in markdown parser — `javascript:`, `data:`, `vbscript:` URLs now blocked in links and image `src`
- **Security:** `sanitizeUrl` hardened against zero-width Unicode character bypass (`\u200B`, `\uFEFF`, etc.)
- **Form:** `number`/`range` input values now coerced to `Number` — fixes silent `min`/`max` validation skip
- **Form:** `<input type="datetime">` mapped to `datetime-local` — fixes browser fallback to plain text input
- **Form:** Enter key now triggers submit even when no explicit `submit` action is defined
- **Form:** `<label>` elements linked to inputs via `for`/`id` attributes for Shadow DOM accessibility
- **Form:** Removed redundant `?selected` binding on `<select>` options
- **Chart:** Added `ResizeObserver` to `u-chart` — charts now auto-resize when container dimensions change
- **Chart:** Fixed `radar` infer/adapter contract — `infer()` now returns `{ axis, y }` matching adapter expectations
- **Chart:** Waterfall chart uses `null` instead of `'-'` for empty bar slots (correct ECharts stacked bar behavior)
- **Table:** Numeric string values now sorted numerically (`"2" < "10"`) instead of alphabetically
- **Markdown:** Code block newlines preserved — `<br>` conversion no longer corrupts `<pre>` content
- **Validation:** `ARRAY_DATA`/`OBJECT_DATA` converted from string to `Set` — fixes substring false-positive matching

### Added

- **Markdown:** Ordered list support (`1. item` → `<ol><li>`)

## [0.3.0] - 2026-02-18

### Added

- **Developer tools entry point:** `u-widgets/tools` — separate bundle for programmatic APIs
  - `help(widget?)` — widget catalog with descriptions, mapping keys, and data shapes
  - `template(widget)` — minimal template spec generation for all widget types
  - `suggestMapping(data, widget?)` — data-driven widget and mapping recommendations
  - `autoSpec(data)` — one-call convenience to generate a complete spec from data
- **Widget name typo detection:** "Did you mean?" suggestions for unknown widget names using Levenshtein distance
  - `suggestWidget(name)` — exported utility function
  - Integrated into `<u-widget>` fallback card UI
- **Mapping validation warnings:** `validate()` now produces warnings when mapping fields reference data keys that don't exist
- **CDN bundle:** `unpkg` and `jsdelivr` fields in `package.json` for automatic CDN resolution

### Changed

- Tools APIs (`help`, `template`, `suggestMapping`, `autoSpec`) moved to `u-widgets/tools` entry point to keep core bundle within 4 KB budget
- Core bundle: 4.11 KB gzip (was 3.84 KB in v0.2.0)

## [0.2.0] - 2026-02-18

### Added

- **Chart types:** scatter (with bubble/size mapping), radar, heatmap, box plot, funnel, waterfall, treemap
- **Chart options:** `legend`, `grid`, `animate`, `colors`, `stacked`, `horizontal`, `smooth`, `donut`, `showLabel`, `referenceLines`, `echarts` passthrough
- **Content widgets:** `markdown`, `image`, `callout` (via `u-content` element)
- **Formdown integration:** `u-widgets/forms` entry point for `@formdown/core` parser
- **CSS theme system:** dark/light mode via CSS custom properties (`--u-widget-*`)
- **ECharts CSS theme integration:** axis, text, legend colors from CSS variables
- **Accessibility:**
  - ARIA attributes on form and table widgets
  - Keyboard navigation for table (roving tabindex, Arrow/Home/End, Enter/Space)
  - Keyboard navigation for list (roving tabindex)
  - Form keyboard support (Enter submit, Escape cancel, `aria-describedby`)
- **i18n:** locale registry, `locale` attribute on `<u-widget>`, template-based validation messages, per-field message override
- **Responsive:** CSS Container Query layouts on all components
- **Table:** sortable columns, pagination, search, compact mode
- **Form validation:** `required`, `maxLength`, `min`/`max`, `email` pattern
- **Composition:** `compose` widget with `stack`, `row`, `grid` layouts and `span`/`columns`
- **Error handling:** styled error card for invalid specs, data type validation messages
- **JSON Schema:** `schema/u-widget.schema.json` aligned with TypeScript types
- **CDN bundle:** IIFE build (`dist/u-widgets.global.js`) for `<script>` tag usage
- **JSDoc:** comprehensive documentation on all public API exports
- **E2E tests:** 27 Playwright tests across all widget types

### Changed

- Removed hardcoded `en-US` locale from `formatValue()` — respects browser/system locale
- Pagination tabindex reset via reactive `_focusedIdx` state
- Bundle split: `u-widgets` (core), `u-widgets/charts` (ECharts), `u-widgets/forms` (formdown)

### Fixed

- `package.json` exports `types` paths aligned with actual `.d.ts` filenames
- Heatmap performance: `Map` lookup instead of `findIndex`
- ECharts options deep merge for `echarts` passthrough

## [0.1.0] - 2026-02-15

### Added

- **Core widgets:** `metric`, `stat-group`, `gauge`, `progress`
- **Chart widgets:** `chart.bar`, `chart.line`, `chart.area`, `chart.pie`
- **Data widgets:** `table`, `list`
- **Input widgets:** `form`, `confirm`
- **Composition:** `compose` widget
- **Auto-inference:** mapping inferred from data shape when omitted
- **Format hints:** `number`, `currency`, `percent`, `date`, `datetime`, `bytes`
- **Events:** `u-widget-event` custom event with `submit`, `action`, `change`, `select` types
- **Formdown:** built-in lightweight parser for markdown-like form definitions
- **Spec validation:** `validate()` and `isWidgetSpec()` functions
- **Web Component:** single `<u-widget>` element with `spec` property and attribute binding
