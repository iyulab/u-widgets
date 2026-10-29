import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../src/elements/u-widget.js';
import type { UWidget } from '../../src/elements/u-widget.js';
import { setMediaOrigins } from '../../src/core/media.js';

/** Draw a spec and return the shadow root of the widget that drew it (`u-widget` → the element it delegates to). */
async function draw(spec: Record<string, unknown>): Promise<ShadowRoot> {
  const el = document.createElement('u-widget') as UWidget;
  el.spec = spec as unknown as UWidget['spec'];
  document.body.appendChild(el);
  await el.updateComplete;
  const inner = el.shadowRoot!.querySelector<HTMLElement & { updateComplete?: Promise<unknown> }>('[nested]')!;
  await inner.updateComplete;
  return inner.shadowRoot!;
}

const srcsOf = (root: ShadowRoot, selector: string) => [...root.querySelectorAll(selector)].map(e => e.getAttribute('src'));

describe('media origins — every widget that loads a URL from the spec goes through one check', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => setMediaOrigins(null));

  it('loads everything while no origins are set', async () => {
    const image = await draw({ widget: 'image', data: { src: 'https://evil.test/a.png?q=SECRET', alt: 'x' } });
    expect(srcsOf(image, 'img')).toEqual(['https://evil.test/a.png?q=SECRET']);
  });

  it('image: a URL outside the list is not requested — the alt text stands in', async () => {
    setMediaOrigins(['https://cdn.example.com']);
    const refused = await draw({ widget: 'image', data: { src: 'https://evil.test/a.png?q=SECRET', alt: 'Site plan', caption: 'Floor 2' } });
    expect(refused.querySelector('img')).toBeNull();
    expect(refused.querySelector('.media-blocked')?.textContent).toBe('Site plan');
    expect(refused.querySelector('.media-blocked')?.getAttribute('role')).toBe('img');
    expect(refused.querySelector('[part="caption"]')?.textContent).toBe('Floor 2');

    const allowed = await draw({ widget: 'image', data: { src: 'https://cdn.example.com/a.png', alt: 'ok' } });
    expect(srcsOf(allowed, 'img')).toEqual(['https://cdn.example.com/a.png']);
    expect(allowed.querySelector('.media-blocked')).toBeNull();
  });

  it('image: a script or data URL is still dropped outright, with nothing standing in', async () => {
    setMediaOrigins(['https://cdn.example.com']);
    const dropped = await draw({ widget: 'image', data: { src: 'javascript:alert(1)', alt: 'x' } });
    expect(dropped.querySelector('img')).toBeNull();
    expect(dropped.querySelector('.media-blocked')).toBeNull();
  });

  it('gallery: refused pictures stand in for themselves, the others load', async () => {
    setMediaOrigins(['https://cdn.example.com']);
    const root = await draw({
      widget: 'gallery',
      data: [
        { src: 'https://cdn.example.com/a.png', alt: 'a' },
        { src: 'https://evil.test/b.png?q=SECRET', alt: 'b' },
      ],
    });
    expect(srcsOf(root, 'img')).toEqual(['https://cdn.example.com/a.png']);
    expect([...root.querySelectorAll('.media-blocked')].map(e => e.textContent)).toEqual(['b']);
    expect(root.querySelectorAll('figure').length).toBe(2);
  });

  it('video: a refused source stands in; poster and subtitle tracks outside the list are left out', async () => {
    setMediaOrigins(['https://cdn.example.com']);
    const refused = await draw({ widget: 'video', data: { src: 'https://evil.test/v.mp4', alt: 'Tour', caption: 'c' } });
    expect(refused.querySelector('video')).toBeNull();
    expect(refused.querySelector('.media-blocked')?.textContent).toBe('Tour');

    const partial = await draw({
      widget: 'video',
      data: {
        src: 'https://cdn.example.com/v.mp4',
        poster: 'https://evil.test/p.png?q=SECRET',
        tracks: [{ src: 'https://cdn.example.com/en.vtt' }, { src: 'https://evil.test/x.vtt' }],
      },
    });
    const video = partial.querySelector('video')!;
    expect(video.getAttribute('src')).toBe('https://cdn.example.com/v.mp4');
    expect(video.hasAttribute('poster')).toBe(false);
    expect(srcsOf(partial, 'track')).toEqual(['https://cdn.example.com/en.vtt']);
  });

  it('status-card: a picture outside the list is not requested', async () => {
    setMediaOrigins(['https://cdn.example.com']);
    const spec = (image: string) => ({ widget: 'status-card', data: { title: 'Pump 1', tone: 'ok', image } });
    expect((await draw(spec('https://evil.test/p.png?q=SECRET'))).querySelector('img')).toBeNull();
    expect(srcsOf(await draw(spec('https://cdn.example.com/p.png')), 'img')).toEqual(['https://cdn.example.com/p.png']);
  });

  it('table list: an avatar outside the list is not requested', async () => {
    setMediaOrigins(['https://cdn.example.com']);
    const root = await draw({
      widget: 'list',
      data: [
        { name: 'Ann', photo: 'https://cdn.example.com/ann.png' },
        { name: 'Bob', photo: 'https://evil.test/bob.png?q=SECRET' },
      ],
      mapping: { primary: 'name', avatar: 'photo' },
    });
    expect(srcsOf(root, 'img.list-avatar')).toEqual(['https://cdn.example.com/ann.png']);
  });
});
