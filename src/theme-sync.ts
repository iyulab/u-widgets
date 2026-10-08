let installed = false

/** The theme the page declares on `<html data-theme>`, or `null` when it declares none. */
function declaredTheme(): 'dark' | 'light' | null {
  const value = document.documentElement.getAttribute('data-theme')
  return value === 'dark' || value === 'light' ? value : null
}

/**
 * Carries the page's declared theme (`<html data-theme="dark" | "light">`) to every `<u-widget>`.
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

  // The value this sync last wrote on each widget. A `theme` that differs from it was set by the page.
  const written = new WeakMap<Element, string>()

  const apply = (el: Element, theme: 'dark' | 'light' | null): void => {
    const current = el.getAttribute('theme')
    if (current !== null && current !== written.get(el)) return
    if (theme === null) {
      if (current !== null) el.removeAttribute('theme')
      written.delete(el)
      return
    }
    if (current !== theme) el.setAttribute('theme', theme)
    written.set(el, theme)
  }

  const syncAll = (): void => {
    const theme = declaredTheme()
    document.querySelectorAll('u-widget').forEach(el => apply(el, theme))
  }

  new MutationObserver(syncAll).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
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
