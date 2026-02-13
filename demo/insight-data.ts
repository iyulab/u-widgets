// ── u-insight Mock Data ──
// Simulates u-insight output structures for u-widgets visualization testing.
// Based on Iris-like dataset: 150 rows, 4 numeric + 1 categorical column.

// ── Dataset Profile (overview) ──

export const datasetProfile = {
  row_count: 150,
  column_count: 5,
  memory_bytes: 12400,
  total_nulls: 8,
  sparsity_pct: 1.07,
  duplicate_count: 3,
  duplicate_pct: 2.0,
  type_counts: { numeric: 4, boolean: 0, categorical: 1, text: 0 },
  quality_score: {
    completeness: 0.989,
    uniqueness: 0.98,
    validity: 0.95,
    consistency: 0.92,
    overall: 0.962,
  },
};

// ── Column Profiles ──

export const columnProfiles = [
  {
    name: 'sepal_length',
    data_type: 'Numeric',
    row_count: 150,
    null_count: 2,
    missing_pct: 1.33,
    numeric: {
      valid_count: 148,
      min: 4.3, max: 7.9, mean: 5.843, median: 5.8,
      std_dev: 0.828, variance: 0.686,
      skewness: 0.314, kurtosis: -0.552,
      p5: 4.6, q1: 5.1, q3: 6.4, p95: 7.3, iqr: 1.3,
      zero_count: 0, negative_count: 0, infinity_count: 0, distinct_count: 35,
    },
    outliers: { method: 'IQR', indices: [15, 131], count: 2, pct: 1.35 },
    diagnostics: [],
  },
  {
    name: 'sepal_width',
    data_type: 'Numeric',
    row_count: 150,
    null_count: 1,
    missing_pct: 0.67,
    numeric: {
      valid_count: 149,
      min: 2.0, max: 4.4, mean: 3.057, median: 3.0,
      std_dev: 0.436, variance: 0.190,
      skewness: 0.319, kurtosis: 0.228,
      p5: 2.4, q1: 2.8, q3: 3.3, p95: 3.8, iqr: 0.5,
      zero_count: 0, negative_count: 0, infinity_count: 0, distinct_count: 23,
    },
    outliers: { method: 'IQR', indices: [15, 32, 33], count: 3, pct: 2.01 },
    diagnostics: [],
  },
  {
    name: 'petal_length',
    data_type: 'Numeric',
    row_count: 150,
    null_count: 3,
    missing_pct: 2.0,
    numeric: {
      valid_count: 147,
      min: 1.0, max: 6.9, mean: 3.758, median: 4.35,
      std_dev: 1.765, variance: 3.116,
      skewness: -0.274, kurtosis: -1.402,
      p5: 1.2, q1: 1.6, q3: 5.1, p95: 6.4, iqr: 3.5,
      zero_count: 0, negative_count: 0, infinity_count: 0, distinct_count: 43,
    },
    outliers: { method: 'IQR', indices: [], count: 0, pct: 0 },
    diagnostics: [],
  },
  {
    name: 'petal_width',
    data_type: 'Numeric',
    row_count: 150,
    null_count: 2,
    missing_pct: 1.33,
    numeric: {
      valid_count: 148,
      min: 0.1, max: 2.5, mean: 1.199, median: 1.3,
      std_dev: 0.762, variance: 0.581,
      skewness: -0.103, kurtosis: -1.341,
      p5: 0.2, q1: 0.3, q3: 1.8, p95: 2.3, iqr: 1.5,
      zero_count: 0, negative_count: 0, infinity_count: 0, distinct_count: 22,
    },
    outliers: { method: 'IQR', indices: [], count: 0, pct: 0 },
    diagnostics: [],
  },
  {
    name: 'species',
    data_type: 'Categorical',
    row_count: 150,
    null_count: 0,
    missing_pct: 0,
    categorical: {
      valid_count: 150,
      distinct_count: 3,
      top_values: [
        ['setosa', 50], ['versicolor', 50], ['virginica', 50],
      ] as [string, number][],
      mode_ratio: 0.333,
      is_constant: false,
    },
    diagnostics: [],
  },
];

// ── Correlation Analysis ──

// Full correlation matrix for heatmap
export const correlationMatrix = [
  { row: 'sepal_length', col: 'sepal_length', r: 1.000 },
  { row: 'sepal_length', col: 'sepal_width', r: -0.118 },
  { row: 'sepal_length', col: 'petal_length', r: 0.872 },
  { row: 'sepal_length', col: 'petal_width', r: 0.818 },
  { row: 'sepal_width', col: 'sepal_length', r: -0.118 },
  { row: 'sepal_width', col: 'sepal_width', r: 1.000 },
  { row: 'sepal_width', col: 'petal_length', r: -0.428 },
  { row: 'sepal_width', col: 'petal_width', r: -0.366 },
  { row: 'petal_length', col: 'sepal_length', r: 0.872 },
  { row: 'petal_length', col: 'sepal_width', r: -0.428 },
  { row: 'petal_length', col: 'petal_length', r: 1.000 },
  { row: 'petal_length', col: 'petal_width', r: 0.963 },
  { row: 'petal_width', col: 'sepal_length', r: 0.818 },
  { row: 'petal_width', col: 'sepal_width', r: -0.366 },
  { row: 'petal_width', col: 'petal_length', r: 0.963 },
  { row: 'petal_width', col: 'petal_width', r: 1.000 },
];

export const correlationHighPairs = [
  { col_a: 'petal_length', col_b: 'petal_width', r: 0.963, p_value: 0.0001 },
  { col_a: 'sepal_length', col_b: 'petal_length', r: 0.872, p_value: 0.0001 },
  { col_a: 'sepal_length', col_b: 'petal_width', r: 0.818, p_value: 0.0001 },
  { col_a: 'sepal_width', col_b: 'petal_length', r: -0.428, p_value: 0.0001 },
  { col_a: 'sepal_width', col_b: 'petal_width', r: -0.366, p_value: 0.0001 },
];

// Scatter data for the highest correlation pair (petal_length vs petal_width)
export const correlationScatter = [
  { petal_length: 1.4, petal_width: 0.2 }, { petal_length: 1.4, petal_width: 0.2 },
  { petal_length: 1.3, petal_width: 0.2 }, { petal_length: 1.5, petal_width: 0.2 },
  { petal_length: 1.4, petal_width: 0.2 }, { petal_length: 1.7, petal_width: 0.4 },
  { petal_length: 1.4, petal_width: 0.3 }, { petal_length: 1.5, petal_width: 0.2 },
  { petal_length: 4.7, petal_width: 1.4 }, { petal_length: 4.5, petal_width: 1.5 },
  { petal_length: 4.9, petal_width: 1.5 }, { petal_length: 4.0, petal_width: 1.3 },
  { petal_length: 4.6, petal_width: 1.5 }, { petal_length: 3.3, petal_width: 1.0 },
  { petal_length: 4.2, petal_width: 1.3 }, { petal_length: 4.2, petal_width: 1.2 },
  { petal_length: 6.0, petal_width: 2.5 }, { petal_length: 5.1, petal_width: 1.9 },
  { petal_length: 5.9, petal_width: 2.1 }, { petal_length: 5.6, petal_width: 1.8 },
  { petal_length: 5.8, petal_width: 2.2 }, { petal_length: 6.6, petal_width: 2.1 },
  { petal_length: 4.5, petal_width: 1.7 }, { petal_length: 6.3, petal_width: 1.8 },
  { petal_length: 5.1, petal_width: 2.3 }, { petal_length: 5.3, petal_width: 1.9 },
  { petal_length: 5.5, petal_width: 2.1 }, { petal_length: 6.7, petal_width: 2.0 },
  { petal_length: 6.9, petal_width: 2.3 }, { petal_length: 5.0, petal_width: 2.0 },
];

// ── Regression (petal_width ~ petal_length) ──

export const regressionResult = {
  target_name: 'petal_width',
  predictor_names: ['petal_length'],
  r_squared: 0.927,
  adj_r_squared: 0.926,
  coefficients: [-0.363, 0.416],  // [intercept, slope]
  p_values: [0.0001, 0.0001],
  f_p_value: 0.0001,
};

export const regressionScatter = correlationScatter.map(d => ({
  petal_length: d.petal_length,
  actual: d.petal_width,
  predicted: +((-0.363 + 0.416 * d.petal_length).toFixed(2)),
}));

// ── Clustering (K-Means, k=3) ──

export const clusteringResult = {
  k: 3,
  wcss: 78.85,
  silhouette: 0.553,
  cluster_sizes: [50, 62, 38],
};

export const clusterSilhouetteByK = [
  { k: 2, silhouette: 0.681 },
  { k: 3, silhouette: 0.553 },
  { k: 4, silhouette: 0.498 },
  { k: 5, silhouette: 0.452 },
  { k: 6, silhouette: 0.378 },
];

// 2D PCA projection with cluster labels
export const clusterScatter = [
  // Cluster 0 (setosa-like, tight group bottom-left)
  { pc1: -2.68, pc2: 0.32, cluster: 0 }, { pc1: -2.71, pc2: -0.18, cluster: 0 },
  { pc1: -2.89, pc2: -0.14, cluster: 0 }, { pc1: -2.75, pc2: -0.32, cluster: 0 },
  { pc1: -2.73, pc2: 0.33, cluster: 0 }, { pc1: -2.28, pc2: 0.74, cluster: 0 },
  { pc1: -2.82, pc2: -0.09, cluster: 0 }, { pc1: -2.63, pc2: 0.17, cluster: 0 },
  { pc1: -2.44, pc2: 0.04, cluster: 0 }, { pc1: -2.96, pc2: -0.90, cluster: 0 },
  // Cluster 1 (versicolor-like, middle)
  { pc1: 1.28, pc2: 0.69, cluster: 1 }, { pc1: 0.93, pc2: -0.32, cluster: 1 },
  { pc1: 1.46, pc2: 0.39, cluster: 1 }, { pc1: 0.18, pc2: -0.21, cluster: 1 },
  { pc1: 1.09, pc2: 0.06, cluster: 1 }, { pc1: 0.64, pc2: 0.42, cluster: 1 },
  { pc1: 1.04, pc2: -0.72, cluster: 1 }, { pc1: 1.24, pc2: 0.17, cluster: 1 },
  { pc1: 0.56, pc2: -0.55, cluster: 1 }, { pc1: 0.35, pc2: 0.89, cluster: 1 },
  // Cluster 2 (virginica-like, top-right)
  { pc1: 2.53, pc2: -0.01, cluster: 2 }, { pc1: 1.41, pc2: -0.57, cluster: 2 },
  { pc1: 2.61, pc2: 0.42, cluster: 2 }, { pc1: 1.97, pc2: -0.43, cluster: 2 },
  { pc1: 2.35, pc2: -0.04, cluster: 2 }, { pc1: 3.39, pc2: 0.55, cluster: 2 },
  { pc1: 0.52, pc2: -1.77, cluster: 2 }, { pc1: 2.93, pc2: 0.35, cluster: 2 },
  { pc1: 2.32, pc2: -0.24, cluster: 2 }, { pc1: 2.91, pc2: 0.78, cluster: 2 },
];

// ── PCA ──

export const pcaResult = {
  n_components: 4,
  explained_variance_ratio: [0.7296, 0.2285, 0.0367, 0.0052],
  cumulative_variance_ratio: [0.7296, 0.9581, 0.9948, 1.0],
  feature_names: ['sepal_length', 'sepal_width', 'petal_length', 'petal_width'],
  loadings: [
    [0.361, -0.085, 0.857, 0.358],   // PC1
    [0.657, 0.730, -0.173, -0.075],   // PC2
    [-0.582, 0.598, 0.076, 0.546],    // PC3
    [0.315, -0.320, -0.480, 0.754],   // PC4
  ],
};

// ── Anomaly Detection (Isolation Forest) ──

export const anomalyResult = {
  anomaly_count: 8,
  anomaly_fraction: 0.053,
  threshold: 0.62,
  // Score distribution (binned)
  score_histogram: [
    { bin: '0.0–0.1', count: 5 },
    { bin: '0.1–0.2', count: 12 },
    { bin: '0.2–0.3', count: 28 },
    { bin: '0.3–0.4', count: 42 },
    { bin: '0.4–0.5', count: 35 },
    { bin: '0.5–0.6', count: 20 },
    { bin: '0.6–0.7', count: 5 },
    { bin: '0.7–0.8', count: 2 },
    { bin: '0.8–0.9', count: 1 },
  ],
  methods_comparison: [
    { method: 'Isolation Forest', anomalies: 8, fraction: 0.053 },
    { method: 'LOF (k=20)', anomalies: 11, fraction: 0.073 },
    { method: 'Mahalanobis', anomalies: 6, fraction: 0.040 },
  ],
};

// ── Distribution (sepal_length) ──

export const distributionResult = {
  column: 'sepal_length',
  n: 148,
  histogram: [
    { bin: '4.3–4.8', count: 10 },
    { bin: '4.8–5.3', count: 25 },
    { bin: '5.3–5.8', count: 32 },
    { bin: '5.8–6.3', count: 30 },
    { bin: '6.3–6.8', count: 27 },
    { bin: '6.8–7.3', count: 16 },
    { bin: '7.3–7.9', count: 8 },
  ],
  qq_plot: [
    { theoretical: -2.33, sample: 4.3 }, { theoretical: -1.88, sample: 4.4 },
    { theoretical: -1.53, sample: 4.6 }, { theoretical: -1.28, sample: 4.8 },
    { theoretical: -1.04, sample: 5.0 }, { theoretical: -0.84, sample: 5.1 },
    { theoretical: -0.67, sample: 5.3 }, { theoretical: -0.52, sample: 5.5 },
    { theoretical: -0.39, sample: 5.6 }, { theoretical: -0.25, sample: 5.7 },
    { theoretical: -0.13, sample: 5.8 }, { theoretical: 0.0, sample: 5.84 },
    { theoretical: 0.13, sample: 5.9 }, { theoretical: 0.25, sample: 6.0 },
    { theoretical: 0.39, sample: 6.1 }, { theoretical: 0.52, sample: 6.3 },
    { theoretical: 0.67, sample: 6.4 }, { theoretical: 0.84, sample: 6.6 },
    { theoretical: 1.04, sample: 6.8 }, { theoretical: 1.28, sample: 7.1 },
    { theoretical: 1.53, sample: 7.3 }, { theoretical: 1.88, sample: 7.6 },
    { theoretical: 2.33, sample: 7.9 },
  ],
  normality_tests: [
    { test: 'Kolmogorov-Smirnov', statistic: 0.049, p_value: 0.200, rejected: false },
    { test: 'Jarque-Bera', statistic: 2.12, p_value: 0.346, rejected: false },
    { test: 'Shapiro-Wilk', statistic: 0.976, p_value: 0.010, rejected: true },
    { test: 'Anderson-Darling', statistic: 0.567, p_value: 0.134, rejected: false },
  ],
  is_normal: false,
  fit_results: [
    { distribution: 'Normal', aic: 365.2, bic: 371.2 },
    { distribution: 'LogNormal', aic: 368.1, bic: 374.1 },
    { distribution: 'Gamma', aic: 370.5, bic: 376.5 },
  ],
};

// ── Feature Importance ──

export const featureImportance = {
  scores: [
    { name: 'petal_length', importance: 0.92, variance: 3.116, max_abs_correlation: 0.963, vif: 15.1 },
    { name: 'petal_width', importance: 0.88, variance: 0.581, max_abs_correlation: 0.963, vif: 14.2 },
    { name: 'sepal_length', importance: 0.64, variance: 0.686, max_abs_correlation: 0.872, vif: 7.1 },
    { name: 'sepal_width', importance: 0.34, variance: 0.190, max_abs_correlation: 0.428, vif: 2.1 },
  ],
  high_correlations: [
    { feature_a: 'petal_length', feature_b: 'petal_width', correlation: 0.963 },
    { feature_a: 'sepal_length', feature_b: 'petal_length', correlation: 0.872 },
  ],
  anova: [
    { name: 'petal_length', f_statistic: 1180.16, p_value: 0.0001 },
    { name: 'petal_width', f_statistic: 960.01, p_value: 0.0001 },
    { name: 'sepal_length', f_statistic: 119.26, p_value: 0.0001 },
    { name: 'sepal_width', f_statistic: 49.16, p_value: 0.0001 },
  ],
  mutual_info: [
    { name: 'petal_length', mi: 1.089 },
    { name: 'petal_width', mi: 1.014 },
    { name: 'sepal_length', mi: 0.682 },
    { name: 'sepal_width', mi: 0.401 },
  ],
};
