import '../src/elements/u-widget.ts';
import '../src/elements/u-chart.ts';

type WidgetElement = HTMLElement & { spec: unknown };

const bind = (id: string, spec: unknown) => {
  const el = document.getElementById(id) as WidgetElement | null;
  if (el) el.spec = spec;
};

// ── Scenario 1: Sales Report ──

bind('w-metric-revenue', {
  widget: 'metric',
  data: { value: 284700, unit: '$', label: 'Total Revenue', change: 12.5, trend: 'up' },
});

bind('w-chart-sales', {
  widget: 'chart.bar',
  data: [
    { month: 'Jan', revenue: 68000, costs: 42000 },
    { month: 'Feb', revenue: 72000, costs: 39000 },
    { month: 'Mar', revenue: 91000, costs: 45000 },
    { month: 'Apr', revenue: 53700, costs: 38000 },
  ],
  mapping: { x: 'month', y: ['revenue', 'costs'] },
});

// ── Scenario 2: Account Info ──

bind('w-kv-account', {
  widget: 'kv',
  data: {
    Name: 'Alice Johnson',
    Plan: 'Pro',
    Status: 'Active',
    Region: 'US-East',
    Expires: '2026-12-31',
    'API Key': 'sk-****-7f3a',
  },
});

// ── Scenario 3: Project Progress ──

bind('w-steps-project', {
  widget: 'steps',
  data: [
    { label: 'Planning Complete', status: 'done', description: 'Requirements & wireframes finalized' },
    { label: 'Design', status: 'done', description: 'Figma mockups approved' },
    { label: 'Frontend Development', status: 'active', description: 'Building components (70%)' },
    { label: 'API Integration', status: 'pending' },
    { label: 'QA & Deployment', status: 'pending' },
  ],
});

bind('w-progress-dev', {
  widget: 'progress',
  data: { value: 70, max: 100 },
  options: { label: 'Frontend progress {percent}%' },
});

// ── Scenario 4: Server Status ──

bind('w-status-server', {
  widget: 'status',
  title: 'Service Health',
  data: [
    { label: 'API Gateway', value: 'Operational', level: 'success' },
    { label: 'Database (Primary)', value: 'Operational', level: 'success' },
    { label: 'Database (Replica)', value: 'Degraded', level: 'warning' },
    { label: 'Redis Cache', value: 'Operational', level: 'success' },
    { label: 'Worker Queue', value: 'Down', level: 'error' },
  ],
});

bind('w-gauge-cpu', {
  widget: 'gauge',
  data: { value: 67 },
  options: {
    min: 0, max: 100, unit: '%',
    thresholds: [
      { to: 60, color: 'green' },
      { to: 80, color: 'yellow' },
      { to: 100, color: 'red' },
    ],
  },
});

// ── Scenario 5: Code Help ──

bind('w-code-dedup', {
  widget: 'code',
  data: {
    content: `function uniqueBy<T>(arr: T[], key: keyof T): T[] {
  const seen = new Set();
  return arr.filter(item => {
    const k = item[key];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// Usage
const users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 1, name: "Alice (dup)" },
];

console.log(uniqueBy(users, "id"));
// [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }]`,
    language: 'typescript',
  },
});

// ── Scenario 6: Data Analysis ──

bind('w-stat-browser', {
  widget: 'stat-group',
  data: [
    { value: 64.2, unit: '%', label: 'Chrome', trend: 'up', change: 2.1 },
    { value: 18.7, unit: '%', label: 'Safari', trend: 'flat' },
    { value: 10.3, unit: '%', label: 'Firefox', trend: 'down', change: -1.5 },
  ],
});

bind('w-chart-browser', {
  widget: 'chart.pie',
  data: [
    { browser: 'Chrome', share: 64.2 },
    { browser: 'Safari', share: 18.7 },
    { browser: 'Firefox', share: 10.3 },
    { browser: 'Edge', share: 4.8 },
    { browser: 'Other', share: 2.0 },
  ],
  options: { donut: true },
});

// ── Scenario 7: Form Input ──

bind('w-form-project', {
  widget: 'form',
  fields: [
    { field: 'name', label: 'Project Name', type: 'text', required: true, placeholder: 'e.g. u-widgets v2' },
    { field: 'type', label: 'Type', type: 'select', options: ['Web App', 'API Server', 'Library', 'Mobile App'] },
    { field: 'desc', label: 'Description', type: 'text', placeholder: 'A brief description of your project' },
    { field: 'private', label: 'Private Project', type: 'toggle' },
  ],
  data: { name: '', type: '', desc: '', private: false },
  actions: [
    { label: 'Cancel', action: 'cancel' },
    { label: 'Create', action: 'submit', style: 'primary' },
  ],
});

// ── Scenario 8: Compose Dashboard ──

bind('w-compose-dashboard', {
  widget: 'compose',
  layout: 'grid',
  columns: 3,
  children: [
    {
      widget: 'metric',
      data: { value: 99.97, unit: '%', label: 'Uptime', change: 0.02, trend: 'up' },
    },
    {
      widget: 'metric',
      data: { value: 1247, label: 'Requests/s', change: -3.2, trend: 'down' },
    },
    {
      widget: 'metric',
      data: { value: 42, unit: 'ms', label: 'Avg Latency', change: -8, trend: 'up' },
    },
  ],
});

bind('w-chart-traffic', {
  widget: 'chart.area',
  data: [
    { time: '00:00', rps: 820 },
    { time: '04:00', rps: 340 },
    { time: '08:00', rps: 1100 },
    { time: '12:00', rps: 1450 },
    { time: '16:00', rps: 1380 },
    { time: '20:00', rps: 1120 },
    { time: '23:00', rps: 890 },
  ],
  options: { smooth: true },
});

// ── Scenario 9: Confirm ──

bind('w-confirm-delete', {
  widget: 'confirm',
  title: 'Delete Repository',
  description: 'Are you sure you want to delete "my-old-project"? This action cannot be undone. All issues, pull requests, and wiki data will be permanently removed.',
  actions: [
    { label: 'Cancel', action: 'cancel' },
    { label: 'Delete', action: 'submit', style: 'danger' },
  ],
});

// ── Scenario 10: Citation ──

bind('w-citation-search', {
  widget: 'citation',
  data: [
    { title: 'Web Components - MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_components', snippet: 'Web Components is a suite of web platform APIs that lets you create reusable custom elements with encapsulated functionality.', source: 'MDN' },
    { title: 'Lit - Simple. Fast. Web Components.', url: 'https://lit.dev/', snippet: 'Lit is a simple library for building fast, lightweight web components with reactive properties and declarative templates.', source: 'lit.dev' },
    { title: 'Custom Elements Everywhere', url: 'https://custom-elements-everywhere.com/', snippet: 'Test results for how well custom elements work across all major frontend frameworks.', source: 'custom-elements-everywhere.com' },
  ],
});

// ── Theme Toggle ──

const btn = document.getElementById('theme-btn')!;
btn.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  btn.textContent = isDark ? 'Light Mode' : 'Dark Mode';
  document.querySelectorAll('u-widget').forEach(el => {
    if (isDark) el.setAttribute('theme', 'dark');
    else el.removeAttribute('theme');
  });
});

// ── Event Log ──

document.addEventListener('u-widget-event', (e) => {
  const toast = document.createElement('div');
  toast.className = 'event-toast';
  toast.textContent = JSON.stringify((e as CustomEvent).detail, null, 0);
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
});
