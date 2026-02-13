import { defineConfig } from 'vite';

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
    },
  },
});
