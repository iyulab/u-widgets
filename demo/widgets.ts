// Side-effect imports: register <u-widget> and <u-chart> custom elements
import '../src/elements/u-widget.ts';
import '../src/elements/u-chart.ts';
import { help } from '../src/core/catalog.ts';
import { specSurface, type SpecSurface, type PropInfo } from '../src/core/spec-surface.ts';
import { getWidgetEvents } from '../src/core/widget-meta.ts';

// ── Types ──

interface WidgetDoc {
  label: string;
  group: string;
  description: string;
  dataShape: string;
  mappingKeys: string[];
  variants: Record<string, object>;
}

// ── Build catalog from CATALOG metadata + variant specs ──

function meta(widget: string) {
  const result = help(widget);
  const info = Array.isArray(result) ? result[0] : result;
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
      'With prefix/suffix': {
        widget: 'stat-group',
        data: [
          { value: 4250, label: 'Revenue', prefix: '$', suffix: '/mo' },
          { value: 128, label: 'Users', suffix: ' active' },
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
      'With icons': {
        widget: 'stat-group',
        data: [
          { value: 42000, label: 'Revenue', prefix: '$', icon: '\uD83D\uDCB0', description: 'Monthly recurring revenue', change: 12.5, trend: 'up' },
          { value: 1284, label: 'Users', icon: '\uD83D\uDC65', description: 'Active in last 30 days', change: 5.2, trend: 'up' },
          { value: 3, label: 'Incidents', icon: '\u26A0\uFE0F', description: 'Requires attention', change: -1, trend: 'down' },
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
      'With thresholds': {
        widget: 'progress',
        data: { value: 35, max: 100 },
        options: {
          label: '{percent}% complete',
          thresholds: [
            { to: 30, color: 'red' },
            { to: 60, color: 'yellow' },
            { to: 100, color: 'green' },
          ],
        },
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
      'Searchable + paginated': {
        widget: 'table',
        data: [
          { name: 'Alice', role: 'Engineer', status: 'Active' },
          { name: 'Bob', role: 'Designer', status: 'Away' },
          { name: 'Carol', role: 'PM', status: 'Active' },
          { name: 'Dave', role: 'QA', status: 'Active' },
          { name: 'Eve', role: 'DevOps', status: 'Away' },
        ],
        options: { searchable: true, pageSize: 3 },
      },
      'Compact + formats': {
        widget: 'table',
        data: [
          { file: 'report.pdf', size: 2048000, modified: '2025-12-01', progress: 0.95 },
          { file: 'data.csv', size: 512000, modified: '2025-11-20', progress: 0.6 },
          { file: 'image.png', size: 8192000, modified: '2025-10-15', progress: 1.0 },
        ],
        mapping: {
          columns: [
            { field: 'file', label: 'File' },
            { field: 'size', label: 'Size', format: 'bytes', align: 'right' },
            { field: 'modified', label: 'Modified', format: 'date' },
            { field: 'progress', label: 'Done', format: 'percent', align: 'right' },
          ],
        },
        options: { compact: true },
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
      'Auto-inferred (no mapping)': {
        widget: 'list',
        data: [
          { title: 'Alice Kim', description: 'Senior Engineer', avatar: 'https://i.pravatar.cc/40?u=alice', amount: '$12,500' },
          { title: 'Bob Park', description: 'Designer', avatar: 'https://i.pravatar.cc/40?u=bob', amount: '$9,800' },
          { title: 'Carol Lee', description: 'PM', avatar: 'https://i.pravatar.cc/40?u=carol', amount: '$11,200' },
        ],
      },
      'Compact mode': {
        widget: 'list',
        data: [
          { task: 'Buy groceries', due: 'Today' },
          { task: 'Walk the dog', due: 'Today' },
          { task: 'Read a book', due: 'Tomorrow' },
          { task: 'Write report', due: 'Friday' },
        ],
        mapping: { primary: 'task', trailing: 'due' },
        options: { compact: true },
      },
      'With badge': {
        widget: 'list',
        data: [
          { name: 'Fix login bug', status: 'In Progress', category: 'Bug' },
          { name: 'Add dark mode', status: 'Todo', category: 'Feature' },
          { name: 'Update docs', status: 'Done', category: 'Docs' },
          { name: 'Refactor auth', status: 'In Progress', category: 'Tech Debt' },
        ],
        mapping: { primary: 'name', secondary: 'status', badge: 'category' },
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
      'Histogram + colors': {
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
        options: { histogram: true, colors: ['#6366f1', '#8b5cf6'] },
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
      'Step + referenceLines': {
        widget: 'chart.line',
        data: [
          { hour: '00:00', requests: 120 },
          { hour: '04:00', requests: 80 },
          { hour: '08:00', requests: 250 },
          { hour: '12:00', requests: 380 },
          { hour: '16:00', requests: 310 },
          { hour: '20:00', requests: 220 },
        ],
        options: {
          step: 'end',
          referenceLines: [
            { axis: 'y', value: 300, label: 'Capacity', color: '#dc2626', style: 'dashed' },
          ],
        },
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
      'Donut + custom colors': {
        widget: 'chart.pie',
        data: [
          { category: 'Completed', count: 42 },
          { category: 'In Progress', count: 18 },
          { category: 'Blocked', count: 5 },
        ],
        options: { donut: true, colors: ['#22c55e', '#f59e0b', '#ef4444'] },
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
      'Bubble (size mapping)': {
        widget: 'chart.scatter',
        data: [
          { revenue: 10, profit: 20, employees: 50 },
          { revenue: 30, profit: 40, employees: 120 },
          { revenue: 50, profit: 15, employees: 200 },
          { revenue: 25, profit: 35, employees: 80 },
          { revenue: 45, profit: 28, employees: 300 },
        ],
        mapping: { x: 'revenue', y: 'profit', size: 'employees' },
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
      'Custom colorRange': {
        widget: 'chart.heatmap',
        data: [
          { x: 'Mon', y: '9am', value: 5 }, { x: 'Mon', y: '12pm', value: 20 }, { x: 'Mon', y: '3pm', value: 18 }, { x: 'Mon', y: '6pm', value: 10 },
          { x: 'Tue', y: '9am', value: 8 }, { x: 'Tue', y: '12pm', value: 25 }, { x: 'Tue', y: '3pm', value: 22 }, { x: 'Tue', y: '6pm', value: 12 },
          { x: 'Wed', y: '9am', value: 12 }, { x: 'Wed', y: '12pm', value: 30 }, { x: 'Wed', y: '3pm', value: 28 }, { x: 'Wed', y: '6pm', value: 15 },
          { x: 'Thu', y: '9am', value: 6 }, { x: 'Thu', y: '12pm', value: 18 }, { x: 'Thu', y: '3pm', value: 15 }, { x: 'Thu', y: '6pm', value: 8 },
          { x: 'Fri', y: '9am', value: 10 }, { x: 'Fri', y: '12pm', value: 22 }, { x: 'Fri', y: '3pm', value: 20 }, { x: 'Fri', y: '6pm', value: 14 },
        ],
        options: { colorRange: ['#eff6ff', '#3b82f6', '#1e3a5f'] },
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
          src: 'https://placehold.co/400x200/4f46e5/ffffff?text=u-widgets',
          alt: 'u-widgets banner',
          caption: 'Declarative widget system for data visualization',
        },
      },
      'Simple': {
        widget: 'image',
        data: {
          src: 'https://placehold.co/300x200/10b981/ffffff?text=Image',
          alt: 'Sample image',
        },
      },
      'Placeholder': {
        widget: 'image',
        data: {
          src: 'https://placehold.co/320x180/64748b/ffffff?text=No+Image',
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
      'Info + title': {
        widget: 'callout',
        data: { title: 'Did you know?', message: 'This is an informational callout with helpful context for the user.', level: 'info' },
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
      'All field types': {
        widget: 'form',
        fields: [
          { field: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter your name' },
          { field: 'email', label: 'Email', type: 'email', placeholder: 'user@example.com' },
          { field: 'bio', label: 'Bio', type: 'textarea', rows: 3, placeholder: 'Tell us about yourself' },
          { field: 'role', label: 'Role', type: 'select', options: ['Engineer', 'Designer', 'PM'] },
          { field: 'volume', label: 'Volume', type: 'range', min: 0, max: 100, step: 10 },
          { field: 'birthday', label: 'Birthday', type: 'date' },
          { field: 'notify', label: 'Email notifications', type: 'toggle' },
        ],
        data: { name: '', email: '', bio: '', role: '', volume: 50, birthday: '', notify: true },
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
      'Validation + pattern': {
        widget: 'form',
        fields: [
          { field: 'username', label: 'Username', type: 'text', required: true, minLength: 3, maxLength: 20, placeholder: '3-20 chars' },
          { field: 'password', label: 'Password', type: 'password', required: true, minLength: 8, placeholder: 'min 8 chars' },
          { field: 'code', label: 'Invite Code', type: 'text', pattern: '^[A-Z]{3}-\\d{4}$', message: 'Format: ABC-1234', placeholder: 'ABC-1234' },
          { field: 'plan', label: 'Plan', type: 'radio', options: ['Free', 'Pro', 'Enterprise'] },
          { field: 'agree', label: 'I agree to the terms', type: 'checkbox' },
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

  // ── Chat / Interaction ──
  code: {
    label: 'Code',
    group: 'Chat',
    ...meta('code'),
    variants: {
      'JavaScript': {
        widget: 'code',
        data: { content: 'const greeting = "Hello, World!";\n\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nconsole.log(fibonacci(10));', language: 'javascript' },
      },
      'Python': {
        widget: 'code',
        data: { content: 'import numpy as np\n\n# Generate random data\ndata = np.random.randn(1000)\nmean = np.mean(data)\nstd = np.std(data)\n\nprint(f"Mean: {mean:.4f}, Std: {std:.4f}")', language: 'python' },
      },
      'SQL': {
        widget: 'code',
        data: { content: 'SELECT u.name, COUNT(o.id) AS orders\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nWHERE u.active = TRUE\nGROUP BY u.name\nORDER BY orders DESC\nLIMIT 10;', language: 'sql' },
      },
      'JSON': {
        widget: 'code',
        data: { content: '{\n  "widget": "metric",\n  "data": {\n    "value": 1523,\n    "label": "Active Users",\n    "trend": "up",\n    "change": 12.5\n  }\n}', language: 'json' },
      },
      'Line highlights': {
        widget: 'code',
        data: { content: 'function add(a, b) {\n  return a + b;\n}\n\nconst result = add(1, 2);\nconsole.log(result);', language: 'javascript' },
        options: { highlight: [2, 5] },
      },
      'No line numbers': {
        widget: 'code',
        data: { content: 'echo "Hello, World!"\nls -la /tmp\ngrep -r "pattern" .', language: 'bash' },
        options: { lineNumbers: false },
      },
      'Max height + wrap': {
        widget: 'code',
        data: { content: '// This is a very long line of code that should wrap when the wrap option is enabled to demonstrate word wrapping behavior in the code widget\nconst x = 1;\nconst y = 2;\nconst z = 3;\nconst a = 4;\nconst b = 5;\nconst c = 6;\nconst d = 7;\nconst e = 8;\nconst f = 9;\nconst g = 10;', language: 'javascript' },
        options: { maxHeight: '150px', wrap: true },
      },
    },
  },
  video: {
    label: 'Video',
    group: 'Content',
    ...meta('video'),
    variants: {
      'Basic video': {
        widget: 'video',
        data: { src: 'https://www.w3schools.com/html/mov_bbb.mp4', poster: 'https://placehold.co/640x360', caption: 'Big Buck Bunny' },
      },
      'Autoplay muted loop': {
        widget: 'video',
        data: { src: 'https://www.w3schools.com/html/mov_bbb.mp4' },
        options: { autoplay: true, loop: true, muted: true },
      },
      'No controls': {
        widget: 'video',
        data: { src: 'https://www.w3schools.com/html/mov_bbb.mp4', alt: 'Sample video without controls' },
        options: { controls: false },
      },
    },
  },
  gallery: {
    label: 'Gallery',
    group: 'Content',
    ...meta('gallery'),
    variants: {
      'Auto grid': {
        widget: 'gallery',
        data: [
          { src: 'https://placehold.co/300x200/4f46e5/fff?text=1', alt: 'Image 1' },
          { src: 'https://placehold.co/300x200/22c55e/fff?text=2', alt: 'Image 2' },
          { src: 'https://placehold.co/300x200/f59e0b/fff?text=3', alt: 'Image 3' },
          { src: 'https://placehold.co/300x200/ef4444/fff?text=4', alt: 'Image 4' },
        ],
      },
      'Square 2-column': {
        widget: 'gallery',
        data: [
          { src: 'https://placehold.co/200/4f46e5/fff?text=A', caption: 'Product A' },
          { src: 'https://placehold.co/200/22c55e/fff?text=B', caption: 'Product B' },
          { src: 'https://placehold.co/200/f59e0b/fff?text=C', caption: 'Product C' },
          { src: 'https://placehold.co/200/ef4444/fff?text=D', caption: 'Product D' },
        ],
        options: { columns: 2, aspectRatio: '1:1' },
      },
      '16:9 widescreen': {
        widget: 'gallery',
        title: 'Screenshots',
        data: [
          { src: 'https://placehold.co/640x360/4f46e5/fff?text=Screenshot+1', alt: 'Screenshot 1' },
          { src: 'https://placehold.co/640x360/22c55e/fff?text=Screenshot+2', alt: 'Screenshot 2' },
          { src: 'https://placehold.co/640x360/f59e0b/fff?text=Screenshot+3', alt: 'Screenshot 3' },
        ],
        options: { columns: 3, aspectRatio: '16:9' },
      },
    },
  },
  kv: {
    label: 'Key-Value',
    group: 'Chat',
    ...meta('kv'),
    variants: {
      'Object data': {
        widget: 'kv',
        data: { status: 'Active', plan: 'Pro', region: 'US-East', expires: '2026-03-15' },
      },
      'Array form (ordered)': {
        widget: 'kv',
        data: [
          { key: 'Name', value: 'Alice Kim' },
          { key: 'Email', value: 'alice@example.com' },
          { key: 'Role', value: 'Senior Engineer' },
          { key: 'Team', value: 'Platform' },
        ],
      },
      'Horizontal layout': {
        widget: 'kv',
        data: { CPU: '72%', Memory: '4.2 GB', Disk: '85%', Network: '120 Mbps' },
        options: { layout: 'horizontal' },
      },
      'Grid layout': {
        widget: 'kv',
        data: { Model: 'GPT-4', Tokens: '128K', Temperature: '0.7', 'Top P': '0.9', 'Max Tokens': '4096', Provider: 'OpenAI' },
        options: { layout: 'grid', columns: 3 },
      },
    },
  },
  steps: {
    label: 'Steps',
    group: 'Chat',
    ...meta('steps'),
    variants: {
      'Vertical (default)': {
        widget: 'steps',
        data: [
          { label: 'Data collection', status: 'done', description: '2M records processed' },
          { label: 'Running analysis', status: 'active', description: 'Estimated 30s remaining' },
          { label: 'Report generation', status: 'pending' },
        ],
      },
      'Horizontal': {
        widget: 'steps',
        data: [
          { label: 'Upload', status: 'done' },
          { label: 'Process', status: 'done' },
          { label: 'Review', status: 'active' },
          { label: 'Deploy', status: 'pending' },
        ],
        options: { layout: 'horizontal' },
      },
      'With error': {
        widget: 'steps',
        data: [
          { label: 'Initialize', status: 'done' },
          { label: 'Build', status: 'error', description: 'Build failed: missing dependency' },
          { label: 'Deploy', status: 'pending' },
        ],
      },
      'Compact mode': {
        widget: 'steps',
        data: [
          { label: 'Step 1', status: 'done', description: 'hidden in compact' },
          { label: 'Step 2', status: 'active', description: 'hidden in compact' },
          { label: 'Step 3', status: 'pending' },
        ],
        options: { compact: true },
      },
      'With custom icons': {
        widget: 'steps',
        data: [
          { label: 'Order placed', status: 'done', icon: '\uD83D\uDED2', description: 'Order #12345 confirmed' },
          { label: 'Shipped', status: 'active', icon: '\uD83D\uDE9A', description: 'In transit via FedEx' },
          { label: 'Delivered', status: 'pending', icon: '\uD83D\uDCE6' },
        ],
      },
    },
  },
  rating: {
    label: 'Rating',
    group: 'Chat',
    ...meta('rating'),
    variants: {
      'Star rating (display)': {
        widget: 'rating',
        data: { value: 4.2, count: 128 },
      },
      'Heart rating': {
        widget: 'rating',
        data: { value: 3 },
        options: { icon: 'heart' },
      },
      'Interactive star': {
        widget: 'rating',
        options: { interactive: true, label: 'Rate this answer:' },
      },
      'Half star': {
        widget: 'rating',
        data: { value: 3.5 },
      },
      '10-point scale': {
        widget: 'rating',
        data: { value: 7 },
        options: { max: 10 },
      },
    },
  },
  citation: {
    label: 'Citation',
    group: 'Chat',
    ...meta('citation'),
    variants: {
      'Multiple sources': {
        widget: 'citation',
        data: [
          { title: 'Web Components MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_components', snippet: 'Web Components is a suite of technologies allowing you to create reusable custom elements.', source: 'MDN' },
          { title: 'Lit Documentation', url: 'https://lit.dev/docs/', snippet: 'Lit is a simple library for building fast, lightweight web components.', source: 'lit.dev' },
          { title: 'ECharts Examples', url: 'https://echarts.apache.org/examples/', snippet: 'Apache ECharts provides rich visualization types and interaction.', source: 'Apache' },
        ],
      },
      'Compact mode': {
        widget: 'citation',
        data: [
          { title: 'Source A', url: 'https://example.com/a' },
          { title: 'Source B', url: 'https://example.com/b' },
          { title: 'Source C', url: 'https://example.com/c' },
        ],
        options: { compact: true },
      },
      'No numbers': {
        widget: 'citation',
        data: [
          { title: 'Design Patterns', snippet: 'Reusable solutions to common software design problems.' },
          { title: 'Clean Architecture', snippet: 'A guide to separation of concerns in software systems.' },
        ],
        options: { numbered: false },
      },
      'Single citation': {
        widget: 'citation',
        data: { title: 'u-widgets GitHub', url: 'https://github.com/iyulab/u-widgets', snippet: 'Declarative, data-driven widget system for AI chat interfaces.', source: 'GitHub' },
      },
    },
  },
  status: {
    label: 'Status',
    group: 'Chat',
    ...meta('status'),
    variants: {
      'System health': {
        widget: 'status',
        title: 'System Status',
        data: [
          { label: 'API Gateway', value: 'Operational', level: 'success' },
          { label: 'Database', value: 'Degraded', level: 'warning' },
          { label: 'CDN', value: 'Operational', level: 'success' },
          { label: 'Auth Service', value: 'Down', level: 'error' },
          { label: 'Backup', value: 'Scheduled', level: 'info' },
        ],
      },
      'All levels': {
        widget: 'status',
        data: [
          { label: 'Info', value: 'Informational', level: 'info' },
          { label: 'Success', value: 'All good', level: 'success' },
          { label: 'Warning', value: 'Caution', level: 'warning' },
          { label: 'Error', value: 'Failed', level: 'error' },
          { label: 'Neutral', value: 'N/A', level: 'neutral' },
        ],
      },
      'Single status': {
        widget: 'status',
        data: { label: 'Build', value: 'Passing', level: 'success' },
      },
    },
  },
  actions: {
    label: 'Actions',
    group: 'Chat',
    ...meta('actions'),
    variants: {
      'Quick replies': {
        widget: 'actions',
        actions: [
          { label: 'Revenue analysis', action: 'analyze_revenue' },
          { label: 'Customer status', action: 'customer_status' },
          { label: 'Inventory check', action: 'check_inventory' },
        ],
      },
      'With styles': {
        widget: 'actions',
        actions: [
          { label: 'Approve', action: 'approve', style: 'primary' },
          { label: 'Reject', action: 'reject', style: 'danger' },
          { label: 'Skip', action: 'skip' },
        ],
      },
      'Column layout': {
        widget: 'actions',
        options: { layout: 'column' },
        actions: [
          { label: 'Option A: Restart service', action: 'restart' },
          { label: 'Option B: Scale up instances', action: 'scale_up' },
          { label: 'Option C: Investigate logs', action: 'investigate' },
        ],
      },
    },
  },
  divider: {
    label: 'Divider',
    group: 'Chat',
    ...meta('divider'),
    variants: {
      'Simple': {
        widget: 'divider',
      },
      'With label': {
        widget: 'divider',
        options: { label: 'Related items' },
      },
      'Large spacing': {
        widget: 'divider',
        options: { spacing: 'large', label: 'Section break' },
      },
    },
  },
  header: {
    label: 'Header',
    group: 'Chat',
    ...meta('header'),
    variants: {
      'Level 1': {
        widget: 'header',
        data: { text: 'Dashboard Overview', level: 1 },
      },
      'Level 2 (default)': {
        widget: 'header',
        data: { text: 'Recent Activity' },
      },
      'Level 3': {
        widget: 'header',
        data: { text: 'Subsection Details', level: 3 },
      },
    },
  },

  // ── Layout ──
  compose: {
    label: 'Compose',
    group: 'Layout',
    ...meta('compose'),
    variants: {
      'Grid + span': {
        widget: 'compose',
        title: 'System Overview',
        layout: 'grid',
        columns: 3,
        children: [
          { widget: 'metric', data: { value: 99.9, unit: '%', label: 'Uptime', change: 0.1, trend: 'up' } },
          { widget: 'metric', data: { value: 142, label: 'Requests/s', change: -5, trend: 'down' } },
          { widget: 'gauge', data: { value: 45 }, options: { min: 0, max: 100, unit: '%', thresholds: [{ to: 60, color: 'green' }, { to: 80, color: 'yellow' }, { to: 100, color: 'red' }] } },
          { widget: 'progress', data: { value: 680, max: 1000 }, options: { label: '{value} / 1000 ({percent}%)' }, span: 3 },
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
      'With global actions': {
        widget: 'compose',
        layout: 'grid',
        columns: 2,
        children: [
          { widget: 'kv', data: { Status: 'Running', Version: 'v2.4.1' } },
          { widget: 'metric', data: { value: 99.9, unit: '%', label: 'Uptime' } },
        ],
        actions: [
          { label: 'Restart', action: 'restart', style: 'danger' },
          { label: 'View Logs', action: 'view_logs', style: 'primary' },
        ],
      },
      'Column widths (1:3)': {
        widget: 'compose',
        layout: 'grid',
        columns: 2,
        options: { widths: [1, 3] },
        children: [
          { widget: 'kv', data: { Plan: 'Pro', Status: 'Active', Expires: '2026-12' } },
          { widget: 'table', data: [{ name: 'Alice', role: 'Engineer', hours: 32 }, { name: 'Bob', role: 'Designer', hours: 28 }] },
        ],
      },
      'Column widths (auto + stretch)': {
        widget: 'compose',
        layout: 'grid',
        columns: 3,
        options: { widths: ['auto', 2, 1] },
        children: [
          { widget: 'metric', data: { value: 42, label: 'ID' } },
          { widget: 'metric', data: { value: 99.9, unit: '%', label: 'Uptime' } },
          { widget: 'gauge', data: { value: 73 }, options: { min: 0, max: 100, unit: '%' } },
        ],
      },
      'Collapsed section': {
        widget: 'compose',
        children: [
          { widget: 'kv', data: { Summary: 'All systems operational', Updated: '2 min ago' } },
          { widget: 'table', title: 'Detailed Logs', collapsed: true, data: [{ time: '10:00', event: 'Deploy v2.4.1' }, { time: '09:45', event: 'Build passed' }, { time: '09:30', event: 'Tests passed' }] },
          { widget: 'code', title: 'Raw Output', collapsed: true, data: { content: '{"status":"ok","uptime":99.9}', language: 'json' } },
        ],
      },
      'Card grid': {
        widget: 'compose',
        title: 'Dashboard',
        layout: 'grid',
        columns: 2,
        options: { card: true },
        children: [
          { widget: 'metric', data: { value: 99.9, unit: '%', label: 'Uptime', icon: '\u2705' } },
          { widget: 'metric', data: { value: 142, label: 'Requests/s', icon: '\u26A1' } },
          { widget: 'progress', data: { value: 680, max: 1000 }, options: { label: '{value} / 1000' }, span: 2 },
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

// ── Props Panel (powered by specSurface from library) ──

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderSection(title: string, body: string): string {
  return `<div class="props-section"><div class="props-section-title">${title}</div>${body}</div>`;
}

function renderPropInfoList(items: PropInfo[]): string {
  let html = '<ul class="props-list">';
  for (const p of items) {
    html += `<li><span class="prop-key">${esc(p.key)}</span> <span class="prop-type">${esc(p.type)}</span>`;
    if (p.desc) html += ` <span class="prop-desc">${esc(p.desc)}</span>`;
    html += '</li>';
  }
  html += '</ul>';
  return html;
}

function renderBadges(items: readonly string[], cls: string): string {
  let html = '<div class="props-badges">';
  for (const item of items) {
    html += `<span class="${cls}">${esc(item)}</span>`;
  }
  html += '</div>';
  return html;
}

function renderSurface(surface: SpecSurface): string {
  let html = '';

  if (surface.specKeys.length > 0) {
    html += renderSection('Spec Keys', renderBadges(surface.specKeys, 'doc-badge shape'));
  }
  if (surface.dataFields.length > 0) {
    html += renderSection('Data Fields', renderPropInfoList(surface.dataFields));
  }
  if (surface.mappingKeys.length > 0) {
    html += renderSection('Mapping', renderPropInfoList(surface.mappingKeys));
  }
  if (surface.optionKeys.length > 0) {
    html += renderSection('Options', renderPropInfoList(surface.optionKeys));
  }
  if (surface.fieldProps.length > 0) {
    html += renderSection('Field Properties', renderPropInfoList(surface.fieldProps));
  }
  if (surface.fieldTypes.length > 0) {
    html += renderSection('Field Types', renderBadges(surface.fieldTypes, 'props-badge'));
  }
  if (surface.actionStyles.length > 0) {
    html += renderSection('Action Styles', renderBadges(surface.actionStyles, 'props-badge'));
  }
  if (surface.events.length > 0) {
    html += renderSection('Events', renderBadges([...surface.events], 'props-badge'));
  }

  return html;
}

function updatePropsPanel(widgetType: string) {
  const entry = catalog[activeKey];
  if (!entry) { propsPanel.innerHTML = ''; return; }

  const surface = specSurface(
    Object.values(entry.variants) as Record<string, unknown>[],
    widgetType,
  );
  propsPanel.innerHTML = renderSurface(surface);
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
  const isDark = document.body.classList.toggle('dark');
  themeBtn.textContent = isDark ? 'Light Mode' : 'Dark Mode';
  document.querySelectorAll('u-widget').forEach(el => {
    if (isDark) el.setAttribute('theme', 'dark');
    else el.removeAttribute('theme');
  });
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
