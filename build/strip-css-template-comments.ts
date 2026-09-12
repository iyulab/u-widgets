/**
 * Strips block comments (`/* … *\/`) from inside `css\`…\`` tagged templates.
 *
 * Why this exists: esbuild minifies JavaScript, but the body of a tagged template is a string
 * literal, so a CSS comment written inside `css\`…\`` is shipped verbatim to every consumer. The
 * design notes that explain a style rule belong in the source, not in the bundle — they cost
 * gzip bytes against the size budget and leak internal context into a public artifact.
 *
 * Deliberately narrow: only `css\`` templates (not `html\``, whose whitespace is significant to
 * rendering), only block comments, and never a comment that contains `${` — inside a template
 * literal that is still an expression, not comment text, and rewriting it would change behavior.
 * Each removed comment is replaced by the newlines it contained, so line numbers in the source
 * map stay aligned.
 */
export function stripCssTemplateComments(source: string): string {
  let out = '';
  let cursor = 0;

  while (cursor < source.length) {
    const start = findCssTemplateStart(source, cursor);
    if (start === -1) {
      out += source.slice(cursor);
      break;
    }
    const bodyStart = start + 'css`'.length;
    out += source.slice(cursor, bodyStart);

    const { text, end } = stripTemplateBody(source, bodyStart);
    out += text;
    cursor = end;
  }

  return out;
}

/** Index of the next `css\`` whose `css` is a whole identifier (so `unsafeCSS\`` is not matched). */
function findCssTemplateStart(source: string, from: number): number {
  let i = source.indexOf('css`', from);
  while (i !== -1) {
    const before = i === 0 ? '' : source[i - 1];
    if (!/[\w$]/.test(before)) return i;
    i = source.indexOf('css`', i + 1);
  }
  return -1;
}

/**
 * Walks one template body starting just after the opening backtick. Returns the rewritten body
 * (including the closing backtick) and the index just past it. `${…}` expressions are copied
 * through untouched, including nested template literals inside them.
 */
function stripTemplateBody(source: string, from: number): { text: string; end: number } {
  let text = '';
  let i = from;

  while (i < source.length) {
    const ch = source[i];

    if (ch === '\\') {
      text += source.slice(i, i + 2);
      i += 2;
      continue;
    }

    if (ch === '`') {
      return { text: text + '`', end: i + 1 };
    }

    if (ch === '$' && source[i + 1] === '{') {
      const exprEnd = skipExpression(source, i + 2);
      text += source.slice(i, exprEnd);
      i = exprEnd;
      continue;
    }

    if (ch === '/' && source[i + 1] === '*') {
      const close = source.indexOf('*/', i + 2);
      const templateEnd = source.indexOf('`', i + 2);
      // A `*/` that lies beyond this template's closing backtick belongs to something else —
      // the comment is unterminated within the template. Leave it (and a comment holding an
      // expression) exactly as written rather than swallowing source past the template.
      const unterminated = close === -1 || (templateEnd !== -1 && templateEnd < close);
      if (unterminated) {
        text += source.slice(i, i + 2);
        i += 2;
        continue;
      }
      const commentEnd = close + 2;
      const comment = source.slice(i, commentEnd);
      text += comment.includes('${') ? comment : comment.replace(/[^\n]/g, '');
      i = commentEnd;
      continue;
    }

    text += ch;
    i++;
  }

  return { text, end: i };
}

/**
 * Given the index just after `${`, returns the index just after the matching `}`. Tracks brace
 * depth and skips string and template literals (recursing into nested templates so a `}` inside
 * them is not miscounted).
 */
function skipExpression(source: string, from: number): number {
  let depth = 1;
  let i = from;

  while (i < source.length) {
    const ch = source[i];

    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '\'' || ch === '"') {
      i = skipQuoted(source, i + 1, ch);
      continue;
    }
    if (ch === '`') {
      i = skipTemplate(source, i + 1);
      continue;
    }
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return i + 1;
    }
    i++;
  }
  return i;
}

function skipQuoted(source: string, from: number, quote: string): number {
  let i = from;
  while (i < source.length) {
    if (source[i] === '\\') {
      i += 2;
      continue;
    }
    if (source[i] === quote) return i + 1;
    i++;
  }
  return i;
}

/** Index just past the closing backtick of a nested template literal (its `${…}` handled too). */
function skipTemplate(source: string, from: number): number {
  let i = from;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '`') return i + 1;
    if (ch === '$' && source[i + 1] === '{') {
      i = skipExpression(source, i + 2);
      continue;
    }
    i++;
  }
  return i;
}
