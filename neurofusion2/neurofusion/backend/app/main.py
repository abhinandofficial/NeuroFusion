import os
import io
import json
import time
import uuid
import tempfile
import sys
from pathlib import Path
from typing import Dict, Any, Optional, List

# Ensure backend root is in sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, BackgroundTasks, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from config import CHECKPOINT_PATH, SAMPLES_DIR, ALLOWED_EXTENSIONS
from schemas import (
    ClinicalData,
    PredictionResponse,
    HealthResponse,
    SliceData,
    SamplePatient,
    OperatingPointsResponse,
    RepresentationResponse,
    ExplainabilityRequest,
    ExplainabilityStatusResponse
)
from static_data import STATIC_RESEARCH_METRICS
from sample_data import SAMPLE_PATIENTS, ensure_sample_nifti_files
from inference import engine
from mri_processor import extract_orthogonal_slices
from explainability import (
    EXPLAIN_JOBS,
    SESSION_ATTRIBUTIONS,
    ExplainJob,
    launch_explain_job
)
from analysis.representations import project_patient_point, fit_and_export_representations
from analysis.export_predictions import generate_operating_points
import nibabel as nib
import numpy as np

app = FastAPI(
    title="NeuroFusion API",
    description="Multimodal 3D Deep Learning for Alzheimer's Disease Classification from Brain MRI and Clinical Biomarkers",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ephemeral in-memory session cache for recent volumes (auto-purged for privacy & slice scrubbing)
SESSION_VOLUMES: Dict[str, Dict[str, Any]] = {}
SESSION_MAX_AGE_SEC = 1800  # 30 minutes TTL for clinical review session


def purge_old_sessions():
    """Remove expired in-memory volumes for memory efficiency and patient data privacy."""
    now = time.time()
    expired = [k for k, v in SESSION_VOLUMES.items() if now - v.get("timestamp", 0) > SESSION_MAX_AGE_SEC]
    for k in expired:
        SESSION_VOLUMES.pop(k, None)
        SESSION_ATTRIBUTIONS.pop(k, None)


@app.on_event("startup")
def startup_event():
    """Initialize synthetic sample files on startup."""
    ensure_sample_nifti_files()
    print("[NeuroFusion API] Ready and listening.")


@app.get("/health", response_model=HealthResponse)
def health_check():
    """Health status and model deployment mode."""
    weights_loaded = (engine.model_mode == "pytorch_weights" and engine.model is not None)
    
    if weights_loaded:
        msg = "PyTorch MultimodalResNet initialized with trained ADNI weights."
    else:
        msg = f"Operating in Calibrated Demo Mode. To enable full PyTorch inference, place weights at: {CHECKPOINT_PATH}"

    return HealthResponse(
        status="healthy",
        app_name="NeuroFusion API",
        version="1.0.0",
        model_mode=engine.model_mode,
        weights_loaded=weights_loaded,
        weights_path=str(CHECKPOINT_PATH),
        device=str(engine.device),
        message=msg
    )


@app.get("/metrics")
def get_research_metrics():
    """Static research metrics, ablation study findings, and ADNI cohort details."""
    return STATIC_RESEARCH_METRICS


@app.get("/samples")
def get_sample_patients():
    """List available ADNI demonstration patient profiles."""
    return SAMPLE_PATIENTS


@app.get("/samples/{sample_id}/download")
def download_sample_nii(sample_id: str):
    """Download the sample NIfTI brain volume for testing."""
    patient = next((p for p in SAMPLE_PATIENTS if p["id"] == sample_id), None)
    if not patient:
        raise HTTPException(status_code=404, detail="Sample patient profile not found.")
    
    file_path = SAMPLES_DIR / patient["filename"]
    if not file_path.exists():
        ensure_sample_nifti_files()

    return FileResponse(
        path=str(file_path),
        filename=patient["filename"],
        media_type="application/gzip"
    )


@app.get("/operating-points", response_model=OperatingPointsResponse)
def get_operating_points():
    """Retrieve precomputed decision threshold operating points with Wilson 95% CIs."""
    points_path = Path(__file__).resolve().parent.parent / "analysis" / "results" / "operating_points.json"
    if not points_path.exists():
        data = generate_operating_points()
    else:
        with open(points_path, "r") as f:
            data = json.load(f)
    return data


@app.get("/representations/points", response_model=RepresentationResponse)
def get_representation_points(
    mmse: Optional[float] = Query(None),
    cdrsb: Optional[float] = Query(None),
    age: Optional[float] = Query(None),
    sex: Optional[str] = Query(None),
    education: Optional[float] = Query(None)
):
    """Retrieve PCA and UMAP representation points across cohort and project optional active patient."""
    rep_path = Path(__file__).resolve().parent.parent / "analysis" / "results" / "representations.json"
    if not rep_path.exists():
        data = fit_and_export_representations()
    else:
        with open(rep_path, "r") as f:
            data = json.load(f)

    # Project current patient if clinical features provided
    if mmse is not None and cdrsb is not None and age is not None and sex is not None and education is not None:
        try:
            pt_coords = project_patient_point(mmse=mmse, cdrsb=cdrsb, age=age, sex=sex, education=education)
            data["current_patient_coords"] = pt_coords
        except Exception as e:
            print(f"[Warning] Failed to project patient coordinates: {e}")

    return data


@app.delete("/session/{session_id}")
def delete_session(session_id: str):
    """Explicitly delete ephemeral volume session and heatmaps for patient privacy."""
    purged = False
    if session_id in SESSION_VOLUMES:
        SESSION_VOLUMES.pop(session_id, None)
        purged = True
    if session_id in SESSION_ATTRIBUTIONS:
        SESSION_ATTRIBUTIONS.pop(session_id, None)
        purged = True

    # Cancel any active explain jobs for this session
    for job in list(EXPLAIN_JOBS.values()):
        if job.session_id == session_id:
            job.cancel_requested = True
            job.status = "cancelled"

    return {"status": "purged", "session_id": session_id, "found": purged}


@app.post("/predict")
async def predict_mri(
    background_tasks: BackgroundTasks,
    nifti_file: UploadFile = File(..., description="T1-weighted brain MRI (.nii or .nii.gz)"),
    mmse: float = Form(..., description="MMSE score (0-30)"),
    cdrsb: float = Form(..., description="CDRSB score (0-18)"),
    age: float = Form(..., description="Patient age (40-110)"),
    sex: str = Form(..., description="'Male' or 'Female'"),
    education: float = Form(..., description="Education years (0-30)")
):
    """
    Multimodal prediction endpoint.
    Upload a NIfTI scan (.nii or .nii.gz) alongside clinical features to receive CN vs Dementia probabilities.
    Files are strictly processed in ephemeral memory and deleted immediately after inference.
    """
    purge_old_sessions()

    # 1. Validate file extension
    filename = nifti_file.filename or ""
    if not any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{filename}'. Only NIfTI volumes (.nii or .nii.gz) are accepted."
        )

    # 2. Validate clinical parameters via Pydantic
    try:
        clinical = ClinicalData(
            mmse=mmse,
            cdrsb=cdrsb,
            age=age,
            sex=sex,
            education=education
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Clinical data validation error: {str(e)}")

    # 3. Read uploaded bytes into ephemeral temp file for nibabel
    temp_file = tempfile.NamedTemporaryFile(suffix=".nii.gz" if filename.lower().endswith(".gz") else ".nii", delete=False)
    temp_path = Path(temp_file.name)
    try:
        contents = await nifti_file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="The uploaded file is empty.")
        temp_file.write(contents)
        temp_file.close()

        # Run inference
        result, volume_ras, volume_tensor, clin_tensor = engine.predict(str(temp_path), clinical)

        # Generate session ID and project patient coordinates
        session_id = str(uuid.uuid4())
        try:
            pt_coords = project_patient_point(
                mmse=clinical.mmse,
                cdrsb=clinical.cdrsb,
                age=clinical.age,
                sex=clinical.sex,
                education=clinical.education
            )
        except Exception:
            pt_coords = None

        result.session_id = session_id
        result.patient_coords = pt_coords

        # Store standardized volume and tensors in temporary session cache (30 min TTL)
        SESSION_VOLUMES[session_id] = {
            "volume_ras": volume_ras,
            "mri_tensor": volume_tensor,
            "clin_tensor": clin_tensor,
            "original_shape": result.volume_info.original_shape,
            "clinical": clinical.model_dump(),
            "timestamp": time.time()
        }

        # Generate initial center slices
        slices_data = extract_orthogonal_slices(volume_ras)

        return {
            "prediction": result.model_dump(),
            "session_id": session_id,
            "slices": slices_data
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed during NIfTI volume processing: {str(e)}")
    finally:
        # Guarantee privacy: ephemeral temp file is unlinked immediately
        if temp_path.exists():
            try:
                os.unlink(temp_path)
            except Exception:
                pass


@app.post("/samples/{sample_id}/predict")
def predict_sample(sample_id: str):
    """Run prediction directly on a built-in sample patient."""
    purge_old_sessions()

    patient = next((p for p in SAMPLE_PATIENTS if p["id"] == sample_id), None)
    if not patient:
        raise HTTPException(status_code=404, detail="Sample patient profile not found.")

    file_path = SAMPLES_DIR / patient["filename"]
    if not file_path.exists():
        ensure_sample_nifti_files()

    clinical = ClinicalData(
        mmse=patient["mmse"],
        cdrsb=patient["cdrsb"],
        age=patient["age"],
        sex=patient["sex"],
        education=patient["education"]
    )

    result, volume_ras, volume_tensor, clin_tensor = engine.predict(str(file_path), clinical)

    session_id = str(uuid.uuid4())
    try:
        pt_coords = project_patient_point(
            mmse=clinical.mmse,
            cdrsb=clinical.cdrsb,
            age=clinical.age,
            sex=clinical.sex,
            education=clinical.education
        )
    except Exception:
        pt_coords = None

    result.session_id = session_id
    result.patient_coords = pt_coords

    SESSION_VOLUMES[session_id] = {
        "volume_ras": volume_ras,
        "mri_tensor": volume_tensor,
        "clin_tensor": clin_tensor,
        "original_shape": result.volume_info.original_shape,
        "clinical": clinical.model_dump(),
        "timestamp": time.time()
    }

    slices_data = extract_orthogonal_slices(volume_ras)

    return {
        "patient": patient,
        "prediction": result.model_dump(),
        "session_id": session_id,
        "slices": slices_data
    }


@app.post("/mri/slice")
def get_slice_view(
    session_id: Optional[str] = Query(None),
    sample_id: Optional[str] = Query(None),
    axial: Optional[int] = Query(None),
    coronal: Optional[int] = Query(None),
    sagittal: Optional[int] = Query(None)
):
    """
    Retrieve updated orthogonal 2D slices when user scrubs any of the 3 viewing planes.
    Uses cached session volume or sample volume.
    """
    volume_ras = None

    if session_id and session_id in SESSION_VOLUMES:
        volume_ras = SESSION_VOLUMES[session_id]["volume_ras"]
    elif sample_id:
        patient = next((p for p in SAMPLE_PATIENTS if p["id"] == sample_id), None)
        if patient:
            file_path = SAMPLES_DIR / patient["filename"]
            if file_path.exists():
                img = nib.load(str(file_path))
                from transforms import standardize_orientation
                volume_ras = standardize_orientation(img)

    if volume_ras is None:
        raise HTTPException(
            status_code=404,
            detail="Active MRI volume session not found. Please upload a scan or select a sample patient."
        )

    slices_data = extract_orthogonal_slices(
        volume_ras,
        axial_idx=axial,
        coronal_idx=coronal,
        sagittal_idx=sagittal
    )

    return slices_data


@app.post("/explain", response_model=ExplainabilityStatusResponse)
def request_explainability(req: ExplainabilityRequest):
    """Launch asynchronous multi-method explainability job."""
    purge_old_sessions()
    
    if req.session_id not in SESSION_VOLUMES:
        raise HTTPException(
            status_code=404,
            detail="Session not found or expired (30-min TTL). Please re-run inference."
        )

    job_id = str(uuid.uuid4())
    job = ExplainJob(job_id=job_id, session_id=req.session_id, method=req.method, preset=req.preset)
    EXPLAIN_JOBS[job_id] = job

    # Launch background worker
    launch_explain_job(job, SESSION_VOLUMES[req.session_id], engine)

    return ExplainabilityStatusResponse(
        job_id=job.job_id,
        session_id=job.session_id,
        status=job.status,
        progress=job.progress,
        method=job.method,
        preset=job.preset
    )


@app.get("/explain/{job_id}", response_model=ExplainabilityStatusResponse)
def get_explainability_status(job_id: str):
    """Poll status and progress of an explainability job."""
    job = EXPLAIN_JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Explainability job not found.")

    vol_url = f"/explain/{job_id}/{job.method}" if job.status == "completed" else None

    return ExplainabilityStatusResponse(
        job_id=job.job_id,
        session_id=job.session_id,
        status=job.status,
        progress=round(job.progress, 2),
        method=job.method,
        preset=job.preset,
        mri_influence_pct=round(job.mri_influence_pct, 1) if job.mri_influence_pct is not None else None,
        pairwise_correlations=job.pairwise_correlations,
        volume_url=vol_url,
        error=job.error
    )


@app.get("/explain/{job_id}/{method}")
def get_explainability_volume(job_id: str, method: str):
    """Stream raw float32 3D attribution volume for high-speed client-side rendering."""
    job = EXPLAIN_JOBS.get(job_id)
    if not job or job.heatmap_ras is None:
        raise HTTPException(status_code=404, detail="Heatmap volume not ready or job not found.")

    shape = job.heatmap_ras.shape
    raw_bytes = job.heatmap_ras.astype(np.float32).tobytes()

    return Response(
        content=raw_bytes,
        media_type="application/octet-stream",
        headers={
            "X-Dimensions": f"{shape[0]},{shape[1]},{shape[2]}",
            "Cache-Control": "public, max-age=1800"
        }
    )


@app.delete("/explain/{job_id}")
def cancel_explainability_job(job_id: str):
    """Cancel and remove an explainability job."""
    job = EXPLAIN_JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    job.cancel_requested = True
    job.status = "cancelled"
    EXPLAIN_JOBS.pop(job_id, None)
    return {"status": "cancelled", "job_id": job_id}

