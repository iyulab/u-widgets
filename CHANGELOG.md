# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

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
