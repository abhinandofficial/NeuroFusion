from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, field_validator


class ClinicalData(BaseModel):
    mmse: float = Field(
        ...,
        ge=0.0,
        le=30.0,
        description="Mini-Mental State Examination score (0 to 30; higher = better cognitive function)",
        examples=[28.0]
    )
    cdrsb: float = Field(
        ...,
        ge=0.0,
        le=18.0,
        description="Clinical Dementia Rating Sum of Boxes (0 to 18; 0 = normal, higher = more severe impairment)",
        examples=[0.0]
    )
    age: float = Field(
        ...,
        ge=40.0,
        le=110.0,
        description="Patient age in years (ADNI cohort range: 50-95)",
        examples=[72.0]
    )
    sex: str = Field(
        ...,
        description="Biological sex ('Male' or 'Female')",
        examples=["Male"]
    )
    education: float = Field(
        ...,
        ge=0.0,
        le=30.0,
        description="Years of formal education (ADNI cohort range: 4-20)",
        examples=[16.0]
    )

    @field_validator("sex")
    @classmethod
    def validate_sex(cls, v: str) -> str:
        cleaned = v.strip().capitalize()
        if cleaned not in ["Male", "Female"]:
            raise ValueError("Sex must be either 'Male' or 'Female'")
        return cleaned


class VolumeInfo(BaseModel):
    original_shape: List[int]
    resampled_shape: List[int]
    min_intensity: float
    max_intensity: float
    mean_intensity: float


class PredictionResponse(BaseModel):
    predicted_class: str
    probabilities: Dict[str, float]
    confidence: float
    risk_level: str
    interpretation: str
    clinical_dominance_note: str
    model_mode: str
    volume_info: VolumeInfo
    inference_time_ms: float
    disclaimer: str
    session_id: Optional[str] = None
    patient_coords: Optional[Dict[str, float]] = None


class SliceRequest(BaseModel):
    axial_idx: Optional[int] = None
    coronal_idx: Optional[int] = None
    sagittal_idx: Optional[int] = None


class SliceData(BaseModel):
    dimensions: List[int]
    current_slices: Dict[str, int]
    axial: str  # Base64 encoded PNG
    coronal: str  # Base64 encoded PNG
    sagittal: str  # Base64 encoded PNG


class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    model_mode: str
    weights_loaded: bool
    weights_path: str
    device: str
    message: str


class SamplePatient(BaseModel):
    id: str
    label: str
    category: str
    age: float
    sex: str
    education: float
    mmse: float
    cdrsb: float
    summary: str
    nii_available: bool


class OperatingPoint(BaseModel):
    threshold: float
    tp: int
    fp: int
    tn: int
    fn: int
    sensitivity: float
    sensitivity_ci95: List[float]
    specificity: float
    specificity_ci95: List[float]
    ppv: float
    ppv_ci95: List[float]
    npv: float
    npv_ci95: List[float]
    fpr: float
    tpr: float


class OperatingPointsResponse(BaseModel):
    cohort_summary: Dict[str, Any]
    caveat: str
    operating_points: List[OperatingPoint]
    roc_curve: List[Dict[str, float]]


class RepresentationPoint(BaseModel):
    id: str
    split: str
    diagnosis: str
    mmse: float
    cdrsb: float
    age: float
    sex: str
    education: float
    pca_x: float
    pca_y: float
    umap_x: float
    umap_y: float


class RepresentationResponse(BaseModel):
    cohort_summary: Dict[str, Any]
    separation_metrics: Dict[str, Any]
    points: List[RepresentationPoint]
    current_patient_coords: Optional[Dict[str, float]] = None


class ExplainabilityRequest(BaseModel):
    session_id: str
    method: str = "sensitivity"  # sensitivity, guided_backprop, occlusion, area_occlusion
    preset: str = "fast"         # fast, standard, detailed
    use_smoothgrad: bool = True


class ExplainabilityStatusResponse(BaseModel):
    job_id: str
    session_id: str
    status: str  # pending, running, completed, failed, cancelled
    progress: float
    method: str
    preset: str
    mri_influence_pct: Optional[float] = None
    pairwise_correlations: Optional[Dict[str, float]] = None
    volume_url: Optional[str] = None
    error: Optional[str] = None
