/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/index.js';
import type { UWidgetSpec } from '../../src/core/types.js';

/**
 * The widgets' own stylesheets say «start» and «end», not «left» and «right» — so in a right-to-left page the tone bar of a card,
 * the label axis of a key–value list and the number columns of a table sit on the reading side. A declaration that names a screen
 * side keeps the widget on the left whatever the page's direction, which only a real engine's layout shows.
 */
describe('u-widgets mirror under dir="rtl"', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  type Host = HTMLElement & { spec: UWidgetSpec; updateComplete: Promise<unknown> };

  async function mount(tag: string, spec: UWidgetSpec, dir: 'ltr' | 'rtl'): Promise<Host> {
    const wrap = document.createElement('div');
    wrap.dir = dir;
    wrap.style.cssText = 'width: 420px';
    const el = document.createElement(tag) as Host;
    el.spec = spec;
    wrap.appendChild(el);
    document.body.appendChild(wrap);
    await el.updateComplete;
    return el;
  }

  /** Which side of the card the tone bar is drawn on: the card's border-start width is the one that is set. */
  const bar = (card: HTMLElement) => {
    const cs = getComputedStyle(card);
    return { left: parseFloat(cs.borderLeftWidth), right: parseFloat(cs.borderRightWidth) };
  };

  it('draws a status card’s tone bar on the reading start side', async () => {
    const spec: UWidgetSpec = { widget: 'status-card', data: { title: 'Pump 1', status: 'ok', fields: [{ label: 'Pressure', value: '3.2' }] } };
    const ltr = bar((await mount('uw-status-card', spec, 'ltr')).shadowRoot!.querySelector<HTMLElement>('[part="card"]')!);
    const rtl = bar((await mount('uw-status-card', spec, 'rtl')).shadowRoot!.querySelector<HTMLElement>('[part="card"]')!);
    expect(ltr.left).toBeGreaterThan(0);
    expect(ltr.right).toBe(0);
    expect(rtl.right).toBeGreaterThan(0);
    expect(rtl.left).toBe(0);
  });

  it('declares a vertical key–value list’s alignment by reading side — labels to the end, values to the start (a screen side would compute to left/right)', async () => {
    const spec: UWidgetSpec = { widget: 'kv', data: { alpha: 'one', 'a longer label': 'two' }, options: { layout: 'vertical' } };
    const aligns = async (dir: 'ltr' | 'rtl') => {
      const el = await mount('uw-kv', spec, dir);
      const key = el.shadowRoot!.querySelector<HTMLElement>('[part="kv-key"]')!;
      const value = el.shadowRoot!.querySelector<HTMLElement>('[part="kv-value"]')!;
      return { key: getComputedStyle(key).textAlign, value: getComputedStyle(value).textAlign };
    };
    // `text-align: start|end` computes to the keyword itself in either direction — what the assertion rules out is `left`/`right`,
    // the screen sides that stay put when the page reads right to left.
    const ltr = await aligns('ltr');
    const rtl = await aligns('rtl');
    expect([ltr.key, ltr.value]).toEqual(['end', 'start']);
    expect([rtl.key, rtl.value]).toEqual(['end', 'start']);
  });
});
