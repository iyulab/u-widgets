import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import dts from 'vite-plugin-dts';

// declare global block for HTMLElementTagNameMap and JSX IntrinsicElements.
// rollup-plugin-dts strips declare global when bundling, so we append it after.
const JSX_GLOBAL_DECLARATIONS = `
declare global {
    interface HTMLElementTagNameMap {
        'u-widget': import('@iyulab/u-widgets').UWidget;
    }
    namespace JSX {
        interface IntrinsicElements {
            'u-widget': UWidgetElementProps;
        }
    }
}

declare module "react" {
    namespace JSX {
        interface IntrinsicElements {
            "u-widget": UWidgetElementProps;
        }
    }
}
`;

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
      afterBuild() {
        // Append declare global block that rollup-plugin-dts strips
        const dtsPath = resolve(__dirname, 'dist/u-widgets.d.ts');
        const content = readFileSync(dtsPath, 'utf-8');
        if (!content.includes('HTMLElementTagNameMap')) {
          writeFileSync(dtsPath, content + JSX_GLOBAL_DECLARATIONS);
        }
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['tests/**/*.{test,spec}.ts'],
  },
});
