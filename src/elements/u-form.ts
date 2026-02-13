import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { UWidgetSpec, UWidgetFieldDefinition, UWidgetAction, UWidgetEvent } from '../core/types.js';

@customElement('u-form')
export class UForm extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
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

    .checkbox-group label,
    .radio-group label {
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
  `;

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
      <div class="form-container" part="form">
        ${fields.map((f) => this.renderField(f))}
        ${actions.length > 0 ? this.renderActions(actions) : nothing}
      </div>
    `;
  }

  private renderConfirm() {
    const desc = this.spec!.description;
    const actions = this.spec!.actions ?? [];

    return html`
      <div class="confirm-container" part="confirm">
        ${desc ? html`<div class="confirm-description" part="description">${desc}</div>` : nothing}
        ${actions.length > 0 ? this.renderActions(actions) : nothing}
      </div>
    `;
  }

  private renderField(field: UWidgetFieldDefinition) {
    const value = this._formData[field.field];
    const type = field.type ?? 'text';
    const error = this._errors[field.field];

    return html`
      <div class="field" part="field">
        ${field.label
          ? html`<label class="field-label" part="label"
              >${field.label}${field.required ? html`<span class="required">*</span>` : nothing}</label
            >`
          : nothing}
        ${this.renderInput(field, type, value)}
        ${error ? html`<div class="field-error" part="field-error">${error}</div>` : nothing}
      </div>
    `;
  }

  private renderInput(
    field: UWidgetFieldDefinition,
    type: string,
    value: unknown,
  ) {
    const hasError = !!this._errors[field.field];

    switch (type) {
      case 'textarea':
        return html`<textarea
          class=${hasError ? 'invalid' : ''}
          .value=${String(value ?? '')}
          placeholder=${field.placeholder ?? ''}
          rows=${field.rows ?? 3}
          ?required=${field.required}
          @input=${(e: Event) => this._onChange(field.field, (e.target as HTMLTextAreaElement).value)}
          part="input"
        ></textarea>`;

      case 'select':
        return html`<select
          class=${hasError ? 'invalid' : ''}
          .value=${String(value ?? '')}
          ?required=${field.required}
          @change=${(e: Event) => this._onChange(field.field, (e.target as HTMLSelectElement).value)}
          part="input"
        >
          <option value="">--</option>
          ${(field.options ?? []).map(
            (opt) => html`<option value=${opt} ?selected=${value === opt}>${opt}</option>`,
          )}
        </select>`;

      case 'multiselect':
        return html`<select
          multiple
          ?required=${field.required}
          @change=${(e: Event) => {
            const sel = e.target as HTMLSelectElement;
            const vals = Array.from(sel.selectedOptions).map((o) => o.value);
            this._onChange(field.field, vals);
          }}
          part="input"
        >
          ${(field.options ?? []).map(
            (opt) =>
              html`<option value=${opt} ?selected=${Array.isArray(value) && value.includes(opt)}>${opt}</option>`,
          )}
        </select>`;

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
        return html`<div class="radio-group" part="radio-group">
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
        return html`<div class="checkbox-group" part="checkbox-group">
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

      default:
        return html`<input
          type=${type}
          class=${hasError ? 'invalid' : ''}
          .value=${String(value ?? '')}
          placeholder=${field.placeholder ?? ''}
          ?required=${field.required}
          min=${field.min ?? ''}
          max=${field.max ?? ''}
          step=${field.step ?? ''}
          maxlength=${field.maxLength ?? ''}
          @input=${(e: Event) => this._onChange(field.field, (e.target as HTMLInputElement).value)}
          part="input"
        />`;
    }
  }

  private renderActions(actions: UWidgetAction[]) {
    return html`
      <div class="actions" part="actions">
        ${actions.map(
          (a) => html`
            <button
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

  private _validate(): boolean {
    const fields = this.spec?.fields ?? [];
    const errors: Record<string, string> = {};

    for (const field of fields) {
      if (field.required) {
        const value = this._formData[field.field];
        if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
          errors[field.field] = `${field.label ?? field.field} is required`;
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
