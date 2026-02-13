import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../../src/elements/u-form.js';
import type { UForm } from '../../src/elements/u-form.js';

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
});
