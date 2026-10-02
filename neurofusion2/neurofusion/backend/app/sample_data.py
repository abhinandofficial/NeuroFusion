import numpy as np
import nibabel as nib
from pathlib import Path
from typing import List, Dict, Any
from config import SAMPLES_DIR


def generate_synthetic_brain_volume(is_dementia: bool = False, shape=(128, 128, 128)) -> np.ndarray:
    """
    Generate an anatomically structured synthetic 3D brain MRI volume.
    Includes:
    - Ellipsoidal brain boundary (scalp, skull, CSF, cortex, white matter)
    - Lateral ventricles: normal slender in CN, dilated (ventriculomegaly) in Dementia
    - Hippocampal region: preserved in CN, atrophied in Dementia
    - Gaussian noise and texture matching clinical MPRAGE
    """
    D, H, W = shape
    z, y, x = np.ogrid[:D, :H, :W]
    cz, cy, cx = D / 2.0, H / 2.0, W / 2.0

    # Normalized coordinates centered at 0
    nx = (x - cx) / (W * 0.40)
    ny = (y - cy) / (H * 0.44)
    nz = (z - cz) / (D * 0.42)
    r_head = nx**2 + ny**2 + nz**2

    volume = np.zeros(shape, dtype=np.float32)

    # 1. Scalp & skull bone
    scalp_mask = (r_head <= 1.05) & (r_head > 0.98)
    volume[scalp_mask] = 160.0

    skull_mask = (r_head <= 0.98) & (r_head > 0.90)
    volume[skull_mask] = 40.0  # Low intensity on T1

    # 2. Brain Parenchyma (Cerebral hemispheres)
    cortex_radius = 0.88 if not is_dementia else 0.82  # Cortical thinning in dementia
    brain_mask = r_head <= cortex_radius
    
    # Gray matter
    volume[brain_mask] = 480.0

    # White matter (central deep core)
    wm_radius = 0.65 if not is_dementia else 0.58
    wm_mask = r_head <= wm_radius
    volume[wm_mask] = 620.0

    # 3. Interhemispheric fissure (longitudinal)
    fissure = np.abs(x - cx) < 1.2
    volume[fissure & brain_mask] = 120.0

    # 4. Lateral Ventricles (CSF, dark on T1)
    # Bilateral anterior & posterior horns
    v_width = 4.0 if not is_dementia else 11.0  # Dilated in dementia
    v_height = 14.0 if not is_dementia else 24.0
    v_depth = 18.0 if not is_dementia else 30.0

    # Left and Right ventricles
    left_ventricle = (
        (((x - (cx - v_width * 1.4)) / (v_width * 0.8))**2 +
         ((y - cy) / v_height)**2 +
         ((z - cz) / v_depth)**2) <= 1.0
    )
    right_ventricle = (
        (((x - (cx + v_width * 1.4)) / (v_width * 0.8))**2 +
         ((y - cy) / v_height)**2 +
         ((z - cz) / v_depth)**2) <= 1.0
    )
    ventricles = left_ventricle | right_ventricle
    volume[ventricles] = 75.0  # CSF is hypo-intense on T1

    # 5. Temporal horns / Hippocampal CSF spaces
    th_depth = 6.0 if not is_dementia else 14.0
    th_y = cy - 8.0
    th_z = cz - 12.0
    left_th = (((x - (cx - 16)) / 3.0)**2 + ((y - th_y) / 6.0)**2 + ((z - th_z) / th_depth)**2) <= 1.0
    right_th = (((x - (cx + 16)) / 3.0)**2 + ((y - th_y) / 6.0)**2 + ((z - th_z) / th_depth)**2) <= 1.0
    if is_dementia:
        volume[left_th | right_th] = 70.0  # Enlarged temporal horn sulci in Alzheimer's

    # 6. Realistic anatomical texture and slight noise
    noise = np.random.normal(0, 15.0, shape).astype(np.float32)
    volume[volume > 0] += noise[volume > 0]
    volume = np.clip(volume, 0.0, 1000.0)

    return volume


def ensure_sample_nifti_files():
    """Ensure sample NIfTI files exist in backend/samples directory."""
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

    cn_path = SAMPLES_DIR / "sample_cn.nii.gz"
    dem_path = SAMPLES_DIR / "sample_dementia.nii.gz"

    affine = np.diag([1.5, 1.5, 1.5, 1.0])  # 1.5mm voxel spacing

    if not cn_path.exists():
        print("[NeuroFusion] Synthesizing sample CN brain volume...")
        cn_vol = generate_synthetic_brain_volume(is_dementia=False)
        cn_img = nib.Nifti1Image(cn_vol, affine)
        nib.save(cn_img, str(cn_path))

    if not dem_path.exists():
        print("[NeuroFusion] Synthesizing sample Dementia brain volume...")
        dem_vol = generate_synthetic_brain_volume(is_dementia=True)
        dem_img = nib.Nifti1Image(dem_vol, affine)
        nib.save(dem_img, str(dem_path))


SAMPLE_PATIENTS: List[Dict[str, Any]] = [
    {
        "id": "patient-cn-01",
        "label": "Subject 041_S_0125 (Cognitively Normal)",
        "category": "Cognitively Normal (CN)",
        "age": 74.0,
        "sex": "Male",
        "education": 18.0,
        "mmse": 29.0,
        "cdrsb": 0.0,
        "filename": "sample_cn.nii.gz",
        "summary": "74yo male, Master's degree, MMSE 29/30 (unimpaired), CDRSB 0.0. Structural MRI demonstrates preserved cortical thickness and normal ventricular boundaries."
    },
    {
        "id": "patient-dem-01",
        "label": "Subject 027_S_0404 (Alzheimer's Dementia)",
        "category": "Alzheimer's Disease",
        "age": 88.0,
        "sex": "Female",
        "education": 14.0,
        "mmse": 20.0,
        "cdrsb": 6.0,
        "filename": "sample_dementia.nii.gz",
        "summary": "88yo female, MMSE 20/30 (marked cognitive impairment), CDRSB 6.0. Structural MRI exhibits ventriculomegaly and pronounced bilateral temporal horn enlargement."
    },
    {
        "id": "patient-mild-01",
        "label": "Subject 031_S_0321 (Borderline / Early Decline)",
        "category": "Alzheimer's Disease",
        "age": 69.0,
        "sex": "Male",
        "education": 18.0,
        "mmse": 26.0,
        "cdrsb": 1.5,
        "filename": "sample_dementia.nii.gz",
        "summary": "69yo male, MMSE 26/30, CDRSB 1.5 (mild symptoms). Demonstrates subtle ventricular enlargement and early temporal volume loss."
    }
]
