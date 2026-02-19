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

  it('renders "Did you mean" hint for typos', async () => {
    const el = createElement({ widget: 'metrc', data: { value: 42 } });
    const shadow = await render(el);
    const hint = shadow.querySelector('.fallback-hint');
    expect(hint).not.toBeNull();
    expect(hint!.textContent).toContain('metric');
  });

  it('does not render hint for unrecognizable widget names', async () => {
    const el = createElement({ widget: 'xyzxyzxyz', data: { foo: 1 } });
    const shadow = await render(el);
    expect(shadow.querySelector('.fallback-hint')).toBeNull();
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

  // ── KV Routing ──

  it('routes kv to u-kv', async () => {
    const el = createElement({
      widget: 'kv',
      data: { status: 'Active', plan: 'Pro' },
    });
    const shadow = await render(el);
    expect(shadow.querySelector('u-kv')).not.toBeNull();
  });

  // ── Code Routing ──

  it('routes code to u-code', async () => {
    const el = createElement({
      widget: 'code',
      data: { content: 'const x = 42;', language: 'javascript' },
    });
    const shadow = await render(el);
    expect(shadow.querySelector('u-code')).not.toBeNull();
  });

  // ── Citation Routing ──

  it('routes citation to u-citation', async () => {
    const el = createElement({
      widget: 'citation',
      data: [{ title: 'Test Source', url: 'https://example.com' }],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('u-citation')).not.toBeNull();
  });

  // ── Status Routing ──

  it('routes status to u-status', async () => {
    const el = createElement({
      widget: 'status',
      data: [{ label: 'API', value: 'Up', level: 'success' }],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('u-status')).not.toBeNull();
  });

  // ── Steps Routing ──

  it('routes steps to u-steps', async () => {
    const el = createElement({
      widget: 'steps',
      data: [{ label: 'Step 1', status: 'done' }, { label: 'Step 2', status: 'active' }],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('u-steps')).not.toBeNull();
  });

  // ── Rating Routing ──

  it('routes rating to u-rating', async () => {
    const el = createElement({
      widget: 'rating',
      data: { value: 4.5 },
    });
    const shadow = await render(el);
    expect(shadow.querySelector('u-rating')).not.toBeNull();
  });

  it('routes video to u-video', async () => {
    const el = createElement({
      widget: 'video',
      data: { src: 'https://example.com/video.mp4' },
    });
    const shadow = await render(el);
    expect(shadow.querySelector('u-video')).not.toBeNull();
  });

  it('routes gallery to u-gallery', async () => {
    const el = createElement({
      widget: 'gallery',
      data: [{ src: 'https://example.com/1.jpg' }],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('u-gallery')).not.toBeNull();
  });

  // ── Actions Widget ──

  it('renders actions widget as button group', async () => {
    const el = createElement({
      widget: 'actions',
      actions: [
        { label: 'Analyze', action: 'analyze' },
        { label: 'Export', action: 'export', style: 'primary' },
      ],
    });
    const shadow = await render(el);
    const group = shadow.querySelector('.actions-widget');
    expect(group).not.toBeNull();
    const buttons = shadow.querySelectorAll('.actions-widget button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].textContent).toBe('Analyze');
    expect(buttons[1].textContent).toBe('Export');
    expect(buttons[1].getAttribute('data-style')).toBe('primary');
  });

  it('actions widget has role="group" and aria-label', async () => {
    const el = createElement({
      widget: 'actions',
      title: 'Quick Actions',
      actions: [{ label: 'Go', action: 'go' }],
    });
    const shadow = await render(el);
    const group = shadow.querySelector('.actions-widget');
    expect(group?.getAttribute('role')).toBe('group');
    expect(group?.getAttribute('aria-label')).toBe('Quick Actions');
  });

  it('actions widget dispatches u-widget-event on click', async () => {
    const el = createElement({
      widget: 'actions',
      actions: [{ label: 'Run', action: 'run_report' }],
    });
    const shadow = await render(el);

    const received: UWidgetEvent[] = [];
    el.addEventListener('u-widget-event', ((e: CustomEvent<UWidgetEvent>) => {
      received.push(e.detail);
    }) as EventListener);

    const btn = shadow.querySelector('.actions-widget button') as HTMLButtonElement;
    btn.click();

    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('action');
    expect(received[0].action).toBe('run_report');
    expect(received[0].widget).toBe('actions');
  });

  it('actions widget renders nothing with empty actions', async () => {
    const el = createElement({
      widget: 'actions',
      actions: [],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('.actions-widget')).toBeNull();
  });

  // ── Divider Widget ──

  it('renders divider with separator role', async () => {
    const el = createElement({ widget: 'divider' });
    const shadow = await render(el);
    const divider = shadow.querySelector('[role="separator"]');
    expect(divider).not.toBeNull();
    expect(divider?.classList.contains('divider')).toBe(true);
  });

  it('renders divider with label', async () => {
    const el = createElement({
      widget: 'divider',
      options: { label: 'Section' },
    });
    const shadow = await render(el);
    const divider = shadow.querySelector('[role="separator"]');
    expect(divider?.textContent?.trim()).toBe('Section');
  });

  it('renders divider with spacing class', async () => {
    const el = createElement({
      widget: 'divider',
      options: { spacing: 'large' },
    });
    const shadow = await render(el);
    const divider = shadow.querySelector('.divider');
    expect(divider?.classList.contains('divider-spacing-large')).toBe(true);
  });

  // ── Header Widget ──

  it('renders header with heading role', async () => {
    const el = createElement({
      widget: 'header',
      data: { text: 'Dashboard' },
    });
    const shadow = await render(el);
    const header = shadow.querySelector('[role="heading"]');
    expect(header).not.toBeNull();
    expect(header?.textContent?.trim()).toBe('Dashboard');
  });

  it('renders header with correct level attribute', async () => {
    const el = createElement({
      widget: 'header',
      data: { text: 'Title', level: 1 },
    });
    const shadow = await render(el);
    const header = shadow.querySelector('[role="heading"]');
    expect(header?.getAttribute('aria-level')).toBe('1');
    expect(header?.getAttribute('data-level')).toBe('1');
  });

  it('header defaults to level 2', async () => {
    const el = createElement({
      widget: 'header',
      data: { text: 'Subtitle' },
    });
    const shadow = await render(el);
    const header = shadow.querySelector('[role="heading"]');
    expect(header?.getAttribute('aria-level')).toBe('2');
  });

  it('header renders nothing when no text', async () => {
    const el = createElement({
      widget: 'header',
      data: {},
    });
    const shadow = await render(el);
    expect(shadow.querySelector('[role="heading"]')).toBeNull();
  });

  it('header falls back to title when no data.text', async () => {
    const el = createElement({
      widget: 'header',
      title: 'From Title',
      data: {},
    });
    const shadow = await render(el);
    const header = shadow.querySelector('[role="heading"]');
    expect(header?.textContent?.trim()).toBe('From Title');
  });

  // ── Global Actions ──

  it('renders global actions for non-form widgets', async () => {
    const el = createElement({
      widget: 'metric',
      data: { value: 42 },
      actions: [
        { label: 'Refresh', action: 'refresh' },
        { label: 'Export', action: 'export', style: 'primary' },
      ],
    });
    const shadow = await render(el);
    const actionBar = shadow.querySelector('.global-actions');
    expect(actionBar).not.toBeNull();
    const buttons = shadow.querySelectorAll('.global-actions button');
    expect(buttons).toHaveLength(2);
  });

  it('does not render global actions for form widgets', async () => {
    const el = createElement({
      widget: 'form',
      fields: [{ field: 'name' }],
      actions: [{ label: 'Submit', action: 'submit', style: 'primary' }],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('.global-actions')).toBeNull();
  });

  it('does not render global actions for confirm widgets', async () => {
    const el = createElement({
      widget: 'confirm',
      description: 'Sure?',
      actions: [{ label: 'Yes', action: 'submit' }],
    });
    const shadow = await render(el);
    expect(shadow.querySelector('.global-actions')).toBeNull();
  });

  it('global action click dispatches u-widget-event', async () => {
    const el = createElement({
      widget: 'metric',
      data: { value: 42 },
      actions: [{ label: 'Refresh', action: 'refresh' }],
    });
    const shadow = await render(el);

    const received: UWidgetEvent[] = [];
    el.addEventListener('u-widget-event', ((e: CustomEvent<UWidgetEvent>) => {
      received.push(e.detail);
    }) as EventListener);

    const btn = shadow.querySelector('.global-actions button') as HTMLButtonElement;
    btn.click();

    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('action');
    expect(received[0].action).toBe('refresh');
    expect(received[0].widget).toBe('metric');
  });

  it('global action with navigate opens new window', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const el = createElement({
      widget: 'metric',
      data: { value: 42 },
      actions: [{ label: 'Docs', action: 'navigate', url: 'https://example.com' }],
    });
    const shadow = await render(el);

    const btn = shadow.querySelector('.global-actions button') as HTMLButtonElement;
    btn.click();

    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener');
    openSpy.mockRestore();
  });

  it('disabled action button has disabled attribute', async () => {
    const el = createElement({
      widget: 'metric',
      data: { value: 42 },
      actions: [{ label: 'Disabled', action: 'noop', disabled: true }],
    });
    const shadow = await render(el);
    const btn = shadow.querySelector('.global-actions button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});
