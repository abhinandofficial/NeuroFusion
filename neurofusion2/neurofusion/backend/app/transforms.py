import numpy as np
import torch
import torch.nn.functional as F
import nibabel as nib
import nibabel.orientations as nio
from typing import Tuple, Dict, Any

try:
    from monai.transforms import (
        Compose,
        NormalizeIntensity,
        Resize,
        ToTensor
    )
    MONAI_AVAILABLE = True
except ImportError:
    MONAI_AVAILABLE = False


def standardize_orientation(img: nib.spatialimages.SpatialImage) -> np.ndarray:
    """Standardize volume orientation to RAS (Right, Anterior, Superior) coordinates."""
    volume = img.get_fdata(dtype=np.float32)
    orig_ornt = nio.io_orientation(img.affine)
    targ_ornt = nio.axcodes2ornt('RAS')
    transform_ornt = nio.ornt_transform(orig_ornt, targ_ornt)
    volume_ras = nio.apply_orientation(volume, transform_ornt)
    return volume_ras


def preprocess_volume_fallback(volume: np.ndarray, target_shape=(128, 128, 128)) -> torch.Tensor:
    """
    Pure PyTorch fallback for preprocessing matching MONAI:
    1. Normalize intensity (nonzero=True, channel_wise=True)
    2. Trilinear resize to (128, 128, 128)
    3. Return torch.Tensor of shape (1, 128, 128, 128)
    """
    # Non-zero intensity normalization
    mask = volume != 0
    if np.any(mask):
        mean = volume[mask].mean()
        std = volume[mask].std()
        if std > 1e-6:
            volume = np.where(mask, (volume - mean) / std, 0.0)

    # Convert to tensor: shape (1, 1, D, H, W)
    tensor = torch.from_numpy(volume).unsqueeze(0).unsqueeze(0).float()
    
    # Trilinear interpolate to (128, 128, 128)
    resized = F.interpolate(
        tensor,
        size=target_shape,
        mode='trilinear',
        align_corners=False
    )
    
    # Return shape (1, 128, 128, 128) matching MONAI ToTensor() output
    return resized.squeeze(0)


def get_val_transforms():
    """Returns MONAI validation transform compose pipeline if available."""
    if MONAI_AVAILABLE:
        return Compose([
            NormalizeIntensity(nonzero=True, channel_wise=True),
            Resize(spatial_size=(128, 128, 128), mode='trilinear'),
            ToTensor()
        ])
    return None


def process_nifti_to_tensor(nifti_path_or_file) -> Tuple[torch.Tensor, Dict[str, Any], np.ndarray]:
    """
    Full preprocessing pipeline from NIfTI file to standardized 3D tensor.
    Returns:
        tensor: torch.Tensor of shape (1, 1, 128, 128, 128)
        stats: dictionary of original metadata and intensity metrics
        volume_ras: numpy array before resizing (for slice viewing)
    """
    if isinstance(nifti_path_or_file, str):
        img = nib.load(nifti_path_or_file)
    else:
        # File-like object
        img = nib.load(nifti_path_or_file)

    original_shape = list(img.shape)
    volume_ras = standardize_orientation(img)
    
    stats = {
        "original_shape": original_shape,
        "resampled_shape": [128, 128, 128],
        "min_intensity": float(np.min(volume_ras)),
        "max_intensity": float(np.max(volume_ras)),
        "mean_intensity": float(np.mean(volume_ras))
    }

    if MONAI_AVAILABLE:
        try:
            vol_expanded = np.expand_dims(volume_ras, axis=0)
            transform = get_val_transforms()
            transformed = transform(vol_expanded)
            # Add batch dimension -> (1, 1, 128, 128, 128)
            final_tensor = transformed.unsqueeze(0).float()
            return final_tensor, stats, volume_ras
        except Exception:
            # Fall back safely
            pass

    tensor_1ch = preprocess_volume_fallback(volume_ras, target_shape=(128, 128, 128))
    final_tensor = tensor_1ch.unsqueeze(0)  # Shape (1, 1, 128, 128, 128)
    return final_tensor, stats, volume_ras
