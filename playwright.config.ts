import { defineConfig } from '@playwright/test';

// e2e 데모 서버의 포트 — Vite 기본(5173)이 아닌 전용 포트. 같은 머신의 다른 dev 서버가 5173을 쓰고 있으면 `reuseExistingServer`가 그 서버를
// 이 데모로 알고 시험한다. `UW_E2E_PORT`로 바꿀 수 있고, 포트가 막혀 있으면 다른 포트로 비켜 가지 않고 실패한다(`--strictPort`).
const PORT = Number(process.env.UW_E2E_PORT ?? 5291);

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: {
    command: `npx vite --force --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}/demo/`,
    reuseExistingServer: true,
    // vite --force 콜드 부팅(의존성 사전번들 재생성)이 30초를 넘길 수 있다 — CI/신규 환경 대비
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
