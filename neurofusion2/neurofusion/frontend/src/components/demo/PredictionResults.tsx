import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, Clock, Info, ShieldAlert, Cpu, Sparkles, Sliders, Trash2, Check } from 'lucide-react';
import type { PredictionResult, OperatingPoint, OperatingPointsResponse } from '../../lib/types';
import { getOperatingPoints, deleteSession } from '../../lib/api';

interface PredictionResultsProps {
  result: PredictionResult | null;
  isLoading: boolean;
  onSessionPurged?: () => void;
}

export const PredictionResults: React.FC<PredictionResultsProps> = ({
  result,
  isLoading,
  onSessionPurged,
}) => {
  const [threshold, setThreshold] = useState<number>(0.50);
  const [operatingPointsData, setOperatingPointsData] = useState<OperatingPointsResponse | null>(null);
  const [isPurging, setIsPurging] = useState<boolean>(false);
  const [purgedSuccess, setPurgedSuccess] = useState<boolean>(false);

  useEffect(() => {
    getOperatingPoints()
      .then((data) => setOperatingPointsData(data))
      .catch((err) => console.warn('Failed to load operating points:', err));
  }, []);

  const handlePurge = async () => {
    if (!result?.session_id) return;
    setIsPurging(true);
    try {
      await deleteSession(result.session_id);
      setPurgedSuccess(true);
      setTimeout(() => {
        setPurgedSuccess(false);
        if (onSessionPurged) onSessionPurged();
      }, 1500);
    } catch (e) {
      console.error('Session purge failed:', e);
    } finally {
      setIsPurging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-200 animate-pulse space-y-4.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="h-5 w-36 bg-gray-200 rounded" />
          <div className="h-7 w-24 bg-gray-200 rounded-full" />
        </div>
        <div className="h-9 w-56 bg-gray-200 rounded" />
        <div className="space-y-2.5 pt-2">
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-5/6 bg-gray-200 rounded" />
        </div>
        <div className="h-20 w-full bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white rounded-2xl p-7 border border-gray-200 text-center flex flex-col items-center justify-center min-h-[220px] shadow-sm">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-slate-500 mb-3">
          <Activity className="w-6 h-6 text-slate-600" />
        </div>
        <h4 className="text-[20px] font-bold text-[#0a0a0a] mb-1.5">Awaiting Input Scan &amp; Biomarkers</h4>
        <p className="text-[16px] text-slate-600 max-w-md leading-relaxed">
          Adjust clinical scores and click "Run Multimodal Prediction" or select an ADNI sample patient to generate real-time class probabilities and 3D reconstruction.
        </p>
      </div>
    );
  }

  const pDementiaRaw = result.probabilities["Alzheimer's Disease"];
  const pCnRaw = result.probabilities['Cognitively Normal (CN)'];
  
  // Dynamic threshold outcome
  const dynamicIsDementia = pDementiaRaw >= threshold;
  const dynamicClass = dynamicIsDementia ? "Alzheimer's Disease" : "Cognitively Normal (CN)";
  const marginPct = (pDementiaRaw - threshold) * 100;
  
  const cnProb = (pCnRaw * 100);
  const demProb = (pDementiaRaw * 100);

  // SVG Radial Gauge Calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (result.confidence / 100) * circumference;

  // Closest matching operating point
  const currentOp = operatingPointsData?.operating_points.find(
    (op) => Math.abs(op.threshold - threshold) < 0.006
  );

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-200 shadow-sm space-y-6">
      {/* Classification Outcome Header with Radial Gauge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-5 border-b border-gray-100">
        <div className="space-y-1.5">
          <div className="text-[13px] sm:text-[14px] font-semibold uppercase tracking-[0.06em] text-slate-600 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Multimodal Decision Output (Threshold: {(threshold * 100).toFixed(0)}%)</span>
          </div>
          <div className="text-[26px] sm:text-[30px] font-extrabold text-[#0a0a0a] flex items-center gap-3 tracking-tight">
            {!dynamicIsDementia ? (
              <CheckCircle className="w-8 h-8 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-8 h-8 text-red-600 shrink-0" />
            )}
            <span className={!dynamicIsDementia ? 'text-emerald-800' : 'text-red-800'}>
              {dynamicClass}
            </span>
          </div>
          <div className="text-[14px] text-slate-600 font-medium flex items-center gap-2 flex-wrap">
            <span>Decision Margin:</span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded text-[13px] ${
              marginPct >= 0 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {marginPct >= 0 ? `+${marginPct.toFixed(1)}% above threshold` : `${marginPct.toFixed(1)}% below threshold`}
            </span>
          </div>
        </div>

        {/* Circular Confidence Meter */}
        <div className="flex items-center gap-3.5 self-end sm:self-center bg-gray-50 border border-gray-200 p-3 rounded-2xl shadow-sm">
          <div className="relative w-18 h-18 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-gray-200"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className={`transition-all duration-1000 ease-out ${
                  !dynamicIsDementia ? 'stroke-emerald-600' : 'stroke-red-600'
                }`}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`text-[17px] sm:text-[19px] font-mono font-bold tabular-nums ${!dynamicIsDementia ? 'text-emerald-800' : 'text-red-800'}`}>
                {result.confidence.toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="text-left pr-1">
            <div className="text-[12px] uppercase font-mono tracking-wider text-slate-500 font-semibold">Base Confidence</div>
            <div className="text-[15px] font-bold text-[#0a0a0a]">Predicted Peak</div>
          </div>
        </div>
      </div>

      {/* Probability Distribution Bars with Threshold Marker */}
      <div className="space-y-4">
        {/* Cognitively Normal Bar */}
        <div>
          <div className="flex justify-between text-[16px] mb-1.5 font-semibold">
            <span className="text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Cognitively Normal (CN)</span>
            </span>
            <span className="font-mono font-bold text-emerald-800 tabular-nums text-[18px] sm:text-[20px]">
              {cnProb.toFixed(1)}%
            </span>
          </div>
          <div className="h-3.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${cnProb}%` }}
            />
          </div>
        </div>

        {/* Dementia Bar with Interactive Threshold Marker */}
        <div>
          <div className="flex justify-between text-[16px] mb-1.5 font-semibold">
            <span className="text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
              <span>Alzheimer's Disease (Dementia)</span>
            </span>
            <span className="font-mono font-bold text-red-800 tabular-nums text-[18px] sm:text-[20px]">
              {demProb.toFixed(1)}%
            </span>
          </div>
          <div className="relative h-3.5 w-full bg-gray-100 rounded-full border border-gray-200">
            <div
              className="h-full bg-red-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${demProb}%` }}
            />
            {/* Threshold marker tick */}
            <div
              className="absolute top-[-5px] bottom-[-5px] w-1 bg-slate-900 shadow-md z-10 pointer-events-none rounded"
              style={{ left: `${threshold * 100}%` }}
              title={`Threshold: ${(threshold * 100).toFixed(0)}%`}
            />
          </div>
        </div>
      </div>

      {/* Adjustable Classification Threshold Control */}
      <div className="p-4.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4.5 h-4.5 text-slate-700" />
            <span className="font-bold text-[#0a0a0a] text-[15px] sm:text-[16px]">
              Adjust Classification Threshold:
            </span>
            <span className="font-mono font-bold text-emerald-800 text-[16px] bg-white px-2 py-0.5 rounded border border-gray-200 shadow-2xs">
              {(threshold * 100).toFixed(0)}% ({threshold.toFixed(2)})
            </span>
          </div>

          {/* Presets */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setThreshold(0.30)}
              className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                threshold === 0.30
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              0.30 (High Sens)
            </button>
            <button
              onClick={() => setThreshold(0.50)}
              className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                threshold === 0.50
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              0.50 (Standard)
            </button>
            <button
              onClick={() => setThreshold(0.70)}
              className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                threshold === 0.70
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              0.70 (High Spec)
            </button>
          </div>
        </div>

        <input
          type="range"
          min="0.01"
          max="0.99"
          step="0.01"
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          className="w-full accent-slate-900 cursor-pointer h-2 bg-gray-200 rounded-lg appearance-none"
        />

        {/* Operating Point Metrics Grid with Wilson 95% CIs */}
        {currentOp && (
          <div className="pt-2 border-t border-gray-200/60">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[12px] sm:text-[13px]">
              <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-2xs">
                <div className="text-slate-500 font-medium">Sensitivity (Recall)</div>
                <div className="font-mono font-bold text-slate-900 text-[14px]">
                  {(currentOp.sensitivity * 100).toFixed(1)}%
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  95% CI: [{(currentOp.sensitivity_ci95[0] * 100).toFixed(1)}-{(currentOp.sensitivity_ci95[1] * 100).toFixed(1)}%]
                </div>
              </div>

              <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-2xs">
                <div className="text-slate-500 font-medium">Specificity</div>
                <div className="font-mono font-bold text-slate-900 text-[14px]">
                  {(currentOp.specificity * 100).toFixed(1)}%
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  95% CI: [{(currentOp.specificity_ci95[0] * 100).toFixed(1)}-{(currentOp.specificity_ci95[1] * 100).toFixed(1)}%]
                </div>
              </div>

              <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-2xs">
                <div className="text-slate-500 font-medium">PPV (Precision)</div>
                <div className="font-mono font-bold text-slate-900 text-[14px]">
                  {(currentOp.ppv * 100).toFixed(1)}%
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  95% CI: [{(currentOp.ppv_ci95[0] * 100).toFixed(1)}-{(currentOp.ppv_ci95[1] * 100).toFixed(1)}%]
                </div>
              </div>

              <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-2xs">
                <div className="text-slate-500 font-medium">NPV</div>
                <div className="font-mono font-bold text-slate-900 text-[14px]">
                  {(currentOp.npv * 100).toFixed(1)}%
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  95% CI: [{(currentOp.npv_ci95[0] * 100).toFixed(1)}-{(currentOp.npv_ci95[1] * 100).toFixed(1)}%]
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 mt-2 text-center italic">
              Computed on ADNI held-out test split (n=92: 70 CN, 22 Dementia). Do not tune thresholds on this test data.
            </div>
          </div>
        )}
      </div>

      {/* Clinical Interpretation Narrative */}
      <div className="p-4.5 rounded-2xl bg-gray-50 border border-gray-200 text-slate-700 leading-relaxed space-y-1.5 shadow-sm">
        <div className="font-bold text-[#0a0a0a] text-[16px] flex items-center gap-2">
          <Info className="w-5 h-5 text-emerald-700" />
          <span>Patient-Specific Clinical Synthesis</span>
        </div>
        <p className="text-[16px] text-slate-700 leading-relaxed">{result.interpretation}</p>
      </div>

      {/* Diagnostics / Telemetry & Privacy Purge Footer */}
      <div className="flex flex-wrap items-center justify-between text-[13px] sm:text-[14px] text-slate-600 pt-3.5 border-t border-gray-100 font-mono gap-3 font-medium">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-slate-800">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="tabular-nums font-bold">{result.inference_time_ms} ms</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-slate-500" />
            <span className="capitalize font-semibold">{result.model_mode.replace('_', ' ')}</span>
          </span>
          {result.session_id && (
            <span className="text-slate-500 text-[12px]">
              TTL: 30m
            </span>
          )}
        </div>

        {result.session_id && (
          <button
            onClick={handlePurge}
            disabled={isPurging || purgedSuccess}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-sans font-semibold transition-colors border ${
              purgedSuccess
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-600 border-gray-200 hover:text-red-700 hover:border-red-200 hover:bg-red-50'
            }`}
            title="Purge in-memory scans & heatmaps for privacy"
          >
            {purgedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Session Purged</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{isPurging ? 'Purging...' : 'Purge Session Data'}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

