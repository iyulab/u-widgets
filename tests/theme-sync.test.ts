import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// @lit-labs/ssr DOM shim 유사 환경: document는 존재하지만
// documentElement/querySelectorAll/body가 없고 MutationObserver도 없다.
const SSR_SHIM_DOCUMENT = {
  createElement: () => ({}),
} as unknown as Document;

async function importFreshThemeSync() {
  vi.resetModules();
  return import('../src/theme-sync.js');
}

describe('installGlobalThemeSync', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('SSR 안전성', () => {
    it('document가 없는 환경에서 throw하지 않는다', async () => {
      vi.stubGlobal('document', undefined);
      const { installGlobalThemeSync } = await importFreshThemeSync();
      expect(() => installGlobalThemeSync()).not.toThrow();
    });

    it('SSR shim(document는 있으나 documentElement/querySelectorAll 없음)에서 throw하지 않는다', async () => {
      vi.stubGlobal('document', SSR_SHIM_DOCUMENT);
      vi.stubGlobal('MutationObserver', undefined);
      const { installGlobalThemeSync } = await importFreshThemeSync();
      expect(() => installGlobalThemeSync()).not.toThrow();
    });

    it('MutationObserver가 없는 환경에서 throw하지 않는다', async () => {
      vi.stubGlobal('MutationObserver', undefined);
      const { installGlobalThemeSync } = await importFreshThemeSync();
      expect(() => installGlobalThemeSync()).not.toThrow();
    });
  });

  describe('브라우저 동작 보존', () => {
    it('data-theme=dark이면 기존 u-widget에 theme="dark"를 부여한다', async () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      const widget = document.createElement('u-widget');
      document.body.appendChild(widget);

      const { installGlobalThemeSync } = await importFreshThemeSync();
      installGlobalThemeSync();

      expect(widget.getAttribute('theme')).toBe('dark');

      widget.remove();
      document.documentElement.removeAttribute('data-theme');
    });
  });
});
