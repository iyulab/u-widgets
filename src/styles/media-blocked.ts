import { css, html, nothing } from 'lit';

/** The stand-in a widget draws where a media URL was refused by {@link import('../core/media.js').setMediaOrigins}. */
export const mediaBlockedStyles = css`
  .media-blocked {
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-height: 48px;
    padding: 8px 12px;
    border: 1px dashed var(--u-widget-border, #e2e8f0);
    border-radius: var(--u-widget-radius, 6px);
    font-size: var(--u-widget-font-size-caption, 0.75rem);
    color: var(--u-widget-text-secondary, #5b6777);
    text-align: center;
    overflow-wrap: anywhere;
  }
`;

/** The `alt` text where the media would be — a labelled image for a screen reader, nothing to read when there is no `alt`. */
export function mediaBlocked(alt: string | undefined) {
  return alt
    ? html`<div class="media-blocked" part="blocked" role="img" aria-label=${alt}>${alt}</div>`
    : html`<div class="media-blocked" part="blocked" aria-hidden="true">${nothing}</div>`;
}
