import { describe, it, expect, vi } from 'vitest';
import { TONES, TONE_GLYPHS, isTone, normalizeTone, normalizeEmphasis, toneLabel, toneStyles } from '../../src/core/tone.js';
import { getLocaleStrings } from '../../src/core/locale.js';
import { ko } from '../../src/locales/ko.js';
import { themeStyles } from '../../src/styles/tokens.js';

describe('tones', () => {
  it('are the eleven, each with a mark, a rule and a colour token in light and both dark blocks', () => {
    expect(TONES).toEqual(['ok', 'info', 'watch', 'warn', 'alarm', 'off', 'idle', 'accent', 'past', 'now', 'next']);
    const tokens = themeStyles.cssText;
    for (const tone of TONES) {
      expect(TONE_GLYPHS[tone]).toBeTruthy();
      expect(toneStyles.cssText).toContain(`[data-tone='${tone}'] { --tone: var(--u-widget-tone-${tone}); }`);
      expect(tokens).toContain(`--u-widget-tone-${tone}:`);
    }
    // The tones with a colour of their own change with the theme; the others follow a semantic token that does.
    for (const own of ['info', 'watch', 'off', 'idle']) expect(tokens.split(`--u-widget-tone-${own}:`)).toHaveLength(4);
  });

  it('give info a colour of its own, not the accent', () => {
    expect(themeStyles.cssText).not.toMatch(/--u-widget-tone-info:\s*var\(--u-widget-primary\)/);
  });

  it('are named in English and in Korean', () => {
    expect(TONES.map(t => toneLabel(t, getLocaleStrings()))).toEqual(['OK', 'Info', 'Watch', 'Warning', 'Alarm', 'Off', 'Idle', 'Highlight', 'Done', 'Now', 'Next']);
    expect(toneLabel('alarm', ko)).toBe('경보');
    expect(toneLabel('now', ko)).toBe('진행 중');
  });

  it('read a word that is not a tone as no tone, warning once per widget and word', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(normalizeTone('ok', 't1')).toBe('ok');
    expect(normalizeTone(undefined, 't1')).toBeUndefined();
    expect(normalizeTone('success', 't1')).toBeUndefined();
    expect(normalizeTone('success', 't1')).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(isTone('danger')).toBe(false);
    expect(normalizeEmphasis('stamp', 't1')).toBe('stamp');
    expect(normalizeEmphasis('glow', 't1')).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});
