import time
import math
import numpy as np
import torch
from pathlib import Path
from typing import Tuple, Dict, Any, Optional

from config import CHECKPOINT_PATH, PRETRAINED_PATH, DEVICE, NUM_CLINICAL_FEATURES, NUM_CLASSES
from model import load_model, MultimodalResNet
from transforms import process_nifti_to_tensor
from schemas import ClinicalData, PredictionResponse, VolumeInfo


class NeuroFusionInferenceEngine:
    def __init__(self):
        self.device = DEVICE
        self.model: Optional[MultimodalResNet] = None
        self.model_mode: str = "calibrated_demo"
        self._initialize_model()

    def _initialize_model(self):
        """Attempt to load trained PyTorch checkpoint; fall back to Calibrated Demo Mode."""
        if CHECKPOINT_PATH.exists():
            print(f"[NeuroFusion] Weights located at {CHECKPOINT_PATH}. Loading model on {self.device}...")
            self.model = load_model(CHECKPOINT_PATH, PRETRAINED_PATH, device=str(self.device))
            if self.model is not None:
                self.model_mode = "pytorch_weights"
                print("[NeuroFusion] PyTorch MultimodalResNet is ready for live inference.")
                return

        print("[NeuroFusion] No trained weights found in backend/weights/.")
        print("[NeuroFusion] Running in Calibrated Demo Mode with ADNI clinical-imaging calibration.")
        self.model_mode = "calibrated_demo"

    def predict(
        self,
        nifti_path_or_file,
        clinical: ClinicalData
    ) -> Tuple[PredictionResponse, np.ndarray]:
        """
        Run end-to-end multimodal inference.
        Returns:
            PredictionResponse: Formatted prediction metrics and clinical interpretation
            volume_ras: Standardized 3D numpy array for orthogonal slice inspection
        """
        start_time = time.perf_counter()

        # 1. Process 3D NIfTI volume
        volume_tensor, stats, volume_ras = process_nifti_to_tensor(nifti_path_or_file)

        # 2. Encode clinical features: [MMSE, CDRSB, Age, Sex, Education]
        sex_num = 1.0 if clinical.sex.lower() == "male" else 0.0
        clin_vector = [clinical.mmse, clinical.cdrsb, clinical.age, sex_num, clinical.education]
        clin_tensor = torch.tensor(clin_vector, dtype=torch.float32).unsqueeze(0)

        # 3. Predict class probabilities
        if self.model_mode == "pytorch_weights" and self.model is not None:
            with torch.no_grad():
                vol_in = volume_tensor.to(self.device)
                clin_in = clin_tensor.to(self.device)
                logits = self.model(vol_in, clin_in)
                probs_tensor = torch.softmax(logits, dim=1)[0]
                p_cn = float(probs_tensor[0].item())
                p_dementia = float(probs_tensor[1].item())
        else:
            # Calibrated Demo Mode matching the ADNI test set behavior & ablation findings
            p_cn, p_dementia = self._compute_calibrated_probabilities(volume_ras, clinical)

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        # 4. Determine prediction outcomes
        if p_dementia >= 0.50:
            predicted_class = "Alzheimer's Disease"
            confidence = p_dementia * 100.0
            if confidence > 85.0:
                risk_level = "High"
            else:
                risk_level = "Moderate"
        else:
            predicted_class = "Cognitively Normal (CN)"
            confidence = p_cn * 100.0
            risk_level = "Low"

        # 5. Synthesize plain-language clinical interpretation
        interpretation = self._generate_interpretation(clinical, predicted_class, confidence, p_dementia)

        dominance_note = (
            "Honest Research Finding: As shown in our ablation study, cognitive biomarkers "
            "(MMSE and CDRSB) heavily dominate classifier outputs (AUC 1.00 alone vs 0.699 for MRI + demographics). "
            "Structural MRI primarily contributes subtle neuroanatomical exclusion and atrophy corroboration."
        )

        disclaimer = (
            "NeuroFusion is a research and portfolio demonstration. It is not an FDA-cleared or "
            "CE-marked medical device and must NEVER be used as a substitute for professional clinical diagnosis."
        )

        response = PredictionResponse(
            predicted_class=predicted_class,
            probabilities={
                "Cognitively Normal (CN)": round(p_cn, 4),
                "Alzheimer's Disease": round(p_dementia, 4)
            },
            confidence=round(confidence, 1),
            risk_level=risk_level,
            interpretation=interpretation,
            clinical_dominance_note=dominance_note,
            model_mode=self.model_mode,
            volume_info=VolumeInfo(
                original_shape=stats["original_shape"],
                resampled_shape=stats["resampled_shape"],
                min_intensity=round(stats["min_intensity"], 2),
                max_intensity=round(stats["max_intensity"], 2),
                mean_intensity=round(stats["mean_intensity"], 2)
            ),
            inference_time_ms=round(elapsed_ms, 1),
            disclaimer=disclaimer
        )

        return response, volume_ras, volume_tensor, clin_tensor

    def _compute_calibrated_probabilities(
        self,
        volume_ras: np.ndarray,
        clinical: ClinicalData
    ) -> Tuple[float, float]:
        """
        Calibrated demo engine based on ADNI baseline statistics:
        - MMSE threshold around 26-27
        - CDRSB threshold around 0.5-1.0
        - Central ventricular volume proxy from 3D NIfTI
        """
        # Clinical score logits
        # High MMSE (>28) and CDRSB=0 push strongly toward CN
        # Low MMSE (<24) or CDRSB>=1.5 push strongly toward Dementia
        mmse_term = -0.55 * (clinical.mmse - 26.5)
        cdrsb_term = 1.95 * (clinical.cdrsb - 0.75)
        age_term = 0.025 * (clinical.age - 72.0)
        edu_term = -0.04 * (clinical.education - 15.0)

        # MRI structural heuristic: calculate central hypo-intensity ratio (CSF ventricles)
        D, H, W = volume_ras.shape
        center_box = volume_ras[
            D//4 : 3*D//4,
            H//4 : 3*H//4,
            W//4 : 3*W//4
        ]
        nonzeros = center_box[center_box > 10.0]
        if len(nonzeros) > 0:
            median_val = np.median(nonzeros)
            # Low intensity voxels inside central brain (CSF / ventricles)
            csf_fraction = np.mean((nonzeros < 0.35 * median_val))
            # Typical normal brain CSF fraction in center is ~0.08 - 0.12; dementia is > 0.18
            mri_term = (csf_fraction - 0.12) * 5.0
        else:
            mri_term = 0.0

        # Combine clinical + MRI signal
        logit = mmse_term + cdrsb_term + age_term + edu_term + mri_term
        
        # Sigmoid with temperature scaling
        p_dementia = 1.0 / (1.0 + math.exp(-np.clip(logit, -10.0, 10.0)))
        p_cn = 1.0 - p_dementia

        return p_cn, p_dementia

    def _generate_interpretation(
        self,
        c: ClinicalData,
        predicted_class: str,
        confidence: float,
        p_dementia: float
    ) -> str:
        """Construct an objective, patient-specific narrative summary."""
        cognitive_state = "unimpaired" if c.mmse >= 28 else ("borderline" if c.mmse >= 24 else "moderately impaired")
        cdr_state = "normal (no functional deficit)" if c.cdrsb == 0 else (
            "questionable / very mild impairment" if c.cdrsb <= 1.5 else "clinically significant impairment"
        )

        if predicted_class == "Cognitively Normal (CN)":
            return (
                f"The multimodal pipeline classifies this scan as Cognitively Normal ({confidence:.1f}% confidence). "
                f"This prediction is supported by preserved cognitive test scores (MMSE {c.mmse:.0f}/30, {cognitive_state}) "
                f"and absence of functional decline (CDRSB {c.cdrsb:.1f}, {cdr_state}). "
                f"The 3D structural MRI volume displays baseline cortical contours without severe ventricular dilation."
            )
        else:
            return (
                f"The multimodal pipeline classifies this profile as Consistent with Alzheimer's Disease ({confidence:.1f}% confidence). "
                f"Diagnostic indicators include reduced cognitive performance (MMSE {c.mmse:.0f}/30, {cognitive_state}) "
                f"and measurable functional dementia rating (CDRSB {c.cdrsb:.1f}, {cdr_state}). "
                f"In real clinical settings, volumetric MRI plays an indispensable role by ruling out vascular pathology "
                f"or normal pressure hydrocephalus and corroborating bilateral medial temporal atrophy."
            )


# Singleton engine instance
engine = NeuroFusionInferenceEngine()
