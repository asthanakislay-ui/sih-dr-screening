# PROJECT_STATUS.md — SIH 2026 PS 26038 DR Detection Prototype

**Last Updated:** 2026-08-22  
**For:** New teammate joining today — zero context assumed

---

## 1. What This Project Does (One Paragraph)

This is a **diabetic retinopathy (DR) screening prototype** built for SIH 2026 Problem Statement 26038. It takes a retinal fundus photograph and outputs a 5-class severity grade (No DR → Mild → Moderate → Severe → Proliferative) with an explainable Grad-CAM heatmap overlay. The goal: deploy at primary health centers (PHCs) in rural India where <10% of 70M diabetics get screened, referring only "referable DR" (Moderate+) cases to ophthalmologists via telemedicine. Current state: **FastAPI backend + model + Grad-CAM working end-to-end**; frontend, validation metrics, and Simulink integration still pending.

---

## 2. Current Architecture — File Map & Data Flow

```
fundus_img.png (upload)
        │
        ▼
┌───────────────────┐
│   app.py          │  FastAPI server (port 8000)
│  - POST /predict  │  • multipart image → temp file
│  - GET  /health   │  • calls DRModel.preprocess()
└─────────┬─────────┘  • calls DRModel.predict()
          │           • calls GradCAM.generate()
          ▼           • calls GradCAM.overlay_on_image()
┌───────────────────┐   • returns JSON + base64 PNG heatmap
│   model.py        │
│  DRModel class    │  timm.create_model("efficientnet_b0", num_classes=5)
│  - preprocess()   │  224×224 resize + ImageNet normalization
│  - predict()      │  Loads weights/dr_model.pth (strict=False)
│  - load_weights() │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   gradcam.py      │
│  GradCAM class    │  Hooks on model.conv_head (EfficientNet-B0 in timm)
│  - generate()     │  Returns 224×224 normalized heatmap (0–1)
│  - overlay()      │  Blends with cv2.COLORMAP_JET (alpha=0.5)
│  - remove_hooks() │
└───────────────────┘
```

**Key files in repo root:**
| File | Role |
|------|------|
| `model.py` | DRModel wrapper: preprocessing, inference, weight loading |
| `gradcam.py` | Grad-CAM hook-based implementation on `conv_head` |
| `app.py` | FastAPI backend: `/predict`, `/health`, CORS, error handling |
| `test_model.py` | Quick model load + predict sanity check |
| `test_gradcam.py` | End-to-end Grad-CAM overlay generation + save |
| `measure_api.py` | Benchmark script (10 requests → latency stats) |
| `weights/dr_model.pth` | **1-epoch fine-tuned EfficientNet-B0** (~100MB, from public Kaggle) |
| `test_images/` | 1 real test image + synthetic placeholders |
| `requirements.txt` | torch, timm, fastapi, uvicorn, opencv, albumentations, sklearn... |

---

## 3. What's Working Right Now (Measured)

| Metric | Value | Notes |
|--------|-------|-------|
| **Model load time** | ~2.1 sec | Cold start, includes weight loading |
| **Model `predict()` only** | **48 ms** | Single forward pass on CPU |
| **Model `predict()` + Grad-CAM** | **208 ms** | Hook forward/backward + interpolation |
| **API `/predict` (full stack)** | **682 ms avg** (661–716 ms range) | 10 requests via `measure_api.py` |
| **API throughput** | **1.47 img/sec** (~5,280 img/hr) | Single-threaded uvicorn worker |
| **Test prediction** | Class 2 (Moderate), conf=0.82 | On `fundus_img.png` |
| **Error handling** | 400 with `{"error": "Invalid or corrupted image file"}` | Non-image content-type, corrupt files, empty files |

**JSON response schema (from `/predict`):**
```json
{
  "class_idx": 2,
  "class_name": "Moderate",
  "confidence": 0.8236,
  "all_probs": [0.00009, 0.0165, 0.8236, 0.0231, 0.1367],
  "heatmap_base64": "iVBORw0KGgoAAAANSUhEUg...",
  "processing_time_ms": 682
}
```

---

## 4. What Still Needs to Be Built (Open Tasks)

### 🔴 A. Simulink Integration (Teammate 2 — *not started*)
| Sub-task | Status |
|----------|--------|
| Export model to ONNX with dynamic batch size | ⬜ |
| MATLAB `importONNXNetwork` → Simulink `predict` block | ⬜ |
| Telemedicine workflow: PHC capture → cloud API → Simulink dashboard → ophthalmologist review | ⬜ |
| Load test: 100k patients/yr ≈ 274/day → async queue + batch inference | ⬜ |

### 🟡 B. Frontend Demo (Teammate 1 — *not started*)
| Sub-task | Status |
|----------|--------|
| `index.html` — single file: drag-drop, preview, "Analyze" button | ⬜ |
| Loading spinner during fetch | ⬜ |
| Results: class badge (color-coded), confidence bar, 5-class prob bars | ⬜ |
| Grad-CAM tabs: Original \| Heatmap \| Overlay | ⬜ |
| Error toast notifications, responsive CSS | ⬜ |
| Serve via `python -m http.server 3000` | ⬜ |

### 🟢 C. Validation & Polish (Me — *in progress*)
| Sub-task | Status |
|----------|--------|
| Curate 10 test images (2/class) from APTOS test + IDRiD | ⬜ |
| Run batch inference → `metrics.json` (Accuracy, Sens/Spec per class, Macro F1, Quad Kappa, AUC-ROC) | ⬜ |
| Confusion matrix plot | ⬜ |
| Grad-CAM visual quality check (attends to lesions, not artifacts) | ⬜ |
| Image quality assessment (blur, illumination, FOV) | ⬜ |
| Confidence calibration (temperature scaling, ECE < 0.05) | ⬜ |
| Architecture 1-pager (`architecture.md`) | ⬜ |
| Backup demo video (`demo_backup.mp4`) | ⬜ |

---

## 5. How to Run Locally (From Scratch)

```bash
# 1. Clone & enter
cd D:\sih_hackathon   # or your project path

# 2. Create venv
python -m venv venv
.\venv\Scripts\Activate.ps1   # Windows PowerShell
# source venv/bin/activate    # Linux/macOS

# 3. Install deps
pip install -r requirements.txt

# 4. Verify weights exist
ls weights/dr_model.pth   # ~100MB file must be present

# 5. Start API server
uvicorn app:app --reload --port 8000

# 6. Test in browser
#    - API docs:      http://localhost:8000/docs
#    - Health check:  http://localhost:8000/health
#    - POST /predict: use /docs "Try it out" or curl

# 7. Run benchmark (in another terminal)
python measure_api.py
```

**Expected output at step 7:**
```
Average: ~680 ms | Min: ~660 ms | Max: ~720 ms | ~1.5 img/sec
```

---

## 6. Known Limitations (Be Upfront)

| Limitation | Impact | Planned Fix |
|------------|--------|-------------|
| **1-epoch weights only** | Model severely undertrained; metrics will be far below SIH targets | Full 20–30 epoch training post-Aug-24 with weighted sampler + focal loss |
| **Class 3 (Severe) overpredicted** | Synthetic test runs show ~75% Severe predictions; real recall for Severe likely weak | More training data, class-balanced sampling, external validation on Messidor-2 |
| **No external validation** | Only tested on 1 real fundus image + synthetic noise | APTOS holdout (500) + IDRiD (100) + Messidor-2 (1,748) after Aug-24 |
| **No confidence calibration** | Softmax probabilities not reliable (ECE unknown) | Temperature scaling on held-out validation set |
| **No image quality assessment** | Blur/dark/off-center images silently produce garbage predictions | Laplacian variance (blur), histogram analysis (illumination), optic disc detection (FOV) |
| **CPU-only inference** | ~680ms/api call; too slow for production volume | GPU deployment, batch inference (batch=8), async queue (Redis/RQ) |
| **Single uvicorn worker** | No horizontal scaling | Gunicorn + multiple workers, or containerize with Kubernetes |
| **Hardcoded paths** | `weights/dr_model.pth`, `test_images/` not configurable | Config file / env vars for production |

---

## 7. Quick Reference — Key Commands

| Action | Command |
|--------|---------|
| Run API | `uvicorn app:app --reload --port 8000` |
| Test model directly | `python test_model.py` |
| Test Grad-CAM | `python test_gradcam.py` |
| Benchmark API | `python measure_api.py` |
| Run 5-image test suite | `python -c "from app import run_test_predictions; run_test_predictions()"` |
| View API docs | Open `http://localhost:8000/docs` |

---

## 8. Context Files to Read Next

1. **`context.md`** — Full problem statement, team structure, tech rationale, datasets
2. **`execution_plan.md`** — Hour-by-hour 72-hour plan (Day 1–4 breakdown)
3. **`progress.md`** — Live checkbox tracker with blockers, decisions, metrics tables

---

*Generated 2026-08-22. Update after every major task completion.*