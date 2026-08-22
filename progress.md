# Progress Tracker — SIH 2026 PS 26038 DR Detection Prototype

**Last Updated:** 2026-08-22  
**Status:** Planning Complete — Ready for Day 1 Implementation  
**Owner:** Kislay Asthana  
**Deadline:** 2026-08-24

---

## 📅 Daily Progress Overview

| Day | Date | Focus | Overall Status |
|-----|------|-------|----------------|
| 1 | 2026-08-21 (Fri) | Core Pipeline Build | ⬜ Not Started |
| 2 | 2026-08-22 (Sat) | Test, Refine, Metrics | ⬜ Not Started |
| 3 | 2026-08-23 (Sun) | Demo Polish & Backup | ⬜ Not Started |
| 4 | 2026-08-24 (Mon) | Presentation | ⬜ Not Started |

---

## 🎯 Day 1 — 2026-08-21 (Friday) — Core Pipeline Build

### Weights Acquisition
- [ ] **Task 1.1** — Identify public Kaggle notebook with 1-epoch EfficientNet-B0 weights for APTOS
  - *Target:* Notebook URL saved
  - *Blocker:* Need Kaggle API token or direct download link
- [ ] **Task 1.2** — Download weights to `weights/dr_model.pth`
  - *Target:* File exists, ~100MB, valid PyTorch state_dict
  - *Verification:* `torch.load()` succeeds, keys match `efficientnet_b0` architecture

### Model Module (`model.py`)
- [ ] **Task 1.3** — Create `DRModel` class with `timm.create_model("efficientnet_b0", num_classes=5)`
- [ ] **Task 1.4** — Implement `load_weights(path)` with strict=False (handle missing classifier keys)
- [ ] **Task 1.5** — Implement `preprocess(image_path)` → Tensor (224×224, ImageNet mean/std)
- [ ] **Task 1.6** — Implement `predict(tensor)` → Dict with class_idx, class_name, confidence, all_probs
- [ ] **Task 1.7** — Unit test: load model, run dummy forward pass, verify output shape (1, 5)

### Grad-CAM Module (`gradcam.py`)
- [ ] **Task 1.8** — Create `GradCAM` class with hook registration on `model.features[-1]`
- [ ] **Task 1.9** — Implement `generate(input_tensor, class_idx)` → heatmap (H, W) normalized 0–1
- [ ] **Task 1.10** — Implement `overlay_on_image(original, heatmap, alpha=0.5)` → blended uint8 image
- [ ] **Task 1.11** — Implement `remove_hooks()` for cleanup
- [ ] **Task 1.12** — Test: generate heatmap for class 2, save overlay, visually verify attention on lesions

### Backend API (`app.py`)
- [ ] **Task 1.13** — Create FastAPI app with CORS middleware (allow all origins)
- [ ] **Task 1.14** — Implement `POST /predict` endpoint: multipart file → preprocess → predict → Grad-CAM → JSON
- [ ] **Task 1.15** — Response schema: class_idx, class_name, confidence, all_probs, heatmap_base64, processing_time_ms
- [ ] **Task 1.16** — Error handling: 400 (invalid file), 413 (too large), 500 (model error)
- [ ] **Task 1.17** — Add `GET /health` endpoint
- [ ] **Task 1.18** — Test: `uvicorn app:app --reload`, verify `/docs` loads, test `/predict` with curl

### Frontend (`index.html`)
- [ ] **Task 1.19** — Single HTML file: drag-drop zone, image preview, "Analyze" button
- [ ] **Task 1.20** — Loading spinner during fetch
- [ ] **Task 1.21** — Results display: class badge (color-coded), confidence bar, 5-class probability bars
- [ ] **Task 1.22** — Grad-CAM visualization: three tabs (Original | Heatmap | Overlay)
- [ ] **Task 1.23** — Error toast notifications
- [ ] **Task 1.24** — Responsive CSS, works on mobile

### End-to-End Integration
- [ ] **Task 1.25** — Start backend (`uvicorn app:app --port 8000`)
- [ ] **Task 1.26** — Serve frontend (`python -m http.server 3000` in project dir)
- [ ] **Task 1.27** — Open `http://localhost:3000`, upload test image, verify full pipeline
- [ ] **Task 1.28** — Git init, first commit, push to GitHub (private repo)

### Day 1 Metrics to Capture
| Metric | Target | Actual | Notes |
|--------|--------|--------|-------|
| Weights download time | < 10 min | | |
| Model load time | < 3 sec | | |
| Single inference + Grad-CAM | < 500 ms | | |
| API response time (local) | < 800 ms | | |
| Frontend load time | < 1 sec | | |

---

## 🎯 Day 2 — 2026-08-22 (Saturday) — Test, Refine, Metrics

### Test Image Curation
- [ ] **Task 2.1** — Download 10 test images (2 per class) from APTOS test + IDRiD
- [ ] **Task 2.2** — Organize in `test_images/` with naming: `test_{class}_{num}.png`
- [ ] **Task 2.3** — Verify class labels match ground truth

### Inference Testing
- [ ] **Task 2.4** — Run `test_inference.py` on all 10 images
- [ ] **Task 2.5** — Save heatmap overlays to `test_outputs/`
- [ ] **Task 2.6** — Visually inspect Grad-CAM quality (attends to lesions? not artifacts?)
- [ ] **Task 2.7** — Log predictions vs ground truth in `test_predictions.csv`

### Bug Fixes
- [ ] **Task 2.8** — Fix any memory leaks (hook cleanup, tensor deletion)
- [ ] **Task 2.9** — Optimize Grad-CAM speed (target < 500ms total)
- [ ] **Task 2.10** — Fix CORS if frontend can't connect
- [ ] **Task 2.11** — Handle edge cases: grayscale images, wrong aspect ratio, corrupt files

### Validation Metrics (APTOS Holdout + IDRiD)
- [ ] **Task 2.12** — Download APTOS holdout set (500 images) + IDRiD subset (100 images)
- [ ] **Task 2.13** — Run batch inference, collect predictions
- [ ] **Task 2.14** — Compute metrics:
  - [ ] Overall Accuracy
  - [ ] Per-class Sensitivity (Recall)
  - [ ] Per-class Specificity
  - [ ] Sensitivity for Referable DR (Class 2+)
  - [ ] Specificity for Referable DR (Class 2+)
  - [ ] Macro F1
  - [ ] Quadratic Kappa
  - [ ] Macro AUC-ROC (OvR)
- [ ] **Task 2.15** — Save metrics to `metrics.json`
- [ ] **Task 2.16** — Generate confusion matrix plot (save as `confusion_matrix.png`)

### Presentation Prep Start
- [ ] **Task 2.17** — Draft `demo_script.md` (5-min flow with talking points)
- [ ] **Task 2.18** — Outline slide deck structure (8–10 slides)
- [ ] **Task 2.19** — Update `progress.md` with Day 2 metrics, blockers, decisions

### Day 2 Metrics to Capture
| Metric | Prototype Target | SIH Target | Actual | Gap |
|--------|------------------|------------|--------|-----|
| Sensitivity (Class 2+) | > 80% | > 90% | | |
| Specificity (Class 2+) | > 75% | > 85% | | |
| Overall Accuracy | > 70% | — | | |
| Quadratic Kappa | > 0.65 | — | | |
| Macro AUC-ROC | > 0.85 | — | | |
| Inference + Grad-CAM | < 500ms | — | | |

---

## 🎯 Day 3 — 2026-08-23 (Sunday) — Demo Polish & Backup

### Demo Rehearsals
- [ ] **Task 3.1** — Rehearsal #1: Full 5-min run-through with timer
  - *Notes:* 
- [ ] **Task 3.2** — Rehearsal #2: With UI polish applied
  - *Notes:*
- [ ] **Task 3.3** — Rehearsal #3: Final polish, backup video ready
  - *Notes:*

### UI Polish
- [ ] **Task 3.4** — Improve heatmap colormap (Jet → Viridis or custom clinical)
- [ ] **Task 3.5** — Add loading states, progress indicators
- [ ] **Task 3.6** — Improve error messages (user-friendly)
- [ ] **Task 3.7** — Color-code class badges: Green(0), Yellow(1), Orange(2), Red(3), DarkRed(4)
- [ ] **Task 3.8** — Add "Referable DR" flag prominently (Class ≥ 2)

### Backup Video
- [ ] **Task 3.9** — Record `demo_backup.mp4` (5 min, narrated)
  - *Tool:* OBS Studio / Loom
  - *Content:* Full demo flow + key talking points

### Architecture Documentation
- [ ] **Task 3.10** — Write `architecture.md` (1-page): model, data flow, API, Grad-CAM method
- [ ] **Task 3.11** — Create `demo_package.zip` with: weights/, test_images/, demo_backup.mp4, architecture.md, metrics.json

### Final Prep
- [ ] **Task 3.12** — Pre-presentation checklist: API running, frontend loaded, test image works
- [ ] **Task 3.13** — Update `progress.md` with final status

---

## 🎯 Day 4 — 2026-08-24 (Monday) — Presentation Day

- [ ] **Task 4.1** — Morning check: restart services, verify demo works
- [ ] **Task 4.2** — Present prototype (5 min demo + 5 min Q&A)
- [ ] **Task 4.3** — Post-event: capture judge feedback, update `progress.md` with outcomes

---

## 🧩 Component-Level Status

| Component | Status | Last Updated | Notes |
|-----------|--------|--------------|-------|
| **Weights** | ⬜ Not Started | — | Need Kaggle notebook URL |
| **model.py** | ⬜ Not Started | — | |
| **gradcam.py** | ⬜ Not Started | — | |
| **app.py** | ⬜ Not Started | — | |
| **index.html** | ⬜ Not Started | — | |
| **Test Suite** | ⬜ Not Started | — | |
| **Validation Metrics** | ⬜ Not Started | — | |
| **Frontend Polish** | ⬜ Not Started | — | |
| **Demo Script** | ⬜ Not Started | — | |
| **Backup Video** | ⬜ Not Started | — | |
| **Architecture Doc** | ⬜ Not Started | — | |
| **Presentation Slides** | ⬜ Not Started | — | Team member |

---

## 📊 Metrics Tracker (Fill In As We Go)

### Prototype Metrics (Day 2 Target)
```json
{
  "overall_accuracy": null,
  "per_class_sensitivity": [null, null, null, null, null],
  "per_class_specificity": [null, null, null, null, null],
  "sensitivity_referable": null,
  "specificity_referable": null,
  "macro_f1": null,
  "quadratic_kappa": null,
  "macro_auc_roc": null,
  "inference_latency_ms": null,
  "gradcam_latency_ms": null,
  "total_latency_ms": null,
  "test_set": "APTOS_holdout_500 + IDRiD_100",
  "date_measured": null
}
```

### SIH Target Comparison
| Metric | SIH Target | Prototype Actual | Gap | Action Needed |
|--------|------------|------------------|-----|---------------|
| Sensitivity (Referable DR) | > 90% | | | More training, class balancing |
| Specificity (Referable DR) | > 85% | | | More training, calibration |
| Quadratic Kappa | — | | | — |
| Inference Time | — | | | Optimize if > 500ms |

---

## 🚧 Blockers & Issues Log

| Date | Blocker | Severity | Resolution | Resolved? |
|------|---------|----------|------------|-----------|
| 2026-08-22 | Need Kaggle notebook URL for weights | Critical | Search Kaggle "APTOS EfficientNet B0 1 epoch" | ⬜ |
| 2026-08-22 | IDRiD dataset access (IEEE DataPort) | High | Ask teammate for credentials | ⬜ |
| 2026-08-22 | Colab GPU quota (12h limit) | Medium | Download weights early, train locally if needed | ⬜ |

---

## 📝 Decision Log

| Date | Decision | Context | Rationale | Alternatives Considered |
|------|----------|---------|-----------|------------------------|
| 2026-08-22 | EfficientNet-B0 for prototype | Model selection | Best accuracy/speed for 224×224; proven on APTOS | ResNet50, ViT, ConvNeXt |
| 2026-08-22 | 1-epoch public weights | Training time | 72-hour deadline; no time for proper training | Train from scratch, more epochs |
| 2026-08-22 | Custom Grad-CAM hooks | Explainability | Zero deps; full control; <50 lines | torchcam, captum |
| 2026-08-22 | Vanilla HTML frontend | Demo simplicity | No build step; portable; offline-capable | React, Streamlit, Gradio |
| 2026-08-22 | Base64 heatmap in JSON | API design | Single request/response; frontend simplicity | Separate endpoint, WebSocket |
| 2026-08-22 | Resize 224 + ImageNet norm | Preprocessing | Matches timm pretrained expectations | Ben Graham crop, center crop |
| 2026-08-22 | No class weights for prototype | Loss function | 1-epoch weights already trained; fix in v2 | Weighted CE, focal loss |

---

## 📋 Open Questions (from execution_plan.md)

| # | Question | Status | Owner | Resolution Target |
|---|----------|--------|-------|-------------------|
| 1 | Exact Kaggle notebook URL for weights? | ⬜ Open | Me | Day 1 09:00 |
| 2 | APTOS test labels public or hidden? | ⬜ Open | Me | Day 1 09:30 |
| 3 | IDRiD download access? | ⬜ Open | Team | Day 1 10:00 |
| 4 | Class mapping in weights = APTOS 0–4? | ⬜ Open | Me | Day 1 10:30 |
| 5 | Frontend serving: python http.server vs FastAPI static? | ⬜ Open | Me | Day 1 16:00 |
| 6 | Grad-CAM colormap choice? | ⬜ Open | Me | Day 2 16:00 |
| 7 | Presentation format: slides or demo only? | ⬜ Open | Team | Day 2 17:00 |
| 8 | Judge Q&A technical depth expected? | ⬜ Open | Team | Day 3 09:00 |

---

## 📁 File Status Checklist

| File | Status | Last Modified | Size |
|------|--------|---------------|------|
| `context.md` | ✅ Done | 2026-08-22 | — |
| `execution_plan.md` | ✅ Done | 2026-08-22 | — |
| `progress.md` | ✅ Done (this file) | 2026-08-22 | — |
| `model.py` | ⬜ Pending | — | — |
| `gradcam.py` | ⬜ Pending | — | — |
| `app.py` | ⬜ Pending | — | — |
| `index.html` | ⬜ Pending | — | — |
| `weights/dr_model.pth` | ⬜ Pending | — | — |
| `requirements.txt` | ⬜ Pending | — | — |
| `test_inference.py` | ⬜ Pending | — | — |
| `test_api.py` | ⬜ Pending | — | — |
| `architecture.md` | ⬜ Pending | — | — |
| `demo_script.md` | ⬜ Pending | — | — |
| `metrics.json` | ⬜ Pending | — | — |
| `README.md` | ⬜ Pending | — | — |

---

## 🔄 Next Actions (Immediate)

1. **Find Kaggle notebook** with 1-epoch EfficientNet-B0 weights for APTOS 2019
2. **Download weights** to `weights/dr_model.pth`
3. **Verify weights load** with `timm.create_model("efficientnet_b0", num_classes=5)`
4. **Start building `model.py`** — wrapper class with preprocessing + inference

---

## 📌 Notes for Future Me (Post-Aug-24)

- The 1-epoch weights are a **temporary hack** — real training needs 20+ epochs with proper augmentation
- Class imbalance in APTOS is severe (Class 0: ~1800, Class 4: ~100) — must use weighted sampler + focal loss
- Grad-CAM on `features[-1]` gives 7×7 heatmap — upsample to 224×224 with bilinear
- Messidor-2 external validation is **critical** for credibility — different camera, population
- MATLAB/Simulink integration will need **ONNX export** with dynamic batch size
- Confidence calibration (temperature scaling) requires **held-out validation set** — don't use test set
- For 100k patients/year: async queue (Redis/RQ) + batch inference (batch=8) + horizontal scaling

---

*Update this file after every major task completion. Use checkboxes for granular tracking.*