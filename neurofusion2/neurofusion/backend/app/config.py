from pathlib import Path
import os
import torch

BASE_DIR = Path(__file__).resolve().parent.parent
WEIGHTS_DIR = BASE_DIR / "weights"
SAMPLES_DIR = BASE_DIR / "samples"

CHECKPOINT_PATH = WEIGHTS_DIR / "best_model_multimodal.pt"
PRETRAINED_PATH = WEIGHTS_DIR / "resnet_10_23dataset.pth"

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Model configuration
NUM_CLINICAL_FEATURES = 5
NUM_CLASSES = 2
CLASS_NAMES = ["Cognitively Normal (CN)", "Alzheimer's Disease"]

# Preprocessing volume target dimensions
TARGET_SHAPE = (128, 128, 128)

# Upload limits
MAX_UPLOAD_SIZE_BYTES = 250 * 1024 * 1024  # 250 MB
ALLOWED_EXTENSIONS = (".nii", ".nii.gz")

# Flag for model presence
WEIGHTS_EXIST = CHECKPOINT_PATH.exists()
