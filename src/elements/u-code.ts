import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { themeStyles } from '../styles/tokens.js';

// ── Mini Syntax Highlighter ──
// Lightweight, CSS-class-based token highlighting for 12 languages.
// No external dependencies. Targets ~2KB gzip.

/** Comment style: [lineComment, [blockOpen, blockClose]] */
const CM: Record<string, (string | [string, string] | undefined)[]> = {
  javascript: ['//', ['/*', '*/']],
  typescript: ['//', ['/*', '*/']],
  python: ['#'],
  java: ['//', ['/*', '*/']],
  csharp: ['//', ['/*', '*/']],
  go: ['//', ['/*', '*/']],
  rust: ['//', ['/*', '*/']],
  sql: ['--', ['/*', '*/']],
  bash: ['#'],
  css: [undefined, ['/*', '*/']],
  html: [undefined, ['<!--', '-->']],
};

/** Keyword sets per language. Space-separated, lazily parsed into Sets. */
const KW: Record<string, string> = {
  javascript: 'async await break case catch class const continue default delete do else export extends false finally for from function if import in instanceof let new null of return static super switch this throw true try typeof undefined var void while with yield',
  typescript: 'abstract any as async await boolean break case catch class const continue declare default delete do else enum export extends false finally for from function if implements import in instanceof interface is keyof let namespace never new null number of override private protected public readonly return static string super switch this throw true try type typeof undefined var void while with yield',
  python: 'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield',
  java: 'abstract boolean break byte case catch char class continue default do double else enum extends false final finally float for if implements import instanceof int interface long new null package private protected public return short static super switch this throw throws true try void volatile while',
  csharp: 'abstract as async await base bool break byte case catch char class const continue decimal default do double else enum false finally float for foreach if in int interface internal is lock long namespace new null object out override params private protected public readonly ref return sealed short static string struct switch this throw true try typeof var virtual void while yield',
  go: 'break case chan const continue default defer else fallthrough false for func go goto if import interface map nil package range return select struct switch true type var',
  rust: 'as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self static struct super trait true type unsafe use where while',
  sql: 'ALL ALTER AND AS ASC BETWEEN BY CASE CREATE DELETE DESC DISTINCT DROP ELSE END EXISTS FALSE FROM GROUP HAVING IF IN INDEX INSERT INTO IS JOIN LEFT LIKE LIMIT NOT NULL ON OR ORDER PRIMARY SELECT SET TABLE THEN TRUE UNION UPDATE VALUES WHERE',
  bash: 'break case do done elif else esac fi for function if in local read return select then until while',
};

/** Language aliases. */
const AL: Record<string, string> = {
  js: 'javascript', ts: 'typescript', py: 'python', cs: 'csharp',
  sh: 'bash', shell: 'bash', zsh: 'bash', jsx: 'javascript', tsx: 'typescript',
  cpp: 'java', c: 'java', xml: 'html', svg: 'html',
  scss: 'css', less: 'css', jsonc: 'json', psql: 'sql', mysql: 'sql',
};

/** Lazily-built keyword Sets. */
const _kwCache = new Map<string, Set<string>>();
function kwSet(lang: string): Set<string> {
  let s = _kwCache.get(lang);
  if (!s) {
    const str = KW[lang] || '';
    s = str ? new Set(str.split(' ')) : new Set();
    _kwCache.set(lang, s);
  }
  return s;
}

/** Escape HTML special characters. */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Wrap token text in a span, handling newlines by closing/reopening the span. */
function wrap(text: string, cls: string): string {
  const escaped = esc(text);
  if (!escaped.includes('\n')) return `<span class="hl-${cls}">${escaped}</span>`;
  return escaped.split('\n').map(line => `<span class="hl-${cls}">${line}</span>`).join('\n');
}

/** Find the end index of a string literal starting at `start`. */
function strEnd(code: string, start: number, quote: string): number {
  let i = start + 1;
  while (i < code.length) {
    if (code[i] === '\\') { i += 2; continue; }
    if (code[i] === quote) return i + 1;
    if (quote !== '`' && code[i] === '\n') return i;
    i++;
  }
  return code.length;
}

/**
 * Highlight code and return an HTML string with syntax-colored spans.
 * Token classes: hl-k (keyword), hl-s (string), hl-c (comment), hl-n (number).
 */
function highlight(code: string, lang: string): string {
  if (!lang) return esc(code);
  const resolved = AL[lang] || lang;

  // JSON has special handling
  if (resolved === 'json') return highlightJSON(code);

  const kw = kwSet(resolved);
  const cmRules = CM[resolved];
  const lineComment = cmRules?.[0] as string | undefined;
  const blockComment = cmRules?.[1] as [string, string] | undefined;
  const hasTemplateStrings = resolved === 'javascript' || resolved === 'typescript';

  let result = '';
  let i = 0;
  const len = code.length;

  while (i < len) {
    // Block comment
    if (blockComment && code.startsWith(blockComment[0], i)) {
      const end = code.indexOf(blockComment[1], i + blockComment[0].length);
      const slice = end === -1 ? code.slice(i) : code.slice(i, end + blockComment[1].length);
      result += wrap(slice, 'c');
      i += slice.length;
      continue;
    }

    // Line comment
    if (lineComment && code.startsWith(lineComment, i)) {
      const end = code.indexOf('\n', i);
      const slice = end === -1 ? code.slice(i) : code.slice(i, end);
      result += wrap(slice, 'c');
      i += slice.length;
      continue;
    }

    // Strings
    const ch = code[i];
    if (ch === '"' || ch === "'" || (ch === '`' && hasTemplateStrings)) {
      const end = strEnd(code, i, ch);
      result += wrap(code.slice(i, end), 's');
      i = end;
      continue;
    }

    // Numbers (not preceded by letter/underscore)
    if (/\d/.test(ch) && (i === 0 || !/[a-zA-Z_$]/.test(code[i - 1]))) {
      let j = i + 1;
      while (j < len && /[0-9a-fA-FxXoObBeE._]/.test(code[j])) j++;
      result += wrap(code.slice(i, j), 'n');
      i = j;
      continue;
    }

    // Identifiers / keywords
    if (/[a-zA-Z_$]/.test(ch)) {
      let j = i + 1;
      while (j < len && /[a-zA-Z0-9_$]/.test(code[j])) j++;
      const word = code.slice(i, j);
      result += kw.has(word) ? `<span class="hl-k">${esc(word)}</span>` : esc(word);
      i = j;
      continue;
    }

    // HTML tags (for html/xml/svg languages)
    if (resolved === 'html' && ch === '<' && i + 1 < len && /[a-zA-Z/!]/.test(code[i + 1])) {
      const end = code.indexOf('>', i);
      if (end !== -1) {
        result += `<span class="hl-k">${esc(code.slice(i, end + 1))}</span>`;
        i = end + 1;
        continue;
      }
    }

    // CSS property names
    if (resolved === 'css' && /[a-z-]/.test(ch)) {
      let j = i + 1;
      while (j < len && /[a-z-]/.test(code[j])) j++;
      const word = code.slice(i, j);
      // If followed by ':', it's a property name
      const afterWord = code.slice(j).trimStart();
      if (afterWord[0] === ':') {
        result += `<span class="hl-k">${esc(word)}</span>`;
      } else {
        result += esc(word);
      }
      i = j;
      continue;
    }

    // Default: output character
    result += esc(ch);
    i++;
  }

  return result;
}

/** Highlight JSON: keys (hl-k), string values (hl-s), numbers (hl-n), booleans/null (hl-k). */
function highlightJSON(code: string): string {
  let result = '';
  let i = 0;
  const len = code.length;

  while (i < len) {
    const ch = code[i];

    if (ch === '"') {
      const end = strEnd(code, i, '"');
      const slice = code.slice(i, end);
      // Key if followed by ':'
      const after = code.slice(end).trimStart();
      result += wrap(slice, after[0] === ':' ? 'k' : 's');
      i = end;
      continue;
    }

    if (/[\d-]/.test(ch) && (i === 0 || /[\s,:\[{]/.test(code[i - 1]))) {
      let j = i + 1;
      while (j < len && /[0-9.eE+\-]/.test(code[j])) j++;
      result += wrap(code.slice(i, j), 'n');
      i = j;
      continue;
    }

    let matched = false;
    for (const kw of ['true', 'false', 'null']) {
      if (code.startsWith(kw, i)) {
        result += `<span class="hl-k">${kw}</span>`;
        i += kw.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    result += esc(ch);
    i++;
  }

  return result;
}

// ── Component ──

/**
 * <u-code> — Syntax-highlighted code display widget.
 *
 * Supports 12 languages with a lightweight built-in highlighter.
 * Features: line numbers, highlighted lines, copy button, scroll containment.
 */
@customElement('u-code')
export class UCode extends LitElement {
  static styles = [themeStyles, css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      container: u-code / inline-size;
    }

    .code-block {
      border: 1px solid var(--u-widget-border, #e2e8f0);
      border-radius: 6px;
      overflow: hidden;
    }

    .code-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 12px;
      background: var(--u-widget-surface, #f1f5f9);
      border-bottom: 1px solid var(--u-widget-border, #e2e8f0);
    }

    .code-lang {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--u-widget-text-secondary, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .code-copy {
      padding: 2px 10px;
      border-radius: 4px;
      border: 1px solid var(--u-widget-border, #e2e8f0);
      background: var(--u-widget-bg, #fff);
      color: var(--u-widget-text-secondary, #64748b);
      cursor: pointer;
      font-size: 0.6875rem;
      font-family: inherit;
      transition: all 0.15s;
    }
    .code-copy:hover {
      background: var(--u-widget-bg, #fff);
      color: var(--u-widget-text, #1a1a2e);
    }
    .code-copy[data-copied] {
      color: var(--u-widget-positive, #16a34a);
      border-color: var(--u-widget-positive, #16a34a);
    }

    .code-body {
      overflow: auto;
      background: var(--u-widget-bg, #fff);
    }
    :host([theme="dark"]) .code-body { background: #1e1e2e; }

    pre {
      margin: 0;
      padding: 12px;
      font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Source Code Pro', Consolas, Monaco, monospace;
      font-size: 0.8125rem;
      line-height: 1.5;
      tab-size: 2;
      white-space: pre;
    }
    pre[data-wrap="true"] { white-space: pre-wrap; word-break: break-all; }

    .line { display: block; }

    .line-no {
      display: inline-block;
      width: 3ch;
      text-align: right;
      margin-right: 1.5ch;
      color: var(--u-widget-text-secondary, #94a3b8);
      user-select: none;
      opacity: 0.5;
    }

    .line-hl {
      background: rgba(79, 70, 229, 0.08);
      margin: 0 -12px;
      padding: 0 12px;
    }
    :host([theme="dark"]) .line-hl { background: rgba(79, 70, 229, 0.15); }

    /* Syntax token colors */
    .hl-k { color: #8b5cf6; }  /* keyword — purple */
    .hl-s { color: #059669; }  /* string — green */
    .hl-c { color: #94a3b8; font-style: italic; } /* comment — gray */
    .hl-n { color: #d97706; }  /* number — amber */

    :host([theme="dark"]) .hl-k { color: #a78bfa; }
    :host([theme="dark"]) .hl-s { color: #34d399; }
    :host([theme="dark"]) .hl-c { color: #64748b; }
    :host([theme="dark"]) .hl-n { color: #fbbf24; }

    @container u-code (max-width: 20rem) {
      pre { font-size: 0.75rem; padding: 8px; }
      .code-header { padding: 4px 8px; }
      .line-no { width: 2.5ch; margin-right: 1ch; }
    }
  `];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  @property({ type: String, reflect: true })
  theme: string | null = null;

  @state() private _copied = false;

  render() {
    if (!this.spec) return nothing;

    const data = this.spec.data as Record<string, unknown> | undefined;
    if (!data) return nothing;

    const content = String(data.content ?? '');
    if (!content) return nothing;

    const language = String(data.language ?? '').toLowerCase();
    const options = (this.spec.options ?? {}) as Record<string, unknown>;
    const lineNumbers = options.lineNumbers !== false;
    const wrapText = Boolean(options.wrap ?? false);
    const maxHeight = options.maxHeight ? String(options.maxHeight) : undefined;
    const highlightLines = new Set(
      Array.isArray(options.highlight) ? (options.highlight as number[]) : [],
    );

    // Highlight and split into lines
    const highlighted = highlight(content, language);
    const lines = highlighted.split('\n');

    const linesHtml = lines.map((line, i) => {
      const num = i + 1;
      const hl = highlightLines.has(num) ? ' line-hl' : '';
      const numHtml = lineNumbers ? `<span class="line-no">${num}</span>` : '';
      return `<span class="line${hl}">${numHtml}${line || ' '}</span>`;
    }).join('');

    const bodyStyle = maxHeight ? `max-height: ${maxHeight}` : '';

    return html`
      <div class="code-block" part="code">
        <div class="code-header" part="code-header">
          <span class="code-lang">${language || 'code'}</span>
          <button
            class="code-copy"
            part="code-copy"
            ?data-copied=${this._copied}
            @click=${this._copyCode}
          >${this._copied ? 'Copied!' : 'Copy'}</button>
        </div>
        <div class="code-body" part="code-body" style=${bodyStyle}>
          <pre data-wrap=${String(wrapText)}><code .innerHTML=${linesHtml}></code></pre>
        </div>
      </div>
    `;
  }

  private async _copyCode() {
    const data = this.spec?.data as Record<string, unknown> | undefined;
    const content = String(data?.content ?? '');
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // Clipboard API may not be available (e.g., non-HTTPS or test environment)
    }
    this._copied = true;
    setTimeout(() => { this._copied = false; }, 2000);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'u-code': UCode;
  }
}
