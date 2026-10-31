// With `u-widgets/components` imported, a table's search box matches as the components select and table filters do —
// diacritics folded, Korean initials, and rows narrowing while a syllable is still being composed.
// (Without the import: tests/browser/table-search-ime.browser.test.ts — the table waits for the composition to end.)
import { describe, it, expect, afterEach } from 'vitest';
import '../../src/elements/u-widget.js';
import '../../src/components.js';
import { compose, commit } from './ime.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
afterEach(() => { document.body.innerHTML = ''; });

async function table(data: Record<string, unknown>[]) {
  const w = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
  w.spec = { widget: 'table', data, options: { searchable: true } };
  document.body.appendChild(w);
  await w.updateComplete;
  await sleep(50);
  const t = w.shadowRoot!.querySelector('uw-table') as HTMLElement & { updateComplete: Promise<unknown> };
  await t.updateComplete;
  const input = t.shadowRoot!.querySelector('.search-input') as HTMLInputElement;
  const rows = () => [...t.shadowRoot!.querySelectorAll('tbody tr')].map((r) => r.textContent!.trim());
  const type = async (text: string) => {
    input.value = text;
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await t.updateComplete;
  };
  return { t, input, rows, type };
}

describe('uw-table search — the components search match', () => {
  it('rows narrow while a Korean syllable is being composed, and by the committed text', async () => {
    const { t, input, rows } = await table([{ city: '서울' }, { city: '성남' }, { city: '대전' }]);
    input.focus();
    const seen: number[] = [];
    // CDP answers before the frame has handled the input — wait for it before reading the rows
    for (const step of ['ㅅ', '서', '성']) { await compose([step]); await sleep(30); await t.updateComplete; seen.push(rows().length); }
    await commit('서');
    await sleep(30);
    await t.updateComplete;
    seen.push(rows().length);
    // ㅅ: initials · 서/성: keystroke prefix (ㅅㅓㅇ ⊂ ㅅㅓㅇㅜㄹ) — 서울 and 성남 stay, 대전 goes · committed 서: 서울
    expect(seen).toEqual([2, 2, 2, 1]);
    expect(input.value).toBe('서');
  });

  it('Korean initials find the row', async () => {
    const { rows, type } = await table([{ city: '서울' }, { city: '부산' }]);
    await type('ㅂㅅ');
    expect(rows()).toEqual(['부산']);
  });

  it('case and diacritics are folded', async () => {
    const { rows, type } = await table([{ name: 'Müller' }, { name: 'Zoë' }, { name: 'Smith' }]);
    await type('MULLER');
    expect(rows()).toEqual(['Müller']);
    await type('zoe');
    expect(rows()).toEqual(['Zoë']);
  });
});
