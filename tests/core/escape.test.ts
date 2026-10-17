import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../../src/core/escape.js';

describe('escapeHtml — the one rule, safe in text and in a quoted attribute', () => {
  const hostile = [
    '" onmouseover="alert(1)',
    "' onfocus='alert(1)",
    '<img src=x onerror=alert(1)>',
    '</script><script>alert(1)</script>',
    '&lt;already&gt; & &amp;',
    'javascript:alert(1)',
  ];

  it.each(hostile)('leaves no raw markup or quote characters in %j', (input) => {
    const out = escapeHtml(input);
    expect(out).not.toMatch(/[<>"']/);
  });

  it('escapes the ampersand first, so an entity in the input is shown as text, not decoded', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('a value placed in an attribute cannot end it or open another', () => {
    const host = document.createElement('div');
    host.innerHTML = `<a title="${escapeHtml('x" onmouseover="alert(1)')}">t</a>`;
    const a = host.querySelector('a')!;
    expect(a.getAttributeNames()).toEqual(['title']);
    expect(a.getAttribute('title')).toBe('x" onmouseover="alert(1)');
  });

  it('plain text passes through unchanged', () => {
    expect(escapeHtml('Plain 한글 text 123')).toBe('Plain 한글 text 123');
  });
});
