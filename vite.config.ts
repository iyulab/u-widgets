import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        'u-widgets': resolve(__dirname, 'src/index.ts'),
        'u-widgets-charts': resolve(__dirname, 'src/charts.ts'),
        'u-widgets-forms': resolve(__dirname, 'src/forms.ts'),
        'u-widgets-tools': resolve(__dirname, 'src/tools.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['lit', /^lit\//, 'echarts', /^echarts\//, '@formdown/core', /^@formdown\/core\//],
      output: {
        globals: {
          lit: 'Lit',
          'lit/decorators.js': 'Lit',
          echarts: 'echarts',
        },
      },
    },
    target: 'es2021',
    sourcemap: true,
    minify: true,
  },
  plugins: [
    dts({
      include: ['src'],
      rollupTypes: true,
    }),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['tests/**/*.{test,spec}.ts'],
  },
});
