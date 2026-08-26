# Execution Plan: Multimodal DR Screening Platform

**Generated:** 2026-08-25  
**Source:** `after_ideas.md`  
**Approach:** Phased, dependency-aware, MVP-first

---

## Phase 0: Foundation & Quick Wins (Weeks 1-2)
*Goal: Solidify core model quality before building infrastructure around it*

| # | Task | Category | Effort | Dependencies | Notes |
|---|------|----------|--------|--------------|-------|
| 0.1 | Implement preprocessing pipeline (circle-crop, CLAHE, illumination normalization) | AI Improvements | 3 days | — | Highest ROI — do first |
| 0.2 | Add fundus-appropriate augmentation (rotation, h-flip, brightness/contrast jitter) | AI Improvements | 2 days | 0.1 | Avoid vertical flip, heavy color shifts |
| 0.3 | Integrate IDRiD + Messidor-2 datasets; build combined dataloader | AI Improvements | 4 days | 0.1 | Cross-dataset training = key differentiator |
| 0.4 | Implement focal loss + oversampling for class imbalance | AI Improvements | 2 days | 0.3 | Target: Severe/Proliferative recall |
| 0.5 | Proper training schedule: 15+ epochs, cosine decay LR, early stopping on macro recall/QWK | AI Improvements | 3 days | 0.4 | Fix epoch-4 instability |
| 0.6 | Error analysis: pull misclassified Severe/Proliferative cases, document 3-4 patterns | AI Improvements | 2 days | 0.5 | Present to mentors — shows rigor |
| 0.7 | Report QWK + sensitivity/specificity + temperature-scaled confidence | AI Improvements | 1 day | 0.5 | Standard DR metrics |

**Exit Criteria:** Single-model (EfficientNet-B0) beats prior baseline on cross-dataset validation with QWK ≥ 0.85

---

## Phase 1: Two-Model Cascade Architecture (Weeks 3-5)
*Goal: Build the core "triage → detailed analysis" pipeline*

| # | Task | Category | Effort | Dependencies | Notes |
|---|------|----------|--------|--------------|-------|
| 1.1 | Train Low-End Model (EfficientNet-B0): classification + Grad-CAM | Core Architecture | 5 days | Phase 0 complete | CPU-friendly, <200ms inference |
| 1.2 | Define cascade routing logic: Grade 0/1 → stop; Grade 2+ / low-confidence → high-end | Core Architecture | 2 days | 1.1 | Threshold tunable via config |
| 1.3 | Train High-End Model: segmentation head (U-Net/DeepLab) + classification | Core Architecture | 7 days | 1.1 | Lesion segmentation (MA, HE, SE, NV) |
| 1.4 | Build inference pipeline: low-end → route → high-end (async) | Core Architecture | 4 days | 1.2, 1.3 | Queue-based for scalability |
| 1.5 | Benchmark cascade: latency, compute savings vs. always-running-high-end | Core Architecture | 2 days | 1.4 | Target: 80%+ cases stop at low-end |

**Exit Criteria:** End-to-end cascade runs; low-end handles ≥80% cases; high-end adds segmentation value on referable cases

---

## Phase 2: Core Backend & Privacy (Weeks 5-7)
*Goal: Production-ready API with privacy-by-design*

| # | Task | Category | Effort | Dependencies | Notes |
|---|------|----------|--------|--------------|-------|
| 2.1 | API layer: REST endpoints for upload, status, results (FastAPI) | Backend | 3 days | Phase 1 | `/screen`, `/screen/{id}`, `/screen/{id}/detail` |
| 2.2 | Pseudonymization: separate PII table, token-linked clinical data | Privacy | 3 days | 2.1 | Non-guessable UUID tokens |
| 2.3 | Encryption: TLS (managed), AES-256 at rest for images/DB | Privacy | 2 days | 2.2 | Use cloud KMS / Vault |
| 2.4 | Retention policy: configurable (default 90 days raw, 5yrs graded) | Privacy | 1 day | 2.2 | GDPR/DPDP aligned |
| 2.5 | Consent flow API + UI screen | Privacy | 2 days | 2.1 | Explicit, recorded, revocable |
| 2.6 | RBAC + audit logs: roles (tech, ophthalmologist, admin, auditor) | Privacy | 3 days | 2.5 | Log all data access |

**Exit Criteria:** API documented; privacy audit passes; consent + pseudonymization working end-to-end

---

## Phase 3: Offline-First PWA & Role-Based UI (Weeks 7-10)
*Goal: Deployable in rural clinics with unreliable connectivity*

| # | Task | Category | Effort | Dependencies | Notes |
|---|------|----------|--------|--------------|-------|
| 3.1 | PWA setup: service worker, IndexedDB queue, background sync | UI/Offline | 5 days | Phase 2 | Workbox or custom SW |
| 3.2 | Technician capture view: camera/upload → queue → referral flag | UI/Offline | 4 days | 3.1 | Minimal fields, large buttons |
| 3.3 | Ophthalmologist review view: full detail, Grad-CAM, segmentation overlay, history, override | UI/Offline | 5 days | 3.1, Phase 1 | Side-by-side comparison |
| 3.4 | Tiered results: immediate low-end badge → "Detailed Analysis" loads async | UI/Offline | 3 days | 3.2, 3.3 | Skeleton loaders |
| 3.5 | Lesion overlay toggle: Grad-CAM ↔ segmentation boundaries | UI/Offline | 2 days | 3.3, 1.3 | Different clinical questions |
| 3.6 | Regional language support: i18n framework (Hindi, Tamil, Bengali, Marathi...) | UI/Offline | 4 days | 3.2 | JSON locale files, RTL-ready |
| 3.7 | Offline queue UI: pending/synced/failed states, manual retry | UI/Offline | 2 days | 3.1 | Critical for field workers |

**Exit Criteria:** PWA installs on Android/iOS; works offline for 48h; syncs on reconnect; both role views functional

---

## Phase 4: Evaluation & Validation Framework (Weeks 10-12)
*Goal: Rigorous evidence package for clinical/regulatory credibility*

| # | Task | Category | Effort | Dependencies | Notes |
|---|------|----------|--------|--------------|-------|
| 4.1 | Cross-dataset validation: train APTOS+IDRiD → test Messidor-2 (hold-out) | Evaluation | 3 days | Phase 1 | Gold-standard generalizability |
| 4.2 | Subgroup analysis: by camera, dilation, quality score, demographics | Evaluation | 3 days | 4.1 | Stratified metrics tables |
| 4.3 | Uncertainty quantification: MC dropout (5 forward passes) or deep ensemble (3 seeds) | Evaluation | 4 days | Phase 1 | Flag "uncertain" → human review |
| 4.4 | Adversarial robustness: test on artifact-augmented test set (dust, lashes, blur) | Evaluation | 3 days | 4.1 | Document failure modes |
| 4.5 | Active learning loop: low-confidence → expert review → retrain trigger | Data Pipeline | 4 days | Phase 2, 4.3 | Continuous improvement |

**Exit Criteria:** Validation report with cross-dataset QWK, subgroup tables, uncertainty calibration curves, adversarial results

---

## Phase 5: Clinical Workflow Integration (Weeks 12-15)
*Goal: Hospital/deployment ready*

| # | Task | Category | Effort | Dependencies | Notes |
|---|------|----------|--------|--------------|-------|
| 5.1 | FHIR R4 endpoints: Patient, ServiceRequest, DiagnosticReport, Observation | Clinical | 5 days | Phase 2 | Profile: `DiagnosticReport` for screening result |
| 5.2 | Referral letter auto-generation (PDF): findings, images, urgency, SNOMED codes | Clinical | 3 days | 5.1 | Template-based, printable |
| 5.3 | Longitudinal patient timeline: grade progression chart across screenings | Clinical | 3 days | 5.1 | FHIR `Observation` history |
| 5.4 | QA dashboard: volumes, referral rates, grader agreement, drift alerts | Clinical | 4 days | 5.1, 4.3 | Grafana/Metabase or custom |

**Exit Criteria:** FHIR validator passes; referral letter clinically reviewed; dashboard shows live metrics

---

## Phase 6: MLOps & Edge Deployment (Weeks 15-18)
*Goal: Automated, reproducible, deployable anywhere*

| # | Task | Category | Effort | Dependencies | Notes |
|---|------|----------|--------|--------------|-------|
| 6.1 | MLflow/DVC: model registry, experiment tracking, dataset versioning | MLOps | 3 days | Phase 1 | Tag: `v1.0-cascade`, `v1.1-distilled` |
| 6.2 | Automated retraining pipeline: drift detection (QWK drop >5%) → retrain → validate | MLOps | 5 days | 6.1, 4.3 | GitHub Actions / Airflow |
| 6.3 | A/B testing framework: canary rollout, statistical significance (p<0.05) | MLOps | 4 days | 6.2 | Feature flags |
| 6.4 | Edge export: ONNX → INT8 quantization → TFLite/CoreML | Edge | 4 days | Phase 1 | Benchmark on Pi 4, Jetson Nano |
| 6.5 | Hardware compilation: TVM/TensorRT for target devices | Edge | 3 days | 6.4 | Profile latency, memory, power |

**Exit Criteria:** Model versioned; retrain triggers on drift; edge artifacts run <500ms on Pi 4

---

## Phase 7: Regulatory & Compliance (Weeks 16-20, parallel)
*Goal: Pathway to clinical deployment in India*

| # | Task | Category | Effort | Dependencies | Notes |
|---|------|----------|--------|--------------|-------|
| 7.1 | CDSCO MDR: intended use statement, risk classification (Class B/C), clinical eval plan | Regulatory | 5 days | Phase 4 | Engage consultant early |
| 7.2 | ISO 13485 / IEC 62304 gap analysis: QMS, risk management, lifecycle docs | Regulatory | 5 days | 7.1 | Identify must-haves vs. nice-to-haves |
| 7.3 | RWE collection protocol: post-market endpoints, data sharing agreements | Regulatory | 3 days | 7.1 | Align with NHM/state health missions |
| 7.4 | DPDP Act compliance audit: consent, retention, breach notification, DPO | Regulatory | 3 days | Phase 2 | Legal review |

**Exit Criteria:** Regulatory dossier draft; gap analysis with remediation plan; DPDP compliance verified

---

## Phase 8: Data & Annotation Pipeline (Weeks 18-21)
*Goal: Sustainable data flywheel*

| # | Task | Category | Effort | Dependencies | Notes |
|---|------|----------|--------|--------------|-------|
| 8.1 | Active learning UI: expert review queue for flagged cases | Data Pipeline | 4 days | 4.5, Phase 3 | Integrated in ophthalmologist view |
| 8.2 | Synthetic data: diffusion model for Proliferative DR (rare class) | Data Pipeline | 5 days | Phase 1 | Validate with radiologist |
| 8.3 | Annotation QC: Fleiss' kappa tracking, adjudication workflow | Data Pipeline | 3 days | 8.1 | Multi-grader support |

**Exit Criteria:** Active learning loop closed; synthetic data improves rare-class recall; grader agreement >0.85

---

## Phase 9: Sustainability & Partnerships (Weeks 20-26, ongoing)
*Goal: Long-term viability and scale*

| # | Task | Category | Effort | Dependencies | Notes |
|---|------|----------|--------|--------------|-------|
| 9.1 | Cost-per-screening model: cloud vs. edge, connectivity, maintenance | Sustainability | 2 days | Phase 6 | Spreadsheet + sensitivity analysis |
| 9.2 | Open-source release: model weights, inference code, preprocessing (Apache 2.0) | Sustainability | 3 days | Phase 6 | GitHub + HuggingFace + documentation |
| 9.3 | Partnership framework: MOU template, data sharing addendum, liability clauses | Sustainability | 3 days | Phase 7 | Legal review |
| 9.4 | Pilot deployments: 2-3 sites (PHC, district hospital, NGO eye camp) | Sustainability | Ongoing | Phase 3, 7 | Measure real-world metrics |

**Exit Criteria:** Open source published; 1+ MOU signed; pilot data feeding back into active learning

---

## Dependency Graph (Critical Path)

```
Phase 0 (2 wks)
    ↓
Phase 1 (3 wks) ──┐
    ↓             │
Phase 2 (2 wks)   │
    ↓             │
Phase 3 (3 wks)   ├──→ Phase 4 (2 wks) ──→ Phase 5 (3 wks)
    ↓             │                        ↓
Phase 6 (3 wks) ──┘                    Phase 7 (4 wks, parallel)
    ↓
Phase 8 (3 wks)
    ↓
Phase 9 (ongoing)
```

**Critical Path:** Phase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 8 → 9  
**Total Minimum Timeline: ~26 weeks (6.5 months) to pilot-ready**

---

## Prioritization Matrix

| Priority | Tasks | Rationale |
|----------|-------|-----------|
| **P0 (Do First)** | 0.1-0.7, 1.1-1.5 | Model quality is the foundation — everything else builds on it |
| **P1 (Core Product)** | 2.1-2.6, 3.1-3.7 | Privacy + offline PWA = deployable in target setting |
| **P2 (Credibility)** | 4.1-4.5, 5.1-5.4 | Validation + clinical workflow = regulatory/commercial readiness |
| **P3 (Scale)** | 6.1-6.5, 7.1-7.4, 8.1-8.3 | MLOps + regulatory + data flywheel = sustainable |
| **P4 (Growth)** | 9.1-9.4 | Partnerships + open source = ecosystem adoption |

---

## Resource Estimates

| Role | Phase 0-1 | Phase 2-3 | Phase 4-6 | Phase 7-9 |
|------|-----------|-----------|-----------|-----------|
| ML Engineer | 1.0 FTE | 0.5 FTE | 0.5 FTE | 0.25 FTE |
| Backend Engineer | 0.25 FTE | 1.0 FTE | 0.5 FTE | 0.25 FTE |
| Frontend Engineer | — | 1.0 FTE | 0.5 FTE | 0.25 FTE |
| Clinical Expert | 0.1 FTE | 0.1 FTE | 0.5 FTE | 0.5 FTE |
| Regulatory Consultant | — | — | — | 0.25 FTE |

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Cross-dataset generalization fails | Medium | High | Start Phase 0.3 early; have fallback to single-dataset + heavy augmentation |
| Offline sync complexity | Medium | Medium | Use proven libs (Workbox, RxDB); test on real 2G/3G networks |
| Regulatory timeline uncertain | High | High | Engage consultant in Phase 0; design for compliance from Day 1 |
| Rare class data scarcity | High | Medium | Synthetic data (8.2) + active learning (8.1) + external partnerships |
| Edge performance on low-end HW | Medium | High | Profile early (6.4); have cloud fallback for edge failures |

---

## Immediate Next Steps (This Week)

1. **Day 1-2:** Set up preprocessing pipeline (0.1) + augmentation (0.2) in training code
2. **Day 3-4:** Download & explore IDRiD + Messidor-2; build unified dataloader (0.3)
3. **Day 5:** Implement focal loss + oversampling (0.4); launch first proper training run
4. **Parallel:** Create GitHub repo structure; set up MLflow tracking; document experiment config

---

## Success Metrics by Phase

| Phase | Key Metric | Target |
|-------|------------|--------|
| 0 | Cross-dataset QWK (APTOS+IDRiD → Messidor-2) | ≥ 0.85 |
| 1 | Cascade compute savings (vs. high-end only) | ≥ 70% |
| 2 | Privacy audit score | Pass (no critical findings) |
| 3 | Offline screening success rate (48h no connectivity) | ≥ 95% |
| 4 | Subgroup QWK variance (max - min) | ≤ 0.10 |
| 5 | FHIR validator compliance | 100% |
| 6 | Edge inference latency (Pi 4, INT8) | < 500ms |
| 7 | Regulatory gap closure | ≤ 3 critical gaps |
| 8 | Active learning yield (new labels / expert hour) | ≥ 50 |
| 9 | Cost per screening (at scale, edge) | < ₹50 |

---

*This plan is a living document — update as you learn. Review weekly, adjust monthly.*