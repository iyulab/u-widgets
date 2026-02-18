import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'demo',
  base: '/u-widgets/',
  build: {
    outDir: '../dist-demo',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      // Disable tree-shaking for demo app build.
      // package.json "sideEffects": false + Lit decorator /*#__PURE__*/ annotations
      // cause custom element registrations to be removed otherwise.
      treeshake: false,
      input: {
        main: resolve(__dirname, 'demo/index.html'),
        widgets: resolve(__dirname, 'demo/widgets.html'),
        insight: resolve(__dirname, 'demo/insight.html'),
      },
    },
  },
});
