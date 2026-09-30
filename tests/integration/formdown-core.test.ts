// @vitest-environment node
/**
 * `u-widgets/forms` 를 **실제 `@formdown/core`** 에 대고 잰다.
 *
 * 어댑터 단위 시험은 손으로 쓴 픽스처(`{ name: 'submit' }`)를 썼는데, 실제 formdown 은 단축형
 * `@[submit "Save"]` 의 이름을 `submit_<무작위>` 로 만들고 버튼 종류를 `attributes.type` 에 싣는다
 * (0.4.0 ~ 0.10.0 동일 · 실측). 그래서 픽스처 시험은 초록인데 실제 폼의 저장 버튼은 `primary` 가 되지 않았고
 * 초기화 버튼은 `cancel` 로 매핑되지 않았다 — 모형이 실제 합성 경로를 건너뛴 자리였다.
 */
import { describe, it, expect } from 'vitest';
import { getFormdownParser } from '../../src/core/formdown.js';
import '../../src/forms.js'; // 실제 @formdown/core 파서를 등록한다

const parse = (s: string) => getFormdownParser()(s);

const SOURCE = `@name(Full name): [text required placeholder="Your name"]
@age: [number min=1 max=120]
@role: [select options="Admin,User"]
@[submit "Save"]
@[reset "Clear"]
@preview: [button "Preview"]`;

describe('u-widgets/forms + @formdown/core', () => {
  it('필드를 u-widgets 필드로 옮긴다', () => {
    const { fields } = parse(SOURCE);
    expect(fields.map((f) => [f.field, f.type])).toEqual([
      ['name', 'text'], ['age', 'number'], ['role', 'select'],
    ]);
    expect(fields[0]).toMatchObject({ label: 'Full name', required: true, placeholder: 'Your name' });
    expect(fields[1]).toMatchObject({ min: 1, max: 120 });
    expect(fields[2].options).toEqual(['Admin', 'User']);
  });

  it('단축형 submit·reset 은 이름이 무작위여도 종류로 매핑된다', () => {
    const { actions } = parse(SOURCE);
    expect(actions).toEqual([
      { action: 'submit', label: 'Save', style: 'primary' },
      { action: 'cancel', label: 'Clear', style: 'default' },
      { action: 'preview', label: 'Preview' },
    ]);
  });
});
