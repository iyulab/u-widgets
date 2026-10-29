/**
 * Where a widget may load media from.
 *
 * `image`, `gallery`, `video` (its source, poster and subtitle tracks), the `status-card` picture and the `table`
 * list avatar take a URL from the spec, and the browser requests it the moment the widget is drawn — the request
 * itself leaves the page, even when the answer is never read. A spec that comes from somewhere the host does not
 * trust (a model's output, a retrieved document) can put what it knows in that URL. This is the one place that
 * decides, for every such widget, whether a URL may be loaded.
 *
 * The default is unrestricted: nothing changes until the host calls {@link setMediaOrigins}.
 */

/** The page's own origin, as an entry of the list. */
export const MEDIA_SELF = 'self';

let allowed: ReadonlySet<string> | null = null;

/**
 * Restrict the origins widgets may load media from.
 *
 * Each entry is an origin (`"https://cdn.example.com"`; a path is ignored) or `"self"` for the page's own origin
 * (which is where a relative URL points). A URL outside the list is not requested: the widget draws its `alt` text
 * where the media would be. `[]` allows nothing. `null` lifts the restriction (the default).
 *
 * The list is read each time a widget draws, so set it before the first widget does; a widget already on screen
 * keeps what it drew until it next renders.
 */
export function setMediaOrigins(origins: readonly string[] | null): void {
  if (origins == null) {
    allowed = null;
    return;
  }
  const set = new Set<string>();
  for (const entry of origins) {
    if (entry === MEDIA_SELF) { set.add(MEDIA_SELF); continue; }
    try {
      const origin = new URL(entry).origin;
      if (origin !== 'null') set.add(origin);
    } catch {
      // not an origin — it matches nothing
    }
  }
  allowed = set;
}

/** The origins set by {@link setMediaOrigins}, or `null` when media is unrestricted. */
export function getMediaOrigins(): readonly string[] | null {
  return allowed ? [...allowed] : null;
}

export interface MediaCheck {
  /** The URL to load, or `''` when it must not be requested. */
  src: string;
  /** `true` when the URL was refused because of its origin (the widget shows a stand-in); `false` for a URL that is simply dropped (a script or `data:` URL, or none at all). */
  blocked: boolean;
}

/** Whitespace and invisible characters a browser ignores inside a URL's scheme. */
const INVISIBLE = /[\s\u200B\u200C\u200D\uFEFF\u00AD\u200E\u200F]/g;

/**
 * Decide whether `raw` may be loaded as media. A `javascript:`, `data:` or `vbscript:` URL is always dropped (an
 * inline `data:image/…` is let through for the widgets that take one, `inlineImage`); with origins set, a URL whose
 * origin is not in the list is blocked.
 */
export function checkMediaUrl(raw: string, options: { inlineImage?: boolean } = {}): MediaCheck {
  const stripped = raw.replace(INVISIBLE, '');
  // An inline image makes no request, so no origin applies to it — for the widgets that have always taken one.
  if (options.inlineImage && /^data:image\//i.test(stripped)) return { src: raw, blocked: false };
  if (!stripped || /^(javascript|data|vbscript):/i.test(stripped)) return { src: '', blocked: false };
  if (!allowed) return { src: raw, blocked: false };
  return originAllowed(stripped) ? { src: raw, blocked: false } : { src: '', blocked: true };
}

function originAllowed(url: string): boolean {
  const base = typeof document !== 'undefined' ? document.baseURI : undefined;
  let origin: string;
  try {
    origin = new URL(url, base).origin;
  } catch {
    // Relative with no page to resolve against (a server-side check): it is the page's own.
    return !/^[a-z][a-z0-9+.-]*:|^\/\//i.test(url) && allowed!.has(MEDIA_SELF);
  }
  if (origin === 'null') return false;
  if (allowed!.has(origin)) return true;
  const own = typeof location !== 'undefined' ? location.origin : undefined;
  return allowed!.has(MEDIA_SELF) && own !== undefined && origin === own;
}
