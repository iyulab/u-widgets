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

  describe('선언이 없으면 auto 모드를 건드리지 않는다', () => {
    // MutationObserver 콜백은 마이크로태스크로 돈다.
    const flush = () => new Promise(resolve => setTimeout(resolve, 0));

    afterEach(() => {
      document.documentElement.removeAttribute('data-theme');
      document.querySelectorAll('u-widget').forEach(el => el.remove());
    });

    it('data-theme가 없으면 theme 속성을 쓰지 않는다 — prefers-color-scheme가 그대로 적용된다', async () => {
      const widget = document.createElement('u-widget');
      document.body.appendChild(widget);
      const { installGlobalThemeSync } = await importFreshThemeSync();
      installGlobalThemeSync();

      const added = document.createElement('u-widget');
      document.body.appendChild(added);
      await flush();

      expect(widget.hasAttribute('theme')).toBe(false);
      expect(added.hasAttribute('theme')).toBe(false);
    });

    it('dark·light가 아닌 값(예: "system")도 선언이 아닌 것으로 본다', async () => {
      document.documentElement.setAttribute('data-theme', 'system');
      const widget = document.createElement('u-widget');
      document.body.appendChild(widget);
      const { installGlobalThemeSync } = await importFreshThemeSync();
      installGlobalThemeSync();
      expect(widget.hasAttribute('theme')).toBe(false);
    });

    it('data-theme=light는 light로 전파하고, 선언이 사라지면 자기가 쓴 theme을 걷는다', async () => {
      document.documentElement.setAttribute('data-theme', 'light');
      const widget = document.createElement('u-widget');
      document.body.appendChild(widget);
      const { installGlobalThemeSync } = await importFreshThemeSync();
      installGlobalThemeSync();
      expect(widget.getAttribute('theme')).toBe('light');

      document.documentElement.setAttribute('data-theme', 'dark');
      await flush();
      expect(widget.getAttribute('theme')).toBe('dark');

      document.documentElement.removeAttribute('data-theme');
      await flush();
      expect(widget.hasAttribute('theme')).toBe(false);
    });

    it('페이지가 위젯에 직접 준 theme은 덮어쓰지도 걷지도 않는다', async () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      const pinned = document.createElement('u-widget');
      pinned.setAttribute('theme', 'light');
      document.body.appendChild(pinned);
      const { installGlobalThemeSync } = await importFreshThemeSync();
      installGlobalThemeSync();
      expect(pinned.getAttribute('theme')).toBe('light');

      document.documentElement.removeAttribute('data-theme');
      await flush();
      expect(pinned.getAttribute('theme')).toBe('light');
    });

    it('페이지가 속성(property)으로 준 theme은 attribute로 반영되기 전에 붙어도 덮어쓰지 않는다', async () => {
      // React(@lit/react)는 요소를 붙인 직후 property를 쓰고, attribute 반영은 그 뒤 업데이트에서 일어난다.
      document.documentElement.setAttribute('data-theme', 'light');
      const { installGlobalThemeSync } = await importFreshThemeSync();
      installGlobalThemeSync();
      const widget = document.createElement('u-widget') as HTMLElement & { theme?: string };
      document.body.appendChild(widget);
      widget.theme = 'dark';
      await flush();
      expect(widget.theme).toBe('dark');
      expect(widget.hasAttribute('theme')).toBe(false);
      widget.remove();
      document.documentElement.removeAttribute('data-theme');
    });

    it('동기화가 쓴 뒤 페이지가 바꾼 theme도 페이지의 것으로 남는다', async () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      const widget = document.createElement('u-widget');
      document.body.appendChild(widget);
      const { installGlobalThemeSync } = await importFreshThemeSync();
      installGlobalThemeSync();
      widget.setAttribute('theme', 'light');

      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.setAttribute('data-theme', 'dark');
      await flush();
      expect(widget.getAttribute('theme')).toBe('light');
    });
  });
});
