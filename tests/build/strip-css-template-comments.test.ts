// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { stripCssTemplateComments } from '../../build/strip-css-template-comments';

describe('stripCssTemplateComments', () => {
  it('removes a block comment inside a css template', () => {
    const src = 'const s = css`\n  /* why: host must be a flex column */\n  :host { display: flex; }\n`;';
    expect(stripCssTemplateComments(src)).toBe('const s = css`\n  \n  :host { display: flex; }\n`;');
  });

  it('keeps line count so source maps stay aligned', () => {
    const src = 'css`\n/* line one\n   line two\n   line three */\n:host{}\n`';
    const out = stripCssTemplateComments(src);
    expect(out.split('\n').length).toBe(src.split('\n').length);
    expect(out).not.toContain('line two');
  });

  it('leaves comments outside css templates alone (JS, html templates)', () => {
    const src = [
      '/* js block comment */',
      'const t = html`<div>/* not css */</div>`;',
      'const s = css`:host{}`;',
    ].join('\n');
    expect(stripCssTemplateComments(src)).toBe(src);
  });

  it('does not treat unsafeCSS` as a css template', () => {
    const src = 'const s = unsafeCSS`/* keep */ :host{}`;';
    expect(stripCssTemplateComments(src)).toBe(src);
  });

  it('copies ${…} expressions through untouched, including braces and nested templates', () => {
    const src = 'css`/* a */ :host { color: ${x ? `${y}` : "}"}; } /* b */`';
    expect(stripCssTemplateComments(src)).toBe('css` :host { color: ${x ? `${y}` : "}"}; } `');
  });

  it('leaves a comment that contains ${ untouched — it is still an expression', () => {
    const src = 'css`/* uses ${token} */ :host{}`';
    expect(stripCssTemplateComments(src)).toBe(src);
  });

  it('leaves an unterminated comment untouched', () => {
    const src = 'css`/* never closed :host{}`';
    expect(stripCssTemplateComments(src)).toBe(src);
  });

  it('handles several templates in one file', () => {
    const src = 'css`/* a */x` + css`y/* b */` + css`z`';
    expect(stripCssTemplateComments(src)).toBe('css`x` + css`y` + css`z`');
  });

  it('is a no-op on source without css templates', () => {
    const src = 'export const n = 1; /* comment */';
    expect(stripCssTemplateComments(src)).toBe(src);
  });
});
