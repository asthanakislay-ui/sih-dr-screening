% build_dr_screening_model.m
% Programmatically creates and runs a Simulink model for DR screening
% telemedicine queue simulation.
%
% This script builds a real Simulink model (.slx) using add_block/add_line,
% not just a MATLAB simulation. It models:
%   - Patient arrival rate (configurable: normal ~42/hr, peak ~120/hr)
%   - AI processing capacity (~3600 images/hr based on ~1000ms per prediction)
%   - Human reviewer capacity (120 reviews/hr per reviewer)
%   - Queue dynamics with non-negative integrator
%
% Usage: Run this script in MATLAB with Simulink installed.
%        It will create dr_screening_model.slx, open it, and run simulation.

%% Configuration Parameters
% --- Simulation time ---
sim_stop_time = 86400;  % 24 hours in seconds

% --- Arrival rates (patients/hour) ---
arrival_normal_per_hr  = 42;   % Normal clinic load
arrival_peak_per_hr    = 120;  % Peak screening day

% --- AI Processing throughput ---
% Measured: ~1000ms per prediction including Grad-CAM = ~3600 images/hour
ai_throughput_per_hr = 3600;

% --- Human Review capacity ---
review_time_per_case_sec = 30;  % PS 26038: 30 seconds per case
reviews_per_hr_per_reviewer = 3600 / review_time_per_case_sec;  % = 120
num_reviewers = 3;  % Change this to test different staffing levels
review_capacity_per_hr = reviews_per_hr_per_reviewer * num_reviewers;

% Convert all rates to per-second for Simulink (which uses seconds as base time unit)
arrival_normal_per_sec  = arrival_normal_per_hr  / 3600;
arrival_peak_per_sec    = arrival_peak_per_hr    / 3600;
ai_throughput_per_sec   = ai_throughput_per_hr   / 3600;
review_capacity_per_sec = review_capacity_per_hr / 3600;

fprintf('=== DR Screening Simulink Model Builder ===\n');
fprintf('Simulation stop time: %d seconds (%.1f hours)\n', sim_stop_time, sim_stop_time/3600);
fprintf('Arrival (normal): %.1f/hr = %.6f/sec\n', arrival_normal_per_hr, arrival_normal_per_sec);
fprintf('Arrival (peak):   %.1f/hr = %.6f/sec\n', arrival_peak_per_hr, arrival_peak_per_sec);
fprintf('AI throughput:    %.1f/hr = %.6f/sec\n', ai_throughput_per_hr, ai_throughput_per_sec);
fprintf('Reviewers: %d\n', num_reviewers);
fprintf('Review capacity:  %.1f/hr = %.6f/sec\n', review_capacity_per_hr, review_capacity_per_sec);
fprintf('Bottleneck ratio (AI/Review): %.2fx\n\n', ai_throughput_per_hr / review_capacity_per_hr);

%% Create new Simulink model
model_name = 'dr_screening_model';

% Close if already open (clean slate)
if bdIsLoaded(model_name)
    close_system(model_name, 0);
end

% Create new model
new_system(model_name);
open_system(model_name);

% Set model parameters
set_param(model_name, ...
    'StopTime', num2str(sim_stop_time), ...
    'Solver', 'ode45', ...
    'FixedStep', 'auto', ...
    'StartTime', '0');

%% Add Blocks

% Block positions [left, top, right, bottom] in pixels
% Layout: Left-to-right flow
pos = struct();

% --- 1. Patient Arrival Rate (Constant + Step + Step + Sum for 24-hour profile) ---
% Profile: 0-2hr: 42/hr, 2-8hr: 120/hr, 8-24hr: 42/hr
% peak_diff = (120-42)/3600 = 78/3600 per sec
peak_diff_per_sec = (arrival_peak_per_hr - arrival_normal_per_hr) / 3600;

% 1a. Constant: normal rate (42/hr)
pos.arrival_normal = [50, 60, 150, 100];
add_block('simulink/Sources/Constant', [model_name, '/Arrival_Normal'], ...
    'Position', pos.arrival_normal, ...
    'Value', num2str(arrival_normal_per_sec), ...
    'SampleTime', '0');

% 1b. Step: +peak_diff starting at 7200 sec (2 hours)
pos.arrival_peak_step = [50, 140, 150, 180];
add_block('simulink/Sources/Step', [model_name, '/Arrival_Peak_Step'], ...
    'Position', pos.arrival_peak_step, ...
    'Time', '7200', ...
    'Before', '0', ...
    'After', num2str(peak_diff_per_sec), ...
    'SampleTime', '0');

% 1c. Step: -peak_diff starting at 28800 sec (8 hours)
pos.arrival_normal_step = [50, 220, 150, 260];
add_block('simulink/Sources/Step', [model_name, '/Arrival_Normal_Step'], ...
    'Position', pos.arrival_normal_step, ...
    'Time', '28800', ...
    'Before', '0', ...
    'After', ['-', num2str(peak_diff_per_sec)], ...
    'SampleTime', '0');

% 1d. Sum: normal + peak_step + normal_step
pos.arrival_sum = [200, 120, 300, 160];
add_block('simulink/Math Operations/Sum', [model_name, '/Arrival_Sum'], ...
    'Position', pos.arrival_sum, ...
    'Inputs', '+++', ...
    'SampleTime', '-1');

% The final arrival rate signal is Arrival_Sum
% (wired below to AI_Processing_Rate)

% --- 2. AI Processing Capacity (Constant) ---
pos.ai_cap = [50, 220, 150, 260];
add_block('simulink/Sources/Constant', [model_name, '/AI_Capacity'], ...
    'Position', pos.ai_cap, ...
    'Value', num2str(ai_throughput_per_sec), ...
    'SampleTime', '0');

% --- 3. AI Processing Rate = min(Arrival, AI_Capacity) ---
% Use MinMax block in 'min' mode
pos.ai_rate = [250, 160, 350, 200];
add_block('simulink/Math Operations/MinMax', [model_name, '/AI_Processing_Rate'], ...
    'Position', pos.ai_rate, ...
    'Function', 'min', ...
    'Inputs', '2', ...
    'SampleTime', '-1');

% --- 4. Human Review Capacity (Constant) ---
pos.review_cap = [50, 340, 150, 380];
add_block('simulink/Sources/Constant', [model_name, '/Review_Capacity'], ...
    'Position', pos.review_cap, ...
    'Value', num2str(review_capacity_per_sec), ...
    'SampleTime', '0');

% --- 5. Queue Inflow = AI_Processing_Rate - Review_Capacity ---
% Subtract block: +-  (first input +, second input -)
pos.queue_inflow = [450, 220, 550, 260];
add_block('simulink/Math Operations/Sum', [model_name, '/Queue_Inflow'], ...
    'Position', pos.queue_inflow, ...
    'Inputs', '+-', ...
    'SampleTime', '-1');

% --- 6. Queue Integrator with Lower Saturation at 0 ---
% Integrator block with LowerSaturationLimit = 0
pos.queue = [650, 180, 750, 300];
add_block('simulink/Continuous/Integrator', [model_name, '/Review_Queue'], ...
    'Position', pos.queue, ...
    'InitialCondition', '0', ...
    'LowerSaturationLimit', '0', ...
    'UpperSaturationLimit', 'inf', ...
    'ShowSaturationPort', 'off', ...
    'ShowStatePort', 'off', ...
    'LimitOutput', 'on');

% --- 7. Wait Time = Queue / Review_Capacity * 60 (minutes) ---
% Gain block: 1/Review_Capacity * 60 = 60/Review_Capacity
wait_time_gain = 60 / review_capacity_per_sec;  % converts queue (cases) to minutes
pos.wait_time = [800, 180, 900, 220];
add_block('simulink/Math Operations/Gain', [model_name, '/Wait_Time'], ...
    'Position', pos.wait_time, ...
    'Gain', num2str(wait_time_gain), ...
    'SampleTime', '-1');

% --- 8. AI Utilization = AI_Processing_Rate / AI_Capacity * 100 ---
pos.ai_util = [450, 100, 550, 140];
add_block('simulink/Math Operations/Product', [model_name, '/AI_Utilization_Raw'], ...
    'Position', pos.ai_util, ...
    'Inputs', '*/', ...
    'SampleTime', '-1');

pos.ai_util_gain = [650, 100, 750, 140];
add_block('simulink/Math Operations/Gain', [model_name, '/AI_Utilization'], ...
    'Position', pos.ai_util_gain, ...
    'Gain', num2str(100 / ai_throughput_per_sec), ...
    'SampleTime', '-1');

% --- 9. Review Utilization = min(AI_Processing_Rate, Review_Capacity) / Review_Capacity * 100 ---
pos.review_util_min = [450, 340, 550, 380];
add_block('simulink/Math Operations/MinMax', [model_name, '/Review_Util_Raw'], ...
    'Position', pos.review_util_min, ...
    'Function', 'min', ...
    'Inputs', '2', ...
    'SampleTime', '-1');

pos.review_util_gain = [650, 340, 750, 380];
add_block('simulink/Math Operations/Gain', [model_name, '/Review_Utilization'], ...
    'Position', pos.review_util_gain, ...
    'Gain', num2str(100 / review_capacity_per_sec), ...
    'SampleTime', '-1');

% --- 10. Scope for Queue Length ---
pos.scope_queue = [950, 180, 1100, 300];
add_block('simulink/Sinks/Scope', [model_name, '/Queue_Scope'], ...
    'Position', pos.scope_queue, ...
    'NumInputPorts', '1', ...
    'LimitDataPoints', 'off', ...
    'SaveToWorkspace', 'on', ...
    'SaveName', 'queue_scope_data', ...
    'SampleTime', '-1');

% --- 11. Scope for Wait Time ---
pos.scope_wait = [950, 300, 1100, 420];
add_block('simulink/Sinks/Scope', [model_name, '/Wait_Time_Scope'], ...
    'Position', pos.scope_wait, ...
    'NumInputPorts', '1', ...
    'LimitDataPoints', 'off', ...
    'SaveToWorkspace', 'on', ...
    'SaveName', 'wait_time_scope_data', ...
    'SampleTime', '-1');

% --- 12. Scope for Utilizations ---
pos.scope_util = [950, 50, 1100, 170];
add_block('simulink/Sinks/Scope', [model_name, '/Utilization_Scope'], ...
    'Position', pos.scope_util, ...
    'NumInputPorts', '2', ...
    'LimitDataPoints', 'off', ...
    'SaveToWorkspace', 'on', ...
    'SaveName', 'util_scope_data', ...
    'SampleTime', '-1');

% --- 13. To Workspace blocks for data export ---
pos.towk_queue = [800, 300, 900, 340];
add_block('simulink/Sinks/To Workspace', [model_name, '/Queue_To_Workspace'], ...
    'Position', pos.towk_queue, ...
    'VariableName', 'queue_length', ...
    'SaveFormat', 'Timeseries', ...
    'SampleTime', '-1');

pos.towk_wait = [950, 440, 1100, 480];
add_block('simulink/Sinks/To Workspace', [model_name, '/Wait_To_Workspace'], ...
    'Position', pos.towk_wait, ...
    'VariableName', 'wait_time_min', ...
    'SaveFormat', 'Timeseries', ...
    'SampleTime', '-1');

pos.towk_aiutil = [800, 50, 900, 90];
add_block('simulink/Sinks/To Workspace', [model_name, '/AI_Util_To_Workspace'], ...
    'Position', pos.towk_aiutil, ...
    'VariableName', 'ai_utilization', ...
    'SaveFormat', 'Timeseries', ...
    'SampleTime', '-1');

pos.towk_revutil = [800, 420, 900, 460];
add_block('simulink/Sinks/To Workspace', [model_name, '/Review_Util_To_Workspace'], ...
    'Position', pos.towk_revutil, ...
    'VariableName', 'review_utilization', ...
    'SaveFormat', 'Timeseries', ...
    'SampleTime', '-1');

% --- 14. Display blocks for final values ---
pos.disp_queue = [800, 540, 900, 580];
add_block('simulink/Sinks/Display', [model_name, '/Queue_Display'], ...
    'Position', pos.disp_queue, ...
    'Decimation', '1', ...
    'SampleTime', '-1');

pos.disp_wait = [950, 540, 1050, 580];
add_block('simulink/Sinks/Display', [model_name, '/Wait_Display'], ...
    'Position', pos.disp_wait, ...
    'Decimation', '1', ...
    'SampleTime', '-1');

%% Wire Blocks with add_line

% Arrival components -> Arrival_Sum
add_line(model_name, 'Arrival_Normal/1', 'Arrival_Sum/1');
add_line(model_name, 'Arrival_Peak_Step/1', 'Arrival_Sum/2');
add_line(model_name, 'Arrival_Normal_Step/1', 'Arrival_Sum/3');

% Arrival_Sum -> AI_Processing_Rate (input 1)
add_line(model_name, 'Arrival_Sum/1', 'AI_Processing_Rate/1');

% AI_Capacity -> AI_Processing_Rate (input 2)
add_line(model_name, 'AI_Capacity/1', 'AI_Processing_Rate/2');

% AI_Processing_Rate -> Queue_Inflow (input 1, +)
add_line(model_name, 'AI_Processing_Rate/1', 'Queue_Inflow/1');

% Review_Capacity -> Queue_Inflow (input 2, -)
add_line(model_name, 'Review_Capacity/1', 'Queue_Inflow/2');

% Queue_Inflow -> Integrator (Queue)
add_line(model_name, 'Queue_Inflow/1', 'Review_Queue/1');

% Queue -> Wait_Time
add_line(model_name, 'Review_Queue/1', 'Wait_Time/1');

% Queue -> Queue_Scope
add_line(model_name, 'Review_Queue/1', 'Queue_Scope/1');

% Queue -> Queue_To_Workspace
add_line(model_name, 'Review_Queue/1', 'Queue_To_Workspace/1');

% Queue -> Queue_Display
add_line(model_name, 'Review_Queue/1', 'Queue_Display/1');

% Wait_Time -> Wait_Time_Scope
add_line(model_name, 'Wait_Time/1', 'Wait_Time_Scope/1');

% Wait_Time -> Wait_To_Workspace
add_line(model_name, 'Wait_Time/1', 'Wait_To_Workspace/1');

% Wait_Time -> Wait_Display
add_line(model_name, 'Wait_Time/1', 'Wait_Display/1');

% AI_Processing_Rate -> AI_Utilization_Raw (input 1, *)
add_line(model_name, 'AI_Processing_Rate/1', 'AI_Utilization_Raw/1');

% AI_Capacity -> AI_Utilization_Raw (input 2, /)
add_line(model_name, 'AI_Capacity/1', 'AI_Utilization_Raw/2');

% AI_Utilization_Raw -> AI_Utilization
add_line(model_name, 'AI_Utilization_Raw/1', 'AI_Utilization/1');

% AI_Utilization -> Utilization_Scope (input 1)
add_line(model_name, 'AI_Utilization/1', 'Utilization_Scope/1');

% AI_Utilization -> AI_Util_To_Workspace
add_line(model_name, 'AI_Utilization/1', 'AI_Util_To_Workspace/1');

% AI_Processing_Rate -> Review_Util_Raw (input 1)
add_line(model_name, 'AI_Processing_Rate/1', 'Review_Util_Raw/1');

% Review_Capacity -> Review_Util_Raw (input 2)
add_line(model_name, 'Review_Capacity/1', 'Review_Util_Raw/2');

% Review_Util_Raw -> Review_Utilization
add_line(model_name, 'Review_Util_Raw/1', 'Review_Utilization/1');

% Review_Utilization -> Utilization_Scope (input 2)
add_line(model_name, 'Review_Utilization/1', 'Utilization_Scope/2');

% Review_Utilization -> Review_Util_To_Workspace
add_line(model_name, 'Review_Utilization/1', 'Review_Util_To_Workspace/1');

%% Save and Run Simulation
fprintf('Saving model...\n');
save_system(model_name);

fprintf('Running simulation (24 hours = %d seconds)...\n', sim_stop_time);
sim_out = sim(model_name);

fprintf('Simulation complete!\n');
fprintf('Results available in workspace:\n');
fprintf('  - queue_length (timeseries)\n');
fprintf('  - wait_time_min (timeseries)\n');
fprintf('  - ai_utilization (timeseries)\n');
fprintf('  - review_utilization (timeseries)\n');

% Also open scopes for visual inspection
open_system([model_name, '/Queue_Scope']);
open_system([model_name, '/Wait_Time_Scope']);
open_system([model_name, '/Utilization_Scope']);

fprintf('\n=== Model saved as %s.slx ===\n', model_name);
fprintf('You can now open it manually with: open_system(''%s'')\n', model_name);

%% Optional: Quick MATLAB plot of results (if you want to verify without Simulink scopes)
try
    if exist('queue_length', 'var') && exist('wait_time_min', 'var')
        figure('Name', 'DR Screening Queue Results', 'NumberTitle', 'off');

        t_hours = queue_length.Time / 3600;

        subplot(3,1,1);
        plot(t_hours, queue_length.Data, 'b-', 'LineWidth', 1.5);
        ylabel('Queue Length (cases)');
        title('Review Queue Length Over 24 Hours');
        grid on;

        subplot(3,1,2);
        plot(t_hours, wait_time_min.Data, 'r-', 'LineWidth', 1.5);
        ylabel('Wait Time (minutes)');
        ax = gca;
        hold on;
        yline(30, '--k', '30 min target');
        hold off;
        title('Patient Wait Time for Review');
        grid on;

        subplot(3,1,3);
        plot(t_hours, ai_utilization.Data, 'g-', 'LineWidth', 1.5, 'DisplayName', 'AI Util');
        hold on;
        plot(t_hours, review_utilization.Data, 'r-', 'LineWidth', 1.5, 'DisplayName', 'Review Util');
        hold off;
        ylabel('Utilization (%)');
        xlabel('Time (hours)');
        legend;
        title('Resource Utilization');
        grid on;

        fprintf('\nQuick MATLAB plots generated.\n');
    end
catch
    fprintf('\nNote: Workspace variables available for manual plotting.\n');
end
