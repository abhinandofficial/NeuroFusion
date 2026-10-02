export interface ClinicalFormValues {
  mmse: number;
  cdrsb: number;
  age: number;
  sex: 'Male' | 'Female';
  education: number;
}

export interface VolumeInfo {
  original_shape: number[];
  resampled_shape: number[];
  min_intensity: number;
  max_intensity: number;
  mean_intensity: number;
}

export interface PredictionResult {
  predicted_class: 'Cognitively Normal (CN)' | "Alzheimer's Disease";
  probabilities: {
    'Cognitively Normal (CN)': number;
    "Alzheimer's Disease": number;
  };
  confidence: number;
  risk_level: 'Low' | 'Moderate' | 'High' | 'Very High';
  interpretation: string;
  clinical_dominance_note: string;
  model_mode: 'pytorch_weights' | 'calibrated_demo';
  volume_info: VolumeInfo;
  inference_time_ms: number;
  disclaimer: string;
  session_id?: string;
  patient_coords?: {
    pca_x: number;
    pca_y: number;
    umap_x: number;
    umap_y: number;
  };
}

export interface SliceData {
  dimensions: [number, number, number];
  current_slices: {
    axial: number;
    coronal: number;
    sagittal: number;
  };
  axial: string; // Base64 data URI
  coronal: string; // Base64 data URI
  sagittal: string; // Base64 data URI
}

export interface PredictionApiResponse {
  prediction: PredictionResult;
  session_id: string;
  slices: SliceData;
}

export interface SamplePatient {
  id: string;
  label: string;
  category: string;
  age: number;
  sex: 'Male' | 'Female';
  education: number;
  mmse: number;
  cdrsb: number;
  filename: string;
  summary: string;
}

export interface PerClassMetric {
  class_name: string;
  precision: number;
  recall: number;
  f1_score: number;
  support: number;
}

export interface AblationStudyItem {
  id: string;
  model: string;
  features: string;
  auc: number;
  notes: string;
}

export interface ResearchJourneyItem {
  step: number;
  title: string;
  metric: string;
  status: 'Failed' | 'Promising' | 'Suboptimal' | 'Breakthrough';
  description: string;
}

export interface ResearchMetrics {
  summary: {
    model_name: string;
    task: string;
    test_accuracy?: number;
    auc_roc: number;
    confidence_interval_95: [number, number];
    test_subjects_count: number;
    total_adni_subjects: number;
    binary_subset_subjects: number;
  };
  per_class: PerClassMetric[];
  confusion_matrix: {
    labels: string[];
    matrix: number[][];
    normalized: number[][];
    total: number;
  };
  ablation_study: AblationStudyItem[];
  roc_curves: Array<{
    fpr: number;
    mri_only_bin: number;
    mri_only_3c: number;
    mri_demog: number;
    multimodal: number;
    clinical_only: number;
  }>;
  research_journey: ResearchJourneyItem[];
  why_mri_matters: Array<{ title: string; body: string }>;
  limitations: Array<{ title: string; body: string }>;
  dataset_info: Record<string, string>;
}

export interface HealthStatus {
  status: string;
  app_name: string;
  version: string;
  model_mode: 'pytorch_weights' | 'calibrated_demo';
  weights_loaded: boolean;
  weights_path: string;
  device: string;
  message: string;
}

export interface OperatingPoint {
  threshold: number;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  sensitivity: number;
  sensitivity_ci95: [number, number];
  specificity: number;
  specificity_ci95: [number, number];
  ppv: number;
  ppv_ci95: [number, number];
  npv: number;
  npv_ci95: [number, number];
  fpr: number;
  tpr: number;
}

export interface OperatingPointsResponse {
  cohort_summary: {
    test_total: number;
    dementia_count: number;
    cn_count: number;
    source: string;
  };
  caveat: string;
  operating_points: OperatingPoint[];
  roc_curve: Array<{ threshold: number; fpr: number; tpr: number }>;
}

export interface RepresentationPoint {
  id: string;
  split: string;
  diagnosis: 'CN' | 'Dementia';
  mmse: number;
  cdrsb: number;
  age: number;
  sex: string;
  education: number;
  pca_x: number;
  pca_y: number;
  umap_x: number;
  umap_y: number;
}

export interface MetricSplitValue {
  train_val: number;
  test: number;
}

export interface SeparationMetrics {
  space: string;
  silhouette_score: MetricSplitValue;
  knn_5_accuracy: MetricSplitValue;
  linear_probe_auc: MetricSplitValue;
}

export interface RepresentationResponse {
  cohort_summary: {
    total_samples: number;
    train_val_count: number;
    test_count: number;
    cn_count: number;
    dementia_count: number;
    pca_explained_variance_ratio: number[];
  };
  separation_metrics: {
    pca: SeparationMetrics;
    umap: SeparationMetrics;
    note: string;
  };
  points: RepresentationPoint[];
  current_patient_coords?: {
    pca_x: number;
    pca_y: number;
    umap_x: number;
    umap_y: number;
  };
}

export type ExplainMethod = 'sensitivity' | 'guided_backprop' | 'occlusion' | 'area_occlusion';
export type ExplainPreset = 'fast' | 'standard' | 'detailed';

export interface ExplainabilityRequest {
  session_id: string;
  method: ExplainMethod;
  preset: ExplainPreset;
  use_smoothgrad?: boolean;
}

export interface ExplainabilityStatusResponse {
  job_id: string;
  session_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  method: ExplainMethod;
  preset: ExplainPreset;
  mri_influence_pct?: number;
  pairwise_correlations?: Record<string, number>;
  volume_url?: string;
  error?: string;
}

