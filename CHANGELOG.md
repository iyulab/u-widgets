# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.12.0] - 2026-07-07

### Added
- `chart.*`: ECharts **CustomChart(custom series)** 등록 — `options.series[i].type: "custom"` 또는 `options.echarts` passthrough로 custom `renderItem`(Gantt/타임라인 등)을 주입하면 이제 바로 렌더된다. 기존에는 임의 series `type` 오버라이드를 허용하면서 CustomChart만 미등록이어서 `[ECharts] Series custom is used but not imported` 경고 후 무음 미렌더되던 비대칭을 해소. online-tools(quality) dogfooding에서 발견. 소비자 앱측 `use([CustomChart])` 워크어라운드 제거 가능.
- `uw-chart`/echarts-adapter: **미등록 series-type 어포던스 가드** 신설 — `options.series[i].type` 오버라이드와 `options.echarts.series[].type` passthrough가 미등록 series(`graph`/`sankey`/`gauge`/`sunburst` 등)를 요청하면, raw ECharts 경고 대신 u-widgets dev 경고 + `@iyulab/flex-chart` 리디렉트를 출력한다. 등록 series는 `bar`/`line`/`pie`/`scatter`/`radar`/`heatmap`/`boxplot`/`funnel`/`treemap`/`custom`. 컴포넌트 키 가드(`dataZoom`/`toolbox` 등)와 대칭 완성 — tree-shakeable 빌드의 false-affordance를 series 클래스까지 확장.
- `uw-table`: **컬럼 강조(`variant`)** — `UWidgetColumnDefinition`에 `variant?: 'success'|'warning'|'danger'|'info'|'neutral'` 추가. 지정 시 해당 컬럼 셀에 `font-weight:600` + `uw-metric`과 동일한 `--u-widget-*` 색 토큰을 적용해 핵심 열을 강조한다. 그동안 stat-group(`uw-metric`)만 `variant` 강조가 가능하고 `table`은 강조 렌더 경로가 없던 카탈로그 내 표현력 비대칭을 해소. 미등록 variant는 warn-once 후 default fallback. schema `columnDefinition`에도 반영. chemical/batch dogfooding에서 발견.

### Fixed
- `tests/core/format.test.ts`: `formatValue(null)`이 빈 문자열을 기대하던 stale 테스트를 수정 — 0.11.x의 em-dash(`—`) null 렌더링(의도된 동작, JSDoc 문서화됨)과 불일치했다.

## [0.11.11] - 2026-07-03

### Documentation
- `README.md`에 `## React` 섹션 신설 — `@iyulab/u-widgets/react` 서브패스가 제공하는 공식 래퍼 `UWidget`(객체 `spec` prop·`onWidgetEvent` 타입드 이벤트·`UWidgetSpec/UWidgetEvent/UWidgetAction` 타입 re-export·peerDependency 안내)을 문서화. 그동안 `/react` 서브패스가 존재함에도 README에 전혀 노출되지 않아 소비자가 공식 래퍼를 발견하지 못했다.
- `## Framework Integration`의 Next.js 예제를 공식 래퍼 사용으로 교정 — 기존 예제는 `<u-widget spec={JSON.stringify(spec)} />` 손수 래퍼를 만들도록 안내해, 같은 패키지에 객체 spec·타입드 이벤트를 처리하는 공식 `UWidget` 래퍼가 있는데도 소비자를 수동 직렬화 우회로 유도하고 있었다.

## [0.11.10] - 2026-07-03

### Fixed
- `uw-metric`: 좁은 카드(모바일 2열 stat-group)에서 큰 통화 값(예: `₩5,122,661,618`)이 천단위 그룹 중간에서 줄바꿈되던 문제 수정. `.metric-value`에 `white-space: nowrap`을 지정해 한 줄을 유지하고, 이미 존재하던 `container: uw-metric / inline-size` 기준으로 카드 폭 티어(16rem → 1.25rem, 12rem → 1.05rem) container 쿼리를 추가해 좁은 카드에서 폰트를 줄여 맞춘다. `part="value"`가 노출되지만 `u-widget` 래퍼의 중첩 shadow DOM(exportparts 없음)에 막혀 소비자 `::part(value)` CSS로 도달 불가하므로 업스트림 수정. yesung-oms dogfooding에서 발견.

## [0.11.9] - 2026-07-02

### Fixed
- `UWidgetColumnDefinition.format` 타입이 `currency:${string}` 형태를 허용하지 않아 JSDoc·런타임(`formatValue`)이 이미 지원하는 `"currency:KRW"` 같은 값을 지정할 때마다 `as unknown as` 캐스트가 필요했던 문제 수정 — 템플릿 리터럴 타입 추가(하위 호환)
- `uw-metric`의 `variant`가 유효하지 않은 값(예: `'default'`)을 받으면 타입 캐스트만 거쳐 조용히 no-op 렌더링되던 문제 — 알 수 없는 variant 값에 대해 콘솔 경고(값당 1회)를 추가하고 기본 스타일로 폴백

### Documentation
- `docs/widgets.md`에 `installGlobalThemeSync()` auto-run 동작(import 시점 자동 실행, `data-theme` 감시·전파 메커니즘) 문서화 — 기존에 문서화되지 않아 소비자가 동일 기능을 중복 구현하는 사례 발생

## [0.11.8] - 2026-06-11

### Fixed
- `theme-sync`: import 시점 자동 초기화가 SSR DOM shim 환경(@lit-labs/ssr 등)에서 throw하여 소비자 모듈 로드 자체가 실패하던 문제 수정 — `documentElement`/`querySelectorAll`/`MutationObserver` 부재 시 no-op으로 통과 (ISSUE-20260610-uwidgets-themesync-ssr-unsafe)

### Added
- `options.echarts` passthrough에 미등록 ECharts 컴포넌트 키(`dataZoom`, `toolbox`, `title` 등)가 전달되면 키당 1회 콘솔 경고 출력 — 옵션은 병합되지만 런타임에 동작하지 않는 false affordance 방지 (ISSUE-20260609-uwidgets-echarts-datazoom-passthrough). 헤비 인터랙션(zoom/pan/toolbox)은 `@iyulab/flex-chart`가 담당 예정

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
