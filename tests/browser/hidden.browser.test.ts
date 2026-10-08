// `hidden` hides every widget element. Each one sets its own host display, which outranks the browser's
// `[hidden] { display: none }` — before the shared theme sheet carried `:host([hidden])`, a hidden widget kept drawing.
import { describe, it, expect, afterEach } from 'vitest';
import '../../src/elements/u-widget.js';
import '../../src/elements/uw-chart.js';
import '../../src/elements/uw-citation.js';
import '../../src/elements/uw-code.js';
import '../../src/elements/uw-compose.js';
import '../../src/elements/uw-content.js';
import '../../src/elements/uw-form.js';
import '../../src/elements/uw-gallery.js';
import '../../src/elements/uw-gauge.js';
import '../../src/elements/uw-kv.js';
import '../../src/elements/uw-math.js';
import '../../src/elements/uw-metric.js';
import '../../src/elements/uw-rating.js';
import '../../src/elements/uw-status.js';
import '../../src/elements/uw-steps.js';
import '../../src/elements/uw-table.js';
import '../../src/elements/uw-video.js';

const TAGS = [
  'u-widget', 'uw-chart', 'uw-citation', 'uw-code', 'uw-compose', 'uw-content', 'uw-form', 'uw-gallery', 'uw-gauge',
  'uw-kv', 'uw-math', 'uw-metric', 'uw-rating', 'uw-status', 'uw-steps', 'uw-table', 'uw-video',
];

afterEach(() => { document.body.replaceChildren(); });

describe('widget elements honour hidden', () => {
  for (const tag of TAGS) {
    it(`a hidden <${tag}> is display: none`, async () => {
      const el = document.createElement(tag) as HTMLElement & { updateComplete?: Promise<unknown> };
      document.body.append(el);
      await el.updateComplete;
      expect(getComputedStyle(el).display).not.toBe('none');
      el.hidden = true;
      expect(getComputedStyle(el).display).toBe('none');
    });
  }
});
