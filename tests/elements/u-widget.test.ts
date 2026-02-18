import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../../src/elements/u-widget.js';
import type { UWidget } from '../../src/elements/u-widget.js';
import type { UWidgetEvent } from '../../src/core/types.js';

function createElement(spec: Record<string, unknown>): UWidget {
  const el = document.createElement('u-widget') as UWidget;
  el.spec = spec as UWidget['spec'];
  document.body.appendChild(el);
  return el;
}

async function render(el: UWidget) {
  await el.updateComplete;
  return el.shadowRoot!;
}

describe('u-widget', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  // ── Null / Empty ──

  it('renders slot when spec is null', async () => {
    const el = document.createElement('u-widget') as UWidget;
    document.body.appendChild(el);
    const shadow = await render(el);
    expect(shadow.querySelector('slot')).not.toBeNull();
  });

  // ── Validation Error ──

  it('renders error for invalid spec', async () => {
    const el = createElement({ widget: '' });
    const shadow = await render(el);
    expect(shadow.querySelector('[part="error"]')).not.toBeNull();
  });

  it('renders error card with styled structure', async () => {
    const el = createElement({ widget: '' });
    const shadow = await render(el);
    expect(shadow.querySelector('.error-card')).not.toBeNull();
    expect(shadow.querySelector('.error-header')).not.toBeNull();
    expect(shadow.querySelector('.error-list')).not.toBeNull();
  });

  it('renders error messages as list items', async () => {
    const el = createElement({ data: { value: 1 } } as Record<string, unknown>);
    const shadow = await render(el);
    const items = shadow.querySelectorAll('.error-list li');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].textContent).toContain('widget');
  });

  it('renders data type error for wrong data shape', async () => {
    const el = createElement({ widget: 'table', data: { name: 'Alice' } });
    const shadow = await render(el);
    const errorDiv = shadow.querySelector('[part="error"]');
    expect(errorDiv).not.toBeNull();
    expect(errorDiv!.textContent).toContain('array');
  });

  // ── Routing ──

  it('routes metric to u-metric', async () => {
    const el = createElement({ widget: 'metric', data: { value: 42 } });
    const shadow = await render(el);
    expect(shadow.querySelector('u-metric')).not.toBeNull();
  });

  it('routes stat-group to u-metric', async () => {
    const el = createElement({
      widget: 'stat-group',
      data: [{ label: 'A', value: 1 }],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('u-metric')).not.toBeNull();
  });

  it('routes gauge to u-gauge', async () => {
    const el = createElement({ widget: 'gauge', data: { value: 75, max: 100 } });
    const shadow = await render(el);
    expect(shadow.querySelector('u-gauge')).not.toBeNull();
  });

  it('routes progress to u-gauge', async () => {
    const el = createElement({ widget: 'progress', data: { value: 50, max: 100 } });
    const shadow = await render(el);
    expect(shadow.querySelector('u-gauge')).not.toBeNull();
  });

  it('routes table to u-table', async () => {
    const el = createElement({
      widget: 'table',
      data: [{ name: 'A', value: 1 }],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('u-table')).not.toBeNull();
  });

  it('routes list to u-table', async () => {
    const el = createElement({
      widget: 'list',
      data: [{ name: 'A' }],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('u-table')).not.toBeNull();
  });

  it('routes form to u-form', async () => {
    const el = createElement({
      widget: 'form',
      fields: [{ field: 'name' }],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('u-form')).not.toBeNull();
  });

  it('routes confirm to u-form', async () => {
    const el = createElement({
      widget: 'confirm',
      description: 'Are you sure?',
      actions: [{ label: 'Yes', action: 'confirm' }],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('u-form')).not.toBeNull();
  });

  it('routes compose to u-compose', async () => {
    const el = createElement({
      widget: 'compose',
      children: [{ widget: 'metric', data: { value: 1 } }],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('u-compose')).not.toBeNull();
  });

  // ── Fallback ──

  it('renders fallback for unknown widget type', async () => {
    const el = createElement({ widget: 'unknown-type', data: { foo: 'bar' } });
    const shadow = await render(el);
    expect(shadow.querySelector('[part="fallback"]')).not.toBeNull();
  });

  it('renders JSON in fallback', async () => {
    const el = createElement({ widget: 'unknown-type', data: { foo: 'bar' } });
    const shadow = await render(el);
    const pre = shadow.querySelector('[part="json"]');
    expect(pre).not.toBeNull();
    expect(pre!.textContent).toContain('"foo"');
  });

  it('renders title in fallback when provided', async () => {
    const el = createElement({ widget: 'unknown-type', title: 'My Widget' });
    const shadow = await render(el);
    const label = shadow.querySelector('.fallback-label');
    expect(label).not.toBeNull();
    expect(label!.textContent).toBe('My Widget');
  });

  it('renders widget type in fallback when no title', async () => {
    const el = createElement({ widget: 'unknown-type', data: { foo: 1 } });
    const shadow = await render(el);
    const label = shadow.querySelector('.fallback-label');
    expect(label).not.toBeNull();
    expect(label!.textContent).toContain('unknown-type');
  });

  // ── chart.* fallback (u-chart not loaded in core tests) ──

  it('renders fallback for chart.* when u-chart is not loaded', async () => {
    const el = createElement({
      widget: 'chart.bar',
      data: [{ x: 'A', y: 1 }],
    });
    const shadow = await render(el);
    // u-chart is not registered in core-only test env, falls through to fallback
    expect(shadow.querySelector('[part="fallback"]')).not.toBeNull();
  });

  // ── JSON Attribute Parsing ──

  it('parses spec from JSON attribute', async () => {
    const el = document.createElement('u-widget') as UWidget;
    el.setAttribute('spec', '{"widget":"metric","data":{"value":99}}');
    document.body.appendChild(el);
    const shadow = await render(el);
    expect(shadow.querySelector('u-metric')).not.toBeNull();
  });

  it('handles invalid JSON attribute gracefully', async () => {
    const el = document.createElement('u-widget') as UWidget;
    el.setAttribute('spec', 'not-json');
    document.body.appendChild(el);
    const shadow = await render(el);
    // Invalid JSON → null → slot
    expect(shadow.querySelector('slot')).not.toBeNull();
  });

  // ── Event Forwarding ──

  it('forwards u-widget-internal to u-widget-event', async () => {
    const el = createElement({ widget: 'metric', data: { value: 42 } });
    await render(el);

    const received: UWidgetEvent[] = [];
    el.addEventListener('u-widget-event', ((e: CustomEvent<UWidgetEvent>) => {
      received.push(e.detail);
    }) as EventListener);

    // Simulate internal event from child
    const internal = new CustomEvent('u-widget-internal', {
      detail: { type: 'select', widget: 'metric', data: { value: 42 } },
      bubbles: true,
      composed: true,
    });
    el.shadowRoot!.querySelector('u-metric')!.dispatchEvent(internal);

    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('select');
    expect(received[0].widget).toBe('metric');
  });

  it('stops propagation of internal events', async () => {
    const el = createElement({ widget: 'metric', data: { value: 42 } });
    await render(el);

    const internalSpy = vi.fn();
    document.body.addEventListener('u-widget-internal', internalSpy);

    const internal = new CustomEvent('u-widget-internal', {
      detail: { type: 'select', widget: 'metric' },
      bubbles: true,
      composed: true,
    });
    el.shadowRoot!.querySelector('u-metric')!.dispatchEvent(internal);

    // Internal event should not reach document.body
    expect(internalSpy).not.toHaveBeenCalled();
    document.body.removeEventListener('u-widget-internal', internalSpy);
  });

  it('accepts theme="dark" attribute', async () => {
    const el = createElement({
      widget: 'metric',
      data: { value: 42, label: 'Test' },
    });
    el.setAttribute('theme', 'dark');
    await el.updateComplete;
    expect(el.getAttribute('theme')).toBe('dark');
  });

  it('accepts theme="light" attribute', async () => {
    const el = createElement({
      widget: 'metric',
      data: { value: 42, label: 'Test' },
    });
    el.setAttribute('theme', 'light');
    await el.updateComplete;
    expect(el.getAttribute('theme')).toBe('light');
  });

  it('has themeStyles in static styles', () => {
    // Verify the styles array includes theme tokens
    const styles = (customElements.get('u-widget') as any).styles;
    expect(Array.isArray(styles)).toBe(true);
    expect(styles.length).toBeGreaterThanOrEqual(2);
  });

  it('propagates locale attribute to sub-component spec', async () => {
    const el = createElement({
      widget: 'metric',
      data: { value: 42, label: 'Test' },
    });
    el.locale = 'ko';
    await el.updateComplete;

    const metric = el.shadowRoot!.querySelector('u-metric') as any;
    expect(metric.spec.options?.locale).toBe('ko');
  });

  it('does not override spec-level locale with attribute', async () => {
    const el = createElement({
      widget: 'metric',
      data: { value: 42, label: 'Test' },
      options: { locale: 'ja' },
    });
    el.locale = 'ko';
    await el.updateComplete;

    const metric = el.shadowRoot!.querySelector('u-metric') as any;
    expect(metric.spec.options?.locale).toBe('ja');
  });

  it('reflects locale attribute', async () => {
    const el = createElement({
      widget: 'metric',
      data: { value: 42, label: 'Test' },
    });
    el.locale = 'de';
    await el.updateComplete;
    expect(el.getAttribute('locale')).toBe('de');
  });
});
