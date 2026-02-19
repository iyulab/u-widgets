import { describe, it, expect, beforeEach } from 'vitest';
import type { UWidgetSpec } from '../../src/core/types.js';

// Dynamic import to ensure custom elements are registered
let UCode: typeof import('../../src/elements/u-code.js').UCode;

beforeEach(async () => {
  const mod = await import('../../src/elements/u-code.js');
  UCode = mod.UCode;
});

function renderCode(spec: UWidgetSpec): HTMLElement {
  const el = new UCode();
  el.spec = spec;
  (el as any).performUpdate();
  return el;
}

function shadow(el: HTMLElement) {
  return el.shadowRoot!;
}

describe('u-code', () => {
  describe('basic rendering', () => {
    it('renders nothing when spec is null', () => {
      const el = new UCode();
      (el as any).performUpdate();
      expect(shadow(el).querySelector('.code-block')).toBeNull();
    });

    it('renders nothing when data is empty', () => {
      const el = renderCode({ widget: 'code', data: {} });
      expect(shadow(el).querySelector('.code-block')).toBeNull();
    });

    it('renders code block with content', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: 'const x = 42;', language: 'javascript' },
      });
      const block = shadow(el).querySelector('.code-block');
      expect(block).toBeTruthy();
    });

    it('renders language label in header', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: 'print("hi")', language: 'python' },
      });
      const lang = shadow(el).querySelector('.code-lang');
      expect(lang?.textContent?.trim()).toBe('python');
    });

    it('renders "code" as default language label', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: 'hello' },
      });
      const lang = shadow(el).querySelector('.code-lang');
      expect(lang?.textContent?.trim()).toBe('code');
    });

    it('renders copy button', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: 'test' },
      });
      const btn = shadow(el).querySelector('.code-copy');
      expect(btn).toBeTruthy();
      expect(btn?.textContent?.trim()).toBe('Copy');
    });
  });

  describe('line numbers', () => {
    it('shows line numbers by default', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: 'line1\nline2\nline3', language: 'javascript' },
      });
      const lineNos = shadow(el).querySelectorAll('.line-no');
      expect(lineNos.length).toBe(3);
      expect(lineNos[0].textContent).toBe('1');
      expect(lineNos[2].textContent).toBe('3');
    });

    it('hides line numbers when lineNumbers is false', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: 'line1\nline2', language: 'javascript' },
        options: { lineNumbers: false },
      });
      const lineNos = shadow(el).querySelectorAll('.line-no');
      expect(lineNos.length).toBe(0);
    });
  });

  describe('line highlighting', () => {
    it('highlights specified lines', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: 'a\nb\nc\nd', language: 'javascript' },
        options: { highlight: [2, 4] },
      });
      const lines = shadow(el).querySelectorAll('.line');
      expect(lines[1].classList.contains('line-hl')).toBe(true);
      expect(lines[3].classList.contains('line-hl')).toBe(true);
      expect(lines[0].classList.contains('line-hl')).toBe(false);
    });
  });

  describe('options', () => {
    it('applies maxHeight style', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: 'test', language: 'javascript' },
        options: { maxHeight: '200px' },
      });
      const body = shadow(el).querySelector('.code-body') as HTMLElement;
      expect(body?.getAttribute('style')).toContain('max-height: 200px');
    });

    it('enables word wrap', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: 'test', language: 'javascript' },
        options: { wrap: true },
      });
      const pre = shadow(el).querySelector('pre') as HTMLElement;
      expect(pre?.getAttribute('data-wrap')).toBe('true');
    });
  });

  describe('syntax highlighting', () => {
    it('highlights JavaScript keywords', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: 'const x = 42;', language: 'javascript' },
      });
      const code = shadow(el).querySelector('code');
      const html = code?.innerHTML ?? '';
      expect(html).toContain('class="hl-k"');
      expect(html).toContain('const');
    });

    it('highlights strings', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: 'const s = "hello";', language: 'javascript' },
      });
      const code = shadow(el).querySelector('code');
      const html = code?.innerHTML ?? '';
      expect(html).toContain('class="hl-s"');
      expect(html).toContain('hello');
    });

    it('highlights comments', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: '// this is a comment\nconst x = 1;', language: 'javascript' },
      });
      const code = shadow(el).querySelector('code');
      const html = code?.innerHTML ?? '';
      expect(html).toContain('class="hl-c"');
    });

    it('highlights numbers', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: 'const x = 42.5;', language: 'javascript' },
      });
      const code = shadow(el).querySelector('code');
      const html = code?.innerHTML ?? '';
      expect(html).toContain('class="hl-n"');
      expect(html).toContain('42.5');
    });

    it('highlights Python keywords', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: 'def hello():\n    return True', language: 'python' },
      });
      const code = shadow(el).querySelector('code');
      const html = code?.innerHTML ?? '';
      expect(html).toContain('class="hl-k"');
      // 'def' and 'return' and 'True' should be keywords
      const kwSpans = html.match(/class="hl-k">[^<]+/g) ?? [];
      const kwTexts = kwSpans.map(s => s.replace('class="hl-k">', ''));
      expect(kwTexts).toContain('def');
      expect(kwTexts).toContain('return');
      expect(kwTexts).toContain('True');
    });

    it('highlights Python comments with #', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: '# comment\nx = 1', language: 'python' },
      });
      const code = shadow(el).querySelector('code');
      const html = code?.innerHTML ?? '';
      expect(html).toContain('class="hl-c"');
    });

    it('highlights SQL keywords (case insensitive in source)', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: 'SELECT name FROM users WHERE id = 1;', language: 'sql' },
      });
      const code = shadow(el).querySelector('code');
      const html = code?.innerHTML ?? '';
      const kwSpans = html.match(/class="hl-k">[^<]+/g) ?? [];
      const kwTexts = kwSpans.map(s => s.replace('class="hl-k">', ''));
      expect(kwTexts).toContain('SELECT');
      expect(kwTexts).toContain('FROM');
      expect(kwTexts).toContain('WHERE');
    });

    it('highlights JSON keys and values', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: '{"name": "Alice", "age": 30, "active": true}', language: 'json' },
      });
      const code = shadow(el).querySelector('code');
      const html = code?.innerHTML ?? '';
      // Keys should be hl-k, string values should be hl-s
      expect(html).toContain('class="hl-k"');
      expect(html).toContain('class="hl-s"');
      expect(html).toContain('class="hl-n"');
    });

    it('handles unknown languages gracefully (plain text)', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: 'some text here', language: 'unknown' },
      });
      const code = shadow(el).querySelector('code');
      const html = code?.innerHTML ?? '';
      // Should not have any highlight spans (except possibly numbers)
      expect(html).toContain('some text here');
    });

    it('resolves language aliases (js → javascript)', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: 'const x = 1;', language: 'js' },
      });
      const code = shadow(el).querySelector('code');
      const html = code?.innerHTML ?? '';
      expect(html).toContain('class="hl-k"');
    });

    it('handles multi-line block comments', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: '/* line1\nline2 */\nconst x = 1;', language: 'javascript' },
      });
      const code = shadow(el).querySelector('code');
      const html = code?.innerHTML ?? '';
      // Block comment should be highlighted
      expect(html).toContain('class="hl-c"');
    });

    it('handles template strings in JS', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: 'const s = `hello ${name}`;', language: 'javascript' },
      });
      const code = shadow(el).querySelector('code');
      const html = code?.innerHTML ?? '';
      expect(html).toContain('class="hl-s"');
    });
  });

  describe('escaping', () => {
    it('escapes HTML in code content', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: '<div>hello</div>', language: 'html' },
      });
      const code = shadow(el).querySelector('code');
      const html = code?.innerHTML ?? '';
      // Should be escaped, not rendered as actual HTML
      expect(html).toContain('&lt;');
      expect(html).toContain('&gt;');
    });

    it('escapes ampersands', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: 'a && b', language: 'javascript' },
      });
      const code = shadow(el).querySelector('code');
      const html = code?.innerHTML ?? '';
      expect(html).toContain('&amp;');
    });
  });

  describe('CSS parts', () => {
    it('exposes code part', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: 'test', language: 'javascript' },
      });
      expect(shadow(el).querySelector('[part="code"]')).toBeTruthy();
    });

    it('exposes code-header part', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: 'test', language: 'javascript' },
      });
      expect(shadow(el).querySelector('[part="code-header"]')).toBeTruthy();
    });

    it('exposes code-body part', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: 'test', language: 'javascript' },
      });
      expect(shadow(el).querySelector('[part="code-body"]')).toBeTruthy();
    });

    it('exposes code-copy part', () => {
      const el = renderCode({
        widget: 'code',
        data: { content: 'test', language: 'javascript' },
      });
      expect(shadow(el).querySelector('[part="code-copy"]')).toBeTruthy();
    });
  });
});
