import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import dts from 'vite-plugin-dts';

// Every element module under src/elements declares its own `declare global { interface
// HTMLElementTagNameMap { '<tag>': <Class>; } }` merge (u-widget.ts also merges
// JSX.IntrinsicElements, via src/types/jsx.ts). rollup-plugin-dts's bundling strips the class
// import each merge depends on but leaves the merge body behind, so every bundled entry ships
// with dangling type references (bundleTypes scans the whole `src` tree for every entry, so this
// affects all six, not just the ones that actually import the affected elements). `declare
// global` has no other use anywhere in this package's src (see the grep in the elements/ and
// types/ directories), so it's safe to strip every occurrence rollup-plugin-dts left behind and
// append one correct, self-contained block instead.
//
// `u-widget` gets a real class reference (self-imported by package name, so it resolves the same
// way regardless of which entry's .d.ts it's appended to) and a JSX declaration — it's the only
// element with a React wrapper (src/react.ts). `uw-chart` and `uw-math` also have real public
// class exports (from their own optional entry points, src/charts.ts and src/math.ts
// respectively) and get the same self-import treatment, from their own subpath. The other 14 are
// composed-only internals: no entry point exports their classes and no consumer is meant to look
// them up by tag name, so `HTMLElement` is the correct (and only available) type for their map
// entries.
const TYPED_TAGS: Record<string, string> = {
  'u-widget': "import('@iyulab/u-widgets').UWidget",
  'uw-chart': "import('@iyulab/u-widgets/charts').UwChart",
  'uw-math': "import('@iyulab/u-widgets/math').UwMath",
};
const OPAQUE_TAGS = [
  'uw-citation', 'uw-code', 'uw-compose', 'uw-content', 'uw-form',
  'uw-gallery', 'uw-gauge', 'uw-kv', 'uw-metric', 'uw-rating',
  'uw-status', 'uw-steps', 'uw-table', 'uw-video',
];

function globalDeclarationsBlock(): string {
  const typedEntries = Object.entries(TYPED_TAGS).map(([tag, type]) => `    '${tag}': ${type};`).join('\n');
  const opaqueEntries = OPAQUE_TAGS.map((tag) => `    '${tag}': HTMLElement;`).join('\n');
  return `
declare global {
  interface HTMLElementTagNameMap {
${typedEntries}
${opaqueEntries}
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'u-widget': import('@iyulab/u-widgets').UWidgetElementProps;
    }
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      'u-widget': import('@iyulab/u-widgets').UWidgetElementProps;
    }
  }
}
`;
}

// Removes every top-level `declare global { ... }` block (brace-depth aware, so nested interface
// bodies don't confuse it). Safe here because `declare global` has exactly one use in this
// package (see comment above) — after a build, every occurrence is one of the orphaned blocks
// this hook exists to replace.
function stripDeclareGlobalBlocks(content: string): string {
  const marker = 'declare global';
  let result = '';
  let cursor = 0;
  for (;;) {
    const start = content.indexOf(marker, cursor);
    if (start === -1) {
      result += content.slice(cursor);
      break;
    }
    result += content.slice(cursor, start);
    let depth = 0;
    let i = content.indexOf('{', start);
    for (; i < content.length; i++) {
      if (content[i] === '{') depth++;
      else if (content[i] === '}') {
        depth--;
        if (depth === 0) { i++; break; }
      }
    }
    cursor = i;
  }
  return result;
}

const ENTRY = {
  'u-widgets': resolve(__dirname, 'src/index.ts'),
  'u-widgets-charts': resolve(__dirname, 'src/charts.ts'),
  'u-widgets-forms': resolve(__dirname, 'src/forms.ts'),
  'u-widgets-tools': resolve(__dirname, 'src/tools.ts'),
  'u-widgets-math': resolve(__dirname, 'src/math.ts'),
  'u-widgets-react': resolve(__dirname, 'src/react.ts'),
};

export default defineConfig({
  build: {
    lib: {
      entry: ENTRY,
      formats: ['es'],
    },
    rollupOptions: {
      external: ['lit', /^lit\//, 'echarts', /^echarts\//, '@formdown/core', /^@formdown\/core\//, 'katex', 'react', /^react\//, '@lit/react', /^@lit\/react\//, '@iyulab/u-widgets'],
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
      bundleTypes: true,
      afterBuild() {
        for (const name of Object.keys(ENTRY)) {
          const dtsPath = resolve(__dirname, 'dist', `${name}.d.ts`);
          const content = readFileSync(dtsPath, 'utf-8');
          const stripped = stripDeclareGlobalBlocks(content);
          writeFileSync(dtsPath, stripped.trimEnd() + '\n' + globalDeclarationsBlock());
        }
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
