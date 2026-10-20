import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';

// api-extractor bundles its own TypeScript, but the plugin hands it the
// *project's* TypeScript lib folder. With a newer project compiler the bundled analyzer
// cannot read the newer lib files and fails on standard symbols such as `AsyncGenerator`
// ("Unable to follow symbol"). A workspace hides this because both resolve to the same hoisted
// TypeScript; a standalone install exposes it. Point api-extractor at the TypeScript it actually
// loads so the two agree.
const requireFromHere = createRequire(import.meta.url);
const extractorTypescript = dirname(
  requireFromHere.resolve('typescript/package.json', {
    paths: [dirname(requireFromHere.resolve('@microsoft/api-extractor/package.json'))],
  }),
);
import stripCssComments from '@iyulab/components/plugins/vite-plugin-strip-css-comments.js';
import { fixPublishedDtsGlobals } from '@iyulab/components/plugins/dts-globals.js';

const ENTRY = {
  'u-widgets': resolve(__dirname, 'src/index.ts'),
  'u-widgets-charts': resolve(__dirname, 'src/charts.ts'),
  'u-widgets-tools': resolve(__dirname, 'src/tools.ts'),
  'u-widgets-math': resolve(__dirname, 'src/math.ts'),
  'u-widgets-react': resolve(__dirname, 'src/react.ts'),
  'u-widgets-components': resolve(__dirname, 'src/components.ts'),
  'u-widgets-locale-ko': resolve(__dirname, 'src/locales/ko.ts'),
  'u-widgets-tools-locale-ko': resolve(__dirname, 'src/locales/tools-ko.ts'),
};

export default defineConfig({
  build: {
    lib: {
      entry: ENTRY,
      formats: ['es'],
    },
    rollupOptions: {
      external: ['lit', /^lit\//, 'echarts', /^echarts\//, '@formdown/core', /^@formdown\/core\//, 'katex', 'react', /^react\//, '@lit/react', /^@lit\/react\//, '@iyulab/u-widgets', '@iyulab/components', /^@iyulab\/components\//],
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
    // Comments inside css`…` templates are string content, so esbuild ships them to every
    // consumer. Strip them at source level (before esbuild) — they are design notes, and the
    // charts bundle blew its 7 KB gzip budget on them alone (7705 → 7131 without). The transform is the
    // family's shared one, published by @iyulab/components (a dev dependency here).
    stripCssComments(),
    dts({
      include: ['src'],
      bundleTypes: { invokeOptions: { typescriptCompilerFolder: extractorTypescript } },
      // The declaration bundler copies every source `declare global` merge into each entry but drops
      // the classes an entry does not reach. The family's shared step points each dangling name at the
      // public entry that exports it (a composed-only element becomes `HTMLElement`), so the merges in
      // src are the single source of truth — nothing is mirrored here.
      afterBuild() {
        fixPublishedDtsGlobals(__dirname);
      },
    }),
  ],
  resolve: {
    alias: {
      '@iyulab/u-widgets': resolve(__dirname, 'src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['tests/**/*.{test,spec}.ts'],
  },
});
