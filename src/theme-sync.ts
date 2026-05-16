let installed = false

export function installGlobalThemeSync(): void {
  if (installed || typeof document === 'undefined') return
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
