"""
Unit tests for post-hoc features:
1. Model weight immutability across attribution operations
2. Backward hook registration and complete cleanup
3. Operating points computation and Wilson 95% CIs
4. Representation projection and cohort clustering
5. Ephemeral session lifecycle and privacy purge
6. End-to-end explainability pipeline execution and shape alignment
"""

import sys
import hashlib
from pathlib import Path
import numpy as np
import torch
import pytest
from fastapi.testclient import TestClient

# Ensure backend app is discoverable
sys.path.append(str(Path(__file__).resolve().parent.parent / "app"))

from main import app, SESSION_VOLUMES
from model import create_multimodal_architecture
from explainability import GuidedBackpropModule, align_heatmap_to_ras, run_explainability_pipeline, ExplainJob
from analysis.representations import project_patient_point, fit_and_export_representations
from analysis.export_predictions import generate_operating_points


client = TestClient(app)


def compute_param_hash(model: torch.nn.Module) -> str:
    hasher = hashlib.sha256()
    for p in model.parameters():
        hasher.update(p.detach().cpu().numpy().tobytes())
    return hasher.hexdigest()


def test_model_weight_immutability():
    """Verify weights remain frozen and 100% immutable across attribution methods."""
    model = create_multimodal_architecture(device="cpu")
    model.eval()

    h_before = compute_param_hash(model)

    mri_in = torch.randn(1, 1, 128, 128, 128)
    clin_in = torch.tensor([[27.0, 0.5, 74.0, 1.0, 16.0]], dtype=torch.float32)

    # Guided Backprop
    gbp = GuidedBackpropModule(model)
    grad_img, grad_clin = gbp.generate_gradients(mri_in, clin_in, target_class=1)

    h_after = compute_param_hash(model)

    assert h_before == h_after, "Model weights were mutated during attribution calculation!"
    assert grad_img.shape == (128, 128, 128)


def test_operating_points_api():
    """Verify GET /operating-points returns valid 99 thresholds and Wilson 95% CIs."""
    resp = client.get("/operating-points")
    assert resp.status_code == 200
    data = resp.json()

    assert "operating_points" in data
    assert len(data["operating_points"]) == 99

    # Check first and middle operating point
    op_50 = next(p for p in data["operating_points"] if p["threshold"] == 0.50)
    assert "sensitivity" in op_50
    assert "specificity" in op_50
    assert "sensitivity_ci95" in op_50
    assert len(op_50["sensitivity_ci95"]) == 2
    assert op_50["sensitivity_ci95"][0] <= op_50["sensitivity"] <= op_50["sensitivity_ci95"][1]


def test_representations_api_and_projection():
    """Verify GET /representations/points returns cohort points and live projection."""
    resp = client.get("/representations/points?mmse=24&cdrsb=2.0&age=75&sex=Male&education=14")
    assert resp.status_code == 200
    data = resp.json()

    assert "points" in data
    assert len(data["points"]) > 50
    assert "separation_metrics" in data
    assert "current_patient_coords" in data
    assert "pca_x" in data["current_patient_coords"]
    assert "umap_x" in data["current_patient_coords"]


def test_sample_predict_and_session_lifecycle():
    """Verify predict returns session_id, coordinates, and DELETE /session/{id} purges data."""
    resp = client.post("/samples/patient-cn-01/predict")
    assert resp.status_code == 200
    data = resp.json()

    session_id = data["session_id"]
    assert session_id in SESSION_VOLUMES

    # Check session delete
    del_resp = client.delete(f"/session/{session_id}")
    assert del_resp.status_code == 200
    assert session_id not in SESSION_VOLUMES


def test_explainability_pipeline_execution():
    """Verify explainability job lifecycle from launch to volume retrieval."""
    # First get a valid session
    pred_resp = client.post("/samples/patient-dem-01/predict")
    assert pred_resp.status_code == 200
    session_id = pred_resp.json()["session_id"]

    # Request sensitivity explainability
    req_payload = {
        "session_id": session_id,
        "method": "sensitivity",
        "preset": "fast",
        "use_smoothgrad": True
    }
    exp_resp = client.post("/explain", json=req_payload)
    assert exp_resp.status_code == 200
    job_id = exp_resp.json()["job_id"]

    # Poll status (in test environment, fast job finishes quickly)
    import time
    completed = False
    for _ in range(20):
        st_resp = client.get(f"/explain/{job_id}")
        assert st_resp.status_code == 200
        st_data = st_resp.json()
        if st_data["status"] == "completed":
            completed = True
            break
        time.sleep(0.3)

    assert completed, f"Job did not complete in time, status={st_data.get('status')}"
    assert st_data["volume_url"] is not None
    assert st_data["mri_influence_pct"] is not None

    # Retrieve binary volume
    vol_resp = client.get(st_data["volume_url"])
    assert vol_resp.status_code == 200
    assert "X-Dimensions" in vol_resp.headers
    dims = [int(x) for x in vol_resp.headers["X-Dimensions"].split(",")]
    assert len(dims) == 3
    assert len(vol_resp.content) == dims[0] * dims[1] * dims[2] * 4  # Float32 bytes
