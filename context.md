# Project Context Document

**Last Updated:** 2026-08-22  
**Status:** Planning Phase — Documentation Complete, Implementation Pending  
**Owner:** Kislay Asthana (DL Backend + API Integration)

---

## 1. Problem Statement Summary

**SIH 2026 Problem Statement 26038: Diabetic Retinopathy Detection from Retinal Fundus Images**

### Core Requirements
- **Task:** 5-class DR severity grading from retinal fundus photographs
- **Classes:** 0=No DR, 1=Mild NPDR, 2=Moderate NPDR, 3=Severe NPDR, 4=Proliferative DR
- **Target Metrics (SIH Official):**
  - Sensitivity > 90% for referable DR (Levels 2+)
  - Specificity > 85% for referable DR (Levels 2+)
- **Explainability:** Grad-CAM heatmaps with calibrated confidence scores
- **Integration Target:** MATLAB/Simulink telemedicine workflow for 100,000+ patients/year

### Why This Matters — Clinical Context
| Metric | Value | Source |
|--------|-------|--------|
| Diabetics in India | ~70 million (2024) | ICMR-INDIAB |
| Expected by 2045 | 134 million | IDF Diabetes Atlas |
| DR prevalence in diabetics | 12–18% | Various Indian studies |
| Blindness from DR | Leading cause in working-age adults | WHO |
| Screening gap (rural India) | < 10% coverage | NPCB&VI reports |
| Ophthalmologists per 100k | ~12 (vs 60+ in US/UK) | MoHFW |

**The Gap:** India has ~70M diabetics but only ~15,000 ophthalmologists. Most are urban. Rural patients travel 50–200 km for screening. Automated DR detection at primary health centers (PHCs) with tele-ophthalmology referral can close this gap.

---

## 2. Team Structure & My Responsibility

| Role | Member | Responsibility |
|------|--------|----------------|
| **DL Backend + API** | **Kislay Asthana (Me)** | Model architecture, training/inference pipeline, FastAPI backend, Grad-CAM, frontend demo |
| Frontend/UI | [Teammate 1] | Web interface, visualization, UX |
| MATLAB/Simulink | [Teammate 2] | Signal processing pipeline, Simulink model, hardware integration |
| Presentation/Report | [Teammate 3] | Slides, demo script, technical report, judge Q&A prep |

**My Scope (This Prototype):**
- ✅ EfficientNet-B0 classifier (5-class)
- ✅ FastAPI `/predict` endpoint (image → JSON + heatmap)
- ✅ Grad-CAM visualization overlay
- ✅ Single-file HTML frontend for demo
- ❌ Image quality assessment (future)
- ❌ Vessel/lesion segmentation (future)
- ❌ Confidence calibration (future)
- ❌ MATLAB/Simulink integration (future)

---

## 3. Tech Stack & Rationale

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Model Architecture** | EfficientNet-B0 (`timm`) | Best accuracy/parameter ratio; 5.3M params; fast inference (~20ms on GPU); proven on APTOS (Kaggle winners used B0–B4) |
| **Framework** | PyTorch 2.x | Native `timm` support; dynamic graph for Grad-CAM hooks; Colab-friendly |
| **Backend** | FastAPI + Uvicorn | Async, auto-docs (`/docs`), Pydantic validation, lightweight |
| **Frontend** | Vanilla HTML/JS (single file) | Zero build step; works offline; easy to embed in presentation |
| **Image Processing** | OpenCV + Albumentations | Fast C++ backend; Albumentations for reproducible augmentations |
| **Grad-CAM** | Custom hook-based | No external dependency; full control over layer selection; < 50 lines |
| **Preprocessing** | Resize 224×224 + ImageNet norm | Matches `timm` pretrained expectations; standard practice |
| **Deployment** | Localhost (dev) | `localhost:8000` (API), `localhost:3000` (frontend via `python -m http.server`) |

**Why Not:**
- ❌ ResNet50 — slower, more params, lower accuracy on medical imaging benchmarks
- ❌ Vision Transformers (ViT) — needs more data, slower on small images, harder Grad-CAM
- ❌ TensorFlow/Keras — team PyTorch expertise; `timm` is PyTorch-first
- ❌ React/Vite — build step adds complexity; single HTML is portable for demo

---

## 4. Datasets Overview

| Dataset | Purpose | Size | Classes | Access | License |
|---------|---------|------|---------|--------|---------|
| **APTOS 2019** | Primary training (grading) | 3,662 train + 1,928 test | 5 (0–4) | Kaggle | CC BY 4.0 |
| **IDRiD** | Lesion segmentation + grading | 516 images | 5 (grading) + 4 lesions | IEEE DataPort | Research |
| **DRIVE** | Vessel segmentation | 40 train + 20 test | Binary (vessel) | Grand Challenge | Research |
| **Messidor-2** | External validation | 1,748 images | 0–3 (referable) | Kaggle/ADDI | Research |

**Dataset Strategy for Prototype:**
1. **Training:** APTOS 2019 (primary) — 1 epoch fine-tune on Kaggle GPU
2. **Validation:** APTOS test split (holdout) + 50 IDRiD images
3. **Demo Testing:** 10 curated images (2 per class) from APTOS test + IDRiD
4. **External Val:** Messidor-2 — post-Aug-24 only

---

## 5. Key Constraints

| Constraint | Detail | Impact |
|------------|--------|--------|
| **Deadline** | Aug 24, 2026 (72 hours from Aug 21) | Strip to absolute MVP; no proper training |
| **GPU Access** | Google Colab (free T4, 12h limit) | Train once, download weights, run locally |
| **Model Weights** | 1-epoch fine-tuned EfficientNet-B0 from public Kaggle notebook | No time for full training; accept lower metrics |
| **Scope** | Prototype only — not production | Hardcode paths, skip auth, skip Docker, skip tests |
| **Integration** | MATLAB/Simulink later | API contract must be stable (`/predict` JSON schema) |

---

## 6. Study Roadmap Reference (8 Topics)

*These are my personal learning topics for GATE DA 2027 prep, aligned with this project:*

| # | Topic | Relevance to Project |
|---|-------|---------------------|
| 1 | **Image Representation** | Fundus imaging physics, color spaces (RGB vs green channel), FOV |
| 2 | **Preprocessing** | CLAHE, Ben Graham's crop/resize, vessel enhancement, quality assessment |
| 3 | **CNN Architectures** | EfficientNet compound scaling, MBConv, transfer learning theory |
| 4 | **Transfer Learning** | Freezing layers, differential LR, domain adaptation (ImageNet → medical) |
| 5 | **Evaluation Metrics** | Sensitivity/Specificity, AUC-ROC, Kappa, Confusion matrix, ECE |
| 6 | **Class Imbalance** | APTOS is imbalanced (Class 0: 1800+, Class 4: ~100); weighted loss, oversampling |
| 7 | **Segmentation** | U-Net, DeepLabV3+ for vessels/lesions (future phase) |
| 8 | **Grad-CAM & Explainability** | Hook-based CAM, Grad-CAM++, clinical validation of attention maps |

---

## 7. Reference Papers

| Paper | Year | Key Contribution |
|-------|------|------------------|
| **Gulshan et al., JAMA** | 2016 | Foundational Google DR paper; CNN on 128k images; AUC 0.99 |
| **Ting et al., JAMA** | 2017 | Multi-ethnic validation; DL for DR + glaucoma + AMD |
| **Kaggle APTOS 2019 Report** | 2019 | Winning solutions: EfficientNet + ensemble + TTA |
| **IDRiD Challenge (Porwal et al.)** | 2020 | Lesion segmentation benchmark |
| **Selvaraju et al. (Grad-CAM)** | 2017 | Gradient-weighted class activation mapping |
| **Guo et al. (Calibration)** | 2017 | Temperature scaling for confidence calibration |
| **Kermany et al., Cell** | 2018 | Multi-disease retinal imaging (OCT + fundus) |

---

## 8. GitHub Repos to Reference

| Repo | Description | Link |
|------|-------------|------|
| `rwightman/pytorch-image-models` (timm) | Model zoo, EfficientNet-B0 | https://github.com/rwightman/pytorch-image-models |
| `kaggle/aptos2019-blindness-detection` | Competition notebooks | https://www.kaggle.com/c/aptos2019-blindness-detection |
| `DeepLIIF/DR-Grading` | DR grading with Grad-CAM | https://github.com/DeepLIIF/DR-Grading |
| `orobix/retina-unet` | Retinal vessel segmentation | https://github.com/orobix/retina-unet |
| `jfhealthcare/DR-Screening` | End-to-end screening pipeline | https://github.com/jfhealthcare/DR-Screening |

---

## 9. Cross-References

- **Execution Plan:** See `execution_plan.md` for hour-by-hour breakdown
- **Progress Tracker:** See `progress.md` for live status updates
- **Decision Log:** Key technical decisions recorded in `progress.md`

---

## 10. Decision Log (High-Level)

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-08-21 | EfficientNet-B0 over ResNet/ViT | Best accuracy/speed tradeoff for 224×224 medical images |
| 2026-08-21 | 1-epoch fine-tune from public weights | 72-hour deadline; training from scratch = 4–6 hours minimum |
| 2026-08-21 | Custom Grad-CAM over `torchcam` lib | Zero dependency; full control; < 50 lines |
| 2026-08-21 | Single HTML file frontend | No build step; portable for demo; works offline |
| 2026-08-21 | Skip image quality assessment | MVP scope; add post-Aug-24 |
| 2026-08-21 | Skip confidence calibration | MVP scope; add post-Aug-24 |

---