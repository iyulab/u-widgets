import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: {
    command: 'npx vite --force --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173/demo/',
    reuseExistingServer: true,
    // vite --force 콜드 부팅(의존성 사전번들 재생성)이 30초를 넘길 수 있다 — CI/신규 환경 대비
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
