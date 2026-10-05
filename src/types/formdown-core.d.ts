// Type stubs for @formdown/core (optional peer dependency)
// These provide compile-time types when @formdown/core is not installed.

declare module '@formdown/core/form-manager' {
  export class FormManager {
    parse(input: string): void;
    setDefaults(data: Record<string, unknown>): void;
    getInputFields(): Array<{
      name: string;
      type: string;
      label?: string;
      required?: boolean;
      placeholder?: string;
      /** 0.15+: `value=Label` 로 값과 보이는 글자를 가른다(라벨 없으면 값을 보인다) */
      options?: { value: string; label?: string }[];
      attributes?: Record<string, string>;
    }>;
    getActions(): Array<{
      name: string;
      type: string;
      label?: string;
      /** 단축형 버튼의 종류(`submit`·`reset`) — 이름은 `submit_<무작위>` 가 된다 */
      attributes?: Record<string, string>;
    }>;
  }
}
