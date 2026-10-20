import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDateText } from '../../src/core/format.js';

// The table of date and time text another library reading the same sources keeps an identical copy of
// (`fixtures/source-times.json`), so the same text reads the same there and here. A time without an offset is local
// wall-clock time here, so its fields are compared with the table's UTC reading; one with an offset is that moment.
const { cases } = JSON.parse(readFileSync(resolve(process.cwd(), 'fixtures/source-times.json'), 'utf8')) as {
  cases: Array<{ text: string; utc: string | null }>;
};

const hasOffset = (text: string) => /(?:z|[+-]\d{2}(?::?\d{2})?)\s*$/i.test(text.trim()) && /[T ]\d{2}:\d{2}/i.test(text);

describe('parseDateText against the shared table', () => {
  it.each(cases)('reads "$text"', ({ text, utc }) => {
    const read = parseDateText(text);
    if (utc === null) return expect(read).toBeNull();
    const expected = new Date(utc);
    if (hasOffset(text)) return expect(read?.getTime()).toBe(expected.getTime());
    const wall = (d: Date) => [d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()];
    const utcWall = (d: Date) => [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()];
    expect(read && wall(read)).toEqual(utcWall(expected));
  });
});
