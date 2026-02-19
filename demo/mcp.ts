/**
 * MCP Tools interactive demo page.
 *
 * Allows testing each MCP-facing function:
 *   help, template, validate, suggestMapping, autoSpec, specSurface
 */

import '../src/elements/u-widget.js';
import '../src/elements/u-chart.js';

import { help, template } from '../src/core/catalog.js';
import { validate } from '../src/core/schema.js';
import { suggestMapping, autoSpec } from '../src/core/suggest-mapping.js';
import { specSurface } from '../src/core/spec-surface.js';

// ── Tool definitions ─────────────────────────────────────

interface ToolDef {
  name: string;
  desc: string;
  signature: string;
  placeholder: string;
  run: (input: string) => unknown;
  /** If true, try to render the output as a widget preview. */
  preview?: boolean;
}

const TOOLS: ToolDef[] = [
  {
    name: 'help',
    desc: 'Widget catalog — list all widgets or filter by type/category.',
    signature: 'help(): WidgetInfo[] | help(widget): WidgetDetail | WidgetInfo[]',
    placeholder: '// Leave empty for all widgets, or enter:\n// "chart" — chart category (WidgetInfo[])\n// "chart.bar" — specific widget (WidgetDetail)\n// "display" — display category\n// "input" — input category\n\nchart.bar',
    run: (input) => {
      const arg = input.trim();
      return help(arg || undefined);
    },
  },
  {
    name: 'template',
    desc: 'Generate a minimal, ready-to-use spec with sample data for any widget type.',
    signature: 'template(widget: string): UWidgetSpec | undefined',
    placeholder: '// Enter a widget type:\n// chart.bar, chart.line, chart.pie, metric,\n// gauge, table, list, form, confirm, compose, ...\n\nchart.bar',
    preview: true,
    run: (input) => {
      const arg = input.trim();
      if (!arg) return { error: 'Please enter a widget type (e.g. "chart.bar", "metric")' };
      return template(arg) ?? { error: `No template found for "${arg}"` };
    },
  },
  {
    name: 'validate',
    desc: 'Validate a widget spec and report errors/warnings.',
    signature: 'validate(spec: unknown): ValidationResult',
    placeholder: JSON.stringify(
      { widget: 'metric', data: { value: 42, unit: 'users' } },
      null, 2,
    ),
    preview: true,
    run: (input) => {
      try {
        const spec = JSON.parse(input);
        return validate(spec);
      } catch (e) {
        return { error: `JSON parse error: ${(e as Error).message}` };
      }
    },
  },
  {
    name: 'suggestMapping',
    desc: 'Analyze data shape and suggest widget types with mapping recommendations, ranked by confidence.',
    signature: 'suggestMapping(data, widget?: string): MappingSuggestion[]',
    placeholder: JSON.stringify(
      [
        { category: 'A', value: 30 },
        { category: 'B', value: 70 },
        { category: 'C', value: 45 },
      ],
      null, 2,
    ),
    run: (input) => {
      try {
        const data = JSON.parse(input);
        return suggestMapping(data);
      } catch (e) {
        return { error: `JSON parse error: ${(e as Error).message}` };
      }
    },
  },
  {
    name: 'autoSpec',
    desc: 'Generate a complete, ready-to-use spec from raw data (picks the best widget + mapping automatically).',
    signature: 'autoSpec(data): UWidgetSpec | undefined',
    placeholder: JSON.stringify(
      [
        { month: 'Jan', revenue: 4200, cost: 2800 },
        { month: 'Feb', revenue: 5100, cost: 3200 },
        { month: 'Mar', revenue: 4800, cost: 2900 },
      ],
      null, 2,
    ),
    preview: true,
    run: (input) => {
      try {
        const data = JSON.parse(input);
        return autoSpec(data) ?? { error: 'No suggestion could be generated for this data' };
      } catch (e) {
        return { error: `JSON parse error: ${(e as Error).message}` };
      }
    },
  },
  {
    name: 'specSurface',
    desc: 'Scan spec objects and extract the full property surface (data fields, mapping keys, options, etc.).',
    signature: 'specSurface(specs: object[], widget?: string): SpecSurface',
    placeholder: JSON.stringify(
      [
        {
          widget: 'chart.bar',
          data: [{ category: 'A', value: 30 }],
          mapping: { x: 'category', y: 'value' },
          options: { stack: true, horizontal: false },
        },
      ],
      null, 2,
    ),
    run: (input) => {
      try {
        const parsed = JSON.parse(input);
        const specs = Array.isArray(parsed) ? parsed : [parsed];
        const widget = specs[0]?.widget;
        return specSurface(specs, widget);
      } catch (e) {
        return { error: `JSON parse error: ${(e as Error).message}` };
      }
    },
  },
];

// ── DOM refs ─────────────────────────────────────────────

const sidebar = document.getElementById('sidebar')!;
const toolTitle = document.getElementById('tool-title')!;
const toolDesc = document.getElementById('tool-desc')!;
const toolSignature = document.getElementById('tool-signature')!;
const inputArea = document.getElementById('input-area') as HTMLTextAreaElement;
const outputArea = document.getElementById('output-area')!;
const runBtn = document.getElementById('run-btn')!;
const runTime = document.getElementById('run-time')!;
const previewPanel = document.getElementById('preview-panel')!;
const previewWidget = document.getElementById('preview-widget') as any;
const themeBtn = document.getElementById('theme-btn')!;

// ── State ────────────────────────────────────────────────

let activeTool: ToolDef = TOOLS[0];

// ── Sidebar build ────────────────────────────────────────

function buildSidebar() {
  sidebar.innerHTML = '';

  const groupLabel = document.createElement('div');
  groupLabel.className = 'sidebar-group';
  groupLabel.textContent = 'MCP Tools';
  sidebar.appendChild(groupLabel);

  for (const tool of TOOLS) {
    const btn = document.createElement('button');
    btn.className = 'sidebar-item';
    btn.dataset.tool = tool.name;

    const nameSpan = document.createElement('div');
    nameSpan.textContent = tool.name + '()';
    btn.appendChild(nameSpan);

    const descSpan = document.createElement('div');
    descSpan.className = 'item-desc';
    descSpan.textContent = tool.desc.split('—')[0].trim().slice(0, 50);
    btn.appendChild(descSpan);

    btn.addEventListener('click', () => selectTool(tool));
    sidebar.appendChild(btn);
  }
}

// ── Tool selection ───────────────────────────────────────

function selectTool(tool: ToolDef) {
  activeTool = tool;

  // Update sidebar active state
  sidebar.querySelectorAll('.sidebar-item').forEach((el) => {
    el.classList.toggle('active', (el as HTMLElement).dataset.tool === tool.name);
  });

  // Update header
  toolTitle.textContent = tool.name + '()';
  toolDesc.textContent = tool.desc;
  toolSignature.textContent = tool.signature;

  // Reset input/output
  inputArea.value = tool.placeholder;
  outputArea.textContent = '// Click "Run" to execute';
  runTime.textContent = '';

  // Hide preview
  previewPanel.style.display = 'none';
  previewWidget.spec = null;
}

// ── Execute ──────────────────────────────────────────────

function execute() {
  const input = inputArea.value.replace(/^\s*\/\/.*$/gm, '').trim();

  const t0 = performance.now();
  let result: unknown;
  try {
    result = activeTool.run(input);
  } catch (e) {
    result = { error: String(e) };
  }
  const elapsed = performance.now() - t0;

  // Show output
  const json = JSON.stringify(result, null, 2);
  outputArea.textContent = json;
  runTime.textContent = `${elapsed.toFixed(1)}ms`;

  // Preview: render as widget if the result looks like a spec
  if (activeTool.preview && result && typeof result === 'object' && !('error' in (result as any))) {
    let spec = result as any;

    // For validate(), render the original spec from input if valid
    if (activeTool.name === 'validate' && (result as any).valid) {
      try {
        spec = JSON.parse(input);
      } catch {
        spec = null;
      }
    }

    if (spec && spec.widget) {
      previewPanel.style.display = '';
      const isDark = document.body.classList.contains('dark');
      previewWidget.setAttribute('theme', isDark ? 'dark' : 'light');
      previewWidget.spec = spec;
    } else {
      previewPanel.style.display = 'none';
      previewWidget.spec = null;
    }
  } else {
    previewPanel.style.display = 'none';
    previewWidget.spec = null;
  }
}

// ── Theme toggle ─────────────────────────────────────────

themeBtn.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  themeBtn.textContent = isDark ? 'Light Mode' : 'Dark Mode';
  document.querySelectorAll('u-widget').forEach(el => {
    if (isDark) el.setAttribute('theme', 'dark');
    else el.removeAttribute('theme');
  });
});

// ── Events ───────────────────────────────────────────────

runBtn.addEventListener('click', execute);

inputArea.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    execute();
  }
});

// ── Init ─────────────────────────────────────────────────

buildSidebar();
selectTool(TOOLS[0]);
