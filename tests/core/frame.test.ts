import { describe, it, expect, vi } from 'vitest';
import { FRAMES, normalizeFrame } from '../../src/core/frame.js';
import { checkSpec } from '../../src/core/check-spec.js';
import { frameStyles } from '../../src/styles/frames.js';
import { themeStyles } from '../../src/styles/tokens.js';
import '../../src/elements/u-widget.js';
import '../../src/elements/uw-metric.js';

describe('frames', () => {
  it('are the eleven, each with a rule that reads the palette tokens', () => {
    expect(FRAMES).toEqual(['card', 'flat', 'glow', 'plate', 'ticket', 'postage', 'tape', 'bevel', 'well', 'block', 'double']);
    for (const f of FRAMES.filter(f => f !== 'flat')) expect(frameStyles.cssText).toContain(`[data-frame='${f}']`);
    expect(frameStyles.cssText).toContain('background: var(--u-widget-bg');
  });

  it('read an unknown word as no frame and warn once, naming the frames', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(normalizeFrame('ticket', 'f')).toBe('ticket');
    expect(normalizeFrame(true, 'f')).toBeUndefined();
    expect(normalizeFrame(true, 'f')).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('card, flat, glow, plate, ticket, postage, tape, bevel, well, block, double');
    warn.mockRestore();
  });

  it('read none as no frame, quietly — and a status-card takes it, drawn with no panel around it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(normalizeFrame('none', 'f')).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
    const spec = { widget: 'status-card', title: 'Pump', data: { title: 'Pump', tone: 'ok' }, options: { frame: 'none' } };
    expect(checkSpec(spec)).toMatchObject({ valid: true, errors: [], warnings: [] });
    const el = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
    el.spec = spec;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('[part="card"][data-frame]')).toBeNull();
    el.spec = { ...spec, options: { frame: 'flat' } };
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('[part="card"]')?.getAttribute('data-frame')).toBe('flat');
    el.remove();
  });

  it('draw a widget with its title inside the frame options.frame names', async () => {
    const el = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
    el.spec = { widget: 'metric', title: 'Flow', data: { value: 12 }, options: { frame: 'postage' } };
    document.body.appendChild(el);
    await el.updateComplete;
    const frame = el.shadowRoot!.querySelector('[part="card"]');
    expect(frame?.getAttribute('data-frame')).toBe('postage');
    expect(frame?.querySelector('[part="title"]')?.textContent).toBe('Flow');
    el.remove();
  });
});

describe('typefaces', () => {
  it('give titles a display face and figures a numeric face, both the body face unless set', () => {
    expect(themeStyles.cssText).toContain('--u-widget-font-display: var(--u-widget-font-family)');
    expect(themeStyles.cssText).toContain('--u-widget-font-numeric: var(--u-widget-font-family)');
  });
});
