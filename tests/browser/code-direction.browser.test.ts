/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, afterEach } from 'vitest';
import '../../src/index.js';
import type { UWidgetSpec } from '../../src/core/types.js';

/**
 * Code reads left to right whatever the page's direction is. In a right-to-left page the code widget's `<pre>` took the page
 * as its paragraph direction, so the closing punctuation of a line (`foo(bar);`) moved to the far end of it and the line
 * numbers sat on the right of the code. The widget is isolated and laid out left to right.
 *
 * Oracle: the screen x of every character of a line, in source order, grows left to right; the line number stands left of the code.
 */
let wrap: HTMLElement;
afterEach(() => wrap?.remove());

async function mount(dir: 'ltr' | 'rtl') {
  wrap = document.createElement('div');
  wrap.dir = dir;
  wrap.style.cssText = 'width: 420px';
  const el = document.createElement('uw-code') as HTMLElement & { spec: UWidgetSpec; updateComplete: Promise<unknown> };
  el.spec = { widget: 'code', data: { language: 'javascript', content: 'foo(bar);\nconst x = [1, 2];' } } as UWidgetSpec;
  wrap.appendChild(el);
  document.body.appendChild(wrap);
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 150));
  return el;
}

function lineGeometry(line: HTMLElement) {
  const no = line.querySelector<HTMLElement>('.line-no')!;
  const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  const xs: number[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node as Text;
    if (text.parentElement === no) continue;
    for (let i = 0; i < text.data.length; i++) {
      range.setStart(text, i);
      range.setEnd(text, i + 1);
      xs.push(range.getBoundingClientRect().left);
    }
  }
  return { numberLeft: no.getBoundingClientRect().left, xs };
}

describe('uw-code — code keeps its left-to-right order in a right-to-left page', () => {
  for (const dir of ['rtl', 'ltr'] as const) {
    it(`${dir}: every line draws left to right with its number on the left`, async () => {
      const el = await mount(dir);
      const lines = [...el.shadowRoot!.querySelectorAll<HTMLElement>('.line')];
      expect(lines.length).toBe(2);
      for (const line of lines) {
        const { numberLeft, xs } = lineGeometry(line);
        expect(xs.every((x, i) => i === 0 || x > xs[i - 1])).toBe(true);
        expect(numberLeft).toBeLessThan(xs[0]);
      }
    });
  }
});
