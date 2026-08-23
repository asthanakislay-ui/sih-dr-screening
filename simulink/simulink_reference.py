#!/usr/bin/env python3
"""
Simulink Reference Implementation for DR Screening Telemedicine Simulation

This Python script replicates the Simulink model logic for:
- Patient arrival rates
- AI processing throughput (5,242 images/hour baseline)
- Human review capacity (30 sec/case = 120 reviews/hour per reviewer)
- Queue dynamics and bottleneck analysis

Run: python simulink_reference.py
"""

import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
from dataclasses import dataclass
from typing import List, Tuple
import json


@dataclass
class SimulationParams:
    """Parameters for the simulation."""
    # Time settings
    simulation_hours: float = 8.0
    dt_seconds: float = 1.0  # Time step

    # AI Processing (from measure_api.py benchmark)
    ai_throughput_per_hour: float = 3600.0  # images/hour

    # Human Review (from PS 26038)
    review_time_per_case_seconds: float = 30.0
    reviewers: int = 1

    # Arrival scenarios
    arrival_rate_per_hour: float = 50.0  # baseline

    @property
    def review_capacity_per_hour(self) -> float:
        """Total review capacity in cases/hour."""
        capacity_per_reviewer = 3600.0 / self.review_time_per_case_seconds
        return self.reviewers * capacity_per_reviewer

    @property
    def simulation_steps(self) -> int:
        return int(self.simulation_hours * 3600 / self.dt_seconds)

    @property
    def time_array(self) -> np.ndarray:
        return np.arange(0, self.simulation_hours * 3600, self.dt_seconds)


@dataclass
class SimulationResults:
    """Results from simulation run."""
    time_hours: np.ndarray
    arrival_rate: np.ndarray
    ai_processed_rate: np.ndarray
    review_capacity: np.ndarray
    queue_length: np.ndarray
    wait_time_minutes: np.ndarray
    ai_utilization: np.ndarray
    review_utilization: np.ndarray


def run_simulation(params: SimulationParams,
                   arrival_pattern: str = "constant",
                   arrival_params: dict = None) -> SimulationResults:
    """
    Run the queue simulation.

    Args:
        params: Simulation parameters
        arrival_pattern: "constant", "step", "sinusoidal", "burst"
        arrival_params: Additional parameters for arrival pattern

    Returns:
        SimulationResults with all time series
    """
    n_steps = params.simulation_steps
    dt_hours = params.dt_seconds / 3600.0

    # Initialize arrays
    time_hours = params.time_array / 3600.0
    arrival_rate = np.zeros(n_steps)
    ai_processed_rate = np.zeros(n_steps)
    review_capacity = np.full(n_steps, params.review_capacity_per_hour)
    queue_length = np.zeros(n_steps)
    wait_time_minutes = np.zeros(n_steps)
    ai_utilization = np.zeros(n_steps)
    review_utilization = np.zeros(n_steps)

    # Generate arrival pattern
    if arrival_pattern == "constant":
        arrival_rate[:] = params.arrival_rate_per_hour
    elif arrival_pattern == "step":
        # Step: baseline -> peak -> baseline
        peak_start = arrival_params.get("peak_start_hour", 2.0)
        peak_end = arrival_params.get("peak_end_hour", 6.0)
        peak_rate = arrival_params.get("peak_rate", 200.0)
        baseline_rate = arrival_params.get("baseline_rate", 50.0)

        for i, t in enumerate(time_hours):
            if peak_start <= t < peak_end:
                arrival_rate[i] = peak_rate
            else:
                arrival_rate[i] = baseline_rate
    elif arrival_pattern == "sinusoidal":
        # Diurnal pattern: baseline + amplitude * sin(2*pi*t/24)
        baseline = arrival_params.get("baseline", 50.0)
        amplitude = arrival_params.get("amplitude", 150.0)
        arrival_rate[:] = baseline + amplitude * np.sin(2 * np.pi * time_hours / 24.0)
        arrival_rate = np.maximum(arrival_rate, 0)  # No negative arrivals
    elif arrival_pattern == "burst":
        # Short burst of high arrivals
        burst_start = arrival_params.get("burst_start_hour", 3.0)
        burst_duration = arrival_params.get("burst_duration_hours", 1.0)
        burst_rate = arrival_params.get("burst_rate", 500.0)
        baseline_rate = arrival_params.get("baseline_rate", 50.0)

        for i, t in enumerate(time_hours):
            if burst_start <= t < burst_start + burst_duration:
                arrival_rate[i] = burst_rate
            else:
                arrival_rate[i] = baseline_rate

    # Simulation loop
    queue = 0.0
    for i in range(n_steps):
        # AI processing: min(arrival, AI capacity)
        ai_rate = min(arrival_rate[i], params.ai_throughput_per_hour)
        ai_processed_rate[i] = ai_rate

        # Update queue: arrivals processed by AI enter review queue
        # Queue change rate = AI_output - Review_capacity (per hour)
        queue_change_rate = ai_rate - params.review_capacity_per_hour
        queue += queue_change_rate * dt_hours
        queue = max(0.0, queue)  # Queue cannot be negative
        queue_length[i] = queue

        # Wait time = queue / review_capacity (in hours) * 60 = minutes
        if params.review_capacity_per_hour > 0:
            wait_time_minutes[i] = (queue / params.review_capacity_per_hour) * 60.0
        else:
            wait_time_minutes[i] = float('inf')

        # Utilizations
        ai_utilization[i] = ai_rate / params.ai_throughput_per_hour * 100.0
        if params.review_capacity_per_hour > 0:
            actual_review_rate = min(params.review_capacity_per_hour, ai_rate + queue / dt_hours if dt_hours > 0 else 0)
            review_utilization[i] = min(100.0, actual_review_rate / params.review_capacity_per_hour * 100.0)

    return SimulationResults(
        time_hours=time_hours,
        arrival_rate=arrival_rate,
        ai_processed_rate=ai_processed_rate,
        review_capacity=review_capacity,
        queue_length=queue_length,
        wait_time_minutes=wait_time_minutes,
        ai_utilization=ai_utilization,
        review_utilization=review_utilization
    )


def plot_results(results: SimulationResults, scenario_name: str, params: SimulationParams):
    """Generate plots for simulation results."""
    fig, axes = plt.subplots(3, 2, figsize=(14, 10))
    fig.suptitle(f'DR Screening Simulation: {scenario_name}\n'
                 f'AI: {params.ai_throughput_per_hour:.0f}/hr, '
                 f'Review: {params.review_capacity_per_hour:.0f}/hr ({params.reviewers} reviewer(s))',
                 fontsize=12)

    t = results.time_hours

    # 1. Rates
    ax = axes[0, 0]
    ax.plot(t, results.arrival_rate, label='Arrival Rate', color='blue', alpha=0.7)
    ax.plot(t, results.ai_processed_rate, label='AI Processed', color='green', alpha=0.7)
    ax.plot(t, results.review_capacity, label='Review Capacity', color='red', alpha=0.7, linestyle='--')
    ax.set_ylabel('Rate (cases/hour)')
    ax.set_title('System Rates')
    ax.legend()
    ax.grid(True, alpha=0.3)

    # 2. Queue Length
    ax = axes[0, 1]
    ax.plot(t, results.queue_length, label='Queue Length', color='purple')
    ax.set_ylabel('Cases in Queue')
    ax.set_title('Review Queue Length')
    ax.grid(True, alpha=0.3)

    # 3. Wait Time
    ax = axes[1, 0]
    ax.plot(t, results.wait_time_minutes, label='Wait Time', color='orange')
    ax.axhline(y=30, color='red', linestyle='--', label='30 min target')
    ax.set_ylabel('Wait Time (minutes)')
    ax.set_title('Patient Wait Time for Review')
    ax.legend()
    ax.grid(True, alpha=0.3)

    # 4. Utilizations
    ax = axes[1, 1]
    ax.plot(t, results.ai_utilization, label='AI Utilization', color='green')
    ax.plot(t, results.review_utilization, label='Review Utilization', color='red')
    ax.set_ylabel('Utilization (%)')
    ax.set_title('Resource Utilization')
    ax.legend()
    ax.grid(True, alpha=0.3)

    # 5. Cumulative processed
    ax = axes[2, 0]
    cum_arrivals = np.cumsum(results.arrival_rate) * (params.dt_seconds / 3600.0)
    cum_ai = np.cumsum(results.ai_processed_rate) * (params.dt_seconds / 3600.0)
    cum_reviewed = np.cumsum(np.minimum(results.ai_processed_rate, results.review_capacity)) * (params.dt_seconds / 3600.0)
    ax.plot(t, cum_arrivals, label='Cumulative Arrivals', color='blue')
    ax.plot(t, cum_ai, label='Cumulative AI Processed', color='green')
    ax.plot(t, cum_reviewed, label='Cumulative Reviewed', color='red')
    ax.set_ylabel('Cumulative Cases')
    ax.set_xlabel('Time (hours)')
    ax.set_title('Cumulative Throughput')
    ax.legend()
    ax.grid(True, alpha=0.3)

    # 6. Bottleneck analysis
    ax = axes[2, 1]
    bottleneck = np.where(results.ai_processed_rate > results.review_capacity, 'Review', 'AI')
    # Color code: red for review bottleneck, green for AI bottleneck
    colors = ['red' if b == 'Review' else 'green' for b in bottleneck]
    ax.scatter(t, results.queue_length, c=colors, s=1, alpha=0.5, label='Bottleneck')
    ax.set_ylabel('Queue Length')
    ax.set_xlabel('Time (hours)')
    ax.set_title('Bottleneck Analysis (Red=Review, Green=AI)')
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(f'simulink/simulation_{scenario_name.lower().replace(" ", "_")}.png', dpi=150)
    plt.close()
    print(f"Saved plot: simulink/simulation_{scenario_name.lower().replace(' ', '_')}.png")


def print_summary(results: SimulationResults, scenario_name: str, params: SimulationParams):
    """Print simulation summary statistics."""
    print(f"\n{'='*60}")
    print(f"Scenario: {scenario_name}")
    print(f"{'='*60}")
    print(f"AI Throughput:     {params.ai_throughput_per_hour:,.0f} images/hour")
    print(f"Review Capacity:   {params.review_capacity_per_hour:,.0f} reviews/hour ({params.reviewers} reviewer(s))")
    print(f"Review Time/Case:  {params.review_time_per_case_seconds:.0f} seconds")
    print(f"-" * 60)
    print(f"Max Queue Length:  {np.max(results.queue_length):.1f} cases")
    print(f"Avg Queue Length:  {np.mean(results.queue_length):.1f} cases")
    print(f"Max Wait Time:     {np.max(results.wait_time_minutes):.1f} minutes")
    print(f"Avg Wait Time:     {np.mean(results.wait_time_minutes):.1f} minutes")
    print(f"Avg AI Util:       {np.mean(results.ai_utilization):.1f}%")
    print(f"Avg Review Util:   {np.mean(results.review_utilization):.1f}%")
    print(f"Final Queue:       {results.queue_length[-1]:.1f} cases")

    # Bottleneck identification
    review_bottleneck_pct = np.mean(results.ai_processed_rate > results.review_capacity) * 100
    print(f"Review Bottleneck: {review_bottleneck_pct:.1f}% of time")


def main():
    """Run all simulation scenarios."""
    print("DR Screening Telemedicine Simulation")
    print("Reference implementation for Simulink model")
    print("=" * 60)

    # Baseline parameters from our benchmarks
    base_params = SimulationParams(
        simulation_hours=8.0,
        ai_throughput_per_hour=5242.0,  # From measure_api.py
        review_time_per_case_seconds=30.0,  # PS 26038 requirement
    )

    scenarios = [
        # (name, params_modifications, arrival_pattern, arrival_params)
        ("Baseline_50_per_hr_1_Reviewer",
         {"arrival_rate_per_hour": 50.0, "reviewers": 1},
         "constant", {}),

        ("Peak_200_per_hr_1_Reviewer",
         {"arrival_rate_per_hour": 50.0, "reviewers": 1},
         "step", {"peak_start_hour": 2.0, "peak_end_hour": 6.0, "peak_rate": 200.0, "baseline_rate": 50.0}),

        ("Peak_200_per_hr_2_Reviewers",
         {"arrival_rate_per_hour": 50.0, "reviewers": 2},
         "step", {"peak_start_hour": 2.0, "peak_end_hour": 6.0, "peak_rate": 200.0, "baseline_rate": 50.0}),

        ("Peak_200_per_hr_3_Reviewers",
         {"arrival_rate_per_hour": 50.0, "reviewers": 3},
         "step", {"peak_start_hour": 2.0, "peak_end_hour": 6.0, "peak_rate": 200.0, "baseline_rate": 50.0}),

        ("High_Load_100_per_hr_1_Reviewer",
         {"arrival_rate_per_hour": 100.0, "reviewers": 1},
         "constant", {}),

        ("Diurnal_Pattern_2_Reviewers",
         {"arrival_rate_per_hour": 50.0, "reviewers": 2},
         "sinusoidal", {"baseline": 50.0, "amplitude": 150.0}),

        ("Burst_500_per_hr_1_Reviewer",
         {"arrival_rate_per_hour": 50.0, "reviewers": 1},
         "burst", {"burst_start_hour": 3.0, "burst_duration_hours": 1.0, "burst_rate": 500.0, "baseline_rate": 50.0}),
    ]

    all_summaries = []

    for name, mods, pattern, pattern_params in scenarios:
        params = SimulationParams(**{**base_params.__dict__, **mods})
        results = run_simulation(params, pattern, pattern_params)
        print_summary(results, name, params)
        plot_results(results, name, params)

        all_summaries.append({
            "scenario": name,
            "max_queue": float(np.max(results.queue_length)),
            "avg_wait_min": float(np.mean(results.wait_time_minutes)),
            "max_wait_min": float(np.max(results.wait_time_minutes)),
            "ai_util_pct": float(np.mean(results.ai_utilization)),
            "review_util_pct": float(np.mean(results.review_utilization)),
            "review_bottleneck_pct": float(np.mean(results.ai_processed_rate > results.review_capacity) * 100),
        })

    # Save summary as JSON
    with open('simulink/simulation_summary.json', 'w') as f:
        json.dump(all_summaries, f, indent=2)
    print(f"\nSaved summary: simulink/simulation_summary.json")

    # Print key insight
    print("\n" + "=" * 60)
    print("KEY INSIGHT: AI vs Human Review Bottleneck")
    print("=" * 60)
    print(f"AI Capacity:      {base_params.ai_throughput_per_hour:,.0f} images/hour")
    print(f"Review Capacity:  {base_params.review_capacity_per_hour:,.0f} reviews/hour (1 reviewer)")
    print(f"Ratio:            {base_params.ai_throughput_per_hour / base_params.review_capacity_per_hour:.1f}x faster")
    print("\nAI is NOT the bottleneck. Human review capacity is the limiting factor.")
    print("To handle 200 patients/hour peak: need at least 2 reviewers (240/hr capacity)")
    print("To handle 500 patients/hour burst: need at least 5 reviewers (600/hr capacity)")


if __name__ == "__main__":
    main()