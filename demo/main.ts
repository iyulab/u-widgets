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
  chartScatter: {
    widget: 'chart.scatter',
    data: [
      { height: 170, weight: 65, group: 'A' }, { height: 175, weight: 72, group: 'A' },
      { height: 160, weight: 55, group: 'B' }, { height: 180, weight: 80, group: 'B' },
      { height: 165, weight: 60, group: 'A' }, { height: 185, weight: 90, group: 'B' },
    ],
    mapping: { x: 'height', y: 'weight', color: 'group' },
  },
  chartBox: {
    widget: 'chart.box',
    data: [
      { group: 'Setosa', min: 4.3, q1: 4.8, median: 5.0, q3: 5.2, max: 5.8 },
      { group: 'Versicolor', min: 4.9, q1: 5.6, median: 5.9, q3: 6.3, max: 7.0 },
      { group: 'Virginica', min: 4.9, q1: 6.2, median: 6.5, q3: 6.9, max: 7.9 },
    ],
  },
  chartHeatmap: {
    widget: 'chart.heatmap',
    data: [
      { x: 'Mon', y: 'Morning', value: 10 },
      { x: 'Mon', y: 'Afternoon', value: 25 },
      { x: 'Mon', y: 'Evening', value: 18 },
      { x: 'Tue', y: 'Morning', value: 8 },
      { x: 'Tue', y: 'Afternoon', value: 32 },
      { x: 'Tue', y: 'Evening', value: 22 },
      { x: 'Wed', y: 'Morning', value: 15 },
      { x: 'Wed', y: 'Afternoon', value: 28 },
      { x: 'Wed', y: 'Evening', value: 12 },
    ],
  },
  chartRadar: {
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
  formdownForm: {
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
  chartFunnel: {
    widget: 'chart.funnel',
    data: [
      { stage: 'Visit', count: 10000 },
      { stage: 'Click', count: 4200 },
      { stage: 'Sign Up', count: 1800 },
      { stage: 'Purchase', count: 620 },
    ],
  },
  chartWaterfall: {
    widget: 'chart.waterfall',
    data: [
      { item: 'Revenue', value: 500 },
      { item: 'COGS', value: -120 },
      { item: 'OpEx', value: -200 },
      { item: 'Tax', value: -45 },
      { item: 'Net Profit', value: 135 },
    ],
  },
  chartTreemap: {
    widget: 'chart.treemap',
    data: [
      { name: 'Engineering', children: [
        { name: 'Frontend', value: 12 },
        { name: 'Backend', value: 18 },
        { name: 'Infra', value: 8 },
      ]},
      { name: 'Design', children: [
        { name: 'Product', value: 6 },
        { name: 'Brand', value: 4 },
      ]},
      { name: 'Marketing', children: [
        { name: 'Growth', value: 10 },
        { name: 'Content', value: 7 },
      ]},
    ],
  },
  markdown: {
    widget: 'markdown',
    data: {
      content: [
        '## Hello, u-widgets!',
        '',
        'This is a **markdown** widget. It supports:',
        '',
        '1. **Bold** and *italic* text',
        '2. [Links](https://github.com/iyulab/u-widgets)',
        '3. Inline `code` and code blocks',
        '',
        '```js',
        'const greeting = "Hello World";',
        'console.log(greeting);',
        '```',
      ].join('\n'),
    },
  },
  image: {
    widget: 'image',
    data: {
      src: 'https://placehold.co/600x200/2563eb/white?text=u-widgets',
      alt: 'u-widgets placeholder image',
    },
  },
  callout: {
    widget: 'callout',
    data: {
      message: 'This is an informational callout. Use it to highlight important notices to users.',
      level: 'info',
    },
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
bind('demo-chart-scatter', specs.chartScatter);
bind('demo-chart-box', specs.chartBox);
bind('demo-chart-heatmap', specs.chartHeatmap);
bind('demo-chart-radar', specs.chartRadar);
bind('demo-form', specs.form);
bind('demo-formdown', specs.formdownForm);
bind('demo-confirm', specs.confirm);
bind('demo-compose', specs.compose);
bind('demo-chart-funnel', specs.chartFunnel);
bind('demo-chart-waterfall', specs.chartWaterfall);
bind('demo-chart-treemap', specs.chartTreemap);
bind('demo-markdown', specs.markdown);
bind('demo-image', specs.image);
bind('demo-callout', specs.callout);

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
