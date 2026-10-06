// A runtime language switch reaches widgets already on screen — and with the opt-in components bridge, one
// `Locale.set()` switches u-widgets too.
//
// Before, `setDefaultLocale()`/`registerLocale()` changed a value nobody watched: rendered widgets kept the old
// language until something else re-rendered them, and an app had to set the components locale and the u-widgets
// locale separately.
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import '../../src/elements/u-widget.js';
import { registerLocale, setDefaultLocale, getEffectiveLocale } from '../../src/core/locale.js';

const KO = { prev: '이전', next: '다음', searchPlaceholder: '검색…', required: '{label} 필수' };
const settle = async (w: HTMLElement & { updateComplete: Promise<unknown> }) => {
  await w.updateComplete;
  for (let i = 0; i < 3; i++) {
    for (const el of w.shadowRoot!.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>('*')) await el.updateComplete;
    await new Promise((r) => setTimeout(r, 10));
  }
};
const deepText = (root: ShadowRoot): string =>
  [...root.querySelectorAll('*')].map((el) => (el.shadowRoot ? deepText(el.shadowRoot) : '')).join(' ') + ' ' + root.textContent;
const table = () => {
  const w = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
  w.spec = { widget: 'table', data: Array.from({ length: 30 }, (_, i) => ({ n: i })), options: { pageSize: 5, searchable: true } };
  document.body.appendChild(w);
  return w;
};

beforeAll(() => registerLocale('ko', KO));
afterEach(() => { document.body.innerHTML = ''; setDefaultLocale(undefined); });

describe('u-widgets runtime locale switch', () => {
  it('setDefaultLocale re-renders widgets on screen', async () => {
    setDefaultLocale('en');
    const w = table();
    await settle(w);
    expect(deepText(w.shadowRoot!)).toContain('Next');
    setDefaultLocale('ko');
    await settle(w);
    expect(deepText(w.shadowRoot!)).toContain('다음');
  });

  it('a widget detached during the switch catches up when attached again', async () => {
    setDefaultLocale('en');
    const w = table();
    await settle(w);
    w.remove();
    setDefaultLocale('ko');
    document.body.appendChild(w);
    await settle(w);
    expect(deepText(w.shadowRoot!)).toContain('다음');
  });

  it('a form error on screen is rewritten in the new locale — the typed value stays', async () => {
    setDefaultLocale('en');
    const w = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
    w.spec = { widget: 'form', data: { name: '' }, fields: [{ field: 'name', type: 'text', label: 'Name', required: true }], actions: [{ label: 'Save', action: 'submit' }] };
    document.body.appendChild(w);
    await settle(w);
    const form = w.shadowRoot!.querySelector('uw-form')!;
    (form.shadowRoot!.querySelector('button') as HTMLButtonElement).click();
    await settle(w);
    expect(deepText(w.shadowRoot!)).toContain('Name is required');
    setDefaultLocale('ko');
    await settle(w);
    expect(deepText(w.shadowRoot!)).toContain('Name 필수');
  });
});

describe('components bridge (@iyulab/u-widgets/components)', () => {
  it('Locale.set() moves the u-widgets default locale', async () => {
    const { Locale } = await import('@iyulab/components/dist/utilities/Locale.js');
    await import('../../src/components.js');
    Locale.set('en');
    expect(getEffectiveLocale()).toBe('en');
    const w = table();
    await settle(w);
    Locale.set('ko');
    await settle(w);
    expect(getEffectiveLocale()).toBe('ko');
    expect(deepText(w.shadowRoot!)).toContain('다음');
    Locale.set('en');
  });
});

describe('chrome strings go through the locale table', () => {
  it('region names, the copy button and the fallback hint follow the locale', async () => {
    registerLocale('ko', { ...KO, keyValuePairs: '키-값', copy: '복사', didYouMean: '{suggestion}을(를) 찾으셨나요?', unknownWidget: '알 수 없는 위젯: {widget}' });
    setDefaultLocale('ko');
    const kv = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
    kv.spec = { widget: 'kv', data: { a: 1 } };
    const code = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
    code.spec = { widget: 'code', data: { content: 'x = 1' } };
    const typo = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
    typo.spec = { widget: 'tabel', data: [] };
    document.body.append(kv, code, typo);
    await settle(kv); await settle(code); await settle(typo);
    const kvEl = kv.shadowRoot!.querySelector('uw-kv')!;
    expect(kvEl.shadowRoot!.querySelector('[aria-label]')!.getAttribute('aria-label')).toBe('키-값');
    const copy = code.shadowRoot!.querySelector('uw-code')!.shadowRoot!.querySelector('.code-copy')!;
    expect(copy.textContent!.trim()).toBe('복사');
    const hint = typo.shadowRoot!.querySelector('.fallback-hint');
    expect(hint?.textContent?.replace(/\s+/g, '')).toBe('table을(를)찾으셨나요?');
    expect(typo.shadowRoot!.querySelector('.fallback-label')!.textContent!.trim()).toBe('알 수 없는 위젯: tabel');
  });
});
