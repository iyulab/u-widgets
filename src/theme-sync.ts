let installed = false

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

  const currentTheme = (): string =>
    document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'

  const apply = (el: Element, t: string): void => {
    if (el.getAttribute('theme') !== t) el.setAttribute('theme', t)
  }

  const syncAll = (): void => {
    const t = currentTheme()
    document.querySelectorAll('u-widget').forEach(el => apply(el, t))
  }

  new MutationObserver(syncAll).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })

  new MutationObserver(mutations => {
    const t = currentTheme()
    for (const m of mutations) {
      m.addedNodes.forEach(n => {
        if (!(n instanceof Element)) return
        if (n.tagName === 'U-WIDGET') apply(n, t)
        else n.querySelectorAll('u-widget').forEach(el => apply(el, t))
      })
    }
  }).observe(document.body, { childList: true, subtree: true })

  syncAll()
}
