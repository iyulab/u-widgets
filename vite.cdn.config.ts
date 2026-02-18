import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * CDN build: IIFE bundle for <script> tag usage.
 * Bundles lit + all widgets. Only echarts remains external.
 *
 * Usage: npm run build:cdn
 */
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/cdn.ts'),
      formats: ['iife'],
      name: 'UWidgets',
      fileName: () => 'u-widgets.global.js',
    },
    rollupOptions: {
      external: ['echarts', /^echarts\//, '@formdown/core', /^@formdown\/core\//],
      output: {
        globals: {
          'echarts': 'echarts',
          'echarts/core': 'echarts',
          'echarts/charts': 'echarts',
          'echarts/components': 'echarts',
          'echarts/renderers': 'echarts',
        },
      },
      treeshake: false,
    },
    target: 'es2021',
    sourcemap: true,
    minify: true,
  },
});
