import torch
import torch.nn as nn
from pathlib import Path
from typing import Optional
import os
import sys

# Ensure local models/resnet can be imported
sys.path.append(os.path.dirname(__file__))
from resnet import resnet10


class MultimodalResNet(nn.Module):
    """
    Multimodal 3D Deep Learning Architecture:
    - 3D MRI Branch: MedicalNet ResNet-10 backbone (512-dim feature embedding)
    - Clinical Branch: 2-layer MLP (5 clinical biomarkers -> 32-dim feature embedding)
    - Multimodal Fusion: Concatenation (512 + 32 = 544 dimensions)
    - Classifier: Linear(544 -> 128) -> ReLU -> Dropout(0.3) -> Linear(128 -> 2)
    """
    def __init__(self, backbone, num_clinical_features: int = 5, num_classes: int = 2):
        super().__init__()
        # Image feature extractor: All ResNet10 stages except final conv_seg
        self.image_encoder = nn.Sequential(
            backbone.conv1,
            backbone.bn1,
            backbone.relu,
            backbone.maxpool,
            backbone.layer1,
            backbone.layer2,
            backbone.layer3,
            backbone.layer4,
            nn.AdaptiveAvgPool3d((1, 1, 1)),
            nn.Flatten()
        )
        # Clinical feature encoder
        self.clinical_encoder = nn.Sequential(
            nn.Linear(num_clinical_features, 32),
            nn.ReLU(),
            nn.Linear(32, 32)
        )
        # Fusion classifier
        self.classifier = nn.Sequential(
            nn.Linear(512 + 32, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, num_classes)
        )

    def forward(self, image: torch.Tensor, clinical: torch.Tensor) -> torch.Tensor:
        img_features = self.image_encoder(image)
        clin_features = self.clinical_encoder(clinical)
        combined = torch.cat([img_features, clin_features], dim=1)
        return self.classifier(combined)


def create_multimodal_architecture(pretrained_path: Optional[Path] = None, device: str = 'cpu') -> MultimodalResNet:
    """Build the MultimodalResNet model graph."""
    backbone = resnet10(
        sample_input_W=128,
        sample_input_H=128,
        sample_input_D=128,
        shortcut_type='B',
        no_cuda=(device == 'cpu'),
        num_seg_classes=2
    )

    if pretrained_path and Path(pretrained_path).exists():
        try:
            checkpoint = torch.load(pretrained_path, map_location=device, weights_only=False)
            state_dict = checkpoint.get('state_dict', checkpoint)
            new_state_dict = {k.replace('module.', ''): v for k, v in state_dict.items()}
            backbone.load_state_dict(new_state_dict, strict=False)
        except Exception as e:
            print(f"[Warning] Could not load MedicalNet backbone weights: {e}")

    model = MultimodalResNet(backbone, num_clinical_features=5, num_classes=2)
    return model


def load_model(checkpoint_path: Path, pretrained_path: Optional[Path] = None, device: str = 'cpu') -> Optional[MultimodalResNet]:
    """
    Attempt to load trained MultimodalResNet weights.
    Returns None if checkpoint does not exist.
    """
    if not checkpoint_path.exists():
        return None

    try:
        model = create_multimodal_architecture(pretrained_path=pretrained_path, device=device)
        state_dict = torch.load(checkpoint_path, map_location=device, weights_only=False)
        
        # Strip any prefix if needed
        clean_state_dict = {}
        for k, v in state_dict.items():
            clean_name = k.replace('module.', '')
            clean_state_dict[clean_name] = v
            
        model.load_state_dict(clean_state_dict, strict=True)
        model.to(device)
        model.eval()
        print(f"[NeuroFusion] Successfully loaded PyTorch weights from {checkpoint_path}")
        return model
    except Exception as e:
        print(f"[NeuroFusion] Error loading weights from {checkpoint_path}: {e}")
        return None
