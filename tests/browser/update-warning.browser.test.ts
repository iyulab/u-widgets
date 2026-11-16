/// <reference types="@vitest/browser-playwright" />
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../../src/index.js';
import '../../src/charts.js';

/**
 * **위젯 요소는 소비자의 개발 콘솔에 Lit «갱신 뒤 갱신» 경고를 남기지 않는다.**
 *
 * `updated()` 가 반응형 상태를 쓰면(시계 · 차트 갱신 · 부제 맞춤 · 대기 중 데이터) 갱신이 한 번 더 예약되고 Lit 개발 빌드는 요소 이름과 함께
 * 경고를 낸다. 일반 마운트와 스펙 바꾸기에서 실제로 나는지는 값이 바뀌는지에 달려 있어 소스만으로는 모른다. 브라우저 시험의
 * `console.warn` 은 러너 출력에 오지 않는다 — 스파이로 직접 단언한다. Lit 은 같은 글을 페이지당 한 번만 내므로 시험마다
 * `globalThis.litIssuedWarnings` 를 비운다.
 */
type Widget = HTMLElement & { spec: unknown; updateComplete: Promise<unknown> };

beforeEach(() => { (globalThis as unknown as { litIssuedWarnings?: Set<string> }).litIssuedWarnings?.clear(); });
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const litWarnings = (warn: { mock: { calls: unknown[][] } }) =>
  warn.mock.calls.map(([m]) => String(m)).filter((m) => m.includes('scheduled an update')).map((m) => m.slice(0, 60));

async function mountWidget(spec: unknown): Promise<Widget> {
  const w = document.createElement('u-widget') as Widget;
  w.style.cssText = 'display:block;width:640px;height:360px';
  w.spec = spec;
  document.body.appendChild(w);
  await w.updateComplete;
  await wait(250);
  return w;
}

describe('u-widgets — Lit 개발 모드 경고', () => {
  it('🔴시계가 있는 머리글 — 스펙을 붙인 뒤에 주는 경로도 경고가 없다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const el = document.createElement('uw-header') as Widget;
    document.body.appendChild(el); // 먼저 붙이고
    el.spec = { widget: 'header', data: { text: 'Ops', clock: true }, options: { locale: 'en-US' } }; // 스펙은 나중에
    await el.updateComplete;
    await wait(120);
    expect(litWarnings(warn)).toEqual([]);
  });

  it('🔴차트 — 그리기와 데이터 바꾸기에 경고가 없다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const w = await mountWidget({ widget: 'chart.line', data: [{ m: 'Jan', v: 3 }, { m: 'Feb', v: 1 }], mapping: { x: 'm', y: 'v' } });
    w.spec = { widget: 'chart.line', data: [{ m: 'Jan', v: 3 }, { m: 'Feb', v: 1 }, { m: 'Mar', v: 5 }], mapping: { x: 'm', y: 'v' } };
    await w.updateComplete;
    await wait(250);
    expect(litWarnings(warn)).toEqual([]);
  });

  it('🔴게이지 — 부제 맞춤이 경고를 내지 않는다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await mountWidget({ widget: 'gauge', data: { value: 73 }, options: { min: 0, max: 100, unit: '%', subtitle: 'Fill level of tank number three' } });
    expect(litWarnings(warn)).toEqual([]);
  });

  it('🔴폼 — 데이터와 필드로 그리는 일반 마운트에 경고가 없다', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await mountWidget({ widget: 'form', data: { name: 'x' }, fields: [{ field: 'name', label: 'Name' }] });
    expect(litWarnings(warn)).toEqual([]);
  });
});
