import { describe, it, expect, beforeEach } from 'vitest';
import type { UWidgetSpec } from '../../src/core/types.js';

let UGallery: typeof import('../../src/elements/u-gallery.js').UGallery;

beforeEach(async () => {
  const mod = await import('../../src/elements/u-gallery.js');
  UGallery = mod.UGallery;
});

function render(spec: UWidgetSpec): HTMLElement {
  const el = new UGallery();
  el.spec = spec;
  (el as any).performUpdate();
  return el;
}

function shadow(el: HTMLElement) {
  return el.shadowRoot!;
}

describe('u-gallery', () => {
  describe('basic rendering', () => {
    it('renders nothing when spec is null', () => {
      const el = new UGallery();
      (el as any).performUpdate();
      expect(shadow(el).querySelector('.gallery-grid')).toBeNull();
    });

    it('renders nothing when data is not array', () => {
      const el = render({ widget: 'gallery', data: { src: 'test.jpg' } });
      expect(shadow(el).querySelector('.gallery-grid')).toBeNull();
    });

    it('renders nothing when data is empty array', () => {
      const el = render({ widget: 'gallery', data: [] as any });
      expect(shadow(el).querySelector('.gallery-grid')).toBeNull();
    });

    it('renders gallery grid with items', () => {
      const el = render({
        widget: 'gallery',
        data: [
          { src: 'https://example.com/1.jpg' },
          { src: 'https://example.com/2.jpg' },
        ],
      });
      const grid = shadow(el).querySelector('.gallery-grid');
      expect(grid).toBeTruthy();
      const items = shadow(el).querySelectorAll('.gallery-item');
      expect(items.length).toBe(2);
    });

    it('renders images with src', () => {
      const el = render({
        widget: 'gallery',
        data: [{ src: 'https://example.com/1.jpg' }],
      });
      const img = shadow(el).querySelector('img');
      expect(img?.getAttribute('src')).toBe('https://example.com/1.jpg');
    });

    it('renders alt text', () => {
      const el = render({
        widget: 'gallery',
        data: [{ src: 'https://example.com/1.jpg', alt: 'Photo A' }],
      });
      const img = shadow(el).querySelector('img');
      expect(img?.getAttribute('alt')).toBe('Photo A');
    });

    it('renders caption when provided', () => {
      const el = render({
        widget: 'gallery',
        data: [{ src: 'https://example.com/1.jpg', caption: 'Product A' }],
      });
      const caption = shadow(el).querySelector('.gallery-caption');
      expect(caption?.textContent?.trim()).toBe('Product A');
    });

    it('does not render caption when absent', () => {
      const el = render({
        widget: 'gallery',
        data: [{ src: 'https://example.com/1.jpg' }],
      });
      expect(shadow(el).querySelector('.gallery-caption')).toBeNull();
    });

    it('uses lazy loading', () => {
      const el = render({
        widget: 'gallery',
        data: [{ src: 'https://example.com/1.jpg' }],
      });
      const img = shadow(el).querySelector('img');
      expect(img?.getAttribute('loading')).toBe('lazy');
    });
  });

  describe('options', () => {
    it('sets custom column count', () => {
      const el = render({
        widget: 'gallery',
        data: [{ src: 'https://example.com/1.jpg' }],
        options: { columns: 3 },
      });
      const grid = shadow(el).querySelector('.gallery-grid') as HTMLElement;
      expect(grid.style.gridTemplateColumns).toBe('repeat(3, 1fr)');
    });

    it('uses auto-fill when no columns specified', () => {
      const el = render({
        widget: 'gallery',
        data: [{ src: 'https://example.com/1.jpg' }],
      });
      const grid = shadow(el).querySelector('.gallery-grid') as HTMLElement;
      expect(grid.style.gridTemplateColumns).toContain('auto-fill');
    });

    it('applies aspect ratio', () => {
      const el = render({
        widget: 'gallery',
        data: [{ src: 'https://example.com/1.jpg' }],
        options: { aspectRatio: '16:9' },
      });
      const item = shadow(el).querySelector('.gallery-item') as HTMLElement;
      expect(item.style.aspectRatio.replace(/\s/g, '')).toBe('16/9');
    });

    it('does not apply aspect-ratio when auto', () => {
      const el = render({
        widget: 'gallery',
        data: [{ src: 'https://example.com/1.jpg' }],
        options: { aspectRatio: 'auto' },
      });
      const item = shadow(el).querySelector('.gallery-item') as HTMLElement;
      expect(item.style.aspectRatio).toBe('');
    });
  });

  describe('security', () => {
    it('filters out javascript: src', () => {
      const el = render({
        widget: 'gallery',
        data: [
          { src: 'javascript:alert(1)' },
          { src: 'https://example.com/safe.jpg' },
        ],
      });
      const items = shadow(el).querySelectorAll('.gallery-item');
      expect(items.length).toBe(1);
    });

    it('filters out data: src', () => {
      const el = render({
        widget: 'gallery',
        data: [{ src: 'data:text/html,<script>alert(1)</script>' }],
      });
      expect(shadow(el).querySelector('.gallery-grid')).toBeNull();
    });
  });

  describe('data filtering', () => {
    it('skips items without src', () => {
      const el = render({
        widget: 'gallery',
        data: [
          { src: 'https://example.com/1.jpg' },
          { alt: 'No src' },
        ],
      });
      const items = shadow(el).querySelectorAll('.gallery-item');
      expect(items.length).toBe(1);
    });

    it('skips items with non-string src', () => {
      const el = render({
        widget: 'gallery',
        data: [
          { src: 'https://example.com/1.jpg' },
          { src: 123 },
        ],
      });
      const items = shadow(el).querySelectorAll('.gallery-item');
      expect(items.length).toBe(1);
    });
  });

  describe('accessibility', () => {
    it('has list role on grid', () => {
      const el = render({
        widget: 'gallery',
        data: [{ src: 'https://example.com/1.jpg' }],
      });
      expect(shadow(el).querySelector('[role="list"]')).toBeTruthy();
    });

    it('has listitem role on items', () => {
      const el = render({
        widget: 'gallery',
        data: [{ src: 'https://example.com/1.jpg' }],
      });
      expect(shadow(el).querySelector('[role="listitem"]')).toBeTruthy();
    });

    it('uses title as aria-label', () => {
      const el = render({
        widget: 'gallery',
        title: 'Product Photos',
        data: [{ src: 'https://example.com/1.jpg' }],
      });
      const grid = shadow(el).querySelector('.gallery-grid');
      expect(grid?.getAttribute('aria-label')).toBe('Product Photos');
    });

    it('defaults aria-label to Gallery', () => {
      const el = render({
        widget: 'gallery',
        data: [{ src: 'https://example.com/1.jpg' }],
      });
      const grid = shadow(el).querySelector('.gallery-grid');
      expect(grid?.getAttribute('aria-label')).toBe('Gallery');
    });
  });

  describe('CSS parts', () => {
    it('exposes gallery part', () => {
      const el = render({
        widget: 'gallery',
        data: [{ src: 'https://example.com/1.jpg' }],
      });
      expect(shadow(el).querySelector('[part="gallery"]')).toBeTruthy();
    });

    it('exposes gallery-item part', () => {
      const el = render({
        widget: 'gallery',
        data: [{ src: 'https://example.com/1.jpg' }],
      });
      expect(shadow(el).querySelector('[part="gallery-item"]')).toBeTruthy();
    });

    it('exposes gallery-image part', () => {
      const el = render({
        widget: 'gallery',
        data: [{ src: 'https://example.com/1.jpg' }],
      });
      expect(shadow(el).querySelector('[part="gallery-image"]')).toBeTruthy();
    });

    it('exposes gallery-caption part when caption present', () => {
      const el = render({
        widget: 'gallery',
        data: [{ src: 'https://example.com/1.jpg', caption: 'Test' }],
      });
      expect(shadow(el).querySelector('[part="gallery-caption"]')).toBeTruthy();
    });
  });
});
