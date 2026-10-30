// A spreadsheet number-format code in a widget's `format` is read once `u-widgets/components` is imported — by the
// engine `@iyulab/components` shares with its table and sheet. (Without the import it is shown as the plain value;
// tests/core/format.test.ts covers that and the reader contract.)
import { describe, it, expect, afterEach } from 'vitest';
import '../../src/elements/u-widget.js';
import '../../src/components.js';

const settle = async (w: HTMLElement & { updateComplete: Promise<unknown> }) => {
  await w.updateComplete;
  for (let i = 0; i < 3; i++) {
    for (const el of w.shadowRoot!.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>('*')) await el.updateComplete;
    await new Promise((r) => setTimeout(r, 10));
  }
};
const deepText = (root: ShadowRoot): string =>
  [...root.querySelectorAll('*')].map((el) => (el.shadowRoot ? deepText(el.shadowRoot) : '')).join(' ') + ' ' + root.textContent;
const draw = async (spec: unknown) => {
  const w = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
  w.spec = spec;
  document.body.appendChild(w);
  await settle(w);
  return deepText(w.shadowRoot!);
};

afterEach(() => { document.body.innerHTML = ''; });

describe('number-format codes in widgets, with u-widgets/components imported', () => {
  it('a metric writes its value with a code', async () => {
    const text = await draw({ widget: 'metric', options: { locale: 'en' }, data: { label: 'Revenue', value: 1234567.891, format: '#,##0.00' } });
    expect(text).toContain('1,234,567.89');
  });

  it('a table column writes its cells with a code, in the widget locale', async () => {
    const text = await draw({
      widget: 'table',
      options: { locale: 'de' },
      data: [{ n: 1234.5 }, { n: -0.00001 }],
      mapping: { columns: [{ field: 'n', label: 'N', format: '#,##0.00' }] },
    });
    expect(text).toContain('1.234,50');
    expect(text).not.toContain('-0,00');
  });

  it('a code with an unsupported condition shows the plain value', async () => {
    const text = await draw({ widget: 'metric', options: { locale: 'en' }, data: { label: 'X', value: 1234, format: '[>100]0.0-unsupported' } });
    expect(text).toContain('1234');
  });
});
