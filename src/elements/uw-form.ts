import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import type { FormdownUI } from '@formdown/ui';
import type { ValidationMessages, typedData } from '@formdown/core';
import type { UWidgetSpec, UWidgetFieldDefinition, UWidgetAction, UWidgetEvent } from '../core/types.js';
import { getLocaleStrings, type UWidgetLocaleStrings } from '../core/locale.js';
import { themeStyles } from '../styles/tokens.js';
import { toFormdown } from '../core/formdown.js';

/** formdown's part of the form — `<formdown-ui>` and the core it reads with — loaded when the first form is drawn, so
 *  a page that shows no form does not carry it (it is most of what the form widget weighs). */
let formdown: { typedData: typeof typedData } | undefined;
let loadingFormdown: Promise<void> | undefined;

function loadFormdown(): Promise<void> {
  loadingFormdown ??= Promise.all([import('@formdown/ui'), import('@formdown/core')]).then(([, core]) => {
    formdown = { typedData: core.typedData };
  });
  return loadingFormdown;
}

/** The parts of the drawn fields, passed through `<formdown-ui>` so a page styles them as `uw-form::part(…)`. */
const FIELD_PARTS = [
  'field', 'label', 'input', 'field-error', 'radio-group', 'checkbox-group', 'description',
  'option-label', 'suggestion', 'decline', 'field-note',
].join(', ');

/** The widget's locale sentences, by formdown's rule names. */
function messagesOf(locale: UWidgetLocaleStrings): Partial<ValidationMessages> {
  return {
    required: locale.required,
    minLength: locale.minLength,
    maxLength: locale.maxLength,
    min: locale.minValue,
    max: locale.maxValue,
    number: locale.invalidNumber,
    email: locale.invalidEmail,
    url: locale.invalidUrl,
    tel: locale.invalidTel,
    date: locale.invalidDate,
    dateMin: locale.dateMin,
    dateMax: locale.dateMax,
    pattern: locale.invalidPattern,
  };
}

/**
 * The form and confirm widgets. A form's fields are drawn, checked and offered suggestions by `<formdown-ui>`
 * (`@formdown/ui`) from the spec's `fields`, written as formdown; the widget draws the actions and says what
 * happened in its own events.
 */
@customElement('uw-form')
export class UwForm extends LitElement {
  static styles = [themeStyles, css`

    /* 세로 flex 인 이유: 아래 form-container 가 flex item 이어야 호스트 제약이 그것에 닿는다. */
    :host {
      display: flex;
      flex-direction: column;
      font-family: var(--u-widget-font-family);
      container: uw-form / inline-size;
    }

    .form-container {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      gap: 8px;
    }

    /* 필드는 <formdown-ui> 가 그린다. 그 모양은 그것의 사용자 정의 속성으로 — 위젯 토큰에서 — 정해, 테마가 다른 위젯에
       닿듯 필드에도 닿는다. 스크롤은 위의 form-container 한 곳이다. */
    formdown-ui {
      flex: 0 0 auto;
      overflow: visible;
      background: transparent;
      --formdown-font-family: inherit;
      --formdown-text-primary: var(--u-widget-text, #1a1a2e);
      --formdown-text-secondary: var(--u-widget-text-secondary, #64748b);
      --formdown-note-color: var(--u-widget-text-secondary, #64748b);
      --formdown-ghost-color: var(--u-widget-text-secondary, #64748b);
      --formdown-border-color: var(--u-widget-border, #e2e8f0);
      --formdown-bg-primary: var(--u-widget-bg, #fff);
      --formdown-bg-secondary: var(--u-widget-surface, #f1f5f9);
      --formdown-accent-color: var(--u-widget-primary, #4f46e5);
      --formdown-switch-on-color: var(--u-widget-primary, #4f46e5);
      --formdown-switch-off-color: var(--u-widget-border, #e2e8f0);
      --formdown-input-focus-ring-color: color-mix(in srgb, var(--u-widget-primary, #4f46e5) 10%, transparent);
      --formdown-error-color: var(--u-widget-negative, #dc2626);
      --formdown-suggestion-bg: color-mix(in srgb, var(--u-widget-primary, #4f46e5) 8%, var(--u-widget-bg, #fff));
      --formdown-suggestion-border-color: color-mix(in srgb, var(--u-widget-primary, #4f46e5) 30%, transparent);
      --formdown-font-size-base: var(--u-widget-font-size, 0.875rem);
      --formdown-font-size-sm: var(--u-widget-font-size-label, 0.8125rem);
      --formdown-font-weight-medium: 600;
      --formdown-input-padding-y: 8px;
      --formdown-input-padding-x: 12px;
      --formdown-input-border-radius: 6px;
      --formdown-label-margin: 4px;
      --formdown-field-gap: 16px;
      --formdown-spacing-md: 16px;
    }

    .actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      padding-top: 8px;
    }

    button {
      padding: 8px 20px;
      border-radius: 6px;
      font-size: var(--u-widget-font-size, 0.875rem);
      font-weight: 500;
      cursor: pointer;
      border: 1px solid var(--u-widget-border, #e2e8f0);
      background: var(--u-widget-bg, #fff);
      color: var(--u-widget-text, #1a1a2e);
      transition: all var(--u-widget-duration-fast, 150ms);
    }

    button:hover {
      background: var(--u-widget-surface, #f1f5f9);
    }

    button[data-style='primary'] {
      background: var(--u-widget-primary, #4f46e5);
      color: var(--u-widget-on-primary, #fff);
      border-color: transparent;
    }

    button[data-style='primary']:hover {
      opacity: 0.9;
    }

    button[data-style='danger'] {
      background: var(--u-widget-negative, #dc2626);
      color: var(--u-widget-on-negative, #fff);
      border-color: transparent;
    }

    /* ── confirm ── */
    .confirm-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .confirm-description {
      font-size: 0.9375rem;
      color: var(--u-widget-text, #1a1a2e);
      line-height: 1.5;
    }

    @container uw-form (max-width: 20rem) {
      formdown-ui {
        --formdown-field-gap: 12px;
        --formdown-spacing-md: 12px;
        --formdown-font-size-sm: var(--u-widget-font-size-caption, 0.75rem);
        --formdown-font-size-base: var(--u-widget-font-size-label, 0.8125rem);
        --formdown-input-padding-y: 6px;
        --formdown-input-padding-x: 8px;
      }

      .actions {
        flex-direction: column;
      }

      .actions button {
        width: 100%;
        text-align: center;
      }

      button {
        padding: 8px 14px;
        font-size: var(--u-widget-font-size-label, 0.8125rem);
      }
    }
  `];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  @property({ type: String, reflect: true })
  theme: string | null = null;

  @query('formdown-ui')
  private _fieldsElement!: FormdownUI | null;

  /** The fields, once `<formdown-ui>` is loaded — before, the element is not yet one. */
  private get _fields(): FormdownUI | null {
    return formdown ? this._fieldsElement : null;
  }

  /** The formdown text the fields are drawn from — written again only when the spec's `fields` change. */
  private _content = '';

  /** Values to put in the fields at the next render — the spec's `data` when it is new. */
  private _pendingData: Record<string, unknown> | null = null;

  willUpdate(changed: Map<string, unknown>) {
    if (this.spec?.widget === 'form' && !formdown) {
      // Drawn again once loaded: the fields take their content and `data` then.
      void loadFormdown().then(() => this.requestUpdate());
    }
    if (changed.has('spec') && this.spec) {
      const prev = changed.get('spec') as UWidgetSpec | null | undefined;
      // `u-widget` builds a new spec object on every render (locale propagation, inferred mapping) — only new
      // `data` or `fields` from the caller is a new form. Resetting on any new object threw away what the user had
      // typed whenever the host re-rendered (a theme or locale switch).
      if (!prev || prev.fields !== this.spec.fields) {
        this._content = toFormdown(this.spec.fields ?? []);
      }
      if (!prev || prev.data !== this.spec.data || prev.fields !== this.spec.fields) {
        this._pendingData = { ...((this.spec.data as Record<string, unknown>) ?? {}) };
      }
    }
  }

  updated() {
    // After the content: `<formdown-ui>` draws the new fields, then fills them from `data`.
    if (this._pendingData && this._fields) {
      this._fields.data = this._pendingData;
      this._pendingData = null;
    }
  }

  render() {
    if (!this.spec) return nothing;

    if (this.spec.widget === 'confirm') {
      return this.renderConfirm();
    }

    return this.renderForm();
  }

  private renderForm() {
    const actions = this.spec!.actions ?? [];

    return html`
      <div class="form-container" part="form">
        <formdown-ui
          exportparts=${FIELD_PARTS}
          body-html="escape"
          .content=${this._content}
          .fieldStates=${this.spec!.fieldStates ?? {}}
          .messages=${messagesOf(this._locale)}
          @formdown-change=${this._onFieldChange}
          @formdown-data-update=${this._stop}
          @form-submit=${this._stop}
          @validation-error=${this._stop}
          @formdown-suggestion-pick=${this._onPick}
          @formdown-suggestion-decline=${this._onDecline}
        ></formdown-ui>
        ${actions.length > 0 ? this.renderActions(actions) : nothing}
      </div>
    `;
  }

  private renderConfirm() {
    const desc = this.spec!.description;
    const actions = this.spec!.actions ?? [];

    return html`
      <div class="confirm-container" part="confirm" @keydown=${this._onConfirmKeydown}>
        ${desc ? html`<div class="confirm-description" part="description">${desc}</div>` : nothing}
        ${actions.length > 0 ? this.renderActions(actions) : nothing}
      </div>
    `;
  }

  private renderActions(actions: UWidgetAction[]) {
    return html`
      <div class="actions" part="actions">
        ${actions.map(
          (a) => html`
            <button
              type="button"
              data-style=${a.style ?? 'default'}
              ?disabled=${a.disabled}
              @click=${() => this._onAction(a)}
              part="action-btn"
            >
              ${a.label}
            </button>
          `,
        )}
      </div>
    `;
  }

  /** `<formdown-ui>`'s own events stay inside the widget — the widget says what happened in its own events. */
  private _stop = (e: Event) => e.stopPropagation();

  private _field(name: string): UWidgetFieldDefinition | undefined {
    return this.spec?.fields?.find((f) => f.field === name);
  }

  /** The form's values as the widget sends them: the spec's `data`, then the fields — numbers as numbers. */
  private _values(): Record<string, unknown> {
    const fields = this._fields;
    const schema = fields?.getSchema();
    const typed = fields && schema && formdown ? formdown.typedData(fields.getFormData(), schema) : {};
    for (const [name, value] of Object.entries(typed)) typed[name] = this._native(name, value);
    return { ...((this.spec?.data as Record<string, unknown>) ?? {}), ...typed };
  }

  /** One field's value as the widget sends it — the same reading as `_values`. */
  private _typed(name: string, value: unknown): unknown {
    const schema = this._fields?.getSchema();
    return this._native(name, schema && formdown ? formdown.typedData({ [name]: value }, schema)[name] : value);
  }

  /** A datetime in the native `datetime-local` shape, `YYYY-MM-DDTHH:mm` in local time, whichever control gave it — a
   *  picker of its own (`u-widgets/components`) reports the time with seconds and its offset. */
  private _native(name: string, value: unknown): unknown {
    if (this._field(name)?.type !== 'datetime' || typeof value !== 'string') return value;
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) ? value.slice(0, 16) : value;
  }

  private _onFieldChange = (e: CustomEvent<{ fieldName: string; value: unknown }>) => {
    e.stopPropagation();
    const { fieldName, value } = e.detail;
    this._emitChange(fieldName, this._typed(fieldName, value));
  };

  /** A suggestion read as the field's value: one more choice for a group of several, a boolean for a switch. */
  private _suggestedValue(field: UWidgetFieldDefinition | undefined, s: string, current: unknown): unknown {
    const type = field?.type ?? 'text';
    if (type === 'toggle') return s === 'true';
    if (type === 'multiselect' || (type === 'checkbox' && (field?.options?.length ?? 0) > 0)) {
      const held = Array.isArray(current) ? current : [];
      return held.includes(s) ? held : [...held, s];
    }
    return s;
  }

  private _onPick = (e: CustomEvent<{ field: string; value: string }>) => {
    e.stopPropagation();
    const fields = this._fields;
    if (!fields) return;
    const { field: name, value: s } = e.detail;
    // `<formdown-ui>` leaves the field as it was — taking the value is the host's call, and the widget takes it.
    const value = this._suggestedValue(this._field(name), s, fields.getFormData()[name]);
    fields.updateField(name, value);
    const typed = this._typed(name, value);
    this._emitEvent({
      type: 'suggestion-pick',
      widget: this.spec!.widget,
      id: this.spec!.id,
      // The value picked — for a group of several, the one choice added, not the whole selection.
      data: { field: name, value: Array.isArray(value) ? s : typed },
    });
    this._emitChange(name, typed);
  };

  private _onDecline = (e: CustomEvent<{ field: string }>) => {
    e.stopPropagation();
    this._emitEvent({
      type: 'suggestion-decline',
      widget: this.spec!.widget,
      id: this.spec!.id,
      data: { field: e.detail.field },
    });
  };

  private _onConfirmKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      const cancelAction = (this.spec?.actions ?? []).find((a) => a.action === 'cancel');
      if (cancelAction) {
        this._onAction(cancelAction);
      }
    }
  };

  private _emitChange(field: string, value: unknown) {
    this._emitEvent({
      type: 'change',
      widget: this.spec!.widget,
      id: this.spec!.id,
      data: { field, value },
    });
  }

  private get _locale() {
    const locale = this.spec?.options?.locale;
    return getLocaleStrings(typeof locale === 'string' ? locale : undefined);
  }

  /** Checks the fields; on a failure the fields say why, and the first field that failed takes focus. */
  private _validate(): boolean {
    const fields = this._fields;
    if (!fields) return true;
    const { isValid, errors } = fields.validate();
    if (!isValid && errors[0]) fields.focusField(errors[0].field);
    return isValid;
  }

  private async _onAction(action: UWidgetAction) {
    if (this.spec?.widget === 'form' && action.action !== 'cancel' && !formdown) {
      // Pressed before the fields have loaded: check and read them once they have, not the bare spec.
      await loadFormdown();
      await this.updateComplete;
      await this._fieldsElement?.updateComplete;
      // Taken off the page while they loaded: there is no form left to act on.
      if (!this.isConnected) return;
    }
    if (action.action === 'submit') {
      if (!this._validate()) return;
      this._emitEvent({
        type: 'submit',
        widget: this.spec!.widget,
        id: this.spec!.id,
        data: this._values(),
      });
    } else if (action.action === 'cancel') {
      this._emitEvent({
        type: 'action',
        widget: this.spec!.widget,
        id: this.spec!.id,
        action: 'cancel',
      });
    } else {
      this._emitEvent({
        type: 'action',
        widget: this.spec!.widget,
        id: this.spec!.id,
        action: action.action,
        data: this._values(),
      });
    }
  }

  private _emitEvent(detail: UWidgetEvent) {
    this.dispatchEvent(
      new CustomEvent('u-widget-internal', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uw-form': UwForm;
  }
}
