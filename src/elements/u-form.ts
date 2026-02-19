import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { UWidgetSpec, UWidgetFieldDefinition, UWidgetAction, UWidgetEvent } from '../core/types.js';
import { getLocaleStrings, formatTemplate } from '../core/locale.js';
import { themeStyles } from '../styles/tokens.js';

@customElement('u-form')
export class UForm extends LitElement {
  static styles = [themeStyles, css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      container: u-form / inline-size;
    }

    .form-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .field-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--u-widget-text, #1a1a2e);
    }

    .field-label .required {
      color: var(--u-widget-negative, #dc2626);
      margin-left: 2px;
    }

    input,
    textarea,
    select {
      padding: 8px 12px;
      border: 1px solid var(--u-widget-border, #e2e8f0);
      border-radius: 6px;
      font-size: 0.875rem;
      font-family: inherit;
      color: var(--u-widget-text, #1a1a2e);
      background: var(--u-widget-bg, #fff);
      outline: none;
      transition: border-color 0.15s;
    }

    input:focus,
    textarea:focus,
    select:focus {
      border-color: var(--u-widget-primary, #4f46e5);
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    textarea {
      resize: vertical;
    }

    .toggle-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toggle-track {
      width: 44px;
      height: 24px;
      border-radius: 12px;
      background: var(--u-widget-border, #e2e8f0);
      cursor: pointer;
      position: relative;
      transition: background 0.2s;
    }

    .toggle-track[data-on='true'] {
      background: var(--u-widget-primary, #4f46e5);
    }

    .toggle-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: white;
      position: absolute;
      top: 2px;
      left: 2px;
      transition: transform 0.2s;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    .toggle-track[data-on='true'] .toggle-thumb {
      transform: translateX(20px);
    }

    .checkbox-group,
    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .multiselect-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
      border: 1px solid var(--u-widget-border, #e2e8f0);
      border-radius: 6px;
      padding: 8px;
      max-height: 180px;
      overflow-y: auto;
    }

    .checkbox-group label,
    .radio-group label,
    .multiselect-group label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      cursor: pointer;
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
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid var(--u-widget-border, #e2e8f0);
      background: var(--u-widget-bg, #fff);
      color: var(--u-widget-text, #1a1a2e);
      transition: all 0.15s;
    }

    button:hover {
      background: var(--u-widget-surface, #f1f5f9);
    }

    button[data-style='primary'] {
      background: var(--u-widget-primary, #4f46e5);
      color: white;
      border-color: transparent;
    }

    button[data-style='primary']:hover {
      opacity: 0.9;
    }

    button[data-style='danger'] {
      background: var(--u-widget-negative, #dc2626);
      color: white;
      border-color: transparent;
    }

    .field-error {
      font-size: 0.75rem;
      color: var(--u-widget-negative, #dc2626);
      margin-top: 2px;
    }

    input.invalid,
    textarea.invalid,
    select.invalid {
      border-color: var(--u-widget-negative, #dc2626);
    }

    input.invalid:focus,
    textarea.invalid:focus,
    select.invalid:focus {
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
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

    @container u-form (max-width: 20rem) {
      .form-container {
        gap: 12px;
      }

      .field-label {
        font-size: 0.75rem;
      }

      input, textarea, select {
        font-size: 0.8125rem;
        padding: 6px 8px;
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
        font-size: 0.8125rem;
      }
    }
  `];

  @property({ type: Object })
  spec: UWidgetSpec | null = null;

  @state()
  private _formData: Record<string, unknown> = {};

  @state()
  private _errors: Record<string, string> = {};

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('spec') && this.spec) {
      this._formData = { ...(this.spec.data as Record<string, unknown> ?? {}) };
      this._errors = {};
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
    const fields = this.spec!.fields ?? [];
    const actions = this.spec!.actions ?? [];

    return html`
      <form class="form-container" part="form" @submit=${this._onFormSubmit}>
        ${fields.map((f) => this.renderField(f))}
        ${actions.length > 0 ? this.renderActions(actions) : nothing}
      </form>
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

  private renderField(field: UWidgetFieldDefinition) {
    const value = this._formData[field.field];
    const type = field.type ?? 'text';
    const error = this._errors[field.field];
    const errorId = `err-${field.field}`;

    return html`
      <div class="field" part="field">
        ${field.label
          ? html`<label class="field-label" for=${`input-${field.field}`} part="label"
              >${field.label}${field.required ? html`<span class="required">*</span>` : nothing}</label
            >`
          : nothing}
        ${this.renderInput(field, type, value, error ? errorId : undefined)}
        ${error ? html`<div class="field-error" id=${errorId} role="alert" part="field-error">${error}</div>` : nothing}
      </div>
    `;
  }

  private renderInput(
    field: UWidgetFieldDefinition,
    type: string,
    value: unknown,
    errorId?: string,
  ) {
    const hasError = !!this._errors[field.field];

    switch (type) {
      case 'textarea':
        return html`<textarea
          id=${`input-${field.field}`}
          class=${hasError ? 'invalid' : ''}
          .value=${String(value ?? '')}
          placeholder=${field.placeholder ?? ''}
          rows=${field.rows ?? 3}
          ?required=${field.required}
          minlength=${field.minLength ?? ''}
          maxlength=${field.maxLength ?? ''}
          aria-invalid=${hasError ? 'true' : 'false'}
          aria-describedby=${errorId ?? nothing}
          ?aria-required=${field.required}
          @input=${(e: Event) => this._onChange(field.field, (e.target as HTMLTextAreaElement).value)}
          part="input"
        ></textarea>`;

      case 'select':
        return html`<select
          id=${`input-${field.field}`}
          class=${hasError ? 'invalid' : ''}
          .value=${String(value ?? '')}
          ?required=${field.required}
          aria-invalid=${hasError ? 'true' : 'false'}
          aria-describedby=${errorId ?? nothing}
          @change=${(e: Event) => this._onChange(field.field, (e.target as HTMLSelectElement).value)}
          part="input"
        >
          <option value="">--</option>
          ${(field.options ?? []).map(
            (opt) => html`<option value=${opt}>${opt}</option>`,
          )}
        </select>`;

      case 'multiselect':
        return html`<div class="multiselect-group" part="multiselect-group" role="group" aria-label=${field.label ?? field.field} aria-invalid=${hasError ? 'true' : 'false'} aria-describedby=${errorId ?? nothing}>
          ${(field.options ?? []).map(
            (opt) => html`
              <label>
                <input
                  type="checkbox"
                  value=${opt}
                  ?checked=${Array.isArray(value) && value.includes(opt)}
                  @change=${(e: Event) => {
                    const checked = (e.target as HTMLInputElement).checked;
                    const current = Array.isArray(value) ? [...value] : [];
                    this._onChange(
                      field.field,
                      checked ? [...current, opt] : current.filter((v) => v !== opt),
                    );
                  }}
                />
                ${opt}
              </label>
            `,
          )}
        </div>`;

      case 'toggle':
        return html`<div class="toggle-wrapper">
          <div
            class="toggle-track"
            data-on=${!!value}
            role="switch"
            aria-checked=${!!value}
            aria-label=${field.label ?? field.field}
            tabindex="0"
            @click=${() => this._onChange(field.field, !value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                this._onChange(field.field, !value);
              }
            }}
            part="toggle"
          >
            <div class="toggle-thumb"></div>
          </div>
        </div>`;

      case 'radio':
        return html`<div class="radio-group" part="radio-group" role="radiogroup" aria-label=${field.label ?? field.field} aria-invalid=${hasError ? 'true' : 'false'} aria-describedby=${errorId ?? nothing}>
          ${(field.options ?? []).map(
            (opt) => html`
              <label>
                <input
                  type="radio"
                  name=${field.field}
                  value=${opt}
                  ?checked=${value === opt}
                  @change=${() => this._onChange(field.field, opt)}
                />
                ${opt}
              </label>
            `,
          )}
        </div>`;

      case 'checkbox':
        return html`<div class="checkbox-group" part="checkbox-group" role="group" aria-label=${field.label ?? field.field} aria-invalid=${hasError ? 'true' : 'false'} aria-describedby=${errorId ?? nothing}>
          ${(field.options ?? []).map(
            (opt) => html`
              <label>
                <input
                  type="checkbox"
                  value=${opt}
                  ?checked=${Array.isArray(value) && value.includes(opt)}
                  @change=${(e: Event) => {
                    const checked = (e.target as HTMLInputElement).checked;
                    const current = Array.isArray(value) ? [...value] : [];
                    this._onChange(
                      field.field,
                      checked ? [...current, opt] : current.filter((v) => v !== opt),
                    );
                  }}
                />
                ${opt}
              </label>
            `,
          )}
        </div>`;

      default: {
        // Map deprecated 'datetime' to the valid HTML input type
        const htmlType = type === 'datetime' ? 'datetime-local' : type;
        return html`<input
          type=${htmlType}
          id=${`input-${field.field}`}
          class=${hasError ? 'invalid' : ''}
          .value=${String(value ?? '')}
          placeholder=${field.placeholder ?? ''}
          ?required=${field.required}
          aria-invalid=${hasError ? 'true' : 'false'}
          aria-describedby=${errorId ?? nothing}
          ?aria-required=${field.required}
          min=${field.min ?? ''}
          max=${field.max ?? ''}
          step=${field.step ?? ''}
          minlength=${field.minLength ?? ''}
          maxlength=${field.maxLength ?? ''}
          pattern=${field.pattern ?? ''}
          @input=${(e: Event) => {
            const raw = (e.target as HTMLInputElement).value;
            const coerced = (type === 'number' || type === 'range') && raw !== ''
              ? Number(raw) : raw;
            this._onChange(field.field, coerced);
          }}
          part="input"
        />`;}
    }
  }

  private renderActions(actions: UWidgetAction[]) {
    return html`
      <div class="actions" part="actions">
        ${actions.map(
          (a) => html`
            <button
              type=${a.action === 'submit' ? 'submit' : 'button'}
              data-style=${a.style ?? 'default'}
              ?disabled=${a.disabled}
              @click=${(e: Event) => {
                if (a.action === 'submit') e.preventDefault();
                this._onAction(a);
              }}
              part="action-btn"
            >
              ${a.label}
            </button>
          `,
        )}
      </div>
    `;
  }

  private _onFormSubmit = (e: Event) => {
    e.preventDefault();
    const submitAction = (this.spec?.actions ?? []).find((a) => a.action === 'submit');
    if (submitAction) {
      this._onAction(submitAction);
    } else if (this._validate()) {
      this._emitEvent({
        type: 'submit',
        widget: this.spec!.widget,
        id: this.spec!.id,
        data: { ...this._formData },
      });
    }
  };

  private _onConfirmKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      const cancelAction = (this.spec?.actions ?? []).find((a) => a.action === 'cancel');
      if (cancelAction) {
        this._onAction(cancelAction);
      }
    }
  };

  private _onChange(field: string, value: unknown) {
    this._formData = { ...this._formData, [field]: value };
    // Clear error for this field on change
    if (this._errors[field]) {
      const updated = { ...this._errors };
      delete updated[field];
      this._errors = updated;
    }
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

  private _validate(): boolean {
    const fields = this.spec?.fields ?? [];
    const errors: Record<string, string> = {};
    const locale = this._locale;

    for (const field of fields) {
      const value = this._formData[field.field];
      const label = field.label ?? field.field;

      // Required check
      if (field.required) {
        if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
          errors[field.field] = field.message ?? formatTemplate(locale.required, { label });
          continue; // Skip further checks if empty
        }
      }

      // Skip further checks if value is empty and not required
      if (value == null || value === '') continue;

      // maxLength check (text, textarea)
      if (field.maxLength != null && typeof value === 'string' && value.length > field.maxLength) {
        errors[field.field] = field.message ?? formatTemplate(locale.maxLength, { label, max: field.maxLength });
      }

      // min/max check (number, range)
      if (field.min != null && typeof value === 'number' && value < Number(field.min)) {
        errors[field.field] = field.message ?? formatTemplate(locale.minValue, { label, min: field.min });
      }
      if (field.max != null && typeof value === 'number' && value > Number(field.max)) {
        errors[field.field] = field.message ?? formatTemplate(locale.maxValue, { label, max: field.max });
      }

      // minLength check (text, textarea)
      if (field.minLength != null && typeof value === 'string' && value.length < field.minLength) {
        errors[field.field] = field.message ?? formatTemplate(locale.minLength, { label, min: field.minLength });
        continue;
      }

      // Email pattern check
      if (field.type === 'email' && typeof value === 'string') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors[field.field] = field.message ?? formatTemplate(locale.invalidEmail, { label });
          continue;
        }
      }

      // URL pattern check
      if (field.type === 'url' && typeof value === 'string') {
        if (!/^https?:\/\/.+/.test(value)) {
          errors[field.field] = field.message ?? formatTemplate(locale.invalidUrl, { label });
          continue;
        }
      }

      // Custom pattern check
      if (field.pattern && typeof value === 'string') {
        try {
          if (!new RegExp(field.pattern).test(value)) {
            errors[field.field] = field.message ?? formatTemplate(locale.invalidPattern, { label });
          }
        } catch {
          // Invalid regex pattern — skip validation
        }
      }
    }

    this._errors = errors;
    return Object.keys(errors).length === 0;
  }

  private _onAction(action: UWidgetAction) {
    if (action.action === 'submit') {
      if (!this._validate()) return;
      this._emitEvent({
        type: 'submit',
        widget: this.spec!.widget,
        id: this.spec!.id,
        data: { ...this._formData },
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
        data: { ...this._formData },
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
    'u-form': UForm;
  }
}
