import type {
  HealthStatus,
  ResearchMetrics,
  SamplePatient,
  PredictionApiResponse,
  ClinicalFormValues,
  SliceData,
  OperatingPointsResponse,
  RepresentationResponse,
  ExplainabilityRequest,
  ExplainabilityStatusResponse
} from './types';

const API_BASE = '/api';

export async function getHealth(): Promise<HealthStatus> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend not yet reachable, using fallback health state:', err);
    return {
      status: 'demo',
      app_name: 'NeuroFusion Web',
      version: '1.0.0',
      model_mode: 'calibrated_demo',
      weights_loaded: false,
      weights_path: 'backend/weights/best_model_multimodal.pt',
      device: 'cpu',
      message: 'Operating in Calibrated Demo Mode. Backend running locally.'
    };
  }
}

export async function getResearchMetrics(): Promise<ResearchMetrics> {
  try {
    const res = await fetch(`${API_BASE}/metrics`);
    if (!res.ok) throw new Error(`Metrics failed: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn('Using built-in static research metrics:', err);
    return {
      summary: {
        model_name: "MedicalNet ResNet10 + Clinical Feature Fusion",
        task: "Binary CN vs Dementia Classification",
        auc_roc: 0.997,
        confidence_interval_95: [0.935, 1.000],
        test_subjects_count: 92,
        total_adni_subjects: 559,
        binary_subset_subjects: 330
      },
      per_class: [
        { class_name: "Cognitively Normal (CN)", precision: 0.96, recall: 1.00, f1_score: 0.98, support: 70 },
        { class_name: "Alzheimer's Disease", precision: 1.00, recall: 0.86, f1_score: 0.93, support: 22 }
      ],
      confusion_matrix: {
        labels: ["Cognitively Normal (CN)", "Alzheimer's Disease"],
        matrix: [[70, 0], [3, 19]],
        normalized: [[1.0, 0.0], [0.136, 0.864]],
        total: 92
      },
      ablation_study: [
        { id: "mri-only-binary", model: "MedicalNet ResNet10", features: "MRI only (binary)", auc: 0.578, notes: "Predicts predominantly CN; misses dementia scans lacking clinical context." },
        { id: "mri-only-3class", model: "MedicalNet ResNet10", features: "MRI only (3-class: CN/MCI/AD)", auc: 0.635, notes: "Pretrained 3D weights capture subtle features, but MCI boundary is noisy." },
        { id: "mri-demographics", model: "MultimodalResNet", features: "MRI + Age / Sex / Education", auc: 0.699, notes: "Honest imaging & demographic contribution without cognitive test leakage." },
        { id: "multimodal-full", model: "MultimodalResNet", features: "MRI + All Clinical Biomarkers", auc: 0.997, notes: "End-to-end multimodal fusion pipeline evaluated on 92 test subjects." },
        { id: "logistic-regression", model: "Logistic Regression", features: "MMSE + CDR + Demographics alone", auc: 1.000, notes: "Cognitive scores alone achieve near-perfect separation on curated cohort." }
      ],
      roc_curves: [
        { fpr: 0.0, mri_only_bin: 0.0, mri_only_3c: 0.0, mri_demog: 0.0, multimodal: 0.0, clinical_only: 0.0 },
        { fpr: 0.02, mri_only_bin: 0.06, mri_only_3c: 0.12, mri_demog: 0.22, multimodal: 0.86, clinical_only: 1.0 },
        { fpr: 0.05, mri_only_bin: 0.14, mri_only_3c: 0.25, mri_demog: 0.41, multimodal: 0.95, clinical_only: 1.0 },
        { fpr: 0.10, mri_only_bin: 0.22, mri_only_3c: 0.38, mri_demog: 0.56, multimodal: 0.98, clinical_only: 1.0 },
        { fpr: 0.20, mri_only_bin: 0.35, mri_only_3c: 0.52, mri_demog: 0.70, multimodal: 0.99, clinical_only: 1.0 },
        { fpr: 0.30, mri_only_bin: 0.44, mri_only_3c: 0.62, mri_demog: 0.79, multimodal: 1.0, clinical_only: 1.0 },
        { fpr: 0.50, mri_only_bin: 0.60, mri_only_3c: 0.74, mri_demog: 0.87, multimodal: 1.0, clinical_only: 1.0 },
        { fpr: 0.70, mri_only_bin: 0.75, mri_only_3c: 0.86, mri_demog: 0.94, multimodal: 1.0, clinical_only: 1.0 },
        { fpr: 1.0, mri_only_bin: 1.0, mri_only_3c: 1.0, mri_demog: 1.0, multimodal: 1.0, clinical_only: 1.0 }
      ],
      research_journey: [
        { step: 1, title: "Attempt 1: DenseNet121 From Scratch (3-Class)", metric: "Overfit: Train Acc 97% vs Val Acc 47%", status: "Failed", description: "Training a 121-layer 3D network with random initialization on only 325 subjects led to severe memorization." },
        { step: 2, title: "Attempt 2: MedicalNet 3D Transfer Learning (3-Class)", metric: "Test AUC 0.635", status: "Promising", description: "Adopted MedicalNet ResNet10 pretrained on 23 distinct 3D medical imaging datasets, stabilizing convergence." },
        { step: 3, title: "Attempt 3: Binary Classification (Imaging Only)", metric: "Test AUC 0.578", status: "Suboptimal", description: "Simplifying to CN vs Dementia without MCI still underperformed; the model defaulted to predicting CN." },
        { step: 4, title: "Attempt 4: Multimodal Dual-Stream Fusion", metric: "Test AUC 0.997", status: "Breakthrough", description: "Integrated a parallel clinical MLP with ResNet10, transparently isolating the MMSE/CDR contribution while preserving neuroanatomical MRI features." }
      ],
      why_mri_matters: [
        { title: "Exclusion Diagnosis", body: "Structural MRI rules out non-Alzheimer's etiologies (e.g. brain tumors, normal pressure hydrocephalus, stroke) that mimic dementia symptoms." },
        { title: "Preclinical Detection", body: "Hippocampal and entorhinal atrophy begin up to a decade prior to measurable cognitive decline on MMSE/CDRSB tests." },
        { title: "Automated Scalability", body: "Standardized volumetric MRI analysis can enable high-throughput screening without requiring extensive clinician neuropsychology testing." },
        { title: "Addressing Cohort Selection Bias", body: "ADNI enrolls well-characterized cohorts with stark cognitive separation; real-world clinical presentations are far more ambiguous." }
      ],
      limitations: [
        { title: "Clinical Feature Leakage", body: "MMSE and CDRSB are direct diagnostic criteria. The ablation proves they account for most of the 0.997 AUC, highlighting the need to evaluate models without cognitive shortcuts." },
        { title: "Curated Dataset Size", body: "330 binary subjects (92 in held-out test split) from 1.5T scanners represents a focused cohort requiring multi-scanner 3T validation." },
        { title: "Multimodal Explainability Gap", body: "Single-modality Grad-CAM cannot straightforwardly localize joint cross-attention in late concatenation fusion architectures." }
      ],
      dataset_info: {
        name: "Alzheimer's Disease Neuroimaging Initiative (ADNI)",
        phase: "ADNI1 Baseline",
        cohort_size: "559 total (330 binary CN + Dementia)",
        test_set_size: "92 subjects (70 CN, 22 Dementia)",
        modality: "T1-weighted MPRAGE 1.5 Tesla",
        standardization: "GradWarp, B1-Correction, N3 Intensity Bias Correction, Scaled",
        resolution: "128 x 128 x 128 voxel volume (trilinear resampled)"
      }
    };
  }
}

export async function getSamples(): Promise<SamplePatient[]> {
  try {
    const res = await fetch(`${API_BASE}/samples`);
    if (!res.ok) throw new Error(`Samples failed: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn('Using built-in sample patient definitions:', err);
    return [
      {
        id: "patient-cn-01",
        label: "Subject 041_S_0125 (Cognitively Normal)",
        category: "Cognitively Normal (CN)",
        age: 74.0,
        sex: "Male",
        education: 18.0,
        mmse: 29.0,
        cdrsb: 0.0,
        filename: "sample_cn.nii.gz",
        summary: "74yo male, Master's degree, MMSE 29/30 (unimpaired), CDRSB 0.0. Structural MRI demonstrates preserved cortical thickness and normal ventricular boundaries."
      },
      {
        id: "patient-dem-01",
        label: "Subject 027_S_0404 (Alzheimer's Dementia)",
        category: "Alzheimer's Disease",
        age: 88.0,
        sex: "Female",
        education: 14.0,
        mmse: 20.0,
        cdrsb: 6.0,
        filename: "sample_dementia.nii.gz",
        summary: "88yo female, MMSE 20/30 (marked cognitive impairment), CDRSB 6.0. Structural MRI exhibits ventriculomegaly and pronounced bilateral temporal horn enlargement."
      },
      {
        id: "patient-mild-01",
        label: "Subject 031_S_0321 (Borderline / Early Decline)",
        category: "Alzheimer's Disease",
        age: 69.0,
        sex: "Male",
        education: 18.0,
        mmse: 26.0,
        cdrsb: 1.5,
        filename: "sample_dementia.nii.gz",
        summary: "69yo male, MMSE 26/30, CDRSB 1.5 (mild symptoms). Demonstrates subtle ventricular enlargement and early temporal volume loss."
      }
    ];
  }
}

export async function predictWithUpload(
  file: File,
  clinical: ClinicalFormValues
): Promise<PredictionApiResponse> {
  const formData = new FormData();
  formData.append('nifti_file', file);
  formData.append('mmse', clinical.mmse.toString());
  formData.append('cdrsb', clinical.cdrsb.toString());
  formData.append('age', clinical.age.toString());
  formData.append('sex', clinical.sex);
  formData.append('education', clinical.education.toString());

  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Prediction failed (${res.status})`);
  }

  return await res.json();
}

export async function predictSamplePatient(
  sampleId: string
): Promise<PredictionApiResponse> {
  const res = await fetch(`${API_BASE}/samples/${sampleId}/predict`, {
    method: 'POST',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Sample prediction failed (${res.status})`);
  }

  return await res.json();
}

export async function fetchOrthogonalSlice(params: {
  sessionId?: string;
  sampleId?: string;
  axial?: number;
  coronal?: number;
  sagittal?: number;
}): Promise<SliceData> {
  const query = new URLSearchParams();
  if (params.sessionId) query.append('session_id', params.sessionId);
  if (params.sampleId) query.append('sample_id', params.sampleId);
  if (params.axial !== undefined) query.append('axial', params.axial.toString());
  if (params.coronal !== undefined) query.append('coronal', params.coronal.toString());
  if (params.sagittal !== undefined) query.append('sagittal', params.sagittal.toString());

  const res = await fetch(`${API_BASE}/mri/slice?${query.toString()}`, {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch updated MRI slice (${res.status})`);
  }

  return await res.json();
}

export async function getOperatingPoints(): Promise<OperatingPointsResponse> {
  const res = await fetch(`${API_BASE}/operating-points`);
  if (!res.ok) throw new Error(`Failed to fetch operating points (${res.status})`);
  return await res.json();
}

export async function getRepresentationPoints(params?: Partial<ClinicalFormValues>): Promise<RepresentationResponse> {
  const query = new URLSearchParams();
  if (params) {
    if (params.mmse !== undefined) query.append('mmse', params.mmse.toString());
    if (params.cdrsb !== undefined) query.append('cdrsb', params.cdrsb.toString());
    if (params.age !== undefined) query.append('age', params.age.toString());
    if (params.sex !== undefined) query.append('sex', params.sex);
    if (params.education !== undefined) query.append('education', params.education.toString());
  }

  const url = query.toString() ? `${API_BASE}/representations/points?${query.toString()}` : `${API_BASE}/representations/points`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch representation points (${res.status})`);
  return await res.json();
}

export async function deleteSession(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/session/${sessionId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`Failed to purge session (${res.status})`);
}

export async function requestExplainability(req: ExplainabilityRequest): Promise<ExplainabilityStatusResponse> {
  const res = await fetch(`${API_BASE}/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Explainability request failed (${res.status})`);
  }
  return await res.json();
}

export async function getExplainabilityStatus(jobId: string): Promise<ExplainabilityStatusResponse> {
  const res = await fetch(`${API_BASE}/explain/${jobId}`);
  if (!res.ok) throw new Error(`Failed to check explainability status (${res.status})`);
  return await res.json();
}

export async function getExplainabilityVolume(jobId: string, method: string): Promise<{ data: Float32Array; shape: [number, number, number] }> {
  const res = await fetch(`${API_BASE}/explain/${jobId}/${method}`);
  if (!res.ok) throw new Error(`Failed to load attribution volume (${res.status})`);
  
  const dimsHeader = res.headers.get('X-Dimensions');
  const dims: [number, number, number] = dimsHeader
    ? (dimsHeader.split(',').map(Number) as [number, number, number])
    : [128, 128, 128];

  const buffer = await res.arrayBuffer();
  const data = new Float32Array(buffer);
  return { data, shape: dims };
}

export async function cancelExplainabilityJob(jobId: string): Promise<void> {
  await fetch(`${API_BASE}/explain/${jobId}`, { method: 'DELETE' });
}

