from typing import Dict, Any, List


STATIC_RESEARCH_METRICS: Dict[str, Any] = {
    "summary": {
        "model_name": "MedicalNet ResNet10 + Clinical Feature Fusion",
        "task": "Binary CN vs Dementia Classification",
        "test_accuracy": 96.74,
        "auc_roc": 0.997,
        "confidence_interval_95": [0.935, 1.000],
        "test_subjects_count": 92,
        "total_adni_subjects": 559,
        "binary_subset_subjects": 330
    },
    "per_class": [
        {
            "class_name": "Cognitively Normal (CN)",
            "precision": 0.96,
            "recall": 1.00,
            "f1_score": 0.98,
            "support": 70
        },
        {
            "class_name": "Alzheimer's Disease",
            "precision": 1.00,
            "recall": 0.86,
            "f1_score": 0.93,
            "support": 22
        }
    ],
    "confusion_matrix": {
        "labels": ["Cognitively Normal (CN)", "Alzheimer's Disease"],
        "matrix": [
            [70, 0],
            [3, 19]
        ],
        "normalized": [
            [1.0, 0.0],
            [0.136, 0.864]
        ],
        "total": 92
    },
    "ablation_study": [
        {
            "id": "mri-only-binary",
            "model": "MedicalNet ResNet10",
            "features": "MRI only (binary)",
            "auc": 0.578,
            "notes": "Predicts predominantly CN; misses dementia scans lacking clinical context."
        },
        {
            "id": "mri-only-3class",
            "model": "MedicalNet ResNet10",
            "features": "MRI only (3-class: CN/MCI/AD)",
            "auc": 0.635,
            "notes": "Pretrained 3D weights capture subtle features, but MCI boundary is noisy."
        },
        {
            "id": "mri-demographics",
            "model": "MultimodalResNet",
            "features": "MRI + Age / Sex / Education",
            "auc": 0.699,
            "notes": "Honest imaging & demographic contribution without cognitive test leakage."
        },
        {
            "id": "multimodal-full",
            "model": "MultimodalResNet",
            "features": "MRI + All Clinical Biomarkers",
            "auc": 0.997,
            "notes": "End-to-end multimodal fusion pipeline evaluated on 92 test subjects."
        },
        {
            "id": "logistic-regression",
            "model": "Logistic Regression",
            "features": "MMSE + CDR + Demographics alone",
            "auc": 1.000,
            "notes": "Cognitive scores alone achieve near-perfect separation on curated cohort."
        }
    ],
    "roc_curves": [
        {"fpr": 0.0, "mri_only_bin": 0.0, "mri_only_3c": 0.0, "mri_demog": 0.0, "multimodal": 0.0, "clinical_only": 0.0},
        {"fpr": 0.02, "mri_only_bin": 0.06, "mri_only_3c": 0.12, "mri_demog": 0.22, "multimodal": 0.86, "clinical_only": 1.0},
        {"fpr": 0.05, "mri_only_bin": 0.14, "mri_only_3c": 0.25, "mri_demog": 0.41, "multimodal": 0.95, "clinical_only": 1.0},
        {"fpr": 0.10, "mri_only_bin": 0.22, "mri_only_3c": 0.38, "mri_demog": 0.56, "multimodal": 0.98, "clinical_only": 1.0},
        {"fpr": 0.20, "mri_only_bin": 0.35, "mri_only_3c": 0.52, "mri_demog": 0.70, "multimodal": 0.99, "clinical_only": 1.0},
        {"fpr": 0.30, "mri_only_bin": 0.44, "mri_only_3c": 0.62, "mri_demog": 0.79, "multimodal": 1.0, "clinical_only": 1.0},
        {"fpr": 0.50, "mri_only_bin": 0.60, "mri_only_3c": 0.74, "mri_demog": 0.87, "multimodal": 1.0, "clinical_only": 1.0},
        {"fpr": 0.70, "mri_only_bin": 0.75, "mri_only_3c": 0.86, "mri_demog": 0.94, "multimodal": 1.0, "clinical_only": 1.0},
        {"fpr": 1.0, "mri_only_bin": 1.0, "mri_only_3c": 1.0, "mri_demog": 1.0, "multimodal": 1.0, "clinical_only": 1.0}
    ],
    "research_journey": [
        {
            "step": 1,
            "title": "Attempt 1: DenseNet121 From Scratch (3-Class)",
            "metric": "Overfit: Train Acc 97% vs Val Acc 47%",
            "status": "Failed",
            "description": "Training a 121-layer 3D network with random initialization on only 325 subjects led to severe memorization. The architecture was overparameterized for the limited sample size."
        },
        {
            "step": 2,
            "title": "Attempt 2: MedicalNet 3D Transfer Learning (3-Class)",
            "metric": "Test AUC 0.635",
            "status": "Promising",
            "description": "Adopted MedicalNet ResNet10 pretrained on 23 distinct 3D medical imaging datasets. Stabilized convergence and captured genuine neuroanatomical signal, but MCI remained clinically ambiguous."
        },
        {
            "step": 3,
            "title": "Attempt 3: Binary Classification (Imaging Only)",
            "metric": "Test AUC 0.578",
            "status": "Suboptimal",
            "description": "Simplifying the problem to CN vs Dementia without MCI still underperformed. The model defaulted to predicting CN and struggled to identify dementia from structural T1 scans in isolation."
        },
        {
            "step": 4,
            "title": "Attempt 4: Multimodal Dual-Stream Fusion",
            "metric": "Test AUC 0.997",
            "status": "Breakthrough",
            "description": "Integrated a parallel clinical MLP with ResNet10. The subsequent systematic ablation revealed that while clinical scores dominate diagnostic certainty, MRI + demographics delivers an honest AUC of 0.699."
        }
    ],
    "why_mri_matters": [
        {
            "title": "Exclusion Diagnosis",
            "body": "Structural MRI rules out non-Alzheimer's etiologies (e.g. subdural hematomas, brain tumors, normal pressure hydrocephalus, stroke) that mimic dementia cognitive decline but require distinct urgent interventions."
        },
        {
            "title": "Preclinical Detection",
            "body": "Entorhinal cortex and hippocampal volume loss initiate up to a decade prior to measurable cognitive decline on MMSE/CDRSB tests, offering the optimal therapeutic window."
        },
        {
            "title": "Automated Scalability",
            "body": "Comprehensive neuropsychological evaluations demand skilled clinical neuropsychologists and 45-90 minutes per patient. Automated MRI volumetry can facilitate standardized population triage."
        },
        {
            "title": "Addressing Cohort Selection Bias",
            "body": "ADNI enrolls well-characterized cohorts with stark cognitive separation. In real-world clinical referrals, presentations are mixed and atypical, where MRI provides critical discriminative signal."
        }
    ],
    "limitations": [
        {
            "title": "Clinical Feature Leakage",
            "body": "MMSE and CDRSB are direct diagnostic criteria in research protocols. The ablation proves they account for most of the 0.997 AUC, highlighting the necessity of evaluating models without cognitive shortcuts."
        },
        {
            "title": "Curated Dataset Size",
            "body": "330 binary subjects (92 in the held-out test split) from 1.5T scanners represents a focused cohort. Validation on multi-scanner, multi-ethnic 3T datasets is essential for generalizability."
        },
        {
            "title": "Multimodal Explainability Gap",
            "body": "Single-modality Grad-CAM cannot straightforwardly localize joint cross-attention in late concatenation fusion architectures, requiring further work in multimodal interpretability."
        }
    ],
    "dataset_info": {
        "name": "Alzheimer's Disease Neuroimaging Initiative (ADNI)",
        "phase": "ADNI1 Baseline",
        "cohort_size": "559 total (330 binary CN + Dementia)",
        "test_set_size": "92 subjects (70 CN, 22 Dementia)",
        "modality": "T1-weighted MPRAGE 1.5 Tesla",
        "standardization": "GradWarp, B1-Correction, N3 Intensity Bias Correction, Scaled",
        "resolution": "128 x 128 x 128 voxel volume (trilinear resampled)"
    }
}
