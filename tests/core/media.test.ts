// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { checkMediaUrl, getMediaOrigins, setMediaOrigins } from '../../src/core/media.js';
import { checkSpec } from '../../src/core/check-spec.js';

describe('media origins', () => {
  afterEach(() => setMediaOrigins(null));

  it('is unrestricted by default — a URL to any site is loaded', () => {
    expect(getMediaOrigins()).toBeNull();
    expect(checkMediaUrl('https://example.com/a.png?q=1')).toEqual({ src: 'https://example.com/a.png?q=1', blocked: false });
    expect(checkMediaUrl('/relative.png')).toEqual({ src: '/relative.png', blocked: false });
  });

  it('always drops script and data URLs, hidden characters included — they are not "blocked", there is nothing to stand in', () => {
    for (const url of ['javascript:alert(1)', 'data:image/png;base64,AAAA', 'vbscript:x', 'java​script:alert(1)', ' \tdata:text/html,x', '']) {
      expect(checkMediaUrl(url)).toEqual({ src: '', blocked: false });
    }
  });

  it('lets through only the listed origins once set; a path in an entry is ignored', () => {
    setMediaOrigins(['https://cdn.example.com/some/path', 'http://localhost:8080']);
    expect(getMediaOrigins()).toEqual(['https://cdn.example.com', 'http://localhost:8080']);
    expect(checkMediaUrl('https://cdn.example.com/a.png').blocked).toBe(false);
    expect(checkMediaUrl('http://localhost:8080/a.png').blocked).toBe(false);
    for (const url of [
      'https://evil.test/a.png?q=SECRET',
      'http://cdn.example.com/a.png', // another scheme is another origin
      'https://cdn.example.com:8443/a.png',
      'https://cdn.example.com.evil.test/a.png',
      '//evil.test/a.png', // protocol-relative: resolves against a page, which a server-side check does not have
    ]) {
      expect(checkMediaUrl(url), url).toEqual({ src: '', blocked: true });
    }
  });

  it('"self" admits the page itself, which is where a relative URL points', () => {
    setMediaOrigins(['https://cdn.example.com']);
    expect(checkMediaUrl('/a.png')).toEqual({ src: '', blocked: true });
    setMediaOrigins(['self']);
    expect(checkMediaUrl('/a.png')).toEqual({ src: '/a.png', blocked: false });
    expect(checkMediaUrl('https://cdn.example.com/a.png').blocked).toBe(true);
  });

  it('an empty list admits nothing, and null lifts the restriction', () => {
    setMediaOrigins([]);
    expect(checkMediaUrl('https://example.com/a.png').blocked).toBe(true);
    expect(checkMediaUrl('/a.png').blocked).toBe(true);
    setMediaOrigins(null);
    expect(checkMediaUrl('https://example.com/a.png').blocked).toBe(false);
  });

  it('an entry that is not an origin matches nothing', () => {
    setMediaOrigins(['not a url', 'file:///etc']);
    expect(checkMediaUrl('https://example.com/a.png').blocked).toBe(true);
  });
});

describe('checkSpec and the media origins', () => {
  afterEach(() => setMediaOrigins(null));

  it('says nothing about a URL to another site while media is unrestricted', () => {
    expect(checkSpec({ widget: 'image', data: { src: 'https://example.com/a.png' } }).warnings).toEqual([]);
  });

  it('names each URL the restriction will refuse, in image, gallery and video', () => {
    setMediaOrigins(['https://cdn.example.com']);
    expect(checkSpec({ widget: 'image', data: { src: 'https://evil.test/a.png' } }).warnings)
      .toEqual([expect.stringMatching(/^data\.src is outside the origins media may load from/)]);
    expect(checkSpec({ widget: 'gallery', data: [{ src: 'https://cdn.example.com/a.png' }, { src: 'https://evil.test/b.png' }] }).warnings)
      .toEqual([expect.stringMatching(/^data\[1\]\.src is outside/)]);
    const video = checkSpec({
      widget: 'video',
      data: { src: 'https://cdn.example.com/v.mp4', poster: 'https://evil.test/p.png', tracks: [{ src: 'https://evil.test/t.vtt' }] },
    });
    expect(video.warnings).toEqual([
      expect.stringMatching(/^data\.poster is outside/),
      expect.stringMatching(/^data\.tracks\[0\]\.src is outside/),
    ]);
    expect(checkSpec({ widget: 'image', data: { src: 'https://cdn.example.com/a.png' } }).warnings).toEqual([]);
  });
});
