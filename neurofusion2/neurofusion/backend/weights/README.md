# NeuroFusion Model Weights

Place your trained model weight files in this directory:

1. **Multimodal Model Checkpoint** (Required for real inference):
   - Filename: `best_model_multimodal.pt`
   - Description: Trained weights of MultimodalResNet on ADNI (MedicalNet ResNet10 + Clinical MLP)

2. **Pretrained MedicalNet Backbone** (Optional / for retraining):
   - Filename: `resnet_10_23dataset.pth`
   - Source: MedicalNet (Med3D: Transfer Learning for 3D Medical Image Analysis)

---

### Demo Mode Note
If `best_model_multimodal.pt` is not found here, NeuroFusion automatically operates in **Calibrated Demo Mode**. In Demo Mode:
- The full 3D NIfTI preprocessing, RAS standardization, intensity normalization, and 3-plane slicing run for real.
- Probabilities are calibrated using the ADNI test set logistic baseline and volumetric brain heuristics.
- The web UI clearly indicates Demo Mode with instructions to drop `best_model_multimodal.pt` here.
- As soon as you place `best_model_multimodal.pt` in this folder and restart the backend, PyTorch loads the real weights automatically.
