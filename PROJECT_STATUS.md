
\# PROJECT_STATUS.md — SIH 2026 PS 26038 DR Detection Prototype

**Last Updated:** 2026-08-23
**For:** New teammate joining today — zero context assumed

---

## 1. What This Project Does (One Paragraph)

This is a **diabetic retinopathy (DR) screening prototype** built for SIH 2026 Problem Statement 26038. It takes a retinal fundus photograph and outputs a 5-class severity grade (No DR → Mild → Moderate → Severe → Proliferative) with an explainable Grad-CAM heatmap overlay. The goal: deploy at primary health centers (PHCs) in rural India where <10% of 70M diabetics get screened, referring only "referable DR" (Moderate+) cases to ophthalmologists via telemedicine. Current state: **FastAPI backend + model + Grad-CAM working end-to-end; React + Vite frontend integrated with the backend;** validation/metrics work, UI polish, and Simulink integration still pending.

> **Superseded note (historical):** An earlier revision of this document described the frontend as a single-file vanilla HTML demo. That plan was replaced — the frontend has since been rewritten as a React + Vite application under `frontend/` and is now wired to the FastAPI backend. See §2 and §3 for the current architecture.

---

## 2. Current Architecture — File Map & Data Flow

### 2.1 Data flow (current implementation)

```
┌──────────────────────────┐
│  React + Vite frontend   │   User uploads fundus image
│  (frontend/, port 5173)  │   via New Screening page
│                          │
│  NewScreeningPage        │   drag-drop / file picker
│       │                  │   + patient info form
│       │ predictScreening()
│       ▼                  │
│  screeningService.js     │   POST {VITE_API_BASE_URL}/predict
│  (multipart "file")      │   default base = http://localhost:8000
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│   app.py (FastAPI)       │   POST /predict
│   - multipart → temp     │   GET  /health
│   - DRModel.preprocess   │   CORS, error handling
│   - DRModel.predict      │
│   - GradCAM.generate     │
│   - GradCAM.overlay      │
└────┬─────────────────┬───┘
     │                 │
     ▼                 ▼
┌─────────┐      ┌────────────┐
│ model.py│      │ gradcam.py │
│ DRModel │      │  GradCAM   │
│ (timm   │      │  hooks on  │
│  EffB0) │      │  conv_head │
└─────────┘      └────────────┘
     │                 │
     └────────┬────────┘
              ▼
   JSON response: class_idx, class_name, confidence,
                  all_probs, heatmap_base64, processing_time_ms
              │
              ▼
┌──────────────────────────┐
│  AnalysisResultPage      │   reads sessionStorage "screeningResult"
│  - Original / Grad-CAM   │   • Original ← locally stored base64 of upload
│    tab switching         │   • Grad-CAM ← result.heatmap_base64
│  - Referable flag,       │   Referable DR computed on the frontend
│    probabilities,        │   using class_idx >= 2
│    recommendation        │
└──────────────────────────┘
```

### 2.2 Backend module map (unchanged)

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

### 2.3 Frontend module map (current)

```
frontend/
├── index.html
├── package.json          (React 19, Vite 8, Tailwind 4, react-router-dom 7)
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx           (BrowserRouter + routes)
    ├── index.css
    ├── layouts/
    │   └── MainLayout.jsx (Sidebar + Header + <Outlet/>)
    ├── components/
    │   ├── Sidebar.jsx
    │   ├── Header.jsx
    │   ├── MetricCard.jsx
    │   └── ScreeningsTable.jsx
    ├── pages/
    │   ├── LoginPage.jsx          (placeholder auth — UI only)
    │   ├── DashboardPage.jsx
    │   ├── NewScreeningPage.jsx   (form + file + API call)
    │   ├── AnalysisResultPage.jsx (reads sessionStorage, tab switching)
    │   └── HistoryPage.jsx        (local mock data)
    ├── services/
    │   └── screeningService.js    (predictScreening + DR_CLASSES)
    ├── data/                      (mock/demo data for dashboard, history)
    └── assets/                    (mock fundus / grad-cam / hero images)
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
| `frontend/` | React + Vite application (see §2.3) |
| `simulink/` | Reserved workspace for Simulink/ONNX integration (not yet started — see §4A) |

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

> **Do not invent additional backend fields.** The response contract above is the full surface area of `/predict`. There is currently no lesion-level detection, recommendation, image-quality score, raw heatmap, or separate heatmap-only image from the backend. Referable DR is computed on the frontend from `class_idx >= 2`.

### 3.1 Frontend status (current)

| Capability | Status | Notes |
|------------|--------|-------|
| React + Vite project under `frontend/` | ✅ Done | React 19, Vite 8, Tailwind 4, react-router-dom 7 |
| Shared layout (Sidebar + Header) | ✅ Done | `MainLayout.jsx` wraps all app routes |
| Login page | ✅ Done (UI only) | Placeholder auth — no backend connection yet |
| Dashboard page | ✅ Done | Metric cards + recent screenings table (mock data) |
| New Screening page | ✅ Done | Patient form + drag-drop upload + API call |
| Analysis Result page | ✅ Done | Reads `sessionStorage`, supports Original/Grad-CAM switching |
| History page | ✅ Done (local) | Renders from local mock data — no backend history endpoint |
| `screeningService.predictScreening` | ✅ Done | POST `/predict` via `VITE_API_BASE_URL` (fallback `http://localhost:8000`) |
| Loading state during inference | ✅ Done | Spinner + disabled submit while request is in flight |
| API error handling on New Screening | ✅ Done | Surfaces backend error message in an alert banner |
| Original image stored locally for Result page | ✅ Done | Uploaded file → base64 → `sessionStorage` |
| Original ↔ Grad-CAM tab switching | ✅ Done | Result page reads `originalImageBase64` and `result.heatmap_base64` |
| UI visual polish (premium clinical look) | 🟡 In progress | Tailwind-based redesign ongoing; subtle animations planned but not yet complete |
| Authentication integration | ⬜ Not started | Login page is UI-only; no real auth backend yet |

---

## 4. What Still Needs to Be Built (Open Tasks)

### 🔴 A. Simulink Integration (Me — *not started*)
| Sub-task | Status |
|----------|--------|
| Export model to ONNX with dynamic batch size | ⬜ |
| MATLAB `importONNXNetwork` → Simulink `predict` block | ⬜ |
| Telemedicine workflow: PHC capture → cloud API → Simulink dashboard → ophthalmologist review | ⬜ |
| Load test: 100k patients/yr ≈ 274/day → async queue + batch inference | ⬜ |

> **Ownership change:** Simulink work is now owned by me (the author of this update). Previous revisions of this file attributed Simulink to "Teammate 2"; that is no longer current.

### 🟢 B. Frontend (React + Vite) — *largely complete, polish remaining*
| Sub-task | Status |
|----------|--------|
| Project scaffold (Vite + React + Tailwind + Router) | ✅ |
| Shared layout, sidebar, header | ✅ |
| Dashboard, New Screening, Analysis Result, History, Login pages | ✅ |
| `screeningService.predictScreening` (multipart upload to `/predict`) | ✅ |
| New Screening → `/predict` → Analysis Result flow | ✅ |
| Original / Grad-CAM tab switching on Result page | ✅ |
| Loading + error handling on New Screening | ✅ |
| Premium clinical UI polish | 🟡 In progress |
| Subtle UI animations (planned) | ⬜ Not started |
| Login authentication wired to backend | ⬜ Not started |
| Real backend-driven history (replaces mock data) | ⬜ Not started — no backend history endpoint exists yet |

> **Superseded:** the original "vanilla HTML single-file demo" plan in earlier revisions of this file is no longer applicable. The React/Vite app under `frontend/` is the current frontend.

### 🟡 C. Validation & Polish (Me — *in progress*)
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

> **Local testing caveat:** the author's laptop currently does not have the backend model weights required by the FastAPI app, so the full ML inference flow may not run locally. This is an environment / model-weight limitation, **not** evidence that the frontend integration is broken. Do not change backend paths or model behavior to work around this.

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

# 6. Test backend in browser
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

### 5.1 Running the frontend

```bash
# 1. Install JS deps (one-time)
cd frontend
npm install

# 2. (Optional) point at a non-default backend
#    Create frontend/.env with: VITE_API_BASE_URL=http://localhost:8000
#    (default already points at http://localhost:8000)

# 3. Start the dev server
npm run dev
#    Vite serves at http://localhost:5173 (default)

# 4. Production build (optional)
npm run build
npm run preview
```

**Expected behavior:**
- `/login` — placeholder login (UI only, sets `submitted` state)
- `/` — dashboard with metric cards + recent screenings table (mock data)
- `/new-screening` — patient form + drag-drop fundus image upload → POSTs to `/predict`
- `/analysis-result` — reads the latest result from `sessionStorage` and lets you toggle between **Original** (the locally stored upload) and **Grad-CAM** (the `heatmap_base64` returned by the backend). The **Lesion Map** tab is intentionally disabled — no lesion-map endpoint exists.
- `/history` — local mock data; no backend history endpoint is implemented yet.

> **Local testing caveat:** without `weights/dr_model.pth`, the backend's `/predict` will fail at model load. The frontend will still render and surface that error in the New Screening alert banner.

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
| **No backend history endpoint** | History page renders mock data only; results are not persisted server-side | Add a history endpoint + persistence layer (out of current scope) |
| **Login is UI-only** | No real auth — `LoginPage` just toggles a placeholder state | Wire to an auth backend when one exists |
| **No lesion-level detection** | Result page derives "Detected Evidence" heuristically from `class_idx`; this is a UI affordance, not a clinical claim | Future: per-lesion model + dedicated endpoint |
| **No separate heatmap-only image** | The returned `heatmap_base64` is the blended Grad-CAM overlay, not a raw colormap | Future: emit raw heatmap alongside overlay |

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
| Install frontend deps | `cd frontend && npm install` |
| Run frontend dev server | `cd frontend && npm run dev` |
| Build frontend | `cd frontend && npm run build` |
| Preview frontend build | `cd frontend && npm run preview` |

---

## 8. Context Files to Read Next

1. **`context.md`** — Full problem statement, team structure, tech rationale, datasets
2. **`execution_plan.md`** — Hour-by-hour 72-hour plan (Day 1–4 breakdown)
3. **`progress.md`** — Live checkbox tracker with blockers, decisions, metrics tables

---

*Generated 2026-08-23. Update after every major task completion.*
