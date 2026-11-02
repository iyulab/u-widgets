import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { UWidgetSpec } from '../../src/core/types.js';

let UwStatus: typeof import('../../src/elements/uw-status.js').UwStatus;

beforeEach(async () => {
  const mod = await import('../../src/elements/uw-status.js');
  UwStatus = mod.UwStatus;
});

function render(spec: UWidgetSpec): HTMLElement {
  const el = new UwStatus();
  el.spec = spec;
  (el as any).performUpdate();
  return el;
}

function shadow(el: HTMLElement) {
  return el.shadowRoot!;
}

describe('uw-status', () => {
  describe('basic rendering', () => {
    it('renders nothing when spec is null', () => {
      const el = new UwStatus();
      (el as any).performUpdate();
      expect(shadow(el).querySelector('.status-list')).toBeNull();
    });

    it('renders nothing when data is empty', () => {
      const el = render({ widget: 'status', data: {} });
      expect(shadow(el).querySelector('.status-list')).toBeNull();
    });

    it('renders an item without a label as a badge showing its value — no label, no colon', () => {
      const el = render({ widget: 'status', data: { value: 'Running', tone: 'ok' } });
      const item = shadow(el).querySelector('.status-item')!;
      expect(item).not.toBeNull();
      expect(item.querySelector('.status-label')).toBeNull();
      expect(item.querySelector('.status-value')!.textContent).toBe('Running');
      expect(item.getAttribute('data-tone')).toBe('ok');
    });

    it('keeps array items that have a value, labelled or not, and skips those without one', () => {
      const el = render({ widget: 'status', data: [{ label: 'API', value: 'Up' }, { value: 'Idle' }, { label: 'DB' }] });
      const items = shadow(el).querySelectorAll('.status-item');
      expect(items).toHaveLength(2);
      expect(items[1].querySelector('.status-label')).toBeNull();
    });

    it('renders status items from array data', () => {
      const el = render({
        widget: 'status',
        data: [
          { label: 'API', value: 'Up', tone: 'ok' },
          { label: 'DB', value: 'Down', tone: 'alarm' },
        ],
      });
      const items = shadow(el).querySelectorAll('.status-item');
      expect(items.length).toBe(2);
    });

    it('renders single status from object data', () => {
      const el = render({
        widget: 'status',
        data: { label: 'Service', value: 'Running', tone: 'ok' },
      });
      const items = shadow(el).querySelectorAll('.status-item');
      expect(items.length).toBe(1);
    });

    it('renders label text', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'API Gateway', value: 'OK', tone: 'ok' }],
      });
      const label = shadow(el).querySelector('.status-label');
      expect(label?.textContent?.trim()).toBe('API Gateway');
    });

    it('renders value text', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'API', value: 'Operational', tone: 'ok' }],
      });
      const value = shadow(el).querySelector('.status-value');
      expect(value?.textContent?.trim()).toBe('Operational');
    });
  });

  describe('level handling', () => {
    it('applies info level', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'Info', tone: 'info' }],
      });
      const item = shadow(el).querySelector('.status-item');
      expect(item?.getAttribute('data-tone')).toBe('info');
    });

    it('applies success level', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'OK', tone: 'ok' }],
      });
      const item = shadow(el).querySelector('.status-item');
      expect(item?.getAttribute('data-tone')).toBe('ok');
    });

    it('applies warning level', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'Slow', tone: 'warn' }],
      });
      const item = shadow(el).querySelector('.status-item');
      expect(item?.getAttribute('data-tone')).toBe('warn');
    });

    it('applies error level', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'Down', tone: 'alarm' }],
      });
      const item = shadow(el).querySelector('.status-item');
      expect(item?.getAttribute('data-tone')).toBe('alarm');
    });

    it('applies neutral level', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'N/A', tone: 'idle' }],
      });
      const item = shadow(el).querySelector('.status-item');
      expect(item?.getAttribute('data-tone')).toBe('idle');
    });

    it('draws an item with no tone plainly — no tone, no mark', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'Val' }],
      });
      const item = shadow(el).querySelector('.status-item');
      expect(item?.hasAttribute('data-tone')).toBe(false);
      expect(shadow(el).querySelector('.status-icon')).toBeNull();
    });

    it('draws an unknown tone as no tone and warns once, naming the tones', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'Val', tone: 'bogus' }, { label: 'Again', value: 'Val', tone: 'bogus' }],
      });
      expect(shadow(el).querySelector('.status-item')?.hasAttribute('data-tone')).toBe(false);
      expect(warn.mock.calls.filter(c => String(c[0]).includes('"bogus"'))).toHaveLength(1);
      expect(String(warn.mock.calls[0][0])).toContain('ok, info, watch, warn, alarm, off, idle, accent, past, now, next');
      warn.mockRestore();
    });

    it('shows the tone’s name for an item with a tone and no value, in the widget’s locale', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Pump', tone: 'alarm' }, { tone: 'next' }],
      });
      const values = [...shadow(el).querySelectorAll('.status-value')].map(v => v.textContent);
      expect(values).toEqual(['Alarm', 'Next']);
    });

    it('takes every one of the eleven tones', () => {
      const tones = ['ok', 'info', 'watch', 'warn', 'alarm', 'off', 'idle', 'accent', 'past', 'now', 'next'];
      const el = render({ widget: 'status', data: tones.map(tone => ({ value: tone, tone })) });
      expect([...shadow(el).querySelectorAll('.status-item')].map(i => i.getAttribute('data-tone'))).toEqual(tones);
    });
  });

  describe('level icons', () => {
    it('renders icon for each item', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'OK', tone: 'ok' }],
      });
      const icon = shadow(el).querySelector('.status-icon');
      expect(icon).toBeTruthy();
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });

    it('renders success checkmark symbol', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'OK', tone: 'ok' }],
      });
      const icon = shadow(el).querySelector('.status-icon');
      expect(icon?.textContent).toBe('\u2713'); // ✓
    });

    it('marks an item with the glyph it is given, in place of its tone’s', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Line 2', value: 'Delayed', tone: 'warn', glyph: '!' }],
      });
      expect(shadow(el).querySelector('.status-icon')?.textContent).toBe('!');
      expect(shadow(el).querySelector('.status-item')?.getAttribute('data-tone')).toBe('warn');
    });

    it('renders error cross symbol', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'Down', tone: 'alarm' }],
      });
      const icon = shadow(el).querySelector('.status-icon');
      expect(icon?.textContent).toBe('\u2715'); // ✕
    });
  });

  describe('accessibility', () => {
    it('has list role', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'OK' }],
      });
      const list = shadow(el).querySelector('[role="list"]');
      expect(list).toBeTruthy();
    });

    it('has listitem roles', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'A', value: '1' }, { label: 'B', value: '2' }],
      });
      const items = shadow(el).querySelectorAll('[role="listitem"]');
      expect(items.length).toBe(2);
    });

    it('uses title as aria-label', () => {
      const el = render({
        widget: 'status',
        title: 'System Health',
        data: [{ label: 'API', value: 'OK' }],
      });
      const list = shadow(el).querySelector('[role="list"]');
      expect(list?.getAttribute('aria-label')).toBe('System Health');
    });
  });

  describe('CSS parts', () => {
    it('exposes status part', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'OK' }],
      });
      expect(shadow(el).querySelector('[part="status"]')).toBeTruthy();
    });

    it('exposes status-item part', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'OK' }],
      });
      expect(shadow(el).querySelector('[part="status-item"]')).toBeTruthy();
    });

    it('exposes status-icon part', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'OK', tone: 'ok' }],
      });
      expect(shadow(el).querySelector('[part="status-icon"]')).toBeTruthy();
    });

    it('exposes status-label part', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'OK' }],
      });
      expect(shadow(el).querySelector('[part="status-label"]')).toBeTruthy();
    });

    it('exposes status-value part', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Test', value: 'OK' }],
      });
      expect(shadow(el).querySelector('[part="status-value"]')).toBeTruthy();
    });
  });

  describe('data filtering', () => {
    it('draws an item without a label as a value-only badge', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Valid', value: 'OK' }, { value: 'No Label' }],
      });
      const items = shadow(el).querySelectorAll('.status-item');
      expect(items.length).toBe(2);
      expect(items[1].querySelector('.status-label')).toBeNull();
    });

    it('skips items without value', () => {
      const el = render({
        widget: 'status',
        data: [{ label: 'Valid', value: 'OK' }, { label: 'No Value' }],
      });
      const items = shadow(el).querySelectorAll('.status-item');
      expect(items.length).toBe(1);
    });
  });
});

describe('uw-status emphasis', () => {
  const shadowOf = (el: HTMLElement) => el.shadowRoot!;
  it('marks an item with its emphasis and draws a stamp as the value stamped', async () => {
    const el = document.createElement('uw-status') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
    el.spec = { widget: 'status', data: [{ label: 'Oven', value: 'Late', tone: 'alarm', emphasis: 'invert' }, { label: 'Order 12', value: 'Done', tone: 'past', emphasis: 'stamp' }] };
    document.body.appendChild(el);
    await el.updateComplete;
    const items = [...shadowOf(el).querySelectorAll('.status-item')];
    expect(items.map(i => i.getAttribute('data-emphasis'))).toEqual(['invert', 'stamp']);
    expect(items[1].querySelector('.status-value')?.classList.contains('tone-stamp')).toBe(true);
    el.remove();
  });
});

describe('uw-status face', () => {
  const data = [{ label: 'Oven', value: 'Late', tone: 'alarm' }, { value: 'Idle' }];
  const listOf = async (options?: Record<string, unknown>) => {
    const el = document.createElement('uw-status') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
    el.spec = { widget: 'status', data, ...(options && { options }) };
    document.body.appendChild(el);
    await el.updateComplete;
    const list = el.shadowRoot!.querySelector('.status-list')!;
    return { el, list };
  };

  it('draws an item as it always was when no face is named — the list carries no face', async () => {
    const { el, list } = await listOf();
    expect(list.hasAttribute('data-face')).toBe(false);
    el.remove();
  });

  it('marks the list a pill when face is "pill" and leaves the items\' own tone and words alone', async () => {
    const { el, list } = await listOf({ face: 'pill' });
    expect(list.getAttribute('data-face')).toBe('pill');
    const items = [...list.querySelectorAll('.status-item')];
    expect(items.map(i => i.getAttribute('data-tone'))).toEqual(['alarm', null]);
    expect(items[0].querySelector('.status-value')!.textContent).toBe('Late');
    el.remove();
  });

  it('ignores a face it does not know', async () => {
    const { el, list } = await listOf({ face: 'oval' });
    expect(list.hasAttribute('data-face')).toBe(false);
    el.remove();
  });

  it('styles the pill as a rounded fill of the item\'s tone', () => {
    const styles = (customElements.get('uw-status') as any).styles;
    const css = (Array.isArray(styles) ? styles : [styles]).map((s: any) => s.cssText ?? '').join(' ');
    expect(css).toMatch(/\[data-face='pill'\][^{]*\.status-item[^{]*\{[^}]*border-radius:\s*999px/);
    expect(css).toMatch(/\[data-face='pill'\][^{]*\.status-item\[data-tone\][^{]*\{[^}]*color-mix\(in srgb, var\(--tone\) 14%/);
  });
});
