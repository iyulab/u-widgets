// Register u-widget and u-chart custom elements
import '../src/elements/u-widget.ts';
import '../src/elements/u-chart.ts';

import {
  datasetProfile, columnProfiles,
  correlationHighPairs, correlationScatter,
  regressionResult, regressionScatter,
  clusteringResult, clusterSilhouetteByK, clusterScatter,
  pcaResult,
  anomalyResult,
  distributionResult,
  featureImportance,
} from './insight-data.ts';

// ── Analysis Categories ──

interface Category {
  label: string;
  group: string;
  description: string;
  render: () => void;
}

const categories: Record<string, Category> = {
  overview: {
    label: 'Overview',
    group: 'Profiling',
    description: 'Dataset-level profiling summary: quality scores, type distribution, key metrics.',
    render: renderOverview,
  },
  columns: {
    label: 'Columns',
    group: 'Profiling',
    description: 'Column-level profiling: descriptive statistics, missing analysis, outlier detection.',
    render: renderColumns,
  },
  correlation: {
    label: 'Correlation',
    group: 'Analysis',
    description: 'Pearson/Spearman correlation analysis: high pairs, scatter plots.',
    render: renderCorrelation,
  },
  regression: {
    label: 'Regression',
    group: 'Analysis',
    description: 'OLS regression: R-squared, coefficients, actual vs predicted.',
    render: renderRegression,
  },
  clustering: {
    label: 'Clustering',
    group: 'Analysis',
    description: 'K-Means clustering: cluster sizes, 2D projection, optimal K search.',
    render: renderClustering,
  },
  pca: {
    label: 'PCA',
    group: 'Analysis',
    description: 'Principal Component Analysis: scree plot, cumulative variance, 2D projection.',
    render: renderPCA,
  },
  anomaly: {
    label: 'Anomaly',
    group: 'Analysis',
    description: 'Anomaly detection: Isolation Forest scores, normal vs anomaly comparison.',
    render: renderAnomaly,
  },
  distribution: {
    label: 'Distribution',
    group: 'Analysis',
    description: 'Distribution analysis: histogram, QQ-plot, normality tests.',
    render: renderDistribution,
  },
  features: {
    label: 'Features',
    group: 'Analysis',
    description: 'Feature importance: composite scores, VIF, ANOVA, mutual information.',
    render: renderFeatures,
  },
};

// ── DOM References ──

const sidebar = document.getElementById('sidebar')!;
const contentEl = document.getElementById('content')!;
const themeBtn = document.getElementById('theme-btn')!;

// ── Sidebar ──

function buildSidebar() {
  const groups: Record<string, string[]> = {};
  for (const [key, cat] of Object.entries(categories)) {
    (groups[cat.group] ??= []).push(key);
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
      btn.textContent = categories[key].label;
      btn.dataset.key = key;
      btn.addEventListener('click', () => selectCategory(key));
      sidebar.appendChild(btn);
    }
  }
}

function updateSidebarActive(key: string) {
  sidebar.querySelectorAll('.sidebar-item').forEach((el) => {
    (el as HTMLElement).classList.toggle('active', (el as HTMLElement).dataset.key === key);
  });
}

// ── Category Selection ──

type WidgetElement = HTMLElement & { spec: unknown };

function selectCategory(key: string) {
  const cat = categories[key];
  if (!cat) return;

  updateSidebarActive(key);
  contentEl.innerHTML = `
    <div class="section-title">${cat.label}</div>
    <div class="section-desc">${cat.description}</div>
    <div id="section-content"></div>
  `;

  cat.render();
}

// ── Helper: create widget card via property binding ──

function addWidget(container: HTMLElement, title: string, spec: object, className = 'widget-card'): void {
  const card = document.createElement('div');
  card.className = className;
  card.innerHTML = `<h3>${title}</h3>`;
  const widget = document.createElement('u-widget') as WidgetElement;
  widget.spec = spec;
  card.appendChild(widget);
  container.appendChild(card);
}

function addGap(container: HTMLElement, id: string, desc: string): void {
  const div = document.createElement('div');
  div.className = 'gap-notice';
  div.textContent = `GAP ${id}: ${desc}`;
  container.appendChild(div);
}

function makeGrid(wide = false): HTMLDivElement {
  const grid = document.createElement('div');
  grid.className = wide ? 'widget-grid-wide' : 'widget-grid';
  return grid;
}

function getSection(): HTMLElement {
  return document.getElementById('section-content')!;
}

// ── Render: Overview ──

function renderOverview(): void {
  const section = getSection();
  const qs = datasetProfile.quality_score;

  // Quality scores — compose with gauges
  addWidget(section, 'Data Quality', {
    widget: 'compose',
    title: 'Quality Scores',
    layout: 'grid',
    columns: 5,
    children: [
      {
        widget: 'gauge',
        title: 'Completeness',
        data: { value: +(qs.completeness * 100).toFixed(1) },
        options: {
          min: 0, max: 100, unit: '%',
          thresholds: [{ to: 70, color: 'red' }, { to: 90, color: 'yellow' }, { to: 100, color: 'green' }],
        },
      },
      {
        widget: 'gauge',
        title: 'Uniqueness',
        data: { value: +(qs.uniqueness * 100).toFixed(1) },
        options: {
          min: 0, max: 100, unit: '%',
          thresholds: [{ to: 70, color: 'red' }, { to: 90, color: 'yellow' }, { to: 100, color: 'green' }],
        },
      },
      {
        widget: 'gauge',
        title: 'Validity',
        data: { value: +(qs.validity * 100).toFixed(1) },
        options: {
          min: 0, max: 100, unit: '%',
          thresholds: [{ to: 70, color: 'red' }, { to: 90, color: 'yellow' }, { to: 100, color: 'green' }],
        },
      },
      {
        widget: 'gauge',
        title: 'Consistency',
        data: { value: +(qs.consistency * 100).toFixed(1) },
        options: {
          min: 0, max: 100, unit: '%',
          thresholds: [{ to: 70, color: 'red' }, { to: 90, color: 'yellow' }, { to: 100, color: 'green' }],
        },
      },
      {
        widget: 'gauge',
        title: 'Overall',
        data: { value: +(qs.overall * 100).toFixed(1) },
        options: {
          min: 0, max: 100, unit: '%',
          thresholds: [{ to: 70, color: 'red' }, { to: 90, color: 'yellow' }, { to: 100, color: 'green' }],
        },
      },
    ],
  }, 'widget-card');

  // Key stats
  const grid = makeGrid();
  section.appendChild(grid);

  addWidget(grid, 'Dataset Summary', {
    widget: 'stat-group',
    data: [
      { value: datasetProfile.row_count, label: 'Rows' },
      { value: datasetProfile.column_count, label: 'Columns' },
      { value: datasetProfile.total_nulls, label: 'Nulls' },
      { value: datasetProfile.duplicate_count, label: 'Duplicates' },
    ],
  });

  addWidget(grid, 'Column Type Distribution', {
    widget: 'chart.pie',
    data: [
      { type: 'Numeric', count: datasetProfile.type_counts.numeric },
      { type: 'Boolean', count: datasetProfile.type_counts.boolean },
      { type: 'Categorical', count: datasetProfile.type_counts.categorical },
      { type: 'Text', count: datasetProfile.type_counts.text },
    ].filter(d => d.count > 0),
  });

  // Sparsity & duplicates progress bars
  const grid2 = makeGrid();
  section.appendChild(grid2);

  addWidget(grid2, 'Data Sparsity', {
    widget: 'progress',
    data: { value: datasetProfile.sparsity_pct, max: 100 },
    options: {
      label: '{value}% missing cells',
      thresholds: [{ to: 5, color: 'green' }, { to: 20, color: 'yellow' }, { to: 100, color: 'red' }],
    },
  });

  addWidget(grid2, 'Duplicate Rows', {
    widget: 'progress',
    data: { value: datasetProfile.duplicate_pct, max: 100 },
    options: {
      label: '{value}% duplicates',
      thresholds: [{ to: 5, color: 'green' }, { to: 20, color: 'yellow' }, { to: 100, color: 'red' }],
    },
  });
}

// ── Render: Columns ──

function renderColumns(): void {
  const section = getSection();

  // Column overview table
  addWidget(section, 'Column Summary', {
    widget: 'table',
    data: columnProfiles.map(c => ({
      name: c.name,
      type: c.data_type,
      nulls: c.null_count,
      missing: c.missing_pct + '%',
      distinct: c.numeric?.distinct_count ?? c.categorical?.distinct_count ?? '-',
    })),
    mapping: {
      columns: [
        { field: 'name', label: 'Column' },
        { field: 'type', label: 'Type' },
        { field: 'nulls', label: 'Nulls', align: 'right' },
        { field: 'missing', label: 'Missing', align: 'right' },
        { field: 'distinct', label: 'Distinct', align: 'right' },
      ],
    },
  }, 'widget-card');

  // Numeric column stats
  const numericCols = columnProfiles.filter(c => c.numeric);
  for (const col of numericCols) {
    const n = col.numeric!;
    const grid = makeGrid();
    const label = document.createElement('div');
    label.className = 'section-title';
    label.style.fontSize = '0.95rem';
    label.style.marginTop = '1rem';
    label.textContent = col.name;
    section.appendChild(label);
    section.appendChild(grid);

    addWidget(grid, 'Descriptive Statistics', {
      widget: 'stat-group',
      data: [
        { value: n.mean, label: 'Mean' },
        { value: n.median, label: 'Median' },
        { value: n.std_dev, label: 'Std Dev' },
        { value: n.skewness, label: 'Skewness' },
      ],
    });

    addWidget(grid, 'Range & Quartiles', {
      widget: 'stat-group',
      data: [
        { value: n.min, label: 'Min' },
        { value: n.q1, label: 'Q1' },
        { value: n.q3, label: 'Q3' },
        { value: n.max, label: 'Max' },
      ],
    });

    // Missing rate as progress
    addWidget(grid, 'Missing Rate', {
      widget: 'progress',
      data: { value: col.missing_pct, max: 100 },
      options: {
        label: col.null_count + ' null values ({percent}%)',
        thresholds: [{ to: 5, color: 'green' }, { to: 20, color: 'yellow' }, { to: 100, color: 'red' }],
      },
    });
  }

  // Categorical column
  const catCols = columnProfiles.filter(c => c.categorical);
  for (const col of catCols) {
    const cat = col.categorical!;
    const label = document.createElement('div');
    label.className = 'section-title';
    label.style.fontSize = '0.95rem';
    label.style.marginTop = '1rem';
    label.textContent = col.name;
    section.appendChild(label);

    const grid = makeGrid();
    section.appendChild(grid);

    addWidget(grid, 'Value Frequency', {
      widget: 'chart.bar',
      data: cat.top_values.map(([name, count]) => ({ name, count })),
      mapping: { x: 'name', y: 'count' },
    });

    addWidget(grid, 'Category Stats', {
      widget: 'stat-group',
      data: [
        { value: cat.distinct_count, label: 'Distinct' },
        { value: +(cat.mode_ratio * 100).toFixed(1), label: 'Mode Ratio %' },
      ],
    });
  }

  addGap(section, 'G-04', 'Box plot 미지원 — 수치형 컬럼의 min/Q1/median/Q3/max 시각화에 이상적이나 u-widgets에 chart.box 없음');
}

// ── Render: Correlation ──

function renderCorrelation(): void {
  const section = getSection();

  addGap(section, 'G-01', 'Heatmap 미지원 — 상관행렬(n×n)을 시각적으로 표현할 chart.heatmap 위젯 없음');

  addWidget(section, 'High Correlation Pairs', {
    widget: 'table',
    data: correlationHighPairs.map(p => ({
      ...p,
      r: p.r.toFixed(3),
      p_value: p.p_value < 0.001 ? '<0.001' : p.p_value.toFixed(3),
    })),
    mapping: {
      columns: [
        { field: 'col_a', label: 'Variable A' },
        { field: 'col_b', label: 'Variable B' },
        { field: 'r', label: 'r', align: 'right' },
        { field: 'p_value', label: 'p-value', align: 'right' },
      ],
    },
  }, 'widget-card');

  addWidget(section, 'Scatter: petal_length vs petal_width (r = 0.963)', {
    widget: 'chart.scatter',
    data: correlationScatter,
  }, 'widget-card');
}

// ── Render: Regression ──

function renderRegression(): void {
  const section = getSection();
  const r = regressionResult;

  const grid = makeGrid();
  section.appendChild(grid);

  addWidget(grid, 'Model Fit', {
    widget: 'gauge',
    title: 'R-squared',
    data: { value: +(r.r_squared * 100).toFixed(1) },
    options: {
      min: 0, max: 100, unit: '%',
      thresholds: [{ to: 50, color: 'red' }, { to: 75, color: 'yellow' }, { to: 100, color: 'green' }],
    },
  });

  addWidget(grid, 'Model Summary', {
    widget: 'stat-group',
    data: [
      { value: r.r_squared, label: 'R²' },
      { value: r.adj_r_squared, label: 'Adj R²' },
      { value: r.coefficients[0], label: 'Intercept' },
      { value: r.coefficients[1], label: 'Slope' },
    ],
  });

  addWidget(section, 'Coefficients', {
    widget: 'chart.bar',
    data: [
      { name: 'Intercept', value: r.coefficients[0] },
      ...r.predictor_names.map((n, i) => ({ name: n, value: r.coefficients[i + 1] })),
    ],
    mapping: { x: 'name', y: 'value' },
  }, 'widget-card');

  addWidget(section, 'Actual vs Predicted (petal_width)', {
    widget: 'chart.scatter',
    data: regressionScatter.map(d => ({ actual: d.actual, predicted: d.predicted })),
  }, 'widget-card');

  // G-05 resolved: referenceLines now supported via options.referenceLines
}

// ── Render: Clustering ──

function renderClustering(): void {
  const section = getSection();
  const c = clusteringResult;

  const grid = makeGrid();
  section.appendChild(grid);

  addWidget(grid, 'Clustering Summary', {
    widget: 'stat-group',
    data: [
      { value: c.k, label: 'Clusters (K)' },
      { value: c.wcss, label: 'WCSS' },
      { value: c.silhouette, label: 'Silhouette' },
    ],
  });

  addWidget(grid, 'Cluster Sizes', {
    widget: 'chart.pie',
    data: c.cluster_sizes.map((size, i) => ({ cluster: `Cluster ${i}`, size })),
  });

  addWidget(section, 'Optimal K (Silhouette Score)', {
    widget: 'chart.line',
    data: clusterSilhouetteByK,
    mapping: { x: 'k', y: 'silhouette' },
  }, 'widget-card');

  addWidget(section, '2D PCA Projection (colored by cluster)', {
    widget: 'chart.scatter',
    data: clusterScatter,
    mapping: { x: 'pc1', y: 'pc2', color: 'cluster' },
  }, 'widget-card');

  // G-02 resolved: scatter color mapping now supported via mapping.color
  addGap(section, 'G-03', 'Dendrogram 미지원 — 계층적 클러스터링 결과(merge tree) 시각화 불가');
}

// ── Render: PCA ──

function renderPCA(): void {
  const section = getSection();
  const p = pcaResult;

  addWidget(section, 'PCA Summary', {
    widget: 'stat-group',
    data: [
      { value: p.n_components, label: 'Components' },
      { value: +(p.cumulative_variance_ratio[1] * 100).toFixed(1), label: 'PC1+PC2 (%)' },
    ],
  }, 'widget-card');

  const grid = makeGrid();
  section.appendChild(grid);

  addWidget(grid, 'Scree Plot (Explained Variance)', {
    widget: 'chart.bar',
    data: p.explained_variance_ratio.map((v, i) => ({
      component: `PC${i + 1}`,
      variance: +(v * 100).toFixed(1),
    })),
    mapping: { x: 'component', y: 'variance' },
  });

  addWidget(grid, 'Cumulative Variance', {
    widget: 'chart.area',
    data: p.cumulative_variance_ratio.map((v, i) => ({
      component: `PC${i + 1}`,
      cumulative: +(v * 100).toFixed(1),
    })),
    mapping: { x: 'component', y: 'cumulative' },
  });

  addWidget(section, 'PC1 vs PC2 Projection', {
    widget: 'chart.scatter',
    data: clusterScatter.map(d => ({ pc1: d.pc1, pc2: d.pc2 })),
  }, 'widget-card');

  addWidget(section, 'PC1 Loadings (Feature Contributions)', {
    widget: 'chart.bar',
    data: p.feature_names.map((name, i) => ({
      feature: name,
      loading: p.loadings[0][i],
    })),
    mapping: { x: 'feature', y: 'loading' },
  }, 'widget-card');
}

// ── Render: Anomaly ──

function renderAnomaly(): void {
  const section = getSection();
  const a = anomalyResult;

  const grid = makeGrid();
  section.appendChild(grid);

  addWidget(grid, 'Detection Summary', {
    widget: 'stat-group',
    data: [
      { value: a.anomaly_count, label: 'Anomalies' },
      { value: +(a.anomaly_fraction * 100).toFixed(1), label: 'Fraction (%)' },
      { value: a.threshold, label: 'Threshold' },
    ],
  });

  addWidget(grid, 'Score Distribution (IF)', {
    widget: 'chart.bar',
    data: a.score_histogram,
    mapping: { x: 'bin', y: 'count' },
  });

  addWidget(section, 'Method Comparison', {
    widget: 'table',
    data: a.methods_comparison.map(m => ({
      ...m,
      fraction: (m.fraction * 100).toFixed(1) + '%',
    })),
    mapping: {
      columns: [
        { field: 'method', label: 'Method' },
        { field: 'anomalies', label: 'Anomalies', align: 'right' },
        { field: 'fraction', label: 'Fraction', align: 'right' },
      ],
    },
  }, 'widget-card');

  // G-05 resolved: threshold reference line added above via options.referenceLines
  // G-02 resolved: scatter color mapping now supported via mapping.color
}

// ── Render: Distribution ──

function renderDistribution(): void {
  const section = getSection();
  const d = distributionResult;

  addWidget(section, `${d.column} — Normality`, {
    widget: 'metric',
    data: {
      value: d.is_normal ? 'Yes' : 'No',
      label: 'Is Normal?',
    },
  }, 'widget-card');

  const grid = makeGrid();
  section.appendChild(grid);

  addWidget(grid, 'Histogram', {
    widget: 'chart.bar',
    data: d.histogram,
    mapping: { x: 'bin', y: 'count' },
  });

  addWidget(grid, 'QQ-Plot (Normal)', {
    widget: 'chart.scatter',
    data: d.qq_plot,
    mapping: { x: 'theoretical', y: 'sample' },
  });

  addWidget(section, 'Normality Tests', {
    widget: 'table',
    data: d.normality_tests.map(t => ({
      ...t,
      statistic: t.statistic.toFixed(3),
      p_value: t.p_value.toFixed(3),
      rejected: t.rejected ? 'REJECTED' : 'NOT REJECTED',
    })),
    mapping: {
      columns: [
        { field: 'test', label: 'Test' },
        { field: 'statistic', label: 'Statistic', align: 'right' },
        { field: 'p_value', label: 'p-value', align: 'right' },
        { field: 'rejected', label: 'Result' },
      ],
    },
  }, 'widget-card');

  addWidget(section, 'Distribution Fit (AIC)', {
    widget: 'table',
    data: d.fit_results,
    mapping: {
      columns: [
        { field: 'distribution', label: 'Distribution' },
        { field: 'aic', label: 'AIC', align: 'right' },
        { field: 'bic', label: 'BIC', align: 'right' },
      ],
    },
  }, 'widget-card');

  addGap(section, 'G-06', 'Step 함수 라인 미지원 — ECDF 시각화에 chart.line의 step 모드 필요');
  addGap(section, 'G-08', 'Histogram 전용 모드 없음 — bin edges 기반 히스토그램이 chart.bar와 약간 다른 의미');
}

// ── Render: Features ──

function renderFeatures(): void {
  const section = getSection();
  const f = featureImportance;

  addWidget(section, 'Feature Importance (Composite Score)', {
    widget: 'chart.bar',
    data: f.scores.map(s => ({ feature: s.name, importance: s.importance })),
    mapping: { x: 'feature', y: 'importance' },
  }, 'widget-card');

  const grid = makeGrid();
  section.appendChild(grid);

  addWidget(grid, 'VIF (Variance Inflation Factor)', {
    widget: 'chart.bar',
    data: f.scores.map(s => ({ feature: s.name, vif: s.vif })),
    mapping: { x: 'feature', y: 'vif' },
    options: {
      referenceLines: [
        { axis: 'y', value: 10, label: 'VIF=10', color: '#dc2626', style: 'dashed' },
      ],
    },
  });

  addWidget(grid, 'Mutual Information', {
    widget: 'chart.bar',
    data: f.mutual_info.map(m => ({ feature: m.name, mi: m.mi })),
    mapping: { x: 'feature', y: 'mi' },
  });

  addWidget(section, 'High Correlation Pairs', {
    widget: 'table',
    data: f.high_correlations.map(p => ({
      ...p,
      correlation: p.correlation.toFixed(3),
    })),
    mapping: {
      columns: [
        { field: 'feature_a', label: 'Feature A' },
        { field: 'feature_b', label: 'Feature B' },
        { field: 'correlation', label: 'Correlation', align: 'right' },
      ],
    },
  }, 'widget-card');

  addWidget(section, 'ANOVA F-test', {
    widget: 'table',
    data: f.anova.map(a => ({
      ...a,
      f_statistic: a.f_statistic.toFixed(2),
      p_value: a.p_value < 0.001 ? '<0.001' : a.p_value.toFixed(3),
    })),
    mapping: {
      columns: [
        { field: 'name', label: 'Feature' },
        { field: 'f_statistic', label: 'F-statistic', align: 'right' },
        { field: 'p_value', label: 'p-value', align: 'right' },
      ],
    },
  }, 'widget-card');

  // G-05 resolved: VIF threshold reference line added above via options.referenceLines
}

// ── Theme Toggle ──

themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  themeBtn.textContent = document.body.classList.contains('dark') ? 'Light Mode' : 'Dark Mode';
});

// ── Init ──

buildSidebar();
selectCategory('overview');
