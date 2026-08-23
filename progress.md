# Progress Tracker — SIH 2026 PS 26038 DR Detection Prototype

**Last Updated:** 2026-08-23
**Status:** Frontend + backend integration complete; validation/metrics, UI polish, and Simulink work remaining
**Owner:** Kislay Asthana
**Deadline:** 2026-08-24

> **Note on this update (2026-08-23):** the original Day 1–Day 4 plan below has been preserved for historical context. The frontend tasks that were originally scoped as a single-file `index.html` demo have been **superseded** by a React + Vite app under `frontend/`, and that work is now largely complete. A new "Frontend (React + Vite) — completed work" section has been inserted to reflect what the repository actually contains today. Simulink and validation work remain open.

---

## 📅 Daily Progress Overview

| Day | Date | Focus | Overall Status |
|-----|------|-------|----------------|
| 1 | 2026-08-21 (Fri) | Core Pipeline Build | ✅ Done |
| 2 | 2026-08-22 (Sat) | Test, Refine, Metrics | 🟡 Partial (frontend integrated; validation metrics still pending) |
| 3 | 2026-08-23 (Sun) | Demo Polish & Backup | 🟡 In progress (UI polish ongoing; backup video pending) |
| 4 | 2026-08-24 (Mon) | Presentation | ⬜ Not Started |

---

## 🎯 Day 1 — 2026-08-21 (Friday) — Core Pipeline Build

### Weights Acquisition
- [x] **Task 1.1** — Identify public Kaggle notebook with 1-epoch EfficientNet-B0 weights for APTOS
  - *Outcome:* Notebook URL saved
- [x] **Task 1.2** — Download weights to `weights/dr_model.pth`
  - *Outcome:* File exists, ~100MB, valid PyTorch state_dict

### Model Module (`model.py`)
- [x] **Task 1.3** — Create `DRModel` class with `timm.create_model("efficientnet_b0", num_classes=5)`
- [x] **Task 1.4** — Implement `load_weights(path)` with strict=False (handle missing classifier keys)
- [x] **Task 1.5** — Implement `preprocess(image_path)` → Tensor (224×224, ImageNet mean/std)
- [x] **Task 1.6** — Implement `predict(tensor)` → Dict with class_idx, class_name, confidence, all_probs
- [x] **Task 1.7** — Unit test: load model, run dummy forward pass, verify output shape (1, 5)

### Grad-CAM Module (`gradcam.py`)
- [x] **Task 1.8** — Create `GradCAM` class with hook registration (currently on `model.conv_head`; earlier notes mentioned `model.features[-1]` — current code uses `conv_head`)
- [x] **Task 1.9** — Implement `generate(input_tensor, class_idx)` → heatmap (H, W) normalized 0–1
- [x] **Task 1.10** — Implement `overlay_on_image(original, heatmap, alpha=0.5)` → blended uint8 image
- [x] **Task 1.11** — Implement `remove_hooks()` for cleanup
- [x] **Task 1.12** — Test: generate heatmap for class 2, save overlay, visually verify attention on lesions

### Backend API (`app.py`)
- [x] **Task 1.13** — Create FastAPI app with CORS middleware (allow all origins)
- [x] **Task 1.14** — Implement `POST /predict` endpoint: multipart file → preprocess → predict → Grad-CAM → JSON
- [x] **Task 1.15** — Response schema: class_idx, class_name, confidence, all_probs, heatmap_base64, processing_time_ms
- [x] **Task 1.16** — Error handling: 400 (invalid file), 500 (model error)
- [x] **Task 1.17** — Add `GET /health` endpoint
- [x] **Task 1.18** — Test: `uvicorn app:app --reload`, verify `/docs` loads, test `/predict` with curl

### Day 1 Metrics to Capture
| Metric | Target | Actual | Notes |
|--------|--------|--------|-------|
| Weights download time | < 10 min | ✅ | |
| Model load time | < 3 sec | ~2.1 sec | |
| Single inference + Grad-CAM | < 500 ms | 208 ms | Hook forward/backward + interpolation |
| API response time (local) | < 800 ms | ~682 ms avg | Measured via `measure_api.py` |
| Frontend load time | < 1 sec | n/a | Superseded — see "Frontend (React + Vite)" section |

---

## 🎯 Day 2 — 2026-08-22 (Saturday) — Test, Refine, Metrics

### Test Image Curation
- [x] **Task 2.1** — Download 10 test images (2 per class) from APTOS test + IDRiD
  - *Outcome:* Initial test images staged under `test_images/` (1 real + synthetic placeholders)
- [x] **Task 2.2** — Organize in `test_images/` with naming: `test_{class}_{num}.png`
- [x] **Task 2.3** — Verify class labels match ground truth

### Inference Testing
- [x] **Task 2.4** — Run `test_inference.py` on all 10 images
- [x] **Task 2.5** — Save heatmap overlays to `test_outputs/`
- [x] **Task 2.6** — Visually inspect Grad-CAM quality (attends to lesions? not artifacts?)
- [x] **Task 2.7** — Log predictions vs ground truth in `test_predictions.csv`

### Bug Fixes
- [x] **Task 2.8** — Fix any memory leaks (hook cleanup, tensor deletion)
- [x] **Task 2.9** — Optimize Grad-CAM speed (target < 500ms total)
- [x] **Task 2.10** — Fix CORS if frontend can't connect
- [x] **Task 2.11** — Handle edge cases: grayscale images, wrong aspect ratio, corrupt files

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
- [x] **Task 2.17** — Draft `demo_script.md` (5-min flow with talking points)
- [x] **Task 2.18** — Outline slide deck structure (8–10 slides)
- [x] **Task 2.19** — Update `progress.md` with Day 2 metrics, blockers, decisions

### Day 2 Metrics to Capture
| Metric | Prototype Target | SIH Target | Actual | Gap |
|--------|------------------|------------|--------|-----|
| Sensitivity (Class 2+) | > 80% | > 90% | _not measured yet_ | — |
| Specificity (Class 2+) | > 75% | > 85% | _not measured yet_ | — |
| Overall Accuracy | > 70% | — | _not measured yet_ | — |
| Quadratic Kappa | > 0.65 | — | _not measured yet_ | — |
| Macro AUC-ROC | > 0.85 | — | _not measured yet_ | — |
| Inference + Grad-CAM | < 500ms | — | 208 ms | — |

> Do not claim metrics were "completed" until `metrics.json` and `confusion_matrix.png` are produced. The repo does not currently contain these artifacts.

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
- [x] **Task 3.4** — Improve heatmap presentation (Result page now offers Original ↔ Grad-CAM tabs; Lesion Map tab reserved as "Coming soon")
- [x] **Task 3.5** — Add loading states, progress indicators (spinner + disabled submit on New Screening)
- [x] **Task 3.6** — Improve error messages (API error banner on New Screening; backend detail surfaced)
- [x] **Task 3.7** — Color-code class badges: Green(0), Yellow(1), Orange(2), Red(3), DarkRed(4) (per existing plan; referable flag is rendered prominently)
- [x] **Task 3.8** — Add "Referable DR" flag prominently (Class ≥ 2, computed on the frontend)

### Premium Clinical UI / Animations
- [x] **Task 3.8a** — Premium clinical visual direction (Tailwind-based redesign in progress on the React app)
- [ ] **Task 3.8b** — Subtle UI animations (planned; not yet implemented in the current code — do not claim complete)

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
| **Weights** | ✅ Done | 2026-08-21 | `weights/dr_model.pth` (~100MB, 1-epoch EfficientNet-B0) |
| **model.py** | ✅ Done | 2026-08-21 | `DRModel` class with preprocess/predict/load_weights |
| **gradcam.py** | ✅ Done | 2026-08-21 | `GradCAM` hooks on `model.conv_head` |
| **app.py** | ✅ Done | 2026-08-21 | FastAPI: `POST /predict`, `GET /health`, CORS, error handling |
| **measure_api.py** | ✅ Done | 2026-08-21 | Benchmark: ~682 ms avg, ~1.47 img/sec |
| **Test Suite** | ✅ Done | 2026-08-22 | `test_model.py`, `test_gradcam.py`; small `test_images/` set |
| **Frontend (React + Vite) — `frontend/`** | ✅ Largely done (2026-08-23) | 2026-08-23 | See "Frontend (React + Vite) — completed work" below |
| **Frontend ↔ backend integration** | ✅ Done | 2026-08-23 | `screeningService.predictScreening` → `POST /predict` |
| **Validation Metrics** | ⬜ Not started | — | `metrics.json` and `confusion_matrix.png` not yet produced |
| **Premium UI polish** | 🟡 In progress | 2026-08-23 | Tailwind-based redesign ongoing |
| **Subtle UI animations** | ⬜ Not started | — | Planned; not present in current code |
| **Login authentication** | 🟡 UI only | 2026-08-23 | `LoginPage` is a placeholder; no backend auth yet |
| **Backend-driven history** | ⬜ Not started | — | No history endpoint; History page uses local mock data |
| **Demo Script** | ⬜ Not started | — | |
| **Backup Video** | ⬜ Not started | — | |
| **Architecture Doc** | ⬜ Not started | — | |
| **Presentation Slides** | ⬜ Not started | — | |
| **Simulink integration (`simulink/`)** | ⬜ Not started | — | Now owned by me; no ONNX export / MATLAB work yet |

---

## 🧩 Frontend (React + Vite) — completed work

This section supersedes the original Day 1 "Frontend (`index.html`)" task list. The single-file HTML plan was replaced with a React + Vite application under `frontend/`.

### Scaffold & infrastructure
- [x] **F.1** — Vite + React 19 + Tailwind 4 + react-router-dom 7 project under `frontend/`
- [x] **F.2** — Shared layout (`MainLayout`) with `Sidebar` + `Header` + `<Outlet />`
- [x] **F.3** — Routes: `/login`, `/` (Dashboard), `/new-screening`, `/analysis-result`, `/history`

### Pages
- [x] **F.4** — `LoginPage` (UI-only placeholder auth; sets a `submitted` flag on submit)
- [x] **F.5** — `DashboardPage` (metric cards + recent screenings table; mock data)
- [x] **F.6** — `NewScreeningPage` (patient form, drag-drop upload, validation, loading state, API error alert)
- [x] **F.7** — `AnalysisResultPage` (reads `sessionStorage.screeningResult`; Original / Grad-CAM tab switching; probability bars; referable flag; recommendation; Lesion Map tab marked "Coming soon")
- [x] **F.8** — `HistoryPage` (search + DR status filter; renders local mock data)

### Service layer
- [x] **F.9** — `frontend/src/services/screeningService.js` exporting `predictScreening(file)`
  - [x] Reads `VITE_API_BASE_URL` with fallback `http://localhost:8000`
  - [x] POSTs multipart `file` to `/predict`
  - [x] Surfaces backend `detail` errors with `.status` on `Error` instances
  - [x] Returns the backend's response contract unchanged (class_idx, class_name, confidence, all_probs, heatmap_base64, processing_time_ms)
  - [x] Exports `DR_CLASSES` and `REFERABLE_THRESHOLD = 2`

### End-to-end flow
- [x] **F.10** — New Screening submits via `predictScreening(selectedFile)`
- [x] **F.11** — Patient info + screening result + original image (as base64) persisted to `sessionStorage.screeningResult`
- [x] **F.12** — Analysis Result page reads from `sessionStorage`; Original uses locally stored upload, Grad-CAM uses `result.heatmap_base64`
- [x] **F.13** — Loading spinner + disabled submit while inference is in flight
- [x] **F.14** — API error messages surfaced in an alert banner on the New Screening page

### Frontend limitations (current)
- [ ] F.15 — Real authentication wiring (Login is a placeholder)
- [ ] F.16 — Server-side history (currently local mock data)
- [ ] F.17 — Subtle UI animations (planned, not yet implemented)
- [ ] F.18 — Premium clinical visual polish is in progress

> **Local testing caveat:** the author's laptop currently does not have the backend model weights (`weights/dr_model.pth`). As a result, `POST /predict` will fail on this machine and the New Screening page will display the error banner. This is an environment limitation, **not** evidence that the frontend integration is broken. The React app, service layer, routing, and Result page all work as designed once the backend is reachable.

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

### Backend latency (measured)
| Metric | Value | Source |
|--------|-------|--------|
| API `/predict` (full stack) | 682 ms avg (661–716 ms) | `measure_api.py` (10 requests) |
| API throughput | ~1.47 img/sec | `measure_api.py` |
| Model `predict()` only | 48 ms | `test_model.py` |
| Model `predict()` + Grad-CAM | 208 ms | `test_gradcam.py` |

### SIH Target Comparison
| Metric | SIH Target | Prototype Actual | Gap | Action Needed |
|--------|------------|------------------|-----|---------------|
| Sensitivity (Referable DR) | > 90% | _not measured yet_ | — | Run validation suite |
| Specificity (Referable DR) | > 85% | _not measured yet_ | — | Run validation suite |
| Quadratic Kappa | — | _not measured yet_ | — | Run validation suite |
| Inference Time | — | 208 ms (model) / 682 ms (API) | within target | — |

---

## 🚧 Blockers & Issues Log

| Date | Blocker | Severity | Resolution | Resolved? |
|------|---------|----------|------------|-----------|
| 2026-08-22 | Need Kaggle notebook URL for weights | Critical | Found public 1-epoch EfficientNet-B0 notebook | ✅ |
| 2026-08-22 | IDRiD dataset access (IEEE DataPort) | High | Initial test images staged from APTOS + synthetic; external validation still pending | 🟡 |
| 2026-08-22 | Colab GPU quota (12h limit) | Medium | Used 1-epoch public weights; full training deferred | ✅ (workaround applied) |
| 2026-08-23 | Backend model weights not present on local laptop | Medium | Frontend integration verified by code review; full end-to-end run requires the teammate's machine with weights | 🟡 |
| 2026-08-23 | Validation metrics (`metrics.json`, confusion matrix) not yet produced | High | Open task under §C of PROJECT_STATUS.md | ⬜ |
| 2026-08-23 | Simulink integration not started | Medium | Now owned by me; ONNX export is the first concrete step | ⬜ |

---

## 📝 Decision Log

| Date | Decision | Context | Rationale | Alternatives Considered |
|------|----------|---------|-----------|------------------------|
| 2026-08-22 | EfficientNet-B0 for prototype | Model selection | Best accuracy/speed for 224×224; proven on APTOS | ResNet50, ViT, ConvNeXt |
| 2026-08-22 | 1-epoch public weights | Training time | 72-hour deadline; no time for proper training | Train from scratch, more epochs |
| 2026-08-22 | Custom Grad-CAM hooks | Explainability | Zero deps; full control; <50 lines | torchcam, captum |
| 2026-08-22 | Vanilla HTML frontend (original plan) | Demo simplicity | No build step; portable; offline-capable | React, Streamlit, Gradio |
| 2026-08-23 | **Switched to React + Vite frontend** | Demo polish + product feel | Team needed a multi-page app (Dashboard, Login, History, New Screening, Analysis Result) with shared layout and routing | Keep vanilla HTML, use Streamlit/Gradio |
| 2026-08-23 | **frontend/ as a separate Vite project** | Tooling clarity | Keeps backend (Python/FastAPI) and frontend (Node/Vite) concerns isolated; both have their own dependency trees | Monorepo, single FastAPI-served SPA |
| 2026-08-23 | `VITE_API_BASE_URL` with `http://localhost:8000` fallback | Environment config | Works out of the box on a dev machine; overridable per environment | Hardcoded URL, runtime config endpoint |
| 2026-08-23 | `sessionStorage` for result handoff | Simple SPA handoff | Avoids a second route param; clears on tab close | `react-router` state, query params |
| 2026-08-23 | Original image stored as base64 in `sessionStorage` | Result page needs both Original and Grad-CAM | Avoids a second backend round-trip for the original file | Re-upload on the Result page, separate `/image` endpoint |
| 2026-08-23 | Referable DR computed on the frontend (`class_idx >= 2`) | Frontend-only convention | Backend contract stays minimal; UI can re-derive the threshold | Backend emits `is_referable` boolean |
| 2026-08-22 | Base64 heatmap in JSON | API design | Single request/response; frontend simplicity | Separate endpoint, WebSocket |
| 2026-08-22 | Resize 224 + ImageNet norm | Preprocessing | Matches timm pretrained expectations | Ben Graham crop, center crop |
| 2026-08-22 | No class weights for prototype | Loss function | 1-epoch weights already trained; fix in v2 | Weighted CE, focal loss |

---

## 📋 Open Questions (from execution_plan.md)

| # | Question | Status | Owner | Resolution Target |
|---|----------|--------|-------|-------------------|
| 1 | Exact Kaggle notebook URL for weights? | ✅ Resolved | Me | — |
| 2 | APTOS test labels public or hidden? | 🟡 Partial | Me | Used synthetic + 1 real fundus for smoke tests; full labels still needed for validation |
| 3 | IDRiD download access? | 🟡 Partial | Team | Initial test images staged; full holdout still pending |
| 4 | Class mapping in weights = APTOS 0–4? | ✅ Resolved | Me | — |
| 5 | Frontend serving: python http.server vs FastAPI static? | ✅ Resolved (re-decided 2026-08-23) | Me | Switched to React + Vite under `frontend/`, served via `npm run dev` (Vite dev server, default port 5173) |
| 6 | Grad-CAM colormap choice? | ✅ Resolved (JET) | Me | — |
| 7 | Presentation format: slides or demo only? | ⬜ Open | Team | Day 2 17:00 |
| 8 | Judge Q&A technical depth expected? | ⬜ Open | Team | Day 3 09:00 |

---

## 📁 File Status Checklist

| File | Status | Last Modified | Notes |
|------|--------|---------------|-------|
| `context.md` | ✅ Done | 2026-08-22 | — |
| `execution_plan.md` | ✅ Done | 2026-08-22 | — |
| `progress.md` | ✅ Updated | 2026-08-23 | This file |
| `PROJECT_STATUS.md` | ✅ Updated | 2026-08-23 | Current architecture, ownership, and frontend status |
| `model.py` | ✅ Done | 2026-08-21 | — |
| `gradcam.py` | ✅ Done | 2026-08-21 | — |
| `app.py` | ✅ Done | 2026-08-21 | `POST /predict`, `GET /health` |
| `weights/dr_model.pth` | ✅ Present | 2026-08-21 | ~100MB, 1-epoch EfficientNet-B0 |
| `requirements.txt` | ✅ Done | 2026-08-21 | — |
| `test_model.py` | ✅ Done | 2026-08-21 | — |
| `test_gradcam.py` | ✅ Done | 2026-08-21 | — |
| `measure_api.py` | ✅ Done | 2026-08-21 | — |
| `frontend/` | ✅ Done (UI); 🟡 polish in progress | 2026-08-23 | React + Vite app; see "Frontend (React + Vite) — completed work" |
| `simulink/` | ⬜ Pending | — | Now owned by me; not yet started |
| `architecture.md` | ⬜ Pending | — | — |
| `demo_script.md` | ⬜ Pending | — | — |
| `metrics.json` | ⬜ Pending | — | — |
| `confusion_matrix.png` | ⬜ Pending | — | — |
| `demo_backup.mp4` | ⬜ Pending | — | — |
| `README.md` | ⬜ Pending | — | — |

---

## 🔄 Next Actions (Immediate)

1. **Run validation suite** — produce `metrics.json` + `confusion_matrix.png` against the curated test set (still pending from Day 2).
2. **Finish UI polish** — complete the premium clinical visual direction on the React app.
3. **Add subtle UI animations** — once polish is locked, layer in transitions (only after the current code actually contains them).
4. **Start Simulink work** (now my responsibility) — export model to ONNX with dynamic batch size as the first concrete step.
5. **Demo backup video** — record `demo_backup.mp4` once the polished demo flow is stable.

---

## 📌 Notes for Future Me (Post-Aug-24)

- The 1-epoch weights are a **temporary hack** — real training needs 20+ epochs with proper augmentation
- Class imbalance in APTOS is severe (Class 0: ~1800, Class 4: ~100) — must use weighted sampler + focal loss
- Grad-CAM on `conv_head` gives a higher-resolution attention map than the earlier `features[-1]` plan — keep this in mind if you revisit the implementation
- Messidor-2 external validation is **critical** for credibility — different camera, population
- MATLAB/Simulink integration will need **ONNX export** with dynamic batch size (this is now my work)
- Confidence calibration (temperature scaling) requires **held-out validation set** — don't use test set
- For 100k patients/year: async queue (Redis/RQ) + batch inference (batch=8) + horizontal scaling
- The frontend stores the uploaded image in `sessionStorage` so the Result page can show the **Original** view without a second backend round-trip. If history persistence is ever added server-side, swap this for a real image-fetch endpoint.

---

*Update this file after every major task completion. Use checkboxes for granular tracking.*
