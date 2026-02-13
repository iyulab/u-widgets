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
      options?: string[];
      attributes?: Record<string, string>;
    }>;
    getActions(): Array<{
      name: string;
      type: string;
      label?: string;
    }>;
  }
}
