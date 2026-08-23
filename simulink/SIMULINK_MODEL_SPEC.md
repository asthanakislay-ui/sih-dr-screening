# Simulink Telemedicine Screening Resource-Capacity Simulation

## Problem Statement
Build a rate-based simulation model for diabetic retinopathy telemedicine screening that demonstrates:
- Patient/image arrival rates
- AI processing capacity (baseline: ~1.46 images/sec, ~5,242 images/hour)
- Human review capacity (PS 26038: human-in-the-loop review under 30 sec/case)
- Queue buildup and bottlenecks
- System throughput under various load conditions

## System Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌─────────┐     ┌───────┐
│  Arrival    │────▶│  AI Processing   │────▶│  Review Queue   │────▶│ Review  │────▶│ Scope │
│  Generator  │     │  (Rate Limiter)  │     │  (Integrator)   │     │ Capacity│     │       │
└─────────────┘     └──────────────────┘     └─────────────────┘     └─────────┘     └───────┘
       │                    │                        │                   │
       ▼                    ▼                        ▼                   ▼
  [patients/hr]       [images/sec]             [queue length]       [reviews/hr]
```

## Block Diagram Specification

### 1. Arrival Rate Generator
- **Block Type**: Signal Generator / Step / From Workspace
- **Output**: Patient arrival rate (patients/hour)
- **Scenarios**:
  - Baseline: 50 patients/hour
  - Peak: 200 patients/hour
  - Burst: 500 patients/hour for 2 hours
  - Diurnal pattern: Sinusoidal (24-hour cycle)

### 2. AI Processing Throughput
- **Block Type**: Saturation / Rate Limiter
- **Parameter**: `AI_THROUGHPUT = 5242` images/hour (1.46 images/sec)
- **Function**: `min(arrival_rate, AI_THROUGHPUT)`
- **Output**: Processed images/hour entering review queue

### 3. Review Queue (Integrator)
- **Block Type**: Integrator
- **Input**: `AI_processed_rate - Review_capacity`
- **Initial Condition**: 0
- **Output**: Queue length (number of cases waiting for review)
- **Saturation**: Queue cannot go negative (max(0, queue))

### 4. Human Review Capacity
- **Block Type**: Constant / Step
- **Parameter**: `REVIEW_TIME_PER_CASE = 30` seconds (PS 26038 requirement)
- **Capacity**: `3600 / REVIEW_TIME_PER_CASE = 120` reviews/hour per reviewer
- **Scalable**: Number of reviewers (1, 2, 3, ...)

### 5. Scope / Visualization
- **Block Type**: Scope / To Workspace
- **Signals to Monitor**:
  - Arrival rate
  - AI processing rate
  - Review capacity
  - Queue length
  - Wait time (queue_length / review_capacity * 3600)
  - System utilization (AI and Review)

## Key Parameters

| Parameter | Value | Source |
|-----------|-------|--------|
| AI_THROUGHPUT | 5,242 images/hour | Local CPU benchmark (measure_api.py) |
| REVIEW_TIME_PER_CASE | 30 seconds | PS 26038 requirement |
| REVIEW_CAPACITY_PER_REVIEWER | 120 reviews/hour | 3600/30 |
| BASELINE_ARRIVAL | 50 patients/hour | Typical clinic |
| PEAK_ARRIVAL | 200 patients/hour | Busy screening day |
| SIMULATION_TIME | 8 hours (28,800 sec) | Single workday |

## Simulation Scenarios

### Scenario 1: Baseline Operation
- Arrival: 50 patients/hour constant
- Reviewers: 1
- Expected: Queue stable, wait time < 30 min

### Scenario 2: Peak Load
- Arrival: 200 patients/hour for 4 hours, then 50
- Reviewers: 1
- Expected: Queue builds up, demonstrates bottleneck

### Scenario 3: Insufficient Review Capacity
- Arrival: 100 patients/hour
- Reviewers: 1 (capacity 120/hr, but AI produces 5,242/hr!)
- Key insight: AI is NOT the bottleneck; human review IS

### Scenario 4: Multiple Reviewers
- Arrival: 200 patients/hour
- Reviewers: 2, 3, 4
- Shows scaling of human review capacity

### Scenario 5: Diurnal Pattern
- Arrival: `50 + 150*sin(2*pi*t/24)` (peaks at noon)
- Reviewers: 2
- Shows dynamic queue behavior

## Critical Insight: The Real Bottleneck

```
AI Capacity:     5,242 images/hour  (1.46 images/sec)
Review Capacity: 120 reviews/hour   (1 reviewer, 30 sec/case)
                 240 reviews/hour   (2 reviewers)
                 360 reviews/hour   (3 reviewers)

AI is ~22-44x FASTER than human review!
The bottleneck is ALWAYS human review capacity.
```

## Simulink Model Structure (for .slx creation)

```
Model: dr_screening_simulation
├── Inputs
│   ├── Arrival_Rate (Signal Generator)
│   └── Num_Reviewers (Constant)
├── AI_Processing
│   ├── AI_Throughput (Constant: 5242)
│   └── Rate_Limiter (Min block: min(arrival, AI_Throughput))
├── Review_System
│   ├── Review_Capacity (Gain: Num_Reviewers * 120)
│   └── Queue (Integrator with lower saturation at 0)
├── Outputs
│   ├── Queue_Length (Scope)
│   ├── Wait_Time (Scope: Queue / Review_Capacity * 3600)
│   ├── AI_Utilization (Scope: AI_Rate / AI_Throughput)
│   └── Review_Utilization (Scope: Review_Rate / Review_Capacity)
```

## Python Reference Implementation

See `simulink_reference.py` for a runnable Python simulation that replicates the Simulink model logic.

## Expected Results

| Scenario | Arrival (hr) | Reviewers | Max Queue | Avg Wait | Bottleneck |
|----------|--------------|-----------|-----------|----------|------------|
| Baseline | 50           | 1         | ~0        | ~0 min   | None       |
| Peak     | 200          | 1         | ~320      | ~160 min | Review     |
| High     | 100          | 1         | ~0        | ~0 min   | None       |
| Peak     | 200          | 2         | ~40       | ~20 min  | Review     |
| Peak     | 200          | 3         | ~0        | ~0 min   | None       |

## Implementation Notes for Teammate

1. Create new Simulink model: `dr_screening_simulation.slx`
2. Use the block diagram above as reference
3. Add Mask parameters for easy scenario switching
4. Include MATLAB Function blocks for complex logic if needed
5. Use Simulink Test for scenario automation
6. Export results to MATLAB workspace for plotting
7. Key visualization: Queue length over time, wait time over time

## Integration with SIH Demo

The Simulink model should demonstrate:
- Real AI throughput number (5,242/hr) from our benchmark
- PS 26038's 30-second review requirement
- How many reviewers needed for different patient loads
- Visual proof that AI is not the bottleneck
- Resource planning tool for telemedicine deployment