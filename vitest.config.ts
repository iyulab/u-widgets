import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { resolve } from 'path';

// 테스트 전용 설정. `vite.config.ts` 의 빌드 플러그인을 로드하지 않도록 분리한다 —
// 테스트 실행이 `dist/` 를 건드리는 부작용을 막기 위함이다(router·components 와 같은 구조).
//
// - unit:    기존 `tests/**`. 종전 설정 그대로 happy-dom 이다.
// - browser: 🔴**이 패키지 테마 계약의 절반은 «캐스케이드» 이고, happy-dom 은 그것을
//            원리적으로 판정하지 못한다.** 토큰이 섀도 DOM 의 `:host` 에 선언돼 있어,
//            바깥 시트가 그것을 이기는지는 «바깥 트리 우선 규칙 vs 특이도» 의 실제
//            적용 결과로만 갈린다. 그 간극에서 실제로 결함이 살아 있었다 — 게시되는
//            `themes/shadcn.css` 가 `:root` 로 덮고 있었고, 그 형태는 이기지 못한다.
export default defineConfig({
  resolve: {
    alias: {
      '@iyulab/u-widgets': resolve(__dirname, 'src/index.ts'),
    },
  },
  test: {
    projects: [
      {
        resolve: { alias: { '@iyulab/u-widgets': resolve(__dirname, 'src/index.ts') } },
        test: {
          name: 'unit',
          globals: true,
          include: ['tests/**/*.{test,spec}.ts'],
          exclude: ['tests/browser/**'],
          environment: 'happy-dom',
        },
      },
      {
        resolve: { alias: { '@iyulab/u-widgets': resolve(__dirname, 'src/index.ts') } },
        test: {
          name: 'browser',
          // 직렬 — 파일마다 브라우저 페이지가 함께 뜨면 여유 메모리가 바닥나 시험이 «timed out waiting for click»·
          // «Failed to fetch dynamically imported module» 로 비결정적으로 죽는다(메모리가 적은 기계에서 병렬은 여유를 바닥까지 끌어내렸다).
          fileParallelism: false,
          globals: true,
          include: ['tests/browser/**/*.test.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            // headless 고정 — 헤드 있는 창은 OS 표시 배율에 물려 얇은 테두리가 장치 픽셀로 스냅된다(components 설정 주석 참조).
            instances: [{ browser: 'chromium', headless: true }],
          },
          // 고정 포트 이유는 packages/components/vitest.config.ts 참조 — 이 머신의
          // Windows 동적 포트 제외 범위와 vitest 기본 포트가 충돌해 EACCES 로
          // 실패하던 것을 실측으로 확인했다. 41501~41507 사용 중이라 다음 칸이다.
          api: { host: '127.0.0.1', port: 41508 },
          isolate: true,
        },
      },
    ],
  },
});
