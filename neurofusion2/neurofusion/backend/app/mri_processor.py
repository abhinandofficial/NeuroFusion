import numpy as np
import io
import base64
from PIL import Image
from typing import Tuple, Dict, Any, Optional
import nibabel as nib


def normalize_slice_to_uint8(slice_2d: np.ndarray, p_min: float = 1.0, p_max: float = 99.0) -> np.ndarray:
    """Normalize 2D slice intensities using percentile clipping for clear contrast."""
    if slice_2d.size == 0 or np.all(slice_2d == 0):
        return np.zeros((max(1, slice_2d.shape[0]), max(1, slice_2d.shape[1])), dtype=np.uint8)

    nonzero_vals = slice_2d[slice_2d > 0]
    if len(nonzero_vals) > 0:
        vmin = np.percentile(nonzero_vals, p_min)
        vmax = np.percentile(nonzero_vals, p_max)
    else:
        vmin = np.min(slice_2d)
        vmax = np.max(slice_2d)

    if vmax > vmin:
        clipped = np.clip(slice_2d, vmin, vmax)
        scaled = ((clipped - vmin) / (vmax - vmin) * 255.0).astype(np.uint8)
    else:
        scaled = np.zeros_like(slice_2d, dtype=np.uint8)

    return scaled


def slice_to_base64_png(slice_2d: np.ndarray) -> str:
    """Convert a 2D numpy slice to a base64 encoded PNG data URI."""
    uint8_img = normalize_slice_to_uint8(slice_2d)
    
    # Ensure correct medical orientation (standard radiology view)
    # Transpose if needed so axial/coronal/sagittal are right-side up
    pil_image = Image.fromarray(uint8_img)
    buffered = io.BytesIO()
    pil_image.save(buffered, format="PNG")
    b64_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64_str}"


def extract_orthogonal_slices(
    volume_ras: np.ndarray,
    axial_idx: Optional[int] = None,
    coronal_idx: Optional[int] = None,
    sagittal_idx: Optional[int] = None
) -> Dict[str, Any]:
    """
    Extract axial, coronal, and sagittal slices from a 3D RAS volume.
    Volume dimensions in RAS:
      Axis 0 (X): Sagittal (Left -> Right)
      Axis 1 (Y): Coronal (Posterior -> Anterior)
      Axis 2 (Z): Axial (Inferior -> Superior)
    """
    shape = volume_ras.shape
    x_dim, y_dim, z_dim = shape[0], shape[1], shape[2]

    # Default to center indices if not provided
    s_idx = int(np.clip(sagittal_idx if sagittal_idx is not None else x_dim // 2, 0, x_dim - 1))
    c_idx = int(np.clip(coronal_idx if coronal_idx is not None else y_dim // 2, 0, y_dim - 1))
    a_idx = int(np.clip(axial_idx if axial_idx is not None else z_dim // 2, 0, z_dim - 1))

    # Slice extractions with proper orientations for display:
    # 1. Axial: plane across Z (XY plane). Rotate 90 deg counter-clockwise so Anterior is Up.
    axial_slice = np.rot90(volume_ras[:, :, a_idx])

    # 2. Coronal: plane across Y (XZ plane). Rotate 90 deg so Superior is Up.
    coronal_slice = np.rot90(volume_ras[:, c_idx, :])

    # 3. Sagittal: plane across X (YZ plane). Rotate 90 deg so Superior is Up.
    sagittal_slice = np.rot90(volume_ras[s_idx, :, :])

    return {
        "dimensions": [x_dim, y_dim, z_dim],
        "current_slices": {
            "axial": a_idx,
            "coronal": c_idx,
            "sagittal": s_idx
        },
        "axial": slice_to_base64_png(axial_slice),
        "coronal": slice_to_base64_png(coronal_slice),
        "sagittal": slice_to_base64_png(sagittal_slice)
    }
