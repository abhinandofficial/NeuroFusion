import pytest
import io
import numpy as np
import nibabel as nib
from pathlib import Path
import sys
import os

# Add backend/app to path
BACKEND_APP = Path(__file__).resolve().parent.parent / "app"
sys.path.insert(0, str(BACKEND_APP))

from fastapi.testclient import TestClient
from main import app
from schemas import ClinicalData
from inference import engine
from sample_data import generate_synthetic_brain_volume, ensure_sample_nifti_files
from transforms import process_nifti_to_tensor


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "model_mode" in data
    assert "weights_loaded" in data


def test_metrics_endpoint():
    response = client.get("/metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["summary"]["test_accuracy"] == 96.74
    assert data["summary"]["auc_roc"] == 0.997
    assert len(data["ablation_study"]) == 5
    assert data["confusion_matrix"]["matrix"] == [[70, 0], [3, 19]]


def test_samples_endpoint():
    response = client.get("/samples")
    assert response.status_code == 200
    samples = response.json()
    assert len(samples) >= 2
    assert any(s["id"] == "patient-cn-01" for s in samples)


def test_sample_prediction():
    response = client.post("/samples/patient-cn-01/predict")
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "slices" in data
    assert data["prediction"]["predicted_class"] == "Cognitively Normal (CN)"
    assert data["prediction"]["probabilities"]["Cognitively Normal (CN)"] > 0.80
    assert "axial" in data["slices"]
    assert "coronal" in data["slices"]
    assert "sagittal" in data["slices"]


def test_synthetic_volume_preprocessing(tmp_path):
    vol = generate_synthetic_brain_volume(is_dementia=False, shape=(64, 64, 64))
    affine = np.eye(4)
    img = nib.Nifti1Image(vol, affine)
    nii_path = tmp_path / "test_brain.nii.gz"
    nib.save(img, str(nii_path))

    tensor, stats, volume_ras = process_nifti_to_tensor(str(nii_path))
    assert tensor.shape == (1, 1, 128, 128, 128)
    assert stats["original_shape"] == [64, 64, 64]
    assert stats["resampled_shape"] == [128, 128, 128]


def test_prediction_validation_errors():
    # 1. Invalid file extension (.txt instead of .nii)
    response = client.post(
        "/predict",
        files={"nifti_file": ("test.txt", b"dummy content", "text/plain")},
        data={"mmse": 28.0, "cdrsb": 0.0, "age": 72.0, "sex": "Male", "education": 16.0}
    )
    assert response.status_code == 400
    assert "Invalid file type" in response.json()["detail"]

    # 2. Out of range MMSE (35 > 30)
    response = client.post(
        "/predict",
        files={"nifti_file": ("test.nii", b"dummy", "application/octet-stream")},
        data={"mmse": 35.0, "cdrsb": 0.0, "age": 72.0, "sex": "Male", "education": 16.0}
    )
    assert response.status_code == 422
