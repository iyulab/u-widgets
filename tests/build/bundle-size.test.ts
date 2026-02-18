import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'fs';
import { resolve } from 'path';
import { gzipSync } from 'zlib';

const DIST = resolve(__dirname, '../../dist');

function gzipSize(filePath: string): number {
  const content = readFileSync(filePath);
  return gzipSync(content).length;
}

function rawSize(filePath: string): number {
  return statSync(filePath).size;
}

describe('bundle size budget', () => {
  it('core bundle (u-widgets.js) is under 5 KB gzip', () => {
    const size = gzipSize(resolve(DIST, 'u-widgets.js'));
    expect(size).toBeLessThan(5 * 1024); // 5 KB
  });

  it('charts bundle is under 5 KB gzip', () => {
    const size = gzipSize(resolve(DIST, 'u-widgets-charts.js'));
    expect(size).toBeLessThan(5 * 1024);
  });

  it('tools bundle is under 5 KB gzip', () => {
    const size = gzipSize(resolve(DIST, 'u-widgets-tools.js'));
    expect(size).toBeLessThan(5 * 1024);
  });

  it('forms bundle is under 2 KB gzip', () => {
    const size = gzipSize(resolve(DIST, 'u-widgets-forms.js'));
    expect(size).toBeLessThan(2 * 1024);
  });

  it('core raw size is under 15 KB', () => {
    const size = rawSize(resolve(DIST, 'u-widgets.js'));
    expect(size).toBeLessThan(15 * 1024);
  });

  it('shared chunks total is under 4 KB gzip', () => {
    const { readdirSync } = require('fs');
    const files = readdirSync(DIST) as string[];
    const chunks = files.filter(
      (f: string) => f.endsWith('.js') && !f.startsWith('u-widgets') && !f.endsWith('.map')
    );
    const totalGzip = chunks.reduce(
      (sum: number, f: string) => sum + gzipSize(resolve(DIST, f)),
      0
    );
    expect(totalGzip).toBeLessThan(4 * 1024); // shared chunks < 4 KB gzip
  });
});
