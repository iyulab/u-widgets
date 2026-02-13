// Side-effect imports: register <u-widget> and <u-chart> custom elements
import '../src/elements/u-widget.ts';
import '../src/elements/u-chart.ts';

// ── Demo Specs ──

const specs = {
  metric: {
    widget: 'metric',
    data: { value: 1284, unit: 'EA', label: 'Total Users', change: 12.5, trend: 'up' },
  },
  statGroup: {
    widget: 'stat-group',
    data: [
      { value: 42, label: 'Active', change: 5, trend: 'up' },
      { value: 18, label: 'Pending', change: -3, trend: 'down' },
      { value: 7, label: 'Errors', trend: 'flat' },
    ],
  },
  gauge: {
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
  progress: {
    widget: 'progress',
    data: { value: 680, max: 1000 },
    options: { label: '{value} / 1000 ({percent}%)' },
  },
  table: {
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
  list: {
    widget: 'list',
    data: [
      { name: 'Deploy to production', category: 'DevOps', status: 'Done' },
      { name: 'Fix login bug', category: 'Backend', status: 'In Progress' },
      { name: 'Update docs', category: 'Docs', status: 'Todo' },
    ],
    mapping: { primary: 'name', secondary: 'status', icon: 'category' },
  },
  chartBar: {
    widget: 'chart.bar',
    data: [
      { month: 'Jan', sales: 120, returns: 15 },
      { month: 'Feb', sales: 200, returns: 20 },
      { month: 'Mar', sales: 150, returns: 10 },
      { month: 'Apr', sales: 280, returns: 30 },
    ],
    mapping: { x: 'month', y: ['sales', 'returns'] },
  },
  chartHBar: {
    widget: 'chart.bar',
    data: [
      { lang: 'JavaScript', pct: 65 },
      { lang: 'Python', pct: 48 },
      { lang: 'TypeScript', pct: 35 },
      { lang: 'Rust', pct: 15 },
    ],
    options: { horizontal: true },
  },
  chartLine: {
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
  chartArea: {
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
  chartPie: {
    widget: 'chart.pie',
    data: [
      { browser: 'Chrome', share: 65 },
      { browser: 'Firefox', share: 15 },
      { browser: 'Safari', share: 12 },
      { browser: 'Edge', share: 8 },
    ],
  },
  chartDonut: {
    widget: 'chart.pie',
    data: [
      { category: 'Completed', count: 42 },
      { category: 'In Progress', count: 18 },
      { category: 'Blocked', count: 5 },
    ],
    options: { donut: true },
  },
  form: {
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
  confirm: {
    widget: 'confirm',
    title: 'Delete Project',
    description: 'Are you sure you want to delete this project? This action cannot be undone.',
    actions: [
      { label: 'Cancel', action: 'cancel' },
      { label: 'Delete', action: 'submit', style: 'danger' },
    ],
  },
  compose: {
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
        options: { min: 0, max: 100, unit: '%',
          thresholds: [{ to: 60, color: 'green' }, { to: 80, color: 'yellow' }, { to: 100, color: 'red' }],
        },
      },
    ],
  },
};

// ── Bind Widgets ──

type WidgetElement = HTMLElement & { spec: unknown };

const bind = (id: string, spec: unknown) => {
  const el = document.getElementById(id) as WidgetElement | null;
  if (el) el.spec = spec;
};

bind('demo-metric', specs.metric);
bind('demo-stat-group', specs.statGroup);
bind('demo-gauge', specs.gauge);
bind('demo-progress', specs.progress);
bind('demo-table', specs.table);
bind('demo-list', specs.list);
bind('demo-chart-bar', specs.chartBar);
bind('demo-chart-hbar', specs.chartHBar);
bind('demo-chart-line', specs.chartLine);
bind('demo-chart-area', specs.chartArea);
bind('demo-chart-pie', specs.chartPie);
bind('demo-chart-donut', specs.chartDonut);
bind('demo-form', specs.form);
bind('demo-confirm', specs.confirm);
bind('demo-compose', specs.compose);

// ── Theme Toggle ──

const btn = document.getElementById('theme-btn')!;
btn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  btn.textContent = document.body.classList.contains('dark') ? 'Light Mode' : 'Dark Mode';
});

// ── Playground ──

document.getElementById('render-btn')!.addEventListener('click', () => {
  try {
    const json = JSON.parse((document.getElementById('spec-input') as HTMLTextAreaElement).value);
    (document.getElementById('demo-custom') as WidgetElement).spec = json;
  } catch (e) {
    alert('Invalid JSON: ' + (e as Error).message);
  }
});

// ── Event Log ──

const log = document.getElementById('event-log')!;
document.addEventListener('u-widget-event', (e) => {
  const line = document.createElement('div');
  line.textContent = `[${new Date().toLocaleTimeString()}] ${JSON.stringify((e as CustomEvent).detail)}`;
  log.prepend(line);
});
