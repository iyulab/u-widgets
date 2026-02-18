// Side-effect imports: register <u-widget> and <u-chart> custom elements
import '../src/elements/u-widget.ts';
import '../src/elements/u-chart.ts';
import { help } from '../src/core/catalog.ts';

// ── Types ──

interface WidgetDoc {
  label: string;
  group: string;
  description: string;
  dataShape: string;
  mappingKeys: string[];
  variants: Record<string, object>;
}

// ── Event type mapping ──

const WIDGET_EVENTS: Record<string, string[]> = {
  chart: ['select'],
  table: ['select'],
  list: ['select'],
  form: ['submit', 'change', 'action'],
  confirm: ['submit', 'action'],
};

function getWidgetEvents(w: string): string[] {
  return WIDGET_EVENTS[w] ?? WIDGET_EVENTS[w.split('.')[0]] ?? [];
}

// ── Build catalog from CATALOG metadata + variant specs ──

function meta(widget: string) {
  const info = help(widget)[0];
  return {
    description: info?.description ?? '',
    dataShape: info?.dataShape ?? 'object',
    mappingKeys: info?.mappingKeys ?? [],
  };
}

const catalog: Record<string, WidgetDoc> = {
  // ── Display ──
  metric: {
    label: 'Metric',
    group: 'Display',
    ...meta('metric'),
    variants: {
      'Basic KPI': {
        widget: 'metric',
        data: { value: 1284, unit: 'EA', label: 'Total Users', change: 12.5, trend: 'up' },
      },
      'String Value': {
        widget: 'metric',
        data: { value: 'Healthy', label: 'System Status' },
      },
      'With prefix/suffix': {
        widget: 'metric',
        data: { value: 4250, label: 'Revenue', prefix: '$', suffix: '/mo', change: 8.3, trend: 'up' },
      },
    },
  },
  'stat-group': {
    label: 'Stat Group',
    group: 'Display',
    ...meta('stat-group'),
    variants: {
      '3 KPIs': {
        widget: 'stat-group',
        data: [
          { value: 42, label: 'Active', change: 5, trend: 'up' },
          { value: 18, label: 'Pending', change: -3, trend: 'down' },
          { value: 7, label: 'Errors', trend: 'flat' },
        ],
      },
      '2 KPIs (minimal)': {
        widget: 'stat-group',
        data: [
          { value: 128, label: 'Users' },
          { value: 42, label: 'Projects' },
        ],
      },
      'With all trends': {
        widget: 'stat-group',
        data: [
          { value: 99.9, unit: '%', label: 'Uptime', change: 0.1, trend: 'up' },
          { value: 142, label: 'Requests/s', change: -5, trend: 'down' },
          { value: 3, label: 'Incidents', change: 0, trend: 'flat' },
        ],
      },
    },
  },
  gauge: {
    label: 'Gauge',
    group: 'Display',
    ...meta('gauge'),
    variants: {
      'Threshold colors': {
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
      'Simple (no threshold)': {
        widget: 'gauge',
        data: { value: 45 },
        options: { min: 0, max: 100, unit: '%' },
      },
      'High value (danger)': {
        widget: 'gauge',
        data: { value: 92 },
        options: {
          min: 0, max: 100, unit: '%',
          thresholds: [
            { to: 60, color: 'green' },
            { to: 80, color: 'yellow' },
            { to: 100, color: 'red' },
          ],
        },
      },
    },
  },
  progress: {
    label: 'Progress',
    group: 'Display',
    ...meta('progress'),
    variants: {
      'Label template': {
        widget: 'progress',
        data: { value: 680, max: 1000 },
        options: { label: '{value} / 1000 ({percent}%)' },
      },
      'Simple (no label)': {
        widget: 'progress',
        data: { value: 65, max: 100 },
      },
      'Low value (warning)': {
        widget: 'progress',
        data: { value: 15, max: 100 },
        options: { label: '{percent}% complete' },
      },
    },
  },

  // ── Data ──
  table: {
    label: 'Table',
    group: 'Data',
    ...meta('table'),
    variants: {
      'Explicit columns': {
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
      'Auto-inferred': {
        widget: 'table',
        data: [
          { name: 'Alice', role: 'Engineer', status: 'Active' },
          { name: 'Bob', role: 'Designer', status: 'Away' },
          { name: 'Carol', role: 'PM', status: 'Active' },
        ],
      },
      'With format (currency)': {
        widget: 'table',
        data: [
          { product: 'Widget A', price: 29.99, quantity: 150 },
          { product: 'Widget B', price: 49.99, quantity: 80 },
          { product: 'Widget C', price: 9.99, quantity: 500 },
        ],
        mapping: {
          columns: [
            { field: 'product', label: 'Product' },
            { field: 'price', label: 'Price', format: 'currency', align: 'right' },
            { field: 'quantity', label: 'Qty', align: 'right' },
          ],
        },
      },
    },
  },
  list: {
    label: 'List',
    group: 'Data',
    ...meta('list'),
    variants: {
      'Icon + secondary': {
        widget: 'list',
        data: [
          { name: 'Deploy to production', category: 'DevOps', status: 'Done' },
          { name: 'Fix login bug', category: 'Backend', status: 'In Progress' },
          { name: 'Update docs', category: 'Docs', status: 'Todo' },
        ],
        mapping: { primary: 'name', secondary: 'status', icon: 'category' },
      },
      'Avatar + trailing': {
        widget: 'list',
        data: [
          { name: 'Alice Kim', role: 'Engineer', avatar: 'https://i.pravatar.cc/40?u=alice', hours: '32h' },
          { name: 'Bob Park', role: 'Designer', avatar: 'https://i.pravatar.cc/40?u=bob', hours: '28h' },
          { name: 'Carol Lee', role: 'PM', avatar: 'https://i.pravatar.cc/40?u=carol', hours: '40h' },
        ],
        mapping: { primary: 'name', secondary: 'role', avatar: 'avatar', trailing: 'hours' },
      },
      'Minimal (primary only)': {
        widget: 'list',
        data: [
          { item: 'Buy groceries' },
          { item: 'Walk the dog' },
          { item: 'Read a book' },
        ],
        mapping: { primary: 'item' },
      },
    },
  },

  // ── Charts ──
  'chart.bar': {
    label: 'Bar Chart',
    group: 'Charts',
    ...meta('chart.bar'),
    variants: {
      'Multi-series': {
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
      'Horizontal': {
        widget: 'chart.bar',
        data: [
          { lang: 'JavaScript', pct: 65 },
          { lang: 'Python', pct: 48 },
          { lang: 'TypeScript', pct: 35 },
          { lang: 'Rust', pct: 15 },
        ],
        options: { horizontal: true },
      },
      'Stacked': {
        widget: 'chart.bar',
        data: [
          { quarter: 'Q1', product: 80, service: 40 },
          { quarter: 'Q2', product: 100, service: 55 },
          { quarter: 'Q3', product: 90, service: 60 },
          { quarter: 'Q4', product: 120, service: 70 },
        ],
        mapping: { x: 'quarter', y: ['product', 'service'] },
        options: { stack: true },
      },
      'Histogram': {
        widget: 'chart.bar',
        data: [
          { bin: '0-10', count: 3 },
          { bin: '10-20', count: 8 },
          { bin: '20-30', count: 15 },
          { bin: '30-40', count: 22 },
          { bin: '40-50', count: 18 },
          { bin: '50-60', count: 12 },
          { bin: '60-70', count: 7 },
          { bin: '70-80', count: 4 },
        ],
        options: { histogram: true },
      },
    },
  },
  'chart.line': {
    label: 'Line Chart',
    group: 'Charts',
    ...meta('chart.line'),
    variants: {
      'Smooth': {
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
      'Step': {
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
      'Multi-series': {
        widget: 'chart.line',
        data: [
          { month: 'Jan', desktop: 200, mobile: 120, tablet: 50 },
          { month: 'Feb', desktop: 180, mobile: 150, tablet: 60 },
          { month: 'Mar', desktop: 250, mobile: 200, tablet: 80 },
          { month: 'Apr', desktop: 230, mobile: 220, tablet: 90 },
        ],
        mapping: { x: 'month', y: ['desktop', 'mobile', 'tablet'] },
      },
    },
  },
  'chart.area': {
    label: 'Area Chart',
    group: 'Charts',
    ...meta('chart.area'),
    variants: {
      'Smooth filled': {
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
      'Stacked area': {
        widget: 'chart.area',
        data: [
          { month: 'Jan', organic: 100, paid: 60, referral: 30 },
          { month: 'Feb', organic: 120, paid: 80, referral: 40 },
          { month: 'Mar', organic: 110, paid: 90, referral: 50 },
          { month: 'Apr', organic: 150, paid: 100, referral: 45 },
        ],
        mapping: { x: 'month', y: ['organic', 'paid', 'referral'] },
        options: { stack: true },
      },
      'Basic': {
        widget: 'chart.area',
        data: [
          { x: 'A', y: 30 },
          { x: 'B', y: 70 },
          { x: 'C', y: 45 },
          { x: 'D', y: 90 },
          { x: 'E', y: 55 },
        ],
      },
    },
  },
  'chart.pie': {
    label: 'Pie Chart',
    group: 'Charts',
    ...meta('chart.pie'),
    variants: {
      'Pie': {
        widget: 'chart.pie',
        data: [
          { browser: 'Chrome', share: 65 },
          { browser: 'Firefox', share: 15 },
          { browser: 'Safari', share: 12 },
          { browser: 'Edge', share: 8 },
        ],
      },
      'Donut': {
        widget: 'chart.pie',
        data: [
          { category: 'Completed', count: 42 },
          { category: 'In Progress', count: 18 },
          { category: 'Blocked', count: 5 },
        ],
        options: { donut: true },
      },
      'Minimal (2 segments)': {
        widget: 'chart.pie',
        data: [
          { label: 'Used', value: 73 },
          { label: 'Free', value: 27 },
        ],
        options: { donut: true },
      },
    },
  },
  'chart.scatter': {
    label: 'Scatter',
    group: 'Charts',
    ...meta('chart.scatter'),
    variants: {
      'Color groups': {
        widget: 'chart.scatter',
        data: [
          { height: 170, weight: 65, group: 'A' }, { height: 175, weight: 72, group: 'A' },
          { height: 160, weight: 55, group: 'B' }, { height: 180, weight: 80, group: 'B' },
          { height: 165, weight: 60, group: 'A' }, { height: 185, weight: 90, group: 'B' },
        ],
        mapping: { x: 'height', y: 'weight', color: 'group' },
      },
      'Simple 2D': {
        widget: 'chart.scatter',
        data: [
          { x: 10, y: 20 }, { x: 30, y: 40 }, { x: 50, y: 15 },
          { x: 25, y: 35 }, { x: 45, y: 28 }, { x: 60, y: 50 },
        ],
      },
      'Large dataset': {
        widget: 'chart.scatter',
        data: Array.from({ length: 50 }, (_, i) => ({
          x: Math.round(Math.sin(i * 0.3) * 40 + 50),
          y: Math.round(Math.cos(i * 0.3) * 40 + 50),
          group: i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C',
        })),
        mapping: { x: 'x', y: 'y', color: 'group' },
      },
    },
  },
  'chart.radar': {
    label: 'Radar',
    group: 'Charts',
    ...meta('chart.radar'),
    variants: {
      'Multi-person': {
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
      'Single series': {
        widget: 'chart.radar',
        data: [
          { axis: 'Speed', value: 80 },
          { axis: 'Power', value: 90 },
          { axis: 'Defense', value: 60 },
          { axis: 'Agility', value: 75 },
          { axis: 'Stamina', value: 85 },
        ],
      },
      'Many axes': {
        widget: 'chart.radar',
        data: [
          { skill: 'HTML', score: 95 },
          { skill: 'CSS', score: 88 },
          { skill: 'JS', score: 92 },
          { skill: 'TS', score: 85 },
          { skill: 'React', score: 90 },
          { skill: 'Node', score: 78 },
          { skill: 'SQL', score: 70 },
          { skill: 'Docker', score: 65 },
        ],
      },
    },
  },
  'chart.heatmap': {
    label: 'Heatmap',
    group: 'Charts',
    ...meta('chart.heatmap'),
    variants: {
      'Day x Time': {
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
      'Compact 2x2': {
        widget: 'chart.heatmap',
        data: [
          { x: 'A', y: '1', value: 5 },
          { x: 'A', y: '2', value: 15 },
          { x: 'B', y: '1', value: 20 },
          { x: 'B', y: '2', value: 8 },
        ],
      },
      'Wide matrix': {
        widget: 'chart.heatmap',
        data: [
          { x: 'Mon', y: '9am', value: 5 }, { x: 'Mon', y: '12pm', value: 20 }, { x: 'Mon', y: '3pm', value: 18 }, { x: 'Mon', y: '6pm', value: 10 },
          { x: 'Tue', y: '9am', value: 8 }, { x: 'Tue', y: '12pm', value: 25 }, { x: 'Tue', y: '3pm', value: 22 }, { x: 'Tue', y: '6pm', value: 12 },
          { x: 'Wed', y: '9am', value: 12 }, { x: 'Wed', y: '12pm', value: 30 }, { x: 'Wed', y: '3pm', value: 28 }, { x: 'Wed', y: '6pm', value: 15 },
          { x: 'Thu', y: '9am', value: 6 }, { x: 'Thu', y: '12pm', value: 18 }, { x: 'Thu', y: '3pm', value: 15 }, { x: 'Thu', y: '6pm', value: 8 },
          { x: 'Fri', y: '9am', value: 10 }, { x: 'Fri', y: '12pm', value: 22 }, { x: 'Fri', y: '3pm', value: 20 }, { x: 'Fri', y: '6pm', value: 14 },
        ],
      },
    },
  },
  'chart.box': {
    label: 'Boxplot',
    group: 'Charts',
    ...meta('chart.box'),
    variants: {
      'Multi-group': {
        widget: 'chart.box',
        data: [
          { group: 'Setosa', min: 4.3, q1: 4.8, median: 5.0, q3: 5.2, max: 5.8 },
          { group: 'Versicolor', min: 4.9, q1: 5.6, median: 5.9, q3: 6.3, max: 7.0 },
          { group: 'Virginica', min: 4.9, q1: 6.2, median: 6.5, q3: 6.9, max: 7.9 },
        ],
      },
      'Single group': {
        widget: 'chart.box',
        data: [
          { group: 'Scores', min: 45, q1: 60, median: 72, q3: 85, max: 98 },
        ],
      },
      'Iris dataset': {
        widget: 'chart.box',
        data: [
          { group: 'Sepal Length', min: 4.3, q1: 5.1, median: 5.8, q3: 6.4, max: 7.9 },
          { group: 'Sepal Width', min: 2.0, q1: 2.8, median: 3.0, q3: 3.3, max: 4.4 },
          { group: 'Petal Length', min: 1.0, q1: 1.6, median: 4.35, q3: 5.1, max: 6.9 },
          { group: 'Petal Width', min: 0.1, q1: 0.3, median: 1.3, q3: 1.8, max: 2.5 },
        ],
      },
    },
  },
  'chart.funnel': {
    label: 'Funnel',
    group: 'Charts',
    ...meta('chart.funnel'),
    variants: {
      'Marketing funnel': {
        widget: 'chart.funnel',
        data: [
          { stage: 'Impressions', count: 10000 },
          { stage: 'Clicks', count: 3500 },
          { stage: 'Sign-ups', count: 800 },
          { stage: 'Purchases', count: 200 },
          { stage: 'Repeat', count: 50 },
        ],
      },
      'Simple 3-stage': {
        widget: 'chart.funnel',
        data: [
          { stage: 'Visit', count: 1000 },
          { stage: 'Click', count: 600 },
          { stage: 'Purchase', count: 200 },
        ],
      },
      'Wide funnel': {
        widget: 'chart.funnel',
        data: [
          { stage: 'Awareness', count: 5000 },
          { stage: 'Interest', count: 4200 },
          { stage: 'Consideration', count: 3000 },
          { stage: 'Intent', count: 2000 },
          { stage: 'Evaluation', count: 1500 },
          { stage: 'Purchase', count: 1200 },
        ],
      },
    },
  },
  'chart.waterfall': {
    label: 'Waterfall',
    group: 'Charts',
    ...meta('chart.waterfall'),
    variants: {
      'P&L waterfall': {
        widget: 'chart.waterfall',
        data: [
          { item: 'Revenue', amount: 500 },
          { item: 'COGS', amount: -200 },
          { item: 'OpEx', amount: -120 },
          { item: 'Tax', amount: -50 },
          { item: 'Net Profit', amount: 130 },
        ],
      },
      'Budget variance': {
        widget: 'chart.waterfall',
        data: [
          { item: 'Budget', amount: 1000 },
          { item: 'Marketing', amount: -150 },
          { item: 'R&D', amount: -300 },
          { item: 'Sales Uplift', amount: 200 },
          { item: 'Savings', amount: 100 },
        ],
      },
      'Simple 3-item': {
        widget: 'chart.waterfall',
        data: [
          { item: 'Revenue', amount: 500 },
          { item: 'Cost', amount: -200 },
          { item: 'Tax', amount: -50 },
        ],
      },
    },
  },
  'chart.treemap': {
    label: 'Treemap',
    group: 'Charts',
    ...meta('chart.treemap'),
    variants: {
      'Nested (dept > team)': {
        widget: 'chart.treemap',
        data: [
          {
            name: 'Engineering', value: 100,
            children: [
              { name: 'Frontend', value: 40 },
              { name: 'Backend', value: 35 },
              { name: 'DevOps', value: 25 },
            ],
          },
          {
            name: 'Design', value: 50,
            children: [
              { name: 'UI', value: 30 },
              { name: 'UX', value: 20 },
            ],
          },
        ],
      },
      'Flat items': {
        widget: 'chart.treemap',
        data: [
          { name: 'JavaScript', value: 65 },
          { name: 'Python', value: 48 },
          { name: 'TypeScript', value: 35 },
          { name: 'Go', value: 20 },
          { name: 'Rust', value: 15 },
        ],
      },
      'Deep hierarchy': {
        widget: 'chart.treemap',
        data: [
          {
            name: 'Company', value: 300,
            children: [
              {
                name: 'Product', value: 180,
                children: [
                  { name: 'Web App', value: 80 },
                  { name: 'Mobile', value: 60 },
                  { name: 'API', value: 40 },
                ],
              },
              {
                name: 'Operations', value: 120,
                children: [
                  { name: 'Support', value: 50 },
                  { name: 'Sales', value: 40 },
                  { name: 'HR', value: 30 },
                ],
              },
            ],
          },
        ],
      },
    },
  },

  // ── Content ──
  markdown: {
    label: 'Markdown',
    group: 'Content',
    ...meta('markdown'),
    variants: {
      'Rich (code, lists, links)': {
        widget: 'markdown',
        data: {
          content: [
            '# Getting Started',
            '',
            'Welcome to **u-widgets**! Here\'s what you can do:',
            '',
            '- Create **metrics** and **gauges**',
            '- Build **charts** with minimal JSON',
            '- Use **forms** for data input',
            '',
            '```json',
            '{ "widget": "metric", "data": { "value": 42 } }',
            '```',
            '',
            'Learn more at [GitHub](https://github.com/iyulab/u-widgets).',
          ].join('\n'),
        },
      },
      'Minimal heading': {
        widget: 'markdown',
        data: { content: '## Hello World\n\nThis is a simple markdown widget.' },
      },
      'Table + blockquote': {
        widget: 'markdown',
        data: {
          content: [
            '## Comparison',
            '',
            '| Feature | u-widgets | Others |',
            '|---------|-----------|--------|',
            '| Declarative | Yes | Varies |',
            '| Auto-infer | Yes | No |',
            '| Token-optimized | Yes | No |',
            '',
            '> u-widgets is designed to be minimal and data-driven.',
          ].join('\n'),
        },
      },
    },
  },
  image: {
    label: 'Image',
    group: 'Content',
    ...meta('image'),
    variants: {
      'With caption': {
        widget: 'image',
        data: {
          src: 'https://via.placeholder.com/400x200/4f46e5/ffffff?text=u-widgets',
          alt: 'u-widgets banner',
          caption: 'Declarative widget system for data visualization',
        },
      },
      'Simple': {
        widget: 'image',
        data: {
          src: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Image',
          alt: 'Sample image',
        },
      },
      'Placeholder': {
        widget: 'image',
        data: {
          src: 'https://via.placeholder.com/320x180/64748b/ffffff?text=No+Image',
          alt: 'Placeholder',
        },
      },
    },
  },
  callout: {
    label: 'Callout',
    group: 'Content',
    ...meta('callout'),
    variants: {
      'Info': {
        widget: 'callout',
        data: { message: 'This is an informational callout with helpful context for the user.', level: 'info' },
      },
      'Warning': {
        widget: 'callout',
        data: { message: 'Be careful! This action may have unexpected side effects.', level: 'warning' },
      },
      'Error': {
        widget: 'callout',
        data: { message: 'Something went wrong. Please check your configuration and try again.', level: 'error' },
      },
      'Success': {
        widget: 'callout',
        data: { message: 'Operation completed successfully! All changes have been saved.', level: 'success' },
      },
    },
  },

  // ── Input ──
  form: {
    label: 'Form',
    group: 'Input',
    ...meta('form'),
    variants: {
      'Full form (fields)': {
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
      'Formdown syntax': {
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
      'Validation demo': {
        widget: 'form',
        fields: [
          { field: 'username', label: 'Username', type: 'text', required: true, placeholder: 'min 3 chars' },
          { field: 'password', label: 'Password', type: 'text', required: true, placeholder: 'min 8 chars' },
          { field: 'agree', label: 'I agree to the terms', type: 'toggle' },
        ],
        actions: [
          { label: 'Register', action: 'submit', style: 'primary' },
        ],
      },
    },
  },
  confirm: {
    label: 'Confirm',
    group: 'Input',
    ...meta('confirm'),
    variants: {
      'Danger action': {
        widget: 'confirm',
        title: 'Delete Project',
        description: 'Are you sure you want to delete this project? This action cannot be undone.',
        actions: [
          { label: 'Cancel', action: 'cancel' },
          { label: 'Delete', action: 'submit', style: 'danger' },
        ],
      },
      'Info action': {
        widget: 'confirm',
        title: 'Publish Changes',
        description: 'Your changes will be published and visible to all users immediately.',
        actions: [
          { label: 'Cancel', action: 'cancel' },
          { label: 'Publish', action: 'submit', style: 'primary' },
        ],
      },
      'Simple yes/no': {
        widget: 'confirm',
        title: 'Are you sure?',
        description: 'This action cannot be undone.',
        actions: [
          { label: 'No', action: 'cancel' },
          { label: 'Yes', action: 'submit', style: 'primary' },
        ],
      },
    },
  },

  // ── Layout ──
  compose: {
    label: 'Compose',
    group: 'Layout',
    ...meta('compose'),
    variants: {
      'Grid 3-col': {
        widget: 'compose',
        title: 'System Overview',
        layout: 'grid',
        columns: 3,
        children: [
          { widget: 'metric', data: { value: 99.9, unit: '%', label: 'Uptime', change: 0.1, trend: 'up' } },
          { widget: 'metric', data: { value: 142, label: 'Requests/s', change: -5, trend: 'down' } },
          { widget: 'gauge', data: { value: 45 }, options: { min: 0, max: 100, unit: '%', thresholds: [{ to: 60, color: 'green' }, { to: 80, color: 'yellow' }, { to: 100, color: 'red' }] } },
        ],
      },
      'Row layout': {
        widget: 'compose',
        layout: 'row',
        children: [
          { widget: 'metric', data: { value: 42, label: 'Active Users' } },
          { widget: 'metric', data: { value: 7, label: 'Errors', trend: 'down' } },
        ],
      },
      'Stack layout': {
        widget: 'compose',
        layout: 'stack',
        children: [
          { widget: 'callout', data: { message: 'System update completed.', level: 'success' } },
          { widget: 'metric', data: { value: 100, unit: '%', label: 'Deployment' } },
          { widget: 'progress', data: { value: 100, max: 100 } },
        ],
      },
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
const eventCount = document.getElementById('event-count')!;
const themeBtn = document.getElementById('theme-btn')!;
const docTitle = document.getElementById('doc-title')!;
const docDesc = document.getElementById('doc-desc')!;
const docBadges = document.getElementById('doc-badges')!;
const variantSelect = document.getElementById('variant-select') as HTMLSelectElement;
const panelPreview = document.getElementById('panel-preview')!;
const propsPanel = document.getElementById('props-panel')!;
const clearLogBtn = document.getElementById('clear-log-btn')!;

// ── State ──

let activeKey = '';
let activeVariantIdx = 0;
let logCount = 0;

// ── Build Sidebar ──

function buildSidebar() {
  const groups: Record<string, string[]> = {};
  for (const [key, entry] of Object.entries(catalog)) {
    (groups[entry.group] ??= []).push(key);
  }

  sidebar.innerHTML = '';
  for (const [group, keys] of Object.entries(groups)) {
    const groupEl = document.createElement('div');
    groupEl.className = 'sidebar-group';
    groupEl.innerHTML = `<span>${group}</span><span class="badge">${keys.length}</span>`;
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

// ── Doc Header ──

function updateDocHeader(entry: WidgetDoc, widgetType: string) {
  docTitle.textContent = widgetType;
  docDesc.textContent = entry.description;

  let badges = '';
  if (entry.dataShape) {
    badges += `<span class="doc-badge shape">${entry.dataShape}</span>`;
  }
  for (const key of entry.mappingKeys) {
    badges += `<span class="doc-badge key">${key}</span>`;
  }
  docBadges.innerHTML = badges;
}

// ── Variant Select ──

function buildVariantSelect(entry: WidgetDoc) {
  const names = Object.keys(entry.variants);
  variantSelect.innerHTML = '';
  names.forEach((name, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = name;
    variantSelect.appendChild(opt);
  });
}

variantSelect.addEventListener('change', () => {
  selectVariant(Number(variantSelect.value));
});

// ── Props Panel ──

interface DocField {
  key: string;
  type: string;
  desc: string;
}

function parseDocString(docStr: string): DocField[] {
  if (!docStr) return [];
  return docStr.split(';').map((seg) => {
    const s = seg.trim();
    if (!s) return null;
    // Match: "key (type): description" or "key (type?, optional): desc"
    const m = s.match(/^(\S+)\s*\(([^)]+)\)\s*[:\-]?\s*(.*)/);
    if (m) return { key: m[1], type: m[2].trim(), desc: m[3].trim() };
    // Fallback: plain text
    return { key: '', type: '', desc: s };
  }).filter(Boolean) as DocField[];
}

function updatePropsPanel(widgetType: string) {
  const info = help(widgetType)[0];
  if (!info) {
    propsPanel.innerHTML = '';
    return;
  }

  let html = '';

  // Data Shape
  html += `<div class="props-section">`;
  html += `<div class="props-section-title">Data Shape</div>`;
  html += `<ul class="props-list"><li><span class="prop-type">${info.dataShape}</span></li></ul>`;
  html += `</div>`;

  // Mapping Keys
  if (info.mappingKeys.length > 0) {
    html += `<div class="props-section">`;
    html += `<div class="props-section-title">Mapping Keys</div>`;
    html += `<div class="props-badges">`;
    for (const k of info.mappingKeys) {
      html += `<span class="doc-badge key">${k}</span>`;
    }
    html += `</div></div>`;
  }

  // Data Fields
  if (info.dataFields) {
    const fields = parseDocString(info.dataFields);
    if (fields.length > 0) {
      html += `<div class="props-section">`;
      html += `<div class="props-section-title">Data Fields</div>`;
      html += `<ul class="props-list">`;
      for (const f of fields) {
        if (f.key) {
          html += `<li><span class="prop-key">${f.key}</span> <span class="prop-type">(${f.type})</span>`;
          if (f.desc) html += ` <span class="prop-desc">${f.desc}</span>`;
          html += `</li>`;
        } else {
          html += `<li><span class="prop-desc">${f.desc}</span></li>`;
        }
      }
      html += `</ul></div>`;
    }
  }

  // Options
  if (info.optionsDocs) {
    const opts = parseDocString(info.optionsDocs);
    if (opts.length > 0) {
      html += `<div class="props-section">`;
      html += `<div class="props-section-title">Options</div>`;
      html += `<ul class="props-list">`;
      for (const o of opts) {
        if (o.key) {
          html += `<li><span class="prop-key">${o.key}</span> <span class="prop-type">(${o.type})</span>`;
          if (o.desc) html += ` <span class="prop-desc">${o.desc}</span>`;
          html += `</li>`;
        } else {
          html += `<li><span class="prop-desc">${o.desc}</span></li>`;
        }
      }
      html += `</ul></div>`;
    }
  }

  // Events
  const events = getWidgetEvents(widgetType);
  if (events.length > 0) {
    html += `<div class="props-section">`;
    html += `<div class="props-section-title">Events</div>`;
    html += `<div class="props-badges">`;
    for (const ev of events) {
      html += `<span class="props-badge">${ev}</span>`;
    }
    html += `</div></div>`;
  }

  propsPanel.innerHTML = html;
}

// ── Widget Selection ──

function selectWidget(key: string) {
  activeKey = key;
  const entry = catalog[key];
  if (!entry) return;

  updateSidebarActive(key);
  updateDocHeader(entry, key);
  buildVariantSelect(entry);
  updatePropsPanel(key);
  selectVariant(0);

  // Update URL hash
  history.replaceState(null, '', `#${key}`);
}

function selectVariant(idx: number) {
  activeVariantIdx = idx;
  const entry = catalog[activeKey];
  if (!entry) return;

  const variantNames = Object.keys(entry.variants);
  const spec = entry.variants[variantNames[idx]];
  if (!spec) return;

  variantSelect.value = String(idx);
  const json = JSON.stringify(spec, null, 2);
  editor.value = json;
  editorError.textContent = '';
  applySpec(spec as Record<string, unknown>);
}

function applySpec(spec: Record<string, unknown>) {
  previewWidget.spec = spec;
  syncPreviewSize();
}

// ── Dynamic Size Sync ──

function syncPreviewSize() {
  const previewArea = panelPreview.querySelector('.preview-area') as HTMLElement;
  if (!previewArea) return;
  const innerH = previewArea.clientHeight;
  const innerW = previewArea.clientWidth;
  if (innerH <= 0) return;

  panelPreview.style.setProperty('--u-widget-chart-height', `${innerH}px`);

  const gaugeFromH = (innerH - 8) / 0.975;
  const gaugeFromW = innerW * 0.6;
  const gaugeSize = Math.max(120, Math.min(gaugeFromH, gaugeFromW, 500));
  panelPreview.style.setProperty('--u-widget-gauge-size', `${gaugeSize}px`);

  requestAnimationFrame(() => {
    const chart = previewWidget.shadowRoot?.querySelector('u-chart') as HTMLElement & { resize?: () => void } | null;
    chart?.resize?.();
  });
}

const previewRO = new ResizeObserver(() => syncPreviewSize());
previewRO.observe(panelPreview);

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

  logCount++;
  eventCount.textContent = String(logCount);
  eventCount.style.display = '';
});

clearLogBtn.addEventListener('click', () => {
  eventLog.innerHTML = 'Waiting for events...';
  logCount = 0;
  eventCount.style.display = 'none';
});

// ── URL Hash Routing ──

function handleHash() {
  const hash = location.hash.slice(1);
  if (hash && catalog[hash]) {
    selectWidget(hash);
  } else {
    selectWidget(Object.keys(catalog)[0]);
  }
}

window.addEventListener('hashchange', handleHash);

// ── Init ──

buildSidebar();
handleHash();
