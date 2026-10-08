/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, afterEach } from 'vitest';
import { cdp } from 'vitest/browser';
import '../../src/index.js';

/**
 * **A page that declares no theme gets auto mode** — the widgets follow `prefers-color-scheme` on their
 * own (`:host` declares `color-scheme: light dark`, the dark tokens sit under
 * `@media (prefers-color-scheme: dark)`).
 *
 * The global theme sync used to read a missing `<html data-theme>` as "light" and write
 * `theme="light"` on every `<u-widget>` — which is exactly what the dark block's selector excludes,
 * so a dark-mode visitor saw light widgets (secondary text #5b6777 on a dark page: 3.26:1). Only a
 * real engine resolves that cascade, so it is pinned here.
 */

const settle = async () => {
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  await new Promise((r) => setTimeout(r, 40));
};

async function colorScheme(value: 'dark' | 'light') {
  await cdp().send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value }] });
}

async function statusWidget() {
  const el = document.createElement('u-widget') as HTMLElement & { spec: unknown };
  el.spec = { widget: 'status', data: { label: 'Pump A', level: 'neutral', value: 'running' } };
  document.body.appendChild(el);
  await settle();
  return el;
}

const token = (el: Element, name: string) => getComputedStyle(el).getPropertyValue(name).trim();

afterEach(async () => {
  document.body.replaceChildren();
  document.documentElement.removeAttribute('data-theme');
  await colorScheme('light');
});

describe('auto theme', () => {
  it('follows a dark preference when the page declares no theme', async () => {
    await colorScheme('dark');
    const el = await statusWidget();
    expect(el.hasAttribute('theme')).toBe(false);
    expect(token(el, '--u-widget-text-secondary')).toBe('#94a3b8');
  });

  it('follows a light preference the same way', async () => {
    const el = await statusWidget();
    expect(token(el, '--u-widget-text-secondary')).toBe('#5b6777');
  });

  it('still carries a declared theme over the preference', async () => {
    await colorScheme('dark');
    document.documentElement.setAttribute('data-theme', 'light');
    const el = await statusWidget();
    expect(el.getAttribute('theme')).toBe('light');
    expect(token(el, '--u-widget-text-secondary')).toBe('#5b6777');
  });
});
