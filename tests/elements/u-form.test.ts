import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../../src/elements/u-form.js';
import type { UForm } from '../../src/elements/u-form.js';
import { registerLocale } from '../../src/core/locale.js';

function createElement(spec: Record<string, unknown>): UForm {
  const el = document.createElement('u-form') as UForm;
  el.spec = spec as UForm['spec'];
  document.body.appendChild(el);
  return el;
}

async function render(el: UForm) {
  await el.updateComplete;
  return el.shadowRoot!;
}

describe('u-form', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('form widget', () => {
    it('renders form container', async () => {
      const el = createElement({
        widget: 'form',
        fields: [{ field: 'name', label: 'Name', type: 'text' }],
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.form-container')).not.toBeNull();
    });

    it('renders text input field with label', async () => {
      const el = createElement({
        widget: 'form',
        fields: [{ field: 'name', label: 'Name', type: 'text' }],
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.field-label')?.textContent).toContain('Name');
      expect(shadow.querySelector('input[type="text"]')).not.toBeNull();
    });

    it('shows required indicator', async () => {
      const el = createElement({
        widget: 'form',
        fields: [{ field: 'name', label: 'Name', type: 'text', required: true }],
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.required')).not.toBeNull();
    });

    it('renders textarea', async () => {
      const el = createElement({
        widget: 'form',
        fields: [{ field: 'desc', type: 'textarea', rows: 5 }],
      });
      const shadow = await render(el);
      const textarea = shadow.querySelector('textarea');
      expect(textarea).not.toBeNull();
      expect(textarea?.getAttribute('rows')).toBe('5');
    });

    it('renders select with options', async () => {
      const el = createElement({
        widget: 'form',
        fields: [
          { field: 'priority', type: 'select', options: ['low', 'medium', 'high'] },
        ],
      });
      const shadow = await render(el);
      const select = shadow.querySelector('select');
      expect(select).not.toBeNull();
      const options = select!.querySelectorAll('option');
      // +1 for the "--" placeholder
      expect(options.length).toBe(4);
    });

    it('renders toggle with role="switch" and aria-checked', async () => {
      const el = createElement({
        widget: 'form',
        data: { active: true },
        fields: [{ field: 'active', label: 'Active', type: 'toggle' }],
      });
      const shadow = await render(el);
      const toggle = shadow.querySelector('.toggle-track');
      expect(toggle).not.toBeNull();
      expect(toggle?.getAttribute('role')).toBe('switch');
      expect(toggle?.getAttribute('aria-checked')).toBe('true');
      expect(toggle?.getAttribute('aria-label')).toBe('Active');
      expect(toggle?.getAttribute('tabindex')).toBe('0');
    });

    it('renders radio buttons', async () => {
      const el = createElement({
        widget: 'form',
        fields: [
          { field: 'size', type: 'radio', options: ['S', 'M', 'L'] },
        ],
      });
      const shadow = await render(el);
      const radios = shadow.querySelectorAll('input[type="radio"]');
      expect(radios.length).toBe(3);
    });

    it('renders checkbox group', async () => {
      const el = createElement({
        widget: 'form',
        fields: [
          { field: 'skills', type: 'checkbox', options: ['JS', 'TS', 'Rust'] },
        ],
      });
      const shadow = await render(el);
      const checkboxes = shadow.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBe(3);
    });

    it('pre-fills from data defaults', async () => {
      const el = createElement({
        widget: 'form',
        data: { name: 'Alice' },
        fields: [{ field: 'name', type: 'text' }],
      });
      const shadow = await render(el);
      const input = shadow.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('Alice');
    });

    it('renders action buttons', async () => {
      const el = createElement({
        widget: 'form',
        fields: [{ field: 'name', type: 'text' }],
        actions: [
          { label: 'Submit', action: 'submit', style: 'primary' },
          { label: 'Cancel', action: 'cancel' },
        ],
      });
      const shadow = await render(el);
      const buttons = shadow.querySelectorAll('button');
      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent).toContain('Submit');
      expect(buttons[0].getAttribute('data-style')).toBe('primary');
    });

    it('dispatches change event on input', async () => {
      const el = createElement({
        widget: 'form',
        fields: [{ field: 'name', type: 'text' }],
      });
      const shadow = await render(el);

      const listener = vi.fn();
      el.addEventListener('u-widget-internal', listener);

      const input = shadow.querySelector('input') as HTMLInputElement;
      input.value = 'Bob';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      expect(listener).toHaveBeenCalledOnce();
      const detail = listener.mock.calls[0][0].detail;
      expect(detail.type).toBe('change');
      expect(detail.data.field).toBe('name');
      expect(detail.data.value).toBe('Bob');
    });

    it('dispatches submit event with form data', async () => {
      const el = createElement({
        widget: 'form',
        data: { name: 'Alice' },
        fields: [{ field: 'name', type: 'text' }],
        actions: [{ label: 'Submit', action: 'submit' }],
      });
      const shadow = await render(el);

      const listener = vi.fn();
      el.addEventListener('u-widget-internal', listener);

      const btn = shadow.querySelector('button') as HTMLButtonElement;
      btn.click();

      expect(listener).toHaveBeenCalledOnce();
      const detail = listener.mock.calls[0][0].detail;
      expect(detail.type).toBe('submit');
      expect(detail.data.name).toBe('Alice');
    });
  });

  describe('validation', () => {
    it('prevents submit when required field is empty', async () => {
      const el = createElement({
        widget: 'form',
        fields: [
          { field: 'name', label: 'Name', type: 'text', required: true },
        ],
        actions: [{ label: 'Submit', action: 'submit' }],
      });
      const shadow = await render(el);

      const listener = vi.fn();
      el.addEventListener('u-widget-internal', listener);

      const btn = shadow.querySelector('button') as HTMLButtonElement;
      btn.click();
      await el.updateComplete;

      // submit event should NOT fire
      expect(listener).not.toHaveBeenCalled();
      // error message should be visible
      expect(shadow.querySelector('.field-error')?.textContent).toBe('Name is required');
    });

    it('shows invalid class on required empty field after submit attempt', async () => {
      const el = createElement({
        widget: 'form',
        fields: [
          { field: 'email', label: 'Email', type: 'email', required: true },
        ],
        actions: [{ label: 'Submit', action: 'submit' }],
      });
      const shadow = await render(el);

      const btn = shadow.querySelector('button') as HTMLButtonElement;
      btn.click();
      await el.updateComplete;

      const input = shadow.querySelector('input');
      expect(input?.classList.contains('invalid')).toBe(true);
    });

    it('allows submit when required field is filled', async () => {
      const el = createElement({
        widget: 'form',
        data: { name: 'Alice' },
        fields: [
          { field: 'name', label: 'Name', type: 'text', required: true },
        ],
        actions: [{ label: 'Submit', action: 'submit' }],
      });
      const shadow = await render(el);

      const listener = vi.fn();
      el.addEventListener('u-widget-internal', listener);

      const btn = shadow.querySelector('button') as HTMLButtonElement;
      btn.click();

      expect(listener).toHaveBeenCalledOnce();
      expect(listener.mock.calls[0][0].detail.type).toBe('submit');
    });

    it('clears error when user types into required field', async () => {
      const el = createElement({
        widget: 'form',
        fields: [
          { field: 'name', label: 'Name', type: 'text', required: true },
        ],
        actions: [{ label: 'Submit', action: 'submit' }],
      });
      const shadow = await render(el);

      // trigger validation error
      const btn = shadow.querySelector('button') as HTMLButtonElement;
      btn.click();
      await el.updateComplete;
      expect(shadow.querySelector('.field-error')).not.toBeNull();

      // type into field
      const input = shadow.querySelector('input') as HTMLInputElement;
      input.value = 'Bob';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;

      // error should be cleared
      expect(shadow.querySelector('.field-error')).toBeNull();
    });

    it('validates required checkbox (must have selections)', async () => {
      const el = createElement({
        widget: 'form',
        fields: [
          { field: 'skills', label: 'Skills', type: 'checkbox', options: ['JS', 'TS'], required: true },
        ],
        actions: [{ label: 'Submit', action: 'submit' }],
      });
      const shadow = await render(el);

      const listener = vi.fn();
      el.addEventListener('u-widget-internal', listener);

      const btn = shadow.querySelector('button') as HTMLButtonElement;
      btn.click();
      await el.updateComplete;

      expect(listener).not.toHaveBeenCalled();
      expect(shadow.querySelector('.field-error')?.textContent).toBe('Skills is required');
    });

    it('validates maxLength on text field', async () => {
      const el = createElement({
        widget: 'form',
        data: { name: 'VeryLongName' },
        fields: [
          { field: 'name', label: 'Name', type: 'text', maxLength: 5 },
        ],
        actions: [{ label: 'Submit', action: 'submit' }],
      });
      const shadow = await render(el);

      const listener = vi.fn();
      el.addEventListener('u-widget-internal', listener);

      const btn = shadow.querySelector('button') as HTMLButtonElement;
      btn.click();
      await el.updateComplete;

      expect(listener).not.toHaveBeenCalled();
      expect(shadow.querySelector('.field-error')?.textContent).toBe('Name must be at most 5 characters');
    });

    it('validates min on number field', async () => {
      const el = createElement({
        widget: 'form',
        data: { age: 5 },
        fields: [
          { field: 'age', label: 'Age', type: 'number', min: 18 },
        ],
        actions: [{ label: 'Submit', action: 'submit' }],
      });
      const shadow = await render(el);

      const listener = vi.fn();
      el.addEventListener('u-widget-internal', listener);

      const btn = shadow.querySelector('button') as HTMLButtonElement;
      btn.click();
      await el.updateComplete;

      expect(listener).not.toHaveBeenCalled();
      expect(shadow.querySelector('.field-error')?.textContent).toBe('Age must be at least 18');
    });

    it('validates max on number field', async () => {
      const el = createElement({
        widget: 'form',
        data: { quantity: 150 },
        fields: [
          { field: 'quantity', label: 'Quantity', type: 'number', max: 100 },
        ],
        actions: [{ label: 'Submit', action: 'submit' }],
      });
      const shadow = await render(el);

      const listener = vi.fn();
      el.addEventListener('u-widget-internal', listener);

      const btn = shadow.querySelector('button') as HTMLButtonElement;
      btn.click();
      await el.updateComplete;

      expect(listener).not.toHaveBeenCalled();
      expect(shadow.querySelector('.field-error')?.textContent).toBe('Quantity must be at most 100');
    });

    it('validates email format', async () => {
      const el = createElement({
        widget: 'form',
        data: { email: 'not-an-email' },
        fields: [
          { field: 'email', label: 'Email', type: 'email' },
        ],
        actions: [{ label: 'Submit', action: 'submit' }],
      });
      const shadow = await render(el);

      const listener = vi.fn();
      el.addEventListener('u-widget-internal', listener);

      const btn = shadow.querySelector('button') as HTMLButtonElement;
      btn.click();
      await el.updateComplete;

      expect(listener).not.toHaveBeenCalled();
      expect(shadow.querySelector('.field-error')?.textContent).toBe('Email must be a valid email address');
    });

    it('passes validation with valid email', async () => {
      const el = createElement({
        widget: 'form',
        data: { email: 'alice@example.com' },
        fields: [
          { field: 'email', label: 'Email', type: 'email' },
        ],
        actions: [{ label: 'Submit', action: 'submit' }],
      });
      const shadow = await render(el);

      const listener = vi.fn();
      el.addEventListener('u-widget-internal', listener);

      const btn = shadow.querySelector('button') as HTMLButtonElement;
      btn.click();

      expect(listener).toHaveBeenCalledOnce();
    });

    it('sets aria-invalid on input after validation failure', async () => {
      const el = createElement({
        widget: 'form',
        fields: [
          { field: 'name', label: 'Name', type: 'text', required: true },
        ],
        actions: [{ label: 'Submit', action: 'submit' }],
      });
      const shadow = await render(el);

      const btn = shadow.querySelector('button') as HTMLButtonElement;
      btn.click();
      await el.updateComplete;

      const input = shadow.querySelector('input');
      expect(input?.getAttribute('aria-invalid')).toBe('true');
    });

    it('sets aria-required on required fields', async () => {
      const el = createElement({
        widget: 'form',
        fields: [
          { field: 'name', label: 'Name', type: 'text', required: true },
        ],
      });
      const shadow = await render(el);
      const input = shadow.querySelector('input');
      expect(input?.hasAttribute('aria-required')).toBe(true);
    });

    it('error message has role="alert"', async () => {
      const el = createElement({
        widget: 'form',
        fields: [
          { field: 'name', label: 'Name', type: 'text', required: true },
        ],
        actions: [{ label: 'Submit', action: 'submit' }],
      });
      const shadow = await render(el);

      const btn = shadow.querySelector('button') as HTMLButtonElement;
      btn.click();
      await el.updateComplete;

      const error = shadow.querySelector('.field-error');
      expect(error?.getAttribute('role')).toBe('alert');
    });

    it('skips min/max/maxLength when field is empty and not required', async () => {
      const el = createElement({
        widget: 'form',
        fields: [
          { field: 'age', label: 'Age', type: 'number', min: 18 },
        ],
        actions: [{ label: 'Submit', action: 'submit' }],
      });
      const shadow = await render(el);

      const listener = vi.fn();
      el.addEventListener('u-widget-internal', listener);

      const btn = shadow.querySelector('button') as HTMLButtonElement;
      btn.click();

      // Empty optional field should pass
      expect(listener).toHaveBeenCalledOnce();
    });
  });

    it('coerces number input value from string to number', async () => {
      const el = createElement({
        widget: 'form',
        fields: [
          { field: 'age', label: 'Age', type: 'number', min: 18 },
        ],
        actions: [{ label: 'Submit', action: 'submit' }],
      });
      const shadow = await render(el);

      const listener = vi.fn();
      el.addEventListener('u-widget-internal', listener);

      // Simulate user typing "5" into the number input
      const input = shadow.querySelector('input[type="number"]') as HTMLInputElement;
      input.value = '5';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      // The change event should emit a number, not a string
      const changeEvent = listener.mock.calls[0][0].detail;
      expect(changeEvent.data.value).toBe(5);
      expect(typeof changeEvent.data.value).toBe('number');
    });

    it('validates min after user types into number input', async () => {
      const el = createElement({
        widget: 'form',
        fields: [
          { field: 'age', label: 'Age', type: 'number', min: 18 },
        ],
        actions: [{ label: 'Submit', action: 'submit' }],
      });
      const shadow = await render(el);

      // Simulate user typing "5" via the input handler
      const input = shadow.querySelector('input[type="number"]') as HTMLInputElement;
      input.value = '5';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;

      const submitListener = vi.fn();
      el.addEventListener('u-widget-internal', submitListener);

      // Now try to submit — min validation should catch the value
      const btn = shadow.querySelector('button') as HTMLButtonElement;
      btn.click();
      await el.updateComplete;

      // Should not have submitted
      const submitEvents = submitListener.mock.calls.filter((c) => c[0].detail.type === 'submit');
      expect(submitEvents.length).toBe(0);
      expect(shadow.querySelector('.field-error')?.textContent).toBe('Age must be at least 18');
    });

    it('links label to input via for/id', async () => {
      const el = createElement({
        widget: 'form',
        fields: [
          { field: 'name', label: 'Name', type: 'text' },
        ],
      });
      const shadow = await render(el);

      const label = shadow.querySelector('label.field-label') as HTMLLabelElement;
      const input = shadow.querySelector('input') as HTMLInputElement;
      expect(label.getAttribute('for')).toBe('input-name');
      expect(input.id).toBe('input-name');
    });

    it('links label to textarea via for/id', async () => {
      const el = createElement({
        widget: 'form',
        fields: [
          { field: 'desc', label: 'Description', type: 'textarea' },
        ],
      });
      const shadow = await render(el);

      const label = shadow.querySelector('label.field-label') as HTMLLabelElement;
      const textarea = shadow.querySelector('textarea') as HTMLTextAreaElement;
      expect(label.getAttribute('for')).toBe('input-desc');
      expect(textarea.id).toBe('input-desc');
    });

    it('renders datetime field as datetime-local input type', async () => {
      const el = createElement({
        widget: 'form',
        fields: [{ field: 'start', label: 'Start', type: 'datetime' }],
      });
      const shadow = await render(el);
      const input = shadow.querySelector('input') as HTMLInputElement;
      expect(input.type).toBe('datetime-local');
    });

    it('links label to select via for/id', async () => {
      const el = createElement({
        widget: 'form',
        fields: [
          { field: 'color', label: 'Color', type: 'select', options: ['red', 'blue'] },
        ],
      });
      const shadow = await render(el);

      const label = shadow.querySelector('label.field-label') as HTMLLabelElement;
      const select = shadow.querySelector('select') as HTMLSelectElement;
      expect(label.getAttribute('for')).toBe('input-color');
      expect(select.id).toBe('input-color');
    });

  describe('confirm widget', () => {
    it('renders confirm container', async () => {
      const el = createElement({
        widget: 'confirm',
        description: 'Delete this item?',
        actions: [
          { label: 'Delete', action: 'submit', style: 'danger' },
          { label: 'Cancel', action: 'cancel' },
        ],
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.confirm-container')).not.toBeNull();
    });

    it('renders description', async () => {
      const el = createElement({
        widget: 'confirm',
        description: 'Are you sure?',
        actions: [],
      });
      const shadow = await render(el);
      expect(shadow.querySelector('.confirm-description')?.textContent).toBe('Are you sure?');
    });

    it('renders danger-styled action', async () => {
      const el = createElement({
        widget: 'confirm',
        description: 'Delete?',
        actions: [{ label: 'Delete', action: 'submit', style: 'danger' }],
      });
      const shadow = await render(el);
      const btn = shadow.querySelector('button');
      expect(btn?.getAttribute('data-style')).toBe('danger');
    });

    it('dispatches cancel event', async () => {
      const el = createElement({
        widget: 'confirm',
        actions: [{ label: 'Cancel', action: 'cancel' }],
      });
      const shadow = await render(el);

      const listener = vi.fn();
      el.addEventListener('u-widget-internal', listener);

      const btn = shadow.querySelector('button') as HTMLButtonElement;
      btn.click();

      expect(listener).toHaveBeenCalledOnce();
      expect(listener.mock.calls[0][0].detail.action).toBe('cancel');
    });
  });

  describe('keyboard & accessibility', () => {
    it('renders form element (not div) for keyboard submit', async () => {
      const el = createElement({
        widget: 'form',
        fields: [{ field: 'name', type: 'text' }],
        actions: [{ label: 'Submit', action: 'submit' }],
      });
      const shadow = await render(el);
      const form = shadow.querySelector('form.form-container');
      expect(form).not.toBeNull();
    });

    it('submit button has type="submit"', async () => {
      const el = createElement({
        widget: 'form',
        fields: [{ field: 'name', type: 'text' }],
        actions: [
          { label: 'Submit', action: 'submit' },
          { label: 'Cancel', action: 'cancel' },
        ],
      });
      const shadow = await render(el);
      const buttons = shadow.querySelectorAll('button');
      expect(buttons[0].getAttribute('type')).toBe('submit');
      expect(buttons[1].getAttribute('type')).toBe('button');
    });

    it('form submit event triggers validation and submit action', async () => {
      const el = createElement({
        widget: 'form',
        data: { name: 'Alice' },
        fields: [{ field: 'name', type: 'text', required: true }],
        actions: [{ label: 'Submit', action: 'submit' }],
      });
      const shadow = await render(el);

      const listener = vi.fn();
      el.addEventListener('u-widget-internal', listener);

      const form = shadow.querySelector('form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      // Filter for submit events only (not change events)
      const submitEvents = listener.mock.calls.filter((c) => c[0].detail.type === 'submit');
      expect(submitEvents.length).toBe(1);
      expect(submitEvents[0][0].detail.data.name).toBe('Alice');
    });

    it('aria-describedby links input to error message', async () => {
      const el = createElement({
        widget: 'form',
        fields: [
          { field: 'name', label: 'Name', type: 'text', required: true },
        ],
        actions: [{ label: 'Submit', action: 'submit' }],
      });
      const shadow = await render(el);

      // Trigger validation
      const btn = shadow.querySelector('button[type="submit"]') as HTMLButtonElement;
      btn.click();
      await el.updateComplete;

      const input = shadow.querySelector('input');
      const errorId = input?.getAttribute('aria-describedby');
      expect(errorId).toBe('err-name');
      const errorEl = shadow.getElementById(errorId!);
      expect(errorEl?.textContent).toBe('Name is required');
    });

    it('aria-describedby not present when no error', async () => {
      const el = createElement({
        widget: 'form',
        data: { name: 'Alice' },
        fields: [{ field: 'name', label: 'Name', type: 'text' }],
      });
      const shadow = await render(el);
      const input = shadow.querySelector('input');
      expect(input?.hasAttribute('aria-describedby')).toBe(false);
    });

    it('Enter key submits form even without explicit submit action', async () => {
      const el = createElement({
        widget: 'form',
        data: { name: 'Alice' },
        fields: [{ field: 'name', type: 'text' }],
        // No actions defined
      });
      const shadow = await render(el);

      const listener = vi.fn();
      el.addEventListener('u-widget-internal', listener);

      const form = shadow.querySelector('form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      const submitEvents = listener.mock.calls.filter((c) => c[0].detail.type === 'submit');
      expect(submitEvents.length).toBe(1);
      expect(submitEvents[0][0].detail.data.name).toBe('Alice');
    });

    it('Escape key in confirm triggers cancel action', async () => {
      const el = createElement({
        widget: 'confirm',
        description: 'Delete this?',
        actions: [
          { label: 'Delete', action: 'submit', style: 'danger' },
          { label: 'Cancel', action: 'cancel' },
        ],
      });
      const shadow = await render(el);

      const listener = vi.fn();
      el.addEventListener('u-widget-internal', listener);

      const container = shadow.querySelector('.confirm-container') as HTMLElement;
      container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(listener).toHaveBeenCalledOnce();
      expect(listener.mock.calls[0][0].detail.action).toBe('cancel');
    });
  });

  describe('locale integration', () => {
    it('uses registered locale for validation messages', async () => {
      registerLocale('ko', { required: '{label}은(는) 필수입니다' });
      const el = createElement({
        widget: 'form',
        fields: [
          { field: 'name', label: '이름', type: 'text', required: true },
        ],
        actions: [{ label: '제출', action: 'submit' }],
        options: { locale: 'ko' },
      });
      const shadow = await render(el);

      const btn = shadow.querySelector('button') as HTMLButtonElement;
      btn.click();
      await el.updateComplete;

      expect(shadow.querySelector('.field-error')?.textContent).toBe('이름은(는) 필수입니다');
    });

    it('uses field.message override over locale', async () => {
      const el = createElement({
        widget: 'form',
        fields: [
          { field: 'pw', label: 'Password', type: 'text', required: true, message: '비밀번호를 입력하세요' },
        ],
        actions: [{ label: 'Submit', action: 'submit' }],
      });
      const shadow = await render(el);

      const btn = shadow.querySelector('button') as HTMLButtonElement;
      btn.click();
      await el.updateComplete;

      expect(shadow.querySelector('.field-error')?.textContent).toBe('비밀번호를 입력하세요');
    });

    it('field.message applies to all validation rules for that field', async () => {
      const el = createElement({
        widget: 'form',
        data: { age: 5 },
        fields: [
          { field: 'age', label: 'Age', type: 'number', min: 18, message: '18세 이상이어야 합니다' },
        ],
        actions: [{ label: 'Submit', action: 'submit' }],
      });
      const shadow = await render(el);

      const btn = shadow.querySelector('button') as HTMLButtonElement;
      btn.click();
      await el.updateComplete;

      expect(shadow.querySelector('.field-error')?.textContent).toBe('18세 이상이어야 합니다');
    });

    it('falls back to English when locale not registered', async () => {
      const el = createElement({
        widget: 'form',
        fields: [
          { field: 'name', label: 'Name', type: 'text', required: true },
        ],
        actions: [{ label: 'Submit', action: 'submit' }],
        options: { locale: 'xx-XX' },
      });
      const shadow = await render(el);

      const btn = shadow.querySelector('button') as HTMLButtonElement;
      btn.click();
      await el.updateComplete;

      expect(shadow.querySelector('.field-error')?.textContent).toBe('Name is required');
    });
  });
});
