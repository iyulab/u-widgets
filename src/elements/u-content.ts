import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { UWidgetSpec } from '../core/types.js';
import { themeStyles } from '../styles/tokens.js';

@customElement('u-content')
export class UContent extends LitElement {
  static styles = [themeStyles, css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      container: u-content / inline-size;
    }

    /* ── markdown ── */
    .markdown {
      font-size: 0.875rem;
      line-height: 1.6;
      color: var(--u-widget-text, #1a1a2e);
    }

    .markdown p {
      margin: 0.5em 0;
    }

    .markdown h1,
    .markdown h2,
    .markdown h3,
    .markdown h4 {
      margin: 0.75em 0 0.25em;
      font-weight: 600;
      color: var(--u-widget-text, #1a1a2e);
    }

    .markdown h1 { font-size: 1.5rem; }
    .markdown h2 { font-size: 1.25rem; }
    .markdown h3 { font-size: 1.1rem; }
    .markdown h4 { font-size: 1rem; }

    .markdown strong { font-weight: 600; }
    .markdown em { font-style: italic; }

    .markdown code {
      background: var(--u-widget-surface, #f1f5f9);
      padding: 0.15em 0.4em;
      border-radius: 3px;
      font-size: 0.8125rem;
      font-family: 'SF Mono', 'Fira Code', monospace;
    }

    .markdown pre {
      background: var(--u-widget-surface, #f1f5f9);
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 0.8125rem;
    }

    .markdown pre code {
      background: none;
      padding: 0;
    }

    .markdown ul,
    .markdown ol {
      padding-left: 1.5em;
      margin: 0.5em 0;
    }

    .markdown blockquote {
      border-left: 3px solid var(--u-widget-border, #e2e8f0);
      padding-left: 12px;
      margin: 0.5em 0;
      color: var(--u-widget-text-secondary, #64748b);
    }

    .markdown a {
      color: var(--u-widget-primary, #4f46e5);
      text-decoration: none;
    }

    .markdown a:hover {
      text-decoration: underline;
    }

    .markdown table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.5em 0;
      font-size: 0.8125rem;
    }

    .markdown th,
    .markdown td {
      border: 1px solid var(--u-widget-border, #e2e8f0);
      padding: 6px 10px;
    }

    .markdown th {
      background: var(--u-widget-surface, #f1f5f9);
      font-weight: 600;
      text-align: left;
    }

    .markdown hr {
      border: none;
      border-top: 1px solid var(--u-widget-border, #e2e8f0);
      margin: 1em 0;
    }

    /* ── image ── */
    .image-container {
      text-align: center;
    }

    .image-container img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
    }

    .image-caption {
      margin-top: 6px;
      font-size: 0.8125rem;
      color: var(--u-widget-text-secondary, #64748b);
    }

    /* ── callout ── */
    .callout {
      padding: 12px 16px;
      border-radius: 6px;
      border-left: 4px solid;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .callout-info {
      background: color-mix(in srgb, var(--u-widget-primary, #3b82f6) 12%, var(--u-widget-bg, #fff));
      border-left-color: var(--u-widget-primary, #3b82f6);
      color: var(--u-widget-text, #1a1a2e);
    }

    .callout-warning {
      background: color-mix(in srgb, var(--u-widget-warning, #f59e0b) 12%, var(--u-widget-bg, #fff));
      border-left-color: var(--u-widget-warning, #f59e0b);
      color: var(--u-widget-text, #1a1a2e);
    }

    .callout-error {
      background: color-mix(in srgb, var(--u-widget-negative, #ef4444) 12%, var(--u-widget-bg, #fff));
      border-left-color: var(--u-widget-negative, #ef4444);
      color: var(--u-widget-text, #1a1a2e);
    }

    .callout-success {
      background: color-mix(in srgb, var(--u-widget-positive, #22c55e) 12%, var(--u-widget-bg, #fff));
      border-left-color: var(--u-widget-positive, #22c55e);
      color: var(--u-widget-text, #1a1a2e);
    }

    .callout-title {
      font-weight: 600;
      margin-bottom: 4px;
    }

    @container u-content (max-width: 20rem) {
      .markdown {
        font-size: 0.8125rem;
      }

      .markdown h1 { font-size: 1.25rem; }
      .markdown h2 { font-size: 1.1rem; }
      .markdown h3 { font-size: 1rem; }

      .callout {
        padding: 8px 12px;
        font-size: 0.8125rem;
      }

      .image-caption {
        font-size: 0.75rem;
      }
    }
  `];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  render() {
    if (!this.spec) return nothing;

    switch (this.spec.widget) {
      case 'markdown':
        return this.renderMarkdown();
      case 'image':
        return this.renderImage();
      case 'callout':
        return this.renderCallout();
      default:
        return nothing;
    }
  }

  private renderMarkdown() {
    const data = this.spec!.data;
    const content = typeof data === 'string'
      ? data
      : (data as Record<string, unknown>)?.content as string ?? '';

    if (!content) return nothing;

    return html`<div class="markdown" part="markdown"
      .innerHTML=${this.parseMarkdown(content)}
    ></div>`;
  }

  private renderImage() {
    const data = this.spec!.data as Record<string, unknown>;
    if (!data) return nothing;

    const rawSrc = String(data.src ?? '');
    const alt = String(data.alt ?? '');
    const caption = data.caption as string | undefined;
    const src = this.sanitizeUrl(rawSrc);

    if (!src) return nothing;

    return html`<div class="image-container" part="image">
      <img src=${src} alt=${alt} loading="lazy" />
      ${caption ? html`<div class="image-caption" part="caption">${caption}</div>` : nothing}
    </div>`;
  }

  private renderCallout() {
    const data = this.spec!.data as Record<string, unknown>;
    if (!data) return nothing;

    const message = String(data.message ?? '');
    const level = String(data.level ?? 'info');
    const title = data.title as string | undefined;
    const validLevels = ['info', 'warning', 'error', 'success'];
    const cls = validLevels.includes(level) ? level : 'info';

    const isUrgent = cls === 'warning' || cls === 'error';
    return html`<div class="callout callout-${cls}" part="callout" role=${isUrgent ? 'alert' : 'note'} aria-live=${isUrgent ? 'assertive' : 'polite'}>
      ${title ? html`<div class="callout-title" part="callout-title">${title}</div>` : nothing}
      <div part="callout-message">${message}</div>
    </div>`;
  }

  /**
   * Minimal markdown parser — handles the most common patterns.
   * Intentionally lightweight; does NOT pull in a full markdown library.
   */
  private parseMarkdown(text: string): string {
    let result = this.escapeHtml(text);

    // Headers (must be at start of line)
    result = result.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    result = result.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    result = result.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    result = result.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Horizontal rule
    result = result.replace(/^---$/gm, '<hr>');

    // Code blocks (``` ... ```)
    result = result.replace(/```[\s\S]*?```/g, (match) => {
      const inner = match.slice(3, -3).replace(/^\w*\n/, ''); // Remove language hint
      return `<pre><code>${inner}</code></pre>`;
    });

    // Tables (must be before inline formatting)
    result = result.replace(
      /^(\|.+\|)\n(\|[\s:|-]+\|)\n((?:\|.+\|\n?)+)/gm,
      (_match, headerLine: string, sepLine: string, bodyBlock: string) => {
        const parseCells = (line: string) =>
          line.split('|').slice(1, -1).map(c => c.trim());
        const headers = parseCells(headerLine);
        const aligns = parseCells(sepLine).map(s => {
          if (s.startsWith(':') && s.endsWith(':')) return 'center';
          if (s.endsWith(':')) return 'right';
          return 'left';
        });
        const rows = bodyBlock.trim().split('\n').map(parseCells);

        const ths = headers.map((h, i) =>
          `<th scope="col" style="text-align:${aligns[i] ?? 'left'}">${h}</th>`).join('');
        const trs = rows.map(row =>
          '<tr>' + row.map((c, i) =>
            `<td style="text-align:${aligns[i] ?? 'left'}">${c}</td>`).join('') + '</tr>').join('');

        return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
      },
    );

    // Inline code
    result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold and italic
    result = result.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Links (sanitize href to block javascript:/data:/vbscript: XSS)
    result = result.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_match, text: string, href: string) => {
        const safe = this.sanitizeUrl(href);
        return `<a href="${safe}" target="_blank" rel="noopener">${text}</a>`;
      },
    );

    // Blockquotes
    result = result.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

    // Ordered lists
    result = result.replace(/^\d+\. (.+)$/gm, '<li data-ol>$1</li>');
    result = result.replace(/(<li data-ol>.*<\/li>\n?)+/g, (m) =>
      `<ol>${m.replace(/ data-ol/g, '')}</ol>`);

    // Unordered lists
    result = result.replace(/^- (.+)$/gm, '<li>$1</li>');
    result = result.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Paragraphs (double newlines)
    result = result.replace(/\n\n+/g, '</p><p>');
    if (!result.startsWith('<h') && !result.startsWith('<ul') && !result.startsWith('<ol') && !result.startsWith('<pre') && !result.startsWith('<blockquote') && !result.startsWith('<hr')) {
      result = `<p>${result}</p>`;
    }

    // Single newlines → <br> (protect content inside <pre> blocks)
    result = result.replace(/<pre>[\s\S]*?<\/pre>/g, (m) =>
      m.replace(/\n/g, '\x00NL\x00'));
    result = result.replace(/\n/g, '<br>');
    result = result.replace(/\x00NL\x00/g, '\n');

    return result;
  }

  private sanitizeUrl(url: string): string {
    // Strip all whitespace + zero-width/invisible Unicode characters
    const stripped = url.replace(/[\s\u200B\u200C\u200D\uFEFF\u00AD\u200E\u200F]/g, '');
    if (/^(javascript|data|vbscript):/i.test(stripped)) return '';
    return url;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'u-content': UContent;
  }
}
