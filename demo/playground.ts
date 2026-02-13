// Side-effect imports: register <u-widget> and <u-chart> custom elements
import '../src/elements/u-widget.ts';
import '../src/elements/u-chart.ts';

// ── Widget Catalog ──

const catalog: Record<string, { label: string; group: string; spec: object }> = {
  metric: {
    label: 'Metric',
    group: 'Display',
    spec: {
      widget: 'metric',
      data: { value: 1284, unit: 'EA', label: 'Total Users', change: 12.5, trend: 'up' },
    },
  },
  'stat-group': {
    label: 'Stat Group',
    group: 'Display',
    spec: {
      widget: 'stat-group',
      data: [
        { value: 42, label: 'Active', change: 5, trend: 'up' },
        { value: 18, label: 'Pending', change: -3, trend: 'down' },
        { value: 7, label: 'Errors', trend: 'flat' },
      ],
    },
  },
  gauge: {
    label: 'Gauge',
    group: 'Display',
    spec: {
      widget: 'gauge',
      data: { value: 73 },
      options: {
        min: 0, max: 100, unit: '%',
        thresholds: [
          { to: 50, color: 'green' },
          { to: 80, color: 'yellow' },
          { to: 100, color: 'red' },
        ],
      },
    },
  },
  progress: {
    label: 'Progress',
    group: 'Display',
    spec: {
      widget: 'progress',
      data: { value: 680, max: 1000 },
      options: { label: '{value} / 1000 ({percent}%)' },
    },
  },
  table: {
    label: 'Table',
    group: 'Data',
    spec: {
      widget: 'table',
      data: [
        { name: 'Alice', role: 'Engineer', status: 'Active', salary: 95000 },
        { name: 'Bob', role: 'Designer', status: 'Away', salary: 82000 },
        { name: 'Carol', role: 'PM', status: 'Active', salary: 105000 },
      ],
      mapping: {
        columns: [
          { field: 'name', label: 'Name' },
          { field: 'role', label: 'Role' },
          { field: 'status', label: 'Status' },
          { field: 'salary', label: 'Salary', format: 'currency', align: 'right' },
        ],
      },
    },
  },
  list: {
    label: 'List',
    group: 'Data',
    spec: {
      widget: 'list',
      data: [
        { name: 'Deploy to production', category: 'DevOps', status: 'Done' },
        { name: 'Fix login bug', category: 'Backend', status: 'In Progress' },
        { name: 'Update docs', category: 'Docs', status: 'Todo' },
      ],
      mapping: { primary: 'name', secondary: 'status', icon: 'category' },
    },
  },
  'chart.bar': {
    label: 'Bar Chart',
    group: 'Charts',
    spec: {
      widget: 'chart.bar',
      data: [
        { month: 'Jan', sales: 120, returns: 15 },
        { month: 'Feb', sales: 200, returns: 20 },
        { month: 'Mar', sales: 150, returns: 10 },
        { month: 'Apr', sales: 280, returns: 30 },
      ],
      mapping: { x: 'month', y: ['sales', 'returns'] },
      options: {
        referenceLines: [
          { axis: 'y', value: 200, label: 'Target', color: '#dc2626', style: 'dashed' },
        ],
      },
    },
  },
  'chart.hbar': {
    label: 'Horizontal Bar',
    group: 'Charts',
    spec: {
      widget: 'chart.bar',
      data: [
        { lang: 'JavaScript', pct: 65 },
        { lang: 'Python', pct: 48 },
        { lang: 'TypeScript', pct: 35 },
        { lang: 'Rust', pct: 15 },
      ],
      options: { horizontal: true },
    },
  },
  'chart.line': {
    label: 'Line Chart',
    group: 'Charts',
    spec: {
      widget: 'chart.line',
      data: [
        { day: 'Mon', cpu: 45, mem: 62 },
        { day: 'Tue', cpu: 52, mem: 58 },
        { day: 'Wed', cpu: 68, mem: 71 },
        { day: 'Thu', cpu: 42, mem: 65 },
        { day: 'Fri', cpu: 55, mem: 60 },
      ],
      mapping: { x: 'day', y: ['cpu', 'mem'] },
      options: { smooth: true },
    },
  },
  'chart.area': {
    label: 'Area Chart',
    group: 'Charts',
    spec: {
      widget: 'chart.area',
      data: [
        { hour: '00:00', traffic: 120 },
        { hour: '06:00', traffic: 80 },
        { hour: '12:00', traffic: 350 },
        { hour: '18:00', traffic: 410 },
        { hour: '23:00', traffic: 180 },
      ],
      options: { smooth: true },
    },
  },
  'chart.pie': {
    label: 'Pie Chart',
    group: 'Charts',
    spec: {
      widget: 'chart.pie',
      data: [
        { browser: 'Chrome', share: 65 },
        { browser: 'Firefox', share: 15 },
        { browser: 'Safari', share: 12 },
        { browser: 'Edge', share: 8 },
      ],
    },
  },
  'chart.donut': {
    label: 'Donut Chart',
    group: 'Charts',
    spec: {
      widget: 'chart.pie',
      data: [
        { category: 'Completed', count: 42 },
        { category: 'In Progress', count: 18 },
        { category: 'Blocked', count: 5 },
      ],
      options: { donut: true },
    },
  },
  'chart.scatter': {
    label: 'Scatter',
    group: 'Charts',
    spec: {
      widget: 'chart.scatter',
      data: [
        { height: 170, weight: 65, group: 'A' }, { height: 175, weight: 72, group: 'A' },
        { height: 160, weight: 55, group: 'B' }, { height: 180, weight: 80, group: 'B' },
        { height: 165, weight: 60, group: 'A' }, { height: 185, weight: 90, group: 'B' },
      ],
      mapping: { x: 'height', y: 'weight', color: 'group' },
    },
  },
  'chart.line-step': {
    label: 'Step Line',
    group: 'Charts',
    spec: {
      widget: 'chart.line',
      data: [
        { hour: '00:00', requests: 120 },
        { hour: '04:00', requests: 80 },
        { hour: '08:00', requests: 250 },
        { hour: '12:00', requests: 380 },
        { hour: '16:00', requests: 310 },
        { hour: '20:00', requests: 220 },
      ],
      options: { step: 'end' },
    },
  },
  'chart.radar': {
    label: 'Radar',
    group: 'Charts',
    spec: {
      widget: 'chart.radar',
      data: [
        { skill: 'JS', alice: 90, bob: 70 },
        { skill: 'CSS', alice: 80, bob: 85 },
        { skill: 'Node', alice: 75, bob: 60 },
        { skill: 'React', alice: 95, bob: 65 },
        { skill: 'SQL', alice: 60, bob: 80 },
      ],
      mapping: { axis: 'skill', y: ['alice', 'bob'] },
    },
  },
  form: {
    label: 'Form',
    group: 'Input',
    spec: {
      widget: 'form',
      fields: [
        { field: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter your name' },
        { field: 'email', label: 'Email', type: 'text', placeholder: 'user@example.com' },
        { field: 'role', label: 'Role', type: 'select', options: ['Engineer', 'Designer', 'PM'] },
        { field: 'notify', label: 'Email notifications', type: 'toggle' },
      ],
      data: { name: '', email: '', role: '', notify: true },
      actions: [
        { label: 'Cancel', action: 'cancel' },
        { label: 'Save', action: 'submit', style: 'primary' },
      ],
    },
  },
  formdown: {
    label: 'Form (formdown)',
    group: 'Input',
    spec: {
      widget: 'form',
      formdown: [
        '@name*(Name): []',
        '@email*(Email): @[]',
        '@volume(Volume): R[min=0,max=100,step=5]',
        '@notify(Notifications): ^[]',
        '@tags{JS,TS,Rust,Go}(Skills): ms[]',
        '@[submit "Save"]',
        '@[cancel "Reset"]',
      ].join('\n'),
    },
  },
  confirm: {
    label: 'Confirm',
    group: 'Input',
    spec: {
      widget: 'confirm',
      title: 'Delete Project',
      description: 'Are you sure you want to delete this project? This action cannot be undone.',
      actions: [
        { label: 'Cancel', action: 'cancel' },
        { label: 'Delete', action: 'submit', style: 'danger' },
      ],
    },
  },
  compose: {
    label: 'Compose',
    group: 'Layout',
    spec: {
      widget: 'compose',
      title: 'System Overview',
      layout: 'grid',
      columns: 3,
      children: [
        {
          widget: 'metric',
          data: { value: 99.9, unit: '%', label: 'Uptime', change: 0.1, trend: 'up' },
        },
        {
          widget: 'metric',
          data: { value: 142, label: 'Requests/s', change: -5, trend: 'down' },
        },
        {
          widget: 'gauge',
          data: { value: 45 },
          options: {
            min: 0, max: 100, unit: '%',
            thresholds: [
              { to: 60, color: 'green' },
              { to: 80, color: 'yellow' },
              { to: 100, color: 'red' },
            ],
          },
        },
      ],
    },
  },
};

// ── DOM References ──

type WidgetElement = HTMLElement & { spec: unknown };

const sidebar = document.getElementById('sidebar')!;
const editor = document.getElementById('editor') as HTMLTextAreaElement;
const editorError = document.getElementById('editor-error')!;
const previewWidget = document.getElementById('preview-widget') as WidgetElement;
const eventLog = document.getElementById('event-log')!;
const themeBtn = document.getElementById('theme-btn')!;

// ── Build Sidebar ──

let activeKey = '';

function buildSidebar() {
  const groups: Record<string, string[]> = {};
  for (const [key, entry] of Object.entries(catalog)) {
    (groups[entry.group] ??= []).push(key);
  }

  sidebar.innerHTML = '';
  for (const [group, keys] of Object.entries(groups)) {
    const groupEl = document.createElement('div');
    groupEl.className = 'sidebar-group';
    groupEl.textContent = group;
    sidebar.appendChild(groupEl);

    for (const key of keys) {
      const btn = document.createElement('button');
      btn.className = 'sidebar-item';
      btn.textContent = catalog[key].label;
      btn.dataset.key = key;
      btn.addEventListener('click', () => selectWidget(key));
      sidebar.appendChild(btn);
    }
  }
}

function updateSidebarActive(key: string) {
  sidebar.querySelectorAll('.sidebar-item').forEach((el) => {
    (el as HTMLElement).classList.toggle('active', (el as HTMLElement).dataset.key === key);
  });
}

// ── Widget Selection ──

const previewPanel = document.getElementById('preview-panel')!;

function selectWidget(key: string) {
  activeKey = key;
  const entry = catalog[key];
  if (!entry) return;

  updateSidebarActive(key);
  const json = JSON.stringify(entry.spec, null, 2);
  editor.value = json;
  editorError.textContent = '';
  applySpec(entry.spec);
}

function applySpec(spec: Record<string, unknown>) {
  previewWidget.spec = spec;
  syncPreviewSize();

  // Scroll preview into view after render
  requestAnimationFrame(() => {
    previewPanel.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
}

// ── Dynamic Size Sync ──
// Watches preview panel size and updates widget CSS variables so
// charts, gauges, etc. fill the available space dynamically.

function syncPreviewSize() {
  const previewArea = previewPanel.querySelector('.preview-area') as HTMLElement;
  if (!previewArea) return;
  const innerH = previewArea.clientHeight;
  const innerW = previewArea.clientWidth;
  if (innerH <= 0) return;

  // Chart: fill the preview area height
  previewPanel.style.setProperty('--u-widget-chart-height', `${innerH}px`);

  // Gauge: SVG viewBox is 200x195, so rendered height = width * 0.975
  // Fit within both available height and width
  const gaugeFromH = (innerH - 8) / 0.975; // -8 for breathing room
  const gaugeFromW = innerW * 0.6; // don't stretch too wide
  const gaugeSize = Math.max(120, Math.min(gaugeFromH, gaugeFromW, 500));
  previewPanel.style.setProperty('--u-widget-gauge-size', `${gaugeSize}px`);

  // Trigger ECharts resize if chart is active
  requestAnimationFrame(() => {
    const chart = previewWidget.shadowRoot?.querySelector('u-chart') as HTMLElement & { resize?: () => void } | null;
    chart?.resize?.();
  });
}

const previewRO = new ResizeObserver(() => syncPreviewSize());
previewRO.observe(previewPanel);

// ── Real-time Editing (debounced) ──

let debounceTimer: ReturnType<typeof setTimeout>;

editor.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const text = editor.value.trim();
    if (!text) return;
    try {
      const parsed = JSON.parse(text);
      editorError.textContent = '';
      applySpec(parsed);
    } catch (e) {
      editorError.textContent = (e as Error).message;
    }
  }, 300);
});

// Tab key inserts spaces instead of changing focus
editor.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + 2;
    editor.dispatchEvent(new Event('input'));
  }
});

// ── Theme Toggle ──

themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  themeBtn.textContent = document.body.classList.contains('dark') ? 'Light Mode' : 'Dark Mode';
});

// ── Event Log ──

document.addEventListener('u-widget-event', (e) => {
  const line = document.createElement('div');
  line.textContent = `[${new Date().toLocaleTimeString()}] ${JSON.stringify((e as CustomEvent).detail)}`;
  eventLog.prepend(line);
});

// ── Init ──

buildSidebar();
selectWidget('metric');
