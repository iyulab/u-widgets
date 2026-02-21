import { describe, it, expect, beforeEach } from 'vitest';
import type { UWidgetSpec } from '../../src/core/types.js';

let UCitation: typeof import('../../src/elements/u-citation.js').UCitation;

beforeEach(async () => {
  const mod = await import('../../src/elements/u-citation.js');
  UCitation = mod.UCitation;
});

function render(spec: UWidgetSpec): HTMLElement {
  const el = new UCitation();
  el.spec = spec;
  (el as any).performUpdate();
  return el;
}

function shadow(el: HTMLElement) {
  return el.shadowRoot!;
}

describe('u-citation', () => {
  describe('basic rendering', () => {
    it('renders nothing when spec is null', () => {
      const el = new UCitation();
      (el as any).performUpdate();
      expect(shadow(el).querySelector('.citations')).toBeNull();
    });

    it('renders nothing when data is empty', () => {
      const el = render({ widget: 'citation', data: {} });
      expect(shadow(el).querySelector('.citations')).toBeNull();
    });

    it('renders citation list from array data', () => {
      const el = render({
        widget: 'citation',
        data: [
          { title: 'Source A', url: 'https://example.com/a' },
          { title: 'Source B', url: 'https://example.com/b' },
        ],
      });
      const items = shadow(el).querySelectorAll('.cite-item');
      expect(items.length).toBe(2);
    });

    it('renders single citation from object data', () => {
      const el = render({
        widget: 'citation',
        data: { title: 'Single Source', url: 'https://example.com' },
      });
      const items = shadow(el).querySelectorAll('.cite-item');
      expect(items.length).toBe(1);
    });

    it('renders title text', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'My Title' }],
      });
      const title = shadow(el).querySelector('.cite-title');
      expect(title?.textContent?.trim()).toBe('My Title');
    });

    it('renders domain from URL', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'Test', url: 'https://docs.example.com/page' }],
      });
      const url = shadow(el).querySelector('.cite-url');
      expect(url?.textContent?.trim()).toBe('example.com');
    });

    it('renders snippet text', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'Test', snippet: 'This is a snippet.' }],
      });
      const snippet = shadow(el).querySelector('.cite-snippet');
      expect(snippet?.textContent?.trim()).toBe('This is a snippet.');
    });

    it('renders source label', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'Test', source: 'MDN' }],
      });
      const source = shadow(el).querySelector('.cite-source');
      expect(source?.textContent?.trim()).toBe('MDN');
    });
  });

  describe('numbering', () => {
    it('shows numbered badges by default', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'A' }, { title: 'B' }],
      });
      const nums = shadow(el).querySelectorAll('.cite-num');
      expect(nums.length).toBe(2);
      expect(nums[0].textContent?.trim()).toBe('1');
      expect(nums[1].textContent?.trim()).toBe('2');
    });

    it('hides numbers when numbered is false', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'A' }, { title: 'B' }],
        options: { numbered: false },
      });
      const nums = shadow(el).querySelectorAll('.cite-num');
      expect(nums.length).toBe(0);
    });
  });

  describe('compact mode', () => {
    it('applies compact attribute', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'A', snippet: 'text' }],
        options: { compact: true },
      });
      const list = shadow(el).querySelector('.citations');
      expect(list?.hasAttribute('data-compact')).toBe(true);
    });
  });

  describe('link behavior', () => {
    it('marks items with URL as links', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'Linked', url: 'https://example.com' }],
      });
      const item = shadow(el).querySelector('.cite-item');
      expect(item?.hasAttribute('data-link')).toBe(true);
    });

    it('does not mark items without URL as links', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'No Link' }],
      });
      const item = shadow(el).querySelector('.cite-item');
      expect(item?.hasAttribute('data-link')).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('has list role', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'Test' }],
      });
      const list = shadow(el).querySelector('[role="list"]');
      expect(list).toBeTruthy();
    });

    it('has listitem roles', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'A' }, { title: 'B' }],
      });
      const items = shadow(el).querySelectorAll('[role="listitem"]');
      expect(items.length).toBe(2);
    });

    it('uses title as aria-label', () => {
      const el = render({
        widget: 'citation',
        title: 'References',
        data: [{ title: 'A' }],
      });
      const list = shadow(el).querySelector('[role="list"]');
      expect(list?.getAttribute('aria-label')).toBe('References');
    });
  });

  describe('CSS parts', () => {
    it('exposes citations part', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'Test' }],
      });
      expect(shadow(el).querySelector('[part="citations"]')).toBeTruthy();
    });

    it('exposes cite-item part', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'Test' }],
      });
      expect(shadow(el).querySelector('[part="cite-item"]')).toBeTruthy();
    });

    it('exposes cite-title part', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'Test' }],
      });
      expect(shadow(el).querySelector('[part="cite-title"]')).toBeTruthy();
    });

    it('exposes cite-num part', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'Test' }],
      });
      expect(shadow(el).querySelector('[part="cite-num"]')).toBeTruthy();
    });
  });

  describe('domain extraction', () => {
    it('strips subdomain from docs.github.com → github.com', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'GitHub Docs', url: 'https://docs.github.com/en/actions' }],
      });
      const url = shadow(el).querySelector('.cite-url');
      expect(url?.textContent?.trim()).toBe('github.com');
    });

    it('preserves ccTLD: blog.example.co.kr → example.co.kr', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'Blog', url: 'https://blog.example.co.kr/post/1' }],
      });
      const url = shadow(el).querySelector('.cite-url');
      expect(url?.textContent?.trim()).toBe('example.co.kr');
    });

    it('keeps localhost as-is', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'Local', url: 'http://localhost:3000/path' }],
      });
      const url = shadow(el).querySelector('.cite-url');
      expect(url?.textContent?.trim()).toBe('localhost');
    });

    it('strips www. prefix: www.example.com → example.com', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'WWW', url: 'https://www.example.com/page' }],
      });
      const url = shadow(el).querySelector('.cite-url');
      expect(url?.textContent?.trim()).toBe('example.com');
    });

    it('keeps plain domain: example.com → example.com', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'Plain', url: 'https://example.com/page' }],
      });
      const url = shadow(el).querySelector('.cite-url');
      expect(url?.textContent?.trim()).toBe('example.com');
    });

    it('returns original string for invalid URL', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'Invalid', url: 'not-a-url' }],
      });
      const url = shadow(el).querySelector('.cite-url');
      expect(url?.textContent?.trim()).toBe('not-a-url');
    });
  });

  describe('data filtering', () => {
    it('skips items without title', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'Valid' }, { url: 'no-title' }],
      });
      const items = shadow(el).querySelectorAll('.cite-item');
      expect(items.length).toBe(1);
    });

    it('skips null items in array', () => {
      const el = render({
        widget: 'citation',
        data: [{ title: 'Valid' }, null as any],
      });
      const items = shadow(el).querySelectorAll('.cite-item');
      expect(items.length).toBe(1);
    });
  });
});
