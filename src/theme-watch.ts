type Listener = () => void

const listeners = new Set<Listener>()
let installed = false

function notify(): void {
  listeners.forEach(fn => fn())
}

function install(): void {
  if (installed) return
  if (
    typeof document === 'undefined' ||
    !document.documentElement ||
    typeof MutationObserver === 'undefined'
  ) return
  installed = true

  // A page switches its theme by an attribute on <html> or <body> (`theme`, `data-theme`, a `dark` class,
  // an inline `color-scheme`) or the system switches it under `prefers-color-scheme`. Which one a page
  // uses is the page's business — any of them may change the tokens a canvas read when it last drew.
  const observer = new MutationObserver(notify)
  observer.observe(document.documentElement, { attributes: true })
  if (document.body) observer.observe(document.body, { attributes: true })
  else document.addEventListener('DOMContentLoaded', () => {
    if (document.body) observer.observe(document.body, { attributes: true })
  }, { once: true })

  if (typeof matchMedia === 'function') {
    matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', notify)
  }
}

/**
 * Calls `listener` when the page may have changed the tokens a canvas reads — a theme attribute or class on
 * `<html>`/`<body>`, or the system colour scheme. It is a hint, not a diff: the listener re-reads what it
 * depends on and does nothing when that is unchanged. Returns the unsubscribe function.
 */
export function onPageThemeChange(listener: Listener): () => void {
  install()
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
