import { css } from 'lit';

/**
 * The frame rules (the frames are named in `core/frame.ts`). An element carrying `data-frame` is drawn as that
 * frame; its padding is the frame's, so the widget inside keeps clear of a scalloped or perforated edge.
 */
export const frameStyles = css`
  [data-frame] {
    padding: 16px 20px;
    background: var(--u-widget-bg, #fff);
    color: var(--u-widget-text, #1a1a2e);
    border-radius: var(--u-widget-radius, 6px);
    box-sizing: border-box;
  }
  [data-frame='card'] {
    border: 1px solid var(--u-widget-border, #e2e8f0);
    box-shadow: var(--u-widget-shadow);
  }
  [data-frame='glow'] {
    border: 1px solid color-mix(in srgb, var(--tone, var(--u-widget-primary)) 45%, var(--u-widget-border, #e2e8f0));
    box-shadow: 0 0 18px color-mix(in srgb, var(--tone, var(--u-widget-primary)) 30%, transparent);
  }
  [data-frame='plate'] {
    border: 2px solid var(--u-widget-text, #1a1a2e);
    box-shadow:
      inset 0 0 0 3px var(--u-widget-bg, #fff),
      inset 0 0 0 4px color-mix(in srgb, var(--u-widget-text, #1a1a2e) 40%, transparent),
      var(--u-widget-shadow);
  }
  /* A mask cuts the edge — and would cut a shadow with it, so the masked frames have none. */
  [data-frame='ticket'] {
    border-radius: 2px;
    padding-block: 20px;
    -webkit-mask:
      radial-gradient(circle at 50% 0, #0000 5px, #000 5.5px) top / 14px 51% repeat-x,
      radial-gradient(circle at 50% 100%, #0000 5px, #000 5.5px) bottom / 14px 51% repeat-x;
    mask:
      radial-gradient(circle at 50% 0, #0000 5px, #000 5.5px) top / 14px 51% repeat-x,
      radial-gradient(circle at 50% 100%, #0000 5px, #000 5.5px) bottom / 14px 51% repeat-x;
  }
  /* Holes only round the edge: a dotted layer and a solid centre layer are added together. */
  [data-frame='postage'] {
    border-radius: 0;
    padding: 20px;
    -webkit-mask:
      radial-gradient(circle, #0000 4px, #000 4.5px) -7px -7px / 14px 14px round,
      linear-gradient(#000 0 0) center / calc(100% - 14px) calc(100% - 14px) no-repeat;
    mask:
      radial-gradient(circle, #0000 4px, #000 4.5px) -7px -7px / 14px 14px round,
      linear-gradient(#000 0 0) center / calc(100% - 14px) calc(100% - 14px) no-repeat;
  }
  [data-frame='tape'] {
    border-radius: 2px;
    transform: rotate(-0.6deg);
    box-shadow: var(--u-widget-shadow);
  }
`;
