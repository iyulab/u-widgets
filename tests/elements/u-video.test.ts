import { describe, it, expect, beforeEach } from 'vitest';
import type { UWidgetSpec } from '../../src/core/types.js';

let UVideo: typeof import('../../src/elements/u-video.js').UVideo;

beforeEach(async () => {
  const mod = await import('../../src/elements/u-video.js');
  UVideo = mod.UVideo;
});

function render(spec: UWidgetSpec): HTMLElement {
  const el = new UVideo();
  el.spec = spec;
  (el as any).performUpdate();
  return el;
}

function shadow(el: HTMLElement) {
  return el.shadowRoot!;
}

describe('u-video', () => {
  describe('basic rendering', () => {
    it('renders nothing when spec is null', () => {
      const el = new UVideo();
      (el as any).performUpdate();
      expect(shadow(el).querySelector('.video-container')).toBeNull();
    });

    it('renders nothing when data is missing', () => {
      const el = render({ widget: 'video' });
      expect(shadow(el).querySelector('.video-container')).toBeNull();
    });

    it('renders nothing when src is empty', () => {
      const el = render({ widget: 'video', data: { src: '' } });
      expect(shadow(el).querySelector('.video-container')).toBeNull();
    });

    it('renders video element with src', () => {
      const el = render({
        widget: 'video',
        data: { src: 'https://example.com/video.mp4' },
      });
      const video = shadow(el).querySelector('video');
      expect(video).toBeTruthy();
      expect(video?.getAttribute('src')).toBe('https://example.com/video.mp4');
    });

    it('renders poster when provided', () => {
      const el = render({
        widget: 'video',
        data: { src: 'https://example.com/video.mp4', poster: 'https://example.com/poster.jpg' },
      });
      const video = shadow(el).querySelector('video');
      expect(video?.getAttribute('poster')).toBe('https://example.com/poster.jpg');
    });

    it('renders caption when provided', () => {
      const el = render({
        widget: 'video',
        data: { src: 'https://example.com/video.mp4', caption: 'Demo video' },
      });
      const caption = shadow(el).querySelector('.video-caption');
      expect(caption?.textContent?.trim()).toBe('Demo video');
    });

    it('does not render caption when absent', () => {
      const el = render({
        widget: 'video',
        data: { src: 'https://example.com/video.mp4' },
      });
      expect(shadow(el).querySelector('.video-caption')).toBeNull();
    });
  });

  describe('options', () => {
    it('shows controls by default', () => {
      const el = render({
        widget: 'video',
        data: { src: 'https://example.com/video.mp4' },
      });
      const video = shadow(el).querySelector('video');
      expect(video?.hasAttribute('controls')).toBe(true);
    });

    it('hides controls when controls: false', () => {
      const el = render({
        widget: 'video',
        data: { src: 'https://example.com/video.mp4' },
        options: { controls: false },
      });
      const video = shadow(el).querySelector('video');
      expect(video?.hasAttribute('controls')).toBe(false);
    });

    it('sets autoplay when specified', () => {
      const el = render({
        widget: 'video',
        data: { src: 'https://example.com/video.mp4' },
        options: { autoplay: true },
      });
      const video = shadow(el).querySelector('video');
      expect(video?.hasAttribute('autoplay')).toBe(true);
    });

    it('auto-mutes when autoplay is true', () => {
      const el = render({
        widget: 'video',
        data: { src: 'https://example.com/video.mp4' },
        options: { autoplay: true },
      });
      const video = shadow(el).querySelector('video');
      expect(video?.hasAttribute('muted')).toBe(true);
    });

    it('sets loop when specified', () => {
      const el = render({
        widget: 'video',
        data: { src: 'https://example.com/video.mp4' },
        options: { loop: true },
      });
      const video = shadow(el).querySelector('video');
      expect(video?.hasAttribute('loop')).toBe(true);
    });

    it('sets muted when specified', () => {
      const el = render({
        widget: 'video',
        data: { src: 'https://example.com/video.mp4' },
        options: { muted: true },
      });
      const video = shadow(el).querySelector('video');
      expect(video?.hasAttribute('muted')).toBe(true);
    });

    it('has playsinline attribute', () => {
      const el = render({
        widget: 'video',
        data: { src: 'https://example.com/video.mp4' },
      });
      const video = shadow(el).querySelector('video');
      expect(video?.hasAttribute('playsinline')).toBe(true);
    });
  });

  describe('security', () => {
    it('blocks javascript: src', () => {
      const el = render({
        widget: 'video',
        data: { src: 'javascript:alert(1)' },
      });
      expect(shadow(el).querySelector('video')).toBeNull();
    });

    it('blocks data: src', () => {
      const el = render({
        widget: 'video',
        data: { src: 'data:text/html,<script>alert(1)</script>' },
      });
      expect(shadow(el).querySelector('video')).toBeNull();
    });

    it('blocks javascript: poster', () => {
      const el = render({
        widget: 'video',
        data: { src: 'https://example.com/video.mp4', poster: 'javascript:alert(1)' },
      });
      const video = shadow(el).querySelector('video');
      // poster should be empty/missing since it was sanitized
      expect(video?.getAttribute('poster') ?? '').toBe('');
    });
  });

  describe('accessibility', () => {
    it('sets aria-label from alt', () => {
      const el = render({
        widget: 'video',
        data: { src: 'https://example.com/video.mp4', alt: 'Product demo' },
      });
      const video = shadow(el).querySelector('video');
      expect(video?.getAttribute('aria-label')).toBe('Product demo');
    });
  });

  describe('CSS parts', () => {
    it('exposes video part', () => {
      const el = render({
        widget: 'video',
        data: { src: 'https://example.com/video.mp4' },
      });
      expect(shadow(el).querySelector('[part="video"]')).toBeTruthy();
    });

    it('exposes video-element part', () => {
      const el = render({
        widget: 'video',
        data: { src: 'https://example.com/video.mp4' },
      });
      expect(shadow(el).querySelector('[part="video-element"]')).toBeTruthy();
    });

    it('exposes caption part when caption present', () => {
      const el = render({
        widget: 'video',
        data: { src: 'https://example.com/video.mp4', caption: 'Demo' },
      });
      expect(shadow(el).querySelector('[part="caption"]')).toBeTruthy();
    });
  });
});
