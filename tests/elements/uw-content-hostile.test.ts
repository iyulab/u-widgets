import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/elements/uw-content.js';
import type { UwContent } from '../../src/elements/uw-content.js';

// Widget specs are often written by a language model, so markdown strings are untrusted input.
async function markdown(data: string): Promise<HTMLElement> {
  const el = document.createElement('uw-content') as UwContent;
  el.spec = { widget: 'markdown', data } as unknown as UwContent['spec'];
  document.body.appendChild(el);
  await el.updateComplete;
  return el.shadowRoot!.querySelector('.markdown') as HTMLElement;
}

function attrNames(el: Element): string[] {
  return [...el.attributes].map((a) => a.name).sort();
}

describe('uw-content markdown — hostile strings', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('a quote in a link URL cannot close the href and add a handler', async () => {
    const md = await markdown('[click](https://x.test/" onmouseover="onerror=alert;throw 1)');
    const a = md.querySelector('a')!;
    expect(attrNames(a)).toEqual(['href', 'rel', 'target']);
    expect(a.getAttribute('href')).toBe('https://x.test/" onmouseover="onerror=alert;throw 1');
  });

  it('a single quote and an angle bracket stay text', async () => {
    const md = await markdown("[x](https://x.test/' onclick='a) <img src=x onerror=alert(1)>");
    expect(md.querySelector('img')).toBeNull();
    expect(attrNames(md.querySelector('a')!)).toEqual(['href', 'rel', 'target']);
  });

  it('script-scheme variants are dropped', async () => {
    for (const url of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'java\tscript:alert(1)', 'data:text/html,x', 'vbscript:x']) {
      const md = await markdown(`[x](${url})`);
      expect(md.querySelector('a')!.getAttribute('href'), url).toBe('');
    }
  });

  it('an entity in the URL is not decoded into a scheme', async () => {
    const md = await markdown('[x](&#106;avascript:alert(1))');
    expect(md.querySelector('a')!.getAttribute('href')).toBe('&#106;avascript:alert(1');
  });

  it('emphasis marks inside a URL stay in the URL', async () => {
    const md = await markdown('[a](https://x.test/*y*/z)');
    const a = md.querySelector('a')!;
    expect(a.getAttribute('href')).toBe('https://x.test/*y*/z');
    expect(a.querySelector('em')).toBeNull();
  });

  it('link text keeps its emphasis', async () => {
    const md = await markdown('[**bold** text](https://x.test/)');
    expect(md.querySelector('a strong')?.textContent).toBe('bold');
  });

  it('emphasis marks inside inline code stay literal', async () => {
    const md = await markdown('`a*b*c` and *d*');
    expect(md.querySelector('code')!.textContent).toBe('a*b*c');
    expect(md.querySelector('em')!.textContent).toBe('d');
  });

  it('a link inside inline code is not a link', async () => {
    const md = await markdown('`[x](https://x.test/)`');
    expect(md.querySelector('a')).toBeNull();
    expect(md.querySelector('code')!.textContent).toBe('[x](https://x.test/)');
  });

  it('placeholder characters in the input do not reach held markup', async () => {
    const md = await markdown('0 [x](https://x.test/)');
    expect(md.querySelectorAll('a')).toHaveLength(1);
    expect(md.textContent).not.toContain('');
  });

  it('quotes in plain text render as quotes', async () => {
    const md = await markdown(`He said "hi" and 'bye'`);
    expect(md.textContent).toBe(`He said "hi" and 'bye'`);
  });
});
