// Typing «서울» with a Korean IME into a searchable table's search box: the table does not filter on a syllable still
// being composed («ㅅ», «성» on the way), which hid every matching row; it filters when the composition ends.
import { describe, it, expect, afterEach } from 'vitest';
import '../../src/elements/u-widget.js';
import { compose, commit } from './ime.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
afterEach(() => { document.body.innerHTML = ''; });

describe('uw-table search — IME composition', () => {
  it('rows stay while composing and are filtered by the committed text', async () => {
    const w = document.createElement('u-widget') as HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };
    w.spec = { widget: 'table', data: [{ city: '서울' }, { city: '성남' }, { city: '부산' }], options: { searchable: true } };
    document.body.appendChild(w);
    await w.updateComplete;
    await sleep(50);
    const t = w.shadowRoot!.querySelector('uw-table') as HTMLElement & { updateComplete: Promise<unknown> };
    await t.updateComplete;
    const rows = () => t.shadowRoot!.querySelectorAll('tbody tr').length;
    const input = t.shadowRoot!.querySelector('.search-input') as HTMLInputElement;
    input.focus();

    const seen: number[] = [];
    for (const step of ['ㅅ', '서', '성']) { await compose([step]); await t.updateComplete; seen.push(rows()); }
    await commit('서');
    await t.updateComplete;
    seen.push(rows());
    expect(seen).toEqual([3, 3, 3, 1]);
    expect(input.value).toBe('서');
  });
});
