import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/elements/u-widget.js';
import '../../src/elements/uw-bar-list.js';
import '../../src/elements/uw-citation.js';
import '../../src/elements/uw-code.js';
import '../../src/elements/uw-compose.js';
import '../../src/elements/uw-content.js';
import '../../src/elements/uw-form.js';
import '../../src/elements/uw-gallery.js';
import '../../src/elements/uw-gauge.js';
import '../../src/elements/uw-header.js';
import '../../src/elements/uw-kv.js';
import '../../src/elements/uw-math.js';
import '../../src/elements/uw-metric.js';
import '../../src/elements/uw-rating.js';
import '../../src/elements/uw-status-card.js';
import '../../src/elements/uw-status-grid.js';
import '../../src/elements/uw-status.js';
import '../../src/elements/uw-steps.js';
import '../../src/elements/uw-table.js';
import '../../src/elements/uw-video.js';
import { WIDGET_OPTIONS } from '../../src/core/widget-meta.js';
import type { UWidget } from '../../src/elements/u-widget.js';

/**
 * An option a widget lists (`WIDGET_OPTIONS`, which the tools and the rulebooks read) must change what the widget
 * draws — the sibling of `tests/renderers/option-effect.test.ts`, which does the same for the charts. Each listed option
 * is given a value the sample can show and the rendered tree (every shadow root, attributes and text) is compared with
 * the one without it: equal means the option is advertised and does nothing — it was `showLabel` on a bar, and a `label`
 * that erased a status card's readings.
 */
const ROWS = Array.from({ length: 12 }, (_, i) => ({ name: `item ${i}`, role: `role ${i}`, qty: i * 3 + 1 }));
const SAMPLES: Record<string, Record<string, unknown>> = {
  metric: { data: { value: 1234.5, label: 'Output', unit: 'kg' } },
  'stat-group': { data: [{ label: 'A', value: 1234.5 }, { label: 'B', value: 7 }] },
  gauge: { data: { value: 73 } },
  progress: { data: { value: 40 } },
  'bar-list': { data: [{ label: 'a', value: 5 }, { label: 'b', value: 9 }, { label: 'c', value: 7 }] },
  table: { data: ROWS },
  list: { data: ROWS, mapping: { primary: 'name', secondary: 'role' } },
  callout: { data: { message: 'Pump 3 is out of range', tone: 'warn' } },
  compose: { layout: 'grid', children: [{ widget: 'metric', data: { value: 42 } }, { widget: 'metric', data: { value: 95 } }] },
  kv: { data: { Pump: 'P-3', Line: 'L1', Shift: 'night', Owner: 'ops' } },
  code: { data: { content: 'const a = 1;\nconst b = 2;\nconst c = a + b;\nconsole.log(c);', language: 'javascript' } },
  citation: { data: [{ title: 'Pump manual', url: 'https://example.com/m', snippet: 'See chapter 3', source: 'Vendor' }] },
  status: { data: { label: 'Line', value: 'Running', tone: 'ok' } },
  'status-card': { data: { title: 'Pump 3', subtitle: 'Line 1', tone: 'warn', readings: [{ label: 'Flow', value: 12, unit: 'l/s' }], note: 'checked' } },
  'status-grid': { data: [{ label: 'A1', tone: 'ok' }, { label: 'A2', tone: 'alarm' }, { label: 'A3', tone: 'ok' }, { label: 'A4', tone: 'idle' }] },
  steps: { data: [{ label: 'Plan', status: 'done' }, { label: 'Build', status: 'active' }, { label: 'Ship' }] },
  rating: { data: { value: 3, max: 5, count: 20 } },
  video: { data: { src: 'https://example.com/v.mp4' } },
  gallery: { data: [{ src: 'https://example.com/a.png' }, { src: 'https://example.com/b.png' }, { src: 'https://example.com/c.png' }] },
  math: { data: { expression: 'x^2 + y^2 = z^2' } },
  actions: { actions: [{ label: 'Analyze', action: 'analyze' }, { label: 'Export', action: 'export' }] },
  divider: {},
  header: { data: { text: 'Plant', time: '2026-11-06T10:00:00+09:00' } },
};
/** The value(s) an option is tried with — a widget's own entry in `FOR` wins over the option's entry here. */
const PROBES: Record<string, unknown[]> = {
  format: ['number:2'], min: [10], max: [200], unit: ['kg'], label: ['LBL'], subtitle: ['SUB'], form: ['pictogram'],
  thresholds: [[{ to: 50, tone: 'ok' }, { to: 100, tone: 'alarm' }]], band: [{ lo: 20, hi: 40 }], marks: [[{ at: 50, label: 'half' }]],
  glyph: ['★'], glyphValue: [2], maxItems: [2], sort: ['asc', 'desc'], compact: [true], pageSize: [5], searchable: [true],
  sortable: [false], interactive: [true, false], header: [false], layout: ['horizontal'], live: ['off'], widths: [[1, 3]],
  frame: ['well', 'none'], columns: [3], lineNumbers: [false], highlight: [[2]], maxHeight: ['40px'], wrap: [true],
  numbered: [false], face: ['pill'], overflow: ['scroll'], cell: ['chip'], counts: [true], icon: ['heart'],
  autoplay: [true], controls: [false], loop: [true], muted: [true], aspectRatio: ['16/9'], displayMode: [true],
  spacing: ['large'], timeZone: ['America/New_York'],
};
const FOR: Record<string, Record<string, unknown[]>> = {
  'bar-list': { max: [20] },
  rating: { max: [10] },
  gauge: { form: ['tank'] },
  list: { layout: ['tiles'] },
  kv: { layout: ['grid'] },
  actions: { layout: ['column'] },
  steps: { layout: ['horizontal'] },
};
/** An option another option has to be on for: the pictogram's glyph is read only by `form: 'pictogram'`, a grid's columns only by `layout: 'grid'`. */
const WITH: Record<string, Record<string, Record<string, unknown>>> = {
  'bar-list': { glyph: { form: 'pictogram' }, glyphValue: { form: 'pictogram' } },
  kv: { columns: { layout: 'grid' } },
};
// Not compared, each for a reason that names what covers it instead.
const SKIPPED: Record<string, string> = {
  form: '`locale` changes the validation messages, which exist only after a failed submit — uw-form.test covers them.',
};

/** Everything a widget draws, shadow roots included: tags, attributes, text. */
function shown(node: Node): string {
  if (node.nodeType === 3) return node.textContent ?? '';
  if (node.nodeType !== 1) return '';
  const el = node as Element;
  const attrs = [...el.attributes].map(a => `${a.name}=${a.value}`).sort().join(' ');
  const own = [...el.childNodes].map(shown).join('');
  const shadow = el.shadowRoot ? `#shadow(${[...el.shadowRoot.childNodes].map(shown).join('')})` : '';
  return `<${el.tagName.toLowerCase()} ${attrs}>${shadow}${own}</${el.tagName.toLowerCase()}>`;
}

async function draw(widget: string, options: Record<string, unknown>): Promise<string> {
  document.body.innerHTML = '';
  const el = document.createElement('u-widget') as UWidget;
  el.spec = { widget, ...SAMPLES[widget], options } as unknown as UWidget['spec'];
  document.body.appendChild(el);
  await el.updateComplete;
  for (let i = 0; i < 4; i++) await new Promise(resolve => setTimeout(resolve, 0));
  return shown(el);
}

describe('an option a widget lists changes its picture', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  for (const [widget, listed] of Object.entries(WIDGET_OPTIONS)) {
    if (widget.startsWith('chart.') || listed.length === 0 || SKIPPED[widget]) continue;
    it(`${widget}: ${listed.join(' · ')}`, async () => {
      expect(SAMPLES[widget], `no sample for ${widget}`).toBeDefined();
      const inert: string[] = [];
      for (const name of listed) {
        const values = FOR[widget]?.[name] ?? PROBES[name];
        expect(values, `no probe for ${widget}.${name}`).toBeDefined();
        const needs = WITH[widget]?.[name] ?? {};
        const base = await draw(widget, needs);
        let changed = false;
        for (const value of values!) if ((await draw(widget, { ...needs, [name]: value })) !== base) changed = true;
        if (!changed) inert.push(name);
      }
      expect(inert, `${widget} lists options that change nothing`).toEqual([]);
    });
  }
});
