import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/elements/u-content.js';
import type { UContent } from '../../src/elements/u-content.js';

function createElement(spec: Record<string, unknown>): UContent {
  const el = document.createElement('u-content') as UContent;
  el.spec = spec as UContent['spec'];
  document.body.appendChild(el);
  return el;
}

async function render(el: UContent) {
  await el.updateComplete;
  return el.shadowRoot!;
}

describe('u-content', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('is defined as a custom element', () => {
    expect(customElements.get('u-content')).toBeDefined();
  });

  it('renders nothing when spec is null', async () => {
    const el = document.createElement('u-content') as UContent;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.markdown')).toBeNull();
    expect(el.shadowRoot!.querySelector('.image-container')).toBeNull();
    expect(el.shadowRoot!.querySelector('.callout')).toBeNull();
  });

  describe('markdown widget', () => {
    it('renders markdown from string data', async () => {
      const el = createElement({
        widget: 'markdown',
        data: 'Hello **world**',
      });
      const shadow = await render(el);
      const md = shadow.querySelector('.markdown');
      expect(md).not.toBeNull();
      expect(md?.innerHTML).toContain('<strong>world</strong>');
    });

    it('renders markdown from data.content object', async () => {
      const el = createElement({
        widget: 'markdown',
        data: { content: '## Title' },
      });
      const shadow = await render(el);
      const md = shadow.querySelector('.markdown');
      expect(md?.innerHTML).toContain('<h2>');
      expect(md?.innerHTML).toContain('Title');
    });

    it('renders nothing for empty markdown', async () => {
      const el = createElement({
        widget: 'markdown',
        data: '',
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.markdown')).toBeNull();
    });

    it('parses bold and italic', async () => {
      const el = createElement({
        widget: 'markdown',
        data: '**bold** and *italic*',
      });
      const shadow = await render(el);
      const md = shadow.querySelector('.markdown')!;
      expect(md.innerHTML).toContain('<strong>bold</strong>');
      expect(md.innerHTML).toContain('<em>italic</em>');
    });

    it('parses inline code', async () => {
      const el = createElement({
        widget: 'markdown',
        data: 'Use `console.log`',
      });
      const shadow = await render(el);
      const md = shadow.querySelector('.markdown')!;
      expect(md.innerHTML).toContain('<code>console.log</code>');
    });

    it('parses links', async () => {
      const el = createElement({
        widget: 'markdown',
        data: 'Visit [Example](https://example.com)',
      });
      const shadow = await render(el);
      const md = shadow.querySelector('.markdown')!;
      expect(md.innerHTML).toContain('href="https://example.com"');
      expect(md.innerHTML).toContain('Example');
    });

    it('escapes HTML', async () => {
      const el = createElement({
        widget: 'markdown',
        data: '<script>alert("xss")</script>',
      });
      const shadow = await render(el);
      const md = shadow.querySelector('.markdown')!;
      expect(md.innerHTML).not.toContain('<script>');
      expect(md.innerHTML).toContain('&lt;script&gt;');
    });

    it('sanitizes javascript: URLs in links', async () => {
      const el = createElement({
        widget: 'markdown',
        data: '[click](javascript:alert(1))',
      });
      const shadow = await render(el);
      const md = shadow.querySelector('.markdown')!;
      expect(md.innerHTML).not.toContain('javascript:');
      expect(md.innerHTML).toContain('href=""');
    });

    it('sanitizes data: URLs in links', async () => {
      const el = createElement({
        widget: 'markdown',
        data: '[click](data:text/html,<script>alert(1)</script>)',
      });
      const shadow = await render(el);
      const md = shadow.querySelector('.markdown')!;
      expect(md.innerHTML).not.toContain('data:text');
    });

    it('sanitizes vbscript: URLs in links', async () => {
      const el = createElement({
        widget: 'markdown',
        data: '[click](vbscript:MsgBox("xss"))',
      });
      const shadow = await render(el);
      const md = shadow.querySelector('.markdown')!;
      expect(md.innerHTML).not.toContain('vbscript:');
    });

    it('sanitizes URLs with zero-width characters', async () => {
      const el = createElement({
        widget: 'markdown',
        data: '[click](java\u200Bscript:alert(1))',
      });
      const shadow = await render(el);
      const md = shadow.querySelector('.markdown')!;
      expect(md.innerHTML).not.toContain('javascript:');
    });

    it('allows safe http/https links', async () => {
      const el = createElement({
        widget: 'markdown',
        data: '[safe](https://example.com)',
      });
      const shadow = await render(el);
      const md = shadow.querySelector('.markdown')!;
      expect(md.innerHTML).toContain('href="https://example.com"');
    });

    it('preserves newlines in code blocks (no <br> corruption)', async () => {
      const el = createElement({
        widget: 'markdown',
        data: '```\nline1\nline2\n```',
      });
      const shadow = await render(el);
      const md = shadow.querySelector('.markdown')!;
      const pre = md.querySelector('pre');
      expect(pre).not.toBeNull();
      // Should NOT contain <br> inside <pre>
      expect(pre!.innerHTML).not.toContain('<br>');
      expect(pre!.innerHTML).toContain('line1\nline2');
    });

    it('renders ordered lists', async () => {
      const el = createElement({
        widget: 'markdown',
        data: '1. First\n2. Second\n3. Third',
      });
      const shadow = await render(el);
      const md = shadow.querySelector('.markdown')!;
      expect(md.innerHTML).toContain('<ol>');
      expect(md.innerHTML).toContain('<li>First</li>');
      expect(md.innerHTML).toContain('<li>Third</li>');
    });

    it('has part="markdown" attribute', async () => {
      const el = createElement({
        widget: 'markdown',
        data: 'Hello',
      });
      const shadow = await render(el);
      expect(shadow.querySelector('[part="markdown"]')).not.toBeNull();
    });
  });

  describe('image widget', () => {
    it('renders image with src and alt', async () => {
      const el = createElement({
        widget: 'image',
        data: { src: 'https://example.com/img.png', alt: 'Test image' },
      });
      const shadow = await render(el);
      const img = shadow.querySelector('img') as HTMLImageElement;
      expect(img).not.toBeNull();
      expect(img.src).toContain('img.png');
      expect(img.alt).toBe('Test image');
    });

    it('renders caption when provided', async () => {
      const el = createElement({
        widget: 'image',
        data: { src: 'https://example.com/img.png', alt: 'Test', caption: 'Figure 1' },
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.image-caption')?.textContent).toBe('Figure 1');
    });

    it('does not render caption when not provided', async () => {
      const el = createElement({
        widget: 'image',
        data: { src: 'https://example.com/img.png', alt: 'Test' },
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.image-caption')).toBeNull();
    });

    it('sanitizes javascript: in image src', async () => {
      const el = createElement({
        widget: 'image',
        data: { src: 'javascript:alert(1)', alt: 'xss' },
      });
      const shadow = await render(el);
      // src is sanitized to empty → nothing rendered
      expect(shadow.querySelector('.image-container')).toBeNull();
    });

    it('sanitizes data: in image src', async () => {
      const el = createElement({
        widget: 'image',
        data: { src: 'data:text/html,<script>alert(1)</script>', alt: 'xss' },
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.image-container')).toBeNull();
    });

    it('renders nothing when src is empty', async () => {
      const el = createElement({
        widget: 'image',
        data: { alt: 'No source' },
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.image-container')).toBeNull();
    });

    it('has part="image" attribute', async () => {
      const el = createElement({
        widget: 'image',
        data: { src: 'https://example.com/img.png', alt: 'Test' },
      });
      const shadow = await render(el);
      expect(shadow.querySelector('[part="image"]')).not.toBeNull();
    });
  });

  describe('callout widget', () => {
    it('renders info callout by default', async () => {
      const el = createElement({
        widget: 'callout',
        data: { message: 'This is info' },
      });
      const shadow = await render(el);
      const callout = shadow.querySelector('.callout');
      expect(callout).not.toBeNull();
      expect(callout?.classList.contains('callout-info')).toBe(true);
      expect(callout?.textContent).toContain('This is info');
    });

    it('renders warning callout', async () => {
      const el = createElement({
        widget: 'callout',
        data: { message: 'Warning!', level: 'warning' },
      });
      const shadow = await render(el);
      const callout = shadow.querySelector('.callout');
      expect(callout?.classList.contains('callout-warning')).toBe(true);
    });

    it('renders error callout', async () => {
      const el = createElement({
        widget: 'callout',
        data: { message: 'Error occurred', level: 'error' },
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.callout-error')).not.toBeNull();
    });

    it('renders success callout', async () => {
      const el = createElement({
        widget: 'callout',
        data: { message: 'All done', level: 'success' },
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.callout-success')).not.toBeNull();
    });

    it('falls back to info for unknown level', async () => {
      const el = createElement({
        widget: 'callout',
        data: { message: 'test', level: 'unknown' },
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.callout-info')).not.toBeNull();
    });

    it('renders title when provided', async () => {
      const el = createElement({
        widget: 'callout',
        data: { message: 'Details here', title: 'Important', level: 'warning' },
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.callout-title')?.textContent).toBe('Important');
    });

    it('has role="alert"', async () => {
      const el = createElement({
        widget: 'callout',
        data: { message: 'Alert' },
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.callout')?.getAttribute('role')).toBe('alert');
    });
  });

  describe('container query', () => {
    it('declares container: u-content / inline-size on :host', () => {
      const styles = (customElements.get('u-content') as unknown as { styles: { cssText: string } }).styles;
      const text = typeof styles === 'string' ? styles : Array.isArray(styles) ? styles.map((s: { cssText: string }) => s.cssText).join('') : styles.cssText;
      expect(text).toContain('container:');
      expect(text).toContain('u-content');
      expect(text).toContain('inline-size');
    });
  });
});
