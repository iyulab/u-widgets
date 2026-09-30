/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/index.js';
import type { UWidgetSpec } from '../../src/core/types.js';

/**
 * 영상의 자막 수단(KWCAG 5.2.1 · WCAG 1.2.2). `<video>` 가 섀도 안에 있어 페이지가 `<track>` 을
 * 넣을 수 없다 — 스펙의 `data.tracks` 가 유일한 자리다. 실제 엔진의 `textTracks` 로 잰다
 * (트랙 파일을 불러오지 않아도 목록에는 잡힌다).
 */
describe('uw-video — 자막 트랙', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  async function mount(spec: UWidgetSpec) {
    const el = document.createElement('uw-video') as HTMLElement & { spec: UWidgetSpec; updateComplete: Promise<unknown> };
    el.spec = spec;
    document.body.appendChild(el);
    await el.updateComplete;
    return el.shadowRoot!.querySelector('video')!;
  }

  it('data.tracks 가 textTracks 로 도달한다 — kind 기본은 subtitles', async () => {
    const video = await mount({
      widget: 'video',
      data: {
        src: '/demo.mp4',
        tracks: [
          { src: '/ko.vtt', srclang: 'ko', label: '한국어', default: true },
          { src: '/en.vtt', srclang: 'en', label: 'English', kind: 'captions' },
        ],
      },
    });
    const tracks = [...video.textTracks];
    expect(tracks.map((t) => [t.kind, t.language, t.label])).toEqual([
      ['subtitles', 'ko', '한국어'],
      ['captions', 'en', 'English'],
    ]);
    expect(video.querySelector('track[default]')!.getAttribute('srclang')).toBe('ko');
  });

  it('위험한 src 와 모르는 kind 는 걸러진다', async () => {
    const video = await mount({
      widget: 'video',
      data: {
        src: '/demo.mp4',
        tracks: [{ src: 'javascript:alert(1)' }, { src: '/a.vtt', kind: 'bogus' }, 'nope'],
      },
    } as unknown as UWidgetSpec);
    const tracks = [...video.textTracks];
    expect(tracks.length).toBe(1);
    expect(tracks[0].kind).toBe('subtitles');
  });

  it('tracks 가 없으면 트랙도 없다', async () => {
    const video = await mount({ widget: 'video', data: { src: '/demo.mp4' } });
    expect(video.textTracks.length).toBe(0);
  });
});
