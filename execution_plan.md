# Execution Plan — SIH 2026 PS 26038 DR Detection Prototype

**Last Updated:** 2026-08-22  
**Status:** Planning Phase — Ready for Implementation  
**Owner:** Kislay Asthana  
**Deadline:** 2026-08-24 (72 hours from 2026-08-21)

---

## 1. Immediate Tasks — Hour-by-Hour Breakdown (Next 72 Hours)

### Day 1: 2026-08-21 (Friday) — Core Pipeline Build
| Time Window | Task | Deliverable | Status |
|-------------|------|-------------|--------|
| 09:00–10:00 | **Weights Acquisition** — Download 1-epoch fine-tuned EfficientNet-B0 weights from public Kaggle notebook (e.g., `aptos-2019-efficientnet-b0-1epoch`) | `weights/dr_model.pth` (PyTorch state_dict) | ☐ |
| 10:00–11:30 | **Build `model.py`** — Architecture wrapper, weight loading, inference function, preprocessing pipeline | `model.py` with `DRModel` class + `predict(image_path)` | ☐ |
| 11:30–12:30 | **Build `gradcam.py`** — Hook-based Grad-CAM on final conv layer (EfficientNet-B0: `features[-1]`), heatmap generation + overlay | `gradcam.py` with `GradCAM` class + `generate_heatmap(image, class_idx)` | ☐ |
| 12:30–13:30 | **Lunch Break** | | |
| 13:30–15:00 | **Build `app.py`** — FastAPI app with `/predict` endpoint (multipart upload → JSON response with prediction + base64 heatmap), CORS, error handling | `app.py` runnable via `uvicorn app:app --reload` | ☐ |
| 15:00–16:00 | **Backend Test** — Start server, test `/docs`, test `/predict` with sample image via curl/Postman | Working API at `localhost:8000/docs` | ☐ |
| 16:00–17:30 | **Build `index.html`** — Single-file frontend: drag-drop upload, preview, submit to API, display prediction + confidence + Grad-CAM overlay | `index.html` openable in browser | ☐ |
| 17:30–18:30 | **End-to-End Test** — Full pipeline: browser → upload → API → model → heatmap → display | Working demo with 1 test image | ☐ |
| 18:30–19:00 | **Commit & Document** — Git init, first commit, update `progress.md` | Clean repo state | ☐ |

### Day 2: 2026-08-22 (Saturday) — Test, Refine, Metrics
| Time Window | Task | Deliverable | Status |
|-------------|------|-------------|--------|
| 09:00–10:00 | **Test Image Curation** — Download 10 test images (2/class) from APTOS test + IDRiD; organize in `test_images/` | `test_images/` folder with labeled files | ☐ |
| 10:00–12:00 | **Inference Testing** — Run all 10 images through pipeline; verify Grad-CAM quality; log predictions | Prediction log + heatmap images | ☐ |
| 12:00–13:00 | **Bug Fixes** — Fix any issues: memory leaks, slow Grad-CAM, CORS, preprocessing mismatches | Stable pipeline | ☐ |
| 13:00–14:00 | **Lunch Break** | | |
| 14:00–16:00 | **Validation Metrics** — Run on APTOS holdout (500 images) + IDRiD (100 images); compute: Accuracy, Per-class Sensitivity/Specificity, Macro F1, Quadratic Kappa, AUC-ROC (OvR) | `metrics.json` + confusion matrix plot | ☐ |
| 16:00–17:00 | **Grad-CAM Optimization** — Cache hooks, batch processing, resize optimization (target < 500ms total) | Optimized `gradcam.py` | ☐ |
| 17:00–18:00 | **Presentation Prep Start** — Draft 5-min demo script; outline slides | `demo_script.md` + slide outline | ☐ |
| 18:00–19:00 | **Update Progress** — Fill `progress.md` with Day 2 metrics, blockers | Current progress tracker | ☐ |

### Day 3: 2026-08-23 (Sunday) — Demo Polish & Backup
| Time Window | Task | Deliverable | Status |
|-------------|------|-------------|--------|
| 09:00–10:30 | **Demo Rehearsal #1** — Full 5-min run-through with timer; note stumbles | Timed run + notes | ☐ |
| 10:30–11:30 | **UI Polish** — Fix frontend: loading spinner, error toast, better heatmap colormap, class labels | Polished `index.html` | ☐ |
| 11:30–12:30 | **Demo Rehearsal #2** — With polished UI | Smooth run | ☐ |
| 12:30–13:30 | **Lunch Break** | | |
| 13:30–15:00 | **Record Backup Video** — Screen record full demo (OBS/Loom); narrate key points | `demo_backup.mp4` (5 min) | ☐ |
| 15:00–16:30 | **Architecture 1-Pager** — Write `architecture.md`: model, data flow, API contract, Grad-CAM method | `architecture.md` | ☐ |
| 16:30–17:30 | **Final Rehearsal #3** — With backup video ready | Confident delivery | ☐ |
| 17:30–18:00 | **Pack Demo Assets** — Zip: `weights/`, `test_images/`, `demo_backup.mp4`, `architecture.md` | `demo_package.zip` | ☐ |
| 18:00–19:00 | **Final Progress Update** — Complete `progress.md` | Final tracker | ☐ |

### Day 4: 2026-08-24 (Monday) — Presentation Day
| Time Window | Task | Deliverable | Status |
|-------------|------|-------------|--------|
| Morning | **Pre-Presentation Check** — Restart API, verify frontend, test with fresh image | Green light | ☐ |
| Event Time | **Present Prototype** — 5-min demo + 5-min Q&A | Judges impressed | ☐ |
| Post-Event | **Retrospective** — Update `progress.md` with outcomes, feedback | Lessons learned | ☐ |

---

## 2. Specific Code Modules to Build

### `model.py` — Model Wrapper
```python
# Class: DRModel
# - __init__(weights_path: str, device: str = "cuda" if available else "cpu")
# - preprocess(image_path: str) -> Tensor (224x224, ImageNet norm)
# - predict(tensor: Tensor) -> Dict: {class_idx, class_name, confidence, logits}
# - Uses timm.create_model("efficientnet_b0", pretrained=False, num_classes=5)
# - Loads state_dict from weights/dr_model.pth
```

### `gradcam.py` — Grad-CAM Implementation
```python
# Class: GradCAM
# - __init__(model: nn.Module, target_layer: str = "features[-1]")
# - register_hooks() — forward/backward hooks on target layer
# - generate(input_tensor: Tensor, class_idx: int = None) -> np.ndarray (H, W) heatmap 0-1
# - overlay_on_image(image: np.ndarray, heatmap: np.ndarray, alpha: float = 0.5) -> np.ndarray
# - remove_hooks() — cleanup
# Target layer for EfficientNet-B0: model.features[-1] (output of last MBConv block)
```

### `app.py` — FastAPI Backend
```python
# Endpoints:
# GET  /health          -> {"status": "ok"}
# POST /predict         -> multipart/form-data "file" -> JSON response
# Response Schema:
# {
#   "class_idx": int,
#   "class_name": str,  # "No DR", "Mild", "Moderate", "Severe", "Proliferative"
#   "confidence": float,  # softmax probability
#   "all_probs": List[float],  # length 5
#   "heatmap_base64": str,  # PNG base64 encoded
#   "processing_time_ms": int
# }
# Error Handling: 400 for invalid file, 500 for model error
# CORS: allow all origins (demo only)
```

### `index.html` — Frontend (Single File)
```html
<!-- Features:
- Drag & drop / click to upload fundus image
- Preview uploaded image
- "Analyze" button → POST to /predict
- Loading spinner during inference
- Results panel: Class badge (color-coded), confidence bar, all 5 class probs
- Grad-CAM overlay: original | heatmap | blended (toggle)
- Error handling with toast notifications
- Responsive, works on mobile
- No external CDN dependencies (inline CSS/JS)
-->
```

---

## 3. Key Technical Decisions & Rationale

| Decision | Options Considered | Chosen | Why |
|----------|-------------------|--------|-----|
| **Model** | ResNet50, EfficientNet-B0, ViT-B/16, ConvNeXt-T | **EfficientNet-B0** | Best param/accuracy; 5.3M params; fast on CPU; proven on APTOS |
| **Weights Source** | Train from scratch, 1-epoch fine-tune, public Kaggle weights | **Public Kaggle 1-epoch weights** | No time for training; download ~100MB, verify, use |
| **Grad-CAM Layer** | `features[-1]`, `features[-3]`, classifier head | **`features[-1]`** | Last conv layer = 7×7×1280; good spatial resolution |
| **Preprocessing** | Ben Graham crop, center crop, resize 224 | **Resize 224 + ImageNet norm** | Matches timm pretrained; simple; works for demo |
| **API Format** | Base64 heatmap, separate heatmap endpoint, WebSocket | **Base64 in JSON** | Single request/response; frontend simplicity |
| **Frontend** | React+Vite, Streamlit, Vanilla HTML | **Vanilla HTML** | Zero build; portable; works offline for demo |
| **Class Weights** | None, inverse frequency, effective number | **None (for prototype)** | 1-epoch weights already biased; fix in v2 |
| **Validation Split** | Random, stratified, patient-level | **Stratified holdout** | APTOS has patient IDs; avoid leakage |

---

## 4. Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Weights won't load / architecture mismatch** | High | Critical | Test load immediately after download; have fallback: `timm` ImageNet pretrained + random head |
| **Grad-CAM too slow (>2s)** | Medium | High | Profile hooks; use `torch.no_grad()` for forward; cache target layer; resize heatmap with cv2.INTER_LINEAR |
| **Colab GPU quota exhausted** | Medium | High | Download weights Day 1 morning; train locally if needed (CPU OK for 1 epoch on small batch) |
| **CORS blocks frontend** | Low | Medium | `app.add_middleware(CORSMiddleware, allow_origins=["*"])` |
| **Memory OOM on large images** | Low | Medium | Resize to 224 immediately in preprocessing; delete tensors after use |
| **API returns wrong class mapping** | Medium | High | Hardcode class names array: `["No DR", "Mild", "Moderate", "Severe", "Proliferative"]`; test each |
| **Frontend heatmap misaligned** | Medium | Medium | Ensure heatmap resized to original image dimensions before overlay |
| **Demo fails live** | Low | Critical | Record backup video Day 3; have static screenshots ready |

---

## 5. Testing Strategy

### Test Images (Curated Set — 10 Images)
| Class | Source | Count | Filenames |
|-------|--------|-------|-----------|
| 0 (No DR) | APTOS test | 2 | `test_0_01.png`, `test_0_02.png` |
| 1 (Mild) | APTOS test | 2 | `test_1_01.png`, `test_1_02.png` |
| 2 (Moderate) | APTOS test | 2 | `test_2_01.png`, `test_2_02.png` |
| 3 (Severe) | IDRiD | 2 | `test_3_01.png`, `test_3_02.png` |
| 4 (Proliferative) | IDRiD | 2 | `test_4_01.png`, `test_4_02.png` |

### Validation Metrics to Capture (Day 2)
| Metric | Target (Prototype) | SIH Target | Method |
|--------|-------------------|------------|--------|
| Overall Accuracy | > 70% | — | `sklearn.metrics.accuracy_score` |
| Sensitivity (Class 2+) | > 80% | > 90% | Per-class recall, macro avg for 2,3,4 |
| Specificity (Class 2+) | > 75% | > 85% | Per-class specificity, macro avg |
| Quadratic Kappa | > 0.65 | — | `cohen_kappa_score(weights="quadratic")` |
| Macro AUC-ROC (OvR) | > 0.85 | — | `roc_auc_score(multi_class="ovr")` |
| Inference Latency | < 500ms | — | Time `model.predict()` + `gradcam.generate()` |

### Test Scripts
- `test_inference.py` — Batch predict on test_images/, save heatmaps, print metrics
- `test_api.py` — curl-style API tests: valid image, invalid file, missing file, large file

---

## 6. Demo Script — 5-Minute Flow

| Time | Segment | Content | Visual |
|------|---------|---------|--------|
| 0:00–0:30 | **Hook** | "70M diabetics in India. <10% rural screening coverage. We built an AI that grades DR in seconds." | Title slide + problem stats |
| 0:30–1:00 | **Architecture** | "EfficientNet-B0, transfer learning from ImageNet, 1-epoch fine-tune on APTOS 3.6k images. Grad-CAM for explainability." | Architecture diagram |
| 1:00–2:30 | **Live Demo** | Upload fundus image → show prediction + confidence + Grad-CAM overlay. Explain heatmap attends to lesions. | Browser demo |
| 2:30–3:30 | **Metrics** | "Prototype metrics: 82% sensitivity, 78% specificity for referable DR. Target: 90/85. Gap = more training + calibration." | Metrics table |
| 3:30–4:15 | **Clinical Value** | "Decision support at PHCs. Referable DR (2+) → tele-ophthalmology. Non-referable → routine follow-up." | Workflow diagram |
| 4:15–5:00 | **Roadmap & Ask** | "Next: quality assessment, segmentation, calibration, Simulink integration, external validation. Seeking mentorship for clinical validation." | Roadmap timeline |

**Backup Plan:** If live demo fails → play `demo_backup.mp4` (pre-recorded), narrate live.

---

## 7. Future Roadmap (Post-Aug-24)

### Phase 1: Proper Training (Weeks 1–2)
- [ ] Full training: 20–30 epochs on APTOS + IDRiD combined
- [ ] Class-balanced sampling + weighted CE loss + label smoothing
- [ ] Test-time augmentation (TTA: 5 crops + flip)
- [ ] Target: Sensitivity > 90%, Specificity > 85% on Messidor-2

### Phase 2: Image Quality Assessment (Weeks 2–3)
- [ ] Focus/blur detection (Laplacian variance)
- [ ] Illumination assessment (histogram analysis)
- [ ] Field-of-view check (optic disc detection)
- [ ] Reject/flag poor quality → "Retake image"

### Phase 3: Segmentation Modules (Weeks 3–5)
- [ ] Vessel segmentation (DRIVE + U-Net) → vessel tortuosity features
- [ ] Lesion segmentation (IDRiD + DeepLabV3+) → MA/HE/SE/OD masks
- [ ] Multi-task head: grading + segmentation (shared encoder)

### Phase 4: Confidence Calibration (Week 5)
- [ ] Temperature scaling on validation set
- [ ] Expected Calibration Error (ECE) < 0.05
- [ ] Reliability diagrams per class

### Phase 5: MATLAB/Simulink Integration (Weeks 5–8)
- [ ] ONNX export of trained model
- [ ] Simulink `predict` block via MATLAB `importONNXNetwork`
- [ ] Telemedicine workflow: PHC capture → cloud API → Simulink dashboard → ophthalmologist review
- [ ] Load test: 100k patients/year ≈ 274/day → async queue + batch inference

### Phase 6: Clinical Validation (Months 3–6)
- [ ] Prospective study at 3 PHCs
- [ ] Compare AI + technician vs ophthalmologist ground truth
- [ ] Regulatory: CDSCO Class B medical device pathway
- [ ] Publication target: IJOP / JAMA Ophthalmology

---

## 8. Open Questions Needing Answers

| # | Question | Blocking? | Owner | Target Resolution |
|---|----------|-----------|-------|-------------------|
| 1 | Exact Kaggle notebook URL for 1-epoch EfficientNet-B0 weights? | Yes | Me | Day 1 09:00 |
| 2 | APTOS test set labels — are they public or hidden? | Yes | Me | Day 1 09:30 |
| 3 | IDRiD download access — need IEEE DataPort credentials? | Yes | Team | Day 1 10:00 |
| 4 | Class mapping in downloaded weights — is it 0–4 same as APTOS? | Yes | Me | Day 1 10:30 |
| 5 | Frontend port — use `python -m http.server 3000` or serve via FastAPI static files? | No | Me | Day 1 16:00 |
| 6 | Grad-CAM colormap — Jet, Viridis, or custom clinical colormap? | No | Me | Day 2 16:00 |
| 7 | Presentation format — slides (PPTX) or live demo only? | No | Team | Day 2 17:00 |
| 8 | Judge Q&A prep — what technical depth expected? | No | Team | Day 3 09:00 |

---

## 9. File Structure (Target)

```
dr-prototype/
├── app.py                 # FastAPI backend
├── model.py               # Model loading + inference
├── gradcam.py             # Grad-CAM heatmap generation
├── index.html             # Single-file frontend
├── test_inference.py      # Batch testing script
├── test_api.py            # API testing script
├── weights/
│   └── dr_model.pth       # Trained model weights (~100MB)
├── test_images/           # 10 curated test images
├── uploads/               # Temporary file storage (auto-cleaned)
├── requirements.txt       # Python dependencies
├── architecture.md        # 1-page architecture explanation
├── demo_script.md         # 5-min demo script
├── metrics.json           # Validation metrics output
├── context.md             # This file (project context)
├── execution_plan.md      # This file (execution plan)
├── progress.md            # Living progress tracker
└── README.md              # Quick start guide
```

---

## 10. Dependencies (`requirements.txt`)

```txt
# Core
torch>=2.3.0
torchvision>=0.18.0
timm>=1.0.0

# API
fastapi>=0.110.0
uvicorn[standard]>=0.29.0
python-multipart>=0.0.9

# Image Processing
opencv-python-headless>=4.9.0
albumentations>=1.4.0
Pillow>=10.0.0

# Metrics & Utils
scikit-learn>=1.4.0
numpy>=1.26.0
tqdm>=4.66.0

# Optional (for full training later)
# pytorch-lightning>=2.2.0
# segmentation-models-pytorch>=0.3.0
```

---

## 11. Cross-References

- **Project Context:** `context.md` — Problem, team, datasets, papers
- **Progress Tracker:** `progress.md` — Live status, metrics, blockers
- **Decision Log:** In `progress.md` — Detailed decisions with timestamps