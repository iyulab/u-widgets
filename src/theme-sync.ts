let installed = false

/**
 * The theme the page declares on `<html data-theme>` — or on `<html theme>`, the attribute `@iyulab/components`'
 * `Theme` writes — or `null` when it declares none. `data-theme` wins when both are present.
 */
function declaredTheme(): 'dark' | 'light' | null {
  for (const name of THEME_ATTRIBUTES) {
    const value = document.documentElement.getAttribute(name)
    if (value === 'dark' || value === 'light') return value
  }
  return null
}

const THEME_ATTRIBUTES = ['data-theme', 'theme']

/** The value this sync last wrote on each widget. A `theme` that differs from it was set by the page. */
const written = new WeakMap<Element, string>()

/**
 * Widgets that sit inside another element's shadow root. `document.querySelectorAll` stops at a shadow boundary and
 * the body observer never sees a node added below one, so the page-wide passes below cannot find these — each widget
 * reports itself when it connects (`trackShadowWidget`) and leaves when it disconnects.
 */
const shadowWidgets = new Set<Element>()

// A widget's own theme: its property once it is upgraded — a framework (React through `@lit/react`)
// sets the property before the attribute reflects it, so a widget added with a theme can reach this
// sync with no attribute yet — else its attribute.
const themeOf = (el: Element): string | null => {
  const property = (el as Element & { theme?: unknown }).theme
  return typeof property === 'string' ? property : el.getAttribute('theme')
}

const apply = (el: Element, theme: 'dark' | 'light' | null): void => {
  const current = themeOf(el)
  if (current !== null && current !== written.get(el)) return
  if (theme === null) {
    if (current !== null) el.removeAttribute('theme')
    written.delete(el)
    return
  }
  if (current !== theme) el.setAttribute('theme', theme)
  written.set(el, theme)
}

/**
 * Called by a `<u-widget>` when it connects. A widget in the document tree is the page-wide passes' to find; one in a
 * shadow tree is remembered here and gets the page's theme now and on every later change.
 */
export function trackShadowWidget(el: Element): void {
  if (typeof ShadowRoot === 'undefined' || !(el.getRootNode() instanceof ShadowRoot)) return
  shadowWidgets.add(el)
  if (installed) apply(el, declaredTheme())
}

/** Called by a `<u-widget>` when it disconnects. */
export function untrackShadowWidget(el: Element): void {
  shadowWidgets.delete(el)
}

/**
 * Carries the page's declared theme (`<html data-theme | theme="dark" | "light">`) to every `<u-widget>` — in the
 * document tree and inside other elements' shadow roots alike.
 *
 * A page that declares no theme is left to auto mode: widgets follow `prefers-color-scheme` (and the
 * page's `color-scheme`) on their own, so no `theme` attribute is written — and one this sync wrote
 * earlier is taken back when the declaration goes away. A `theme` the page sets on a widget itself is
 * its own and is never overwritten.
 */
export function installGlobalThemeSync(): void {
  if (installed) return
  // SSR DOM shim은 document만 있고 documentElement/querySelectorAll/MutationObserver가
  // 없을 수 있다 — 테마 동기화는 런타임 전용이므로 그런 환경에선 no-op.
  if (
    typeof document === 'undefined' ||
    !document.documentElement ||
    !document.body ||
    typeof document.querySelectorAll !== 'function' ||
    typeof MutationObserver === 'undefined'
  ) return
  installed = true

  const syncAll = (): void => {
    const theme = declaredTheme()
    document.querySelectorAll('u-widget').forEach(el => apply(el, theme))
    shadowWidgets.forEach(el => apply(el, theme))
  }

  new MutationObserver(syncAll).observe(document.documentElement, {
    attributes: true,
    attributeFilter: THEME_ATTRIBUTES,
  })

  new MutationObserver(mutations => {
    const theme = declaredTheme()
    for (const m of mutations) {
      m.addedNodes.forEach(n => {
        if (!(n instanceof Element)) return
        if (n.tagName === 'U-WIDGET') apply(n, theme)
        else n.querySelectorAll('u-widget').forEach(el => apply(el, theme))
      })
    }
  }).observe(document.body, { childList: true, subtree: true })

  syncAll()
}
