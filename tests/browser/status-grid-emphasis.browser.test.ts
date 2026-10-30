/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/index.js';
import type { UWidgetSpec } from '../../src/core/types.js';

/**
 * A cell's emphasis is a background (a fill, hatching) that the cell's own tint would outrank if the shared emphasis rules
 * were all it had — which only a real engine's computed style shows.
 */
describe('uw-status-grid — a cell’s emphasis', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  async function cells(data: Record<string, unknown>[]) {
    const el = document.createElement('uw-status-grid') as HTMLElement & { spec: UWidgetSpec; updateComplete: Promise<unknown> };
    el.style.setProperty('--u-widget-tone-alarm', 'rgb(208, 0, 0)');
    el.style.setProperty('--u-widget-bg', 'rgb(255, 255, 255)');
    el.spec = { widget: 'status-grid', data };
    document.body.appendChild(el);
    await el.updateComplete;
    return [...el.shadowRoot!.querySelectorAll<HTMLElement>('[part="cell"]')];
  }

  it('fills an inverted cell with its tone and draws its text on the paper', async () => {
    const [plain, inverted] = await cells([{ label: '1', tone: 'alarm' }, { label: '2', tone: 'alarm', emphasis: 'invert' }]);
    expect(getComputedStyle(inverted).backgroundColor).toBe('rgb(208, 0, 0)');
    expect(getComputedStyle(inverted).color).toBe('rgb(255, 255, 255)');
    expect(getComputedStyle(plain).backgroundColor).not.toBe('rgb(208, 0, 0)');
  });

  it('hatches a hatched cell and blinks a blinking one', async () => {
    const [hatched, blinking] = await cells([{ label: '1', tone: 'alarm', emphasis: 'hatch' }, { label: '2', tone: 'alarm', emphasis: 'blink' }]);
    expect(getComputedStyle(hatched).backgroundImage).toContain('repeating-linear-gradient');
    expect(getComputedStyle(blinking).animationName).toBe('uw-tone-blink');
  });
});
