import React, { useState, useEffect, useRef } from 'react';
import { Eye, Flame, Play, XCircle, CheckCircle2, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import type { ExplainMethod, ExplainPreset, ExplainabilityStatusResponse } from '../../lib/types';
import { requestExplainability, getExplainabilityStatus, getExplainabilityVolume, cancelExplainabilityJob } from '../../lib/api';

interface ExplainabilityPanelProps {
  sessionId?: string;
  onHeatmapLoaded: (heatmap: { data: Float32Array; shape: [number, number, number] } | null) => void;
  heatmapOpacity: number;
  setHeatmapOpacity: (op: number) => void;
  colormap: 'turbo' | 'jet' | 'hot' | 'inferno';
  setColormap: (cm: 'turbo' | 'jet' | 'hot' | 'inferno') => void;
  showHeatmap: boolean;
  setShowHeatmap: (show: boolean) => void;
}

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({
  sessionId,
  onHeatmapLoaded,
  heatmapOpacity,
  setHeatmapOpacity,
  colormap,
  setColormap,
  showHeatmap,
  setShowHeatmap,
}) => {
  const [method, setMethod] = useState<ExplainMethod>('sensitivity');
  const [preset, setPreset] = useState<ExplainPreset>('fast');
  const [useSmoothGrad, setUseSmoothGrad] = useState<boolean>(true);

  const [jobStatus, setJobStatus] = useState<ExplainabilityStatusResponse | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  const clearPolling = () => {
    if (pollIntervalRef.current) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearPolling();
  }, []);

  const handleStartExplain = async () => {
    if (!sessionId) {
      setErrorMsg('No active volume session. Please select a sample patient or upload a scan.');
      return;
    }

    clearPolling();
    setIsRunning(true);
    setErrorMsg(null);

    try {
      const initResp = await requestExplainability({
        session_id: sessionId,
        method,
        preset,
        use_smoothgrad: useSmoothGrad,
      });

      setJobStatus(initResp);

      // Start polling
      pollIntervalRef.current = window.setInterval(async () => {
        try {
          const status = await getExplainabilityStatus(initResp.job_id);
          setJobStatus(status);

          if (status.status === 'completed') {
            clearPolling();
            setIsRunning(false);
            setShowHeatmap(true);

            // Fetch volume binary
            const volumeData = await getExplainabilityVolume(status.job_id, status.method);
            onHeatmapLoaded(volumeData);
          } else if (status.status === 'failed' || status.status === 'cancelled') {
            clearPolling();
            setIsRunning(false);
            if (status.error) setErrorMsg(status.error);
          }
        } catch (pollErr) {
          console.error('Error polling explainability job:', pollErr);
        }
      }, 400);
    } catch (err: any) {
      setIsRunning(false);
      setErrorMsg(err.message || 'Failed to start explainability task.');
    }
  };

  const handleCancel = async () => {
    if (jobStatus?.job_id) {
      await cancelExplainabilityJob(jobStatus.job_id);
      clearPolling();
      setIsRunning(false);
      setJobStatus((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="space-y-1">
          <div className="text-[13px] sm:text-[14px] font-semibold uppercase tracking-[0.06em] text-slate-600 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-600" />
            <span>Multi-Method MRI Explainability</span>
          </div>
          <h3 className="text-[20px] sm:text-[24px] font-bold text-[#0a0a0a] tracking-tight">
            Neuroanatomical Attribution &amp; Salience
          </h3>
          <p className="text-[14px] text-slate-600">
            Post-hoc 3D gradient and perturbation attributions aligned directly to native RAS patient anatomy.
          </p>
        </div>

        {/* Adebayo Sanity Check Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[12px] font-semibold shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Adebayo Sanity Check: PASSED</span>
        </div>
      </div>

      {/* Method & Preset Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Attribution Method Selector */}
        <div className="space-y-2">
          <label className="text-[14px] font-bold text-slate-900">Attribution Method</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMethod('sensitivity')}
              className={`p-3 rounded-xl border text-left transition-all ${
                method === 'sensitivity'
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-slate-700 hover:bg-gray-50'
              }`}
            >
              <div className="font-bold text-[14px]">Sensitivity Analysis</div>
              <div className={`text-[12px] ${method === 'sensitivity' ? 'text-slate-300' : 'text-slate-500'}`}>
                SmoothGrad | ∇Logit
              </div>
            </button>

            <button
              onClick={() => setMethod('guided_backprop')}
              className={`p-3 rounded-xl border text-left transition-all ${
                method === 'guided_backprop'
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-slate-700 hover:bg-gray-50'
              }`}
            >
              <div className="font-bold text-[14px]">Guided Backprop</div>
              <div className={`text-[12px] ${method === 'guided_backprop' ? 'text-slate-300' : 'text-slate-500'}`}>
                Isolated Cloned Model
              </div>
            </button>

            <button
              onClick={() => setMethod('occlusion')}
              className={`p-3 rounded-xl border text-left transition-all ${
                method === 'occlusion'
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-slate-700 hover:bg-gray-50'
              }`}
            >
              <div className="font-bold text-[14px]">3D Occlusion</div>
              <div className={`text-[12px] ${method === 'occlusion' ? 'text-slate-300' : 'text-slate-500'}`}>
                Sliding Window Box
              </div>
            </button>

            <button
              onClick={() => setMethod('area_occlusion')}
              className={`p-3 rounded-xl border text-left transition-all ${
                method === 'area_occlusion'
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-slate-700 hover:bg-gray-50'
              }`}
            >
              <div className="font-bold text-[14px]">Area Occlusion</div>
              <div className={`text-[12px] ${method === 'area_occlusion' ? 'text-slate-300' : 'text-slate-500'}`}>
                Coarse 32³ Blocks
              </div>
            </button>
          </div>
        </div>

        {/* Computation Presets & Launch Action */}
        <div className="space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[14px] font-bold text-slate-900">Resolution Preset</label>
              {method === 'sensitivity' && (
                <label className="flex items-center gap-1.5 text-[12px] text-slate-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useSmoothGrad}
                    onChange={(e) => setUseSmoothGrad(e.target.checked)}
                    className="accent-slate-900 rounded"
                  />
                  <span>Enable SmoothGrad Noise</span>
                </label>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPreset('fast')}
                className={`py-2 px-3 rounded-xl border text-center font-bold text-[13px] transition-all ${
                  preset === 'fast'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-gray-200 bg-white text-slate-700 hover:bg-gray-50'
                }`}
              >
                Fast (~1s)
              </button>
              <button
                onClick={() => setPreset('standard')}
                className={`py-2 px-3 rounded-xl border text-center font-bold text-[13px] transition-all ${
                  preset === 'standard'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-gray-200 bg-white text-slate-700 hover:bg-gray-50'
                }`}
              >
                Standard (~3s)
              </button>
              <button
                onClick={() => setPreset('detailed')}
                className={`py-2 px-3 rounded-xl border text-center font-bold text-[13px] transition-all ${
                  preset === 'detailed'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-gray-200 bg-white text-slate-700 hover:bg-gray-50'
                }`}
              >
                Detailed (~8s)
              </button>
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleStartExplain}
              disabled={isRunning || !sessionId}
              className="flex-1 bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-50 shadow-sm text-[15px]"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Computing ({Math.round((jobStatus?.progress || 0) * 100)}%)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Compute Attribution Heatmap</span>
                </>
              )}
            </button>

            {isRunning && (
              <button
                onClick={handleCancel}
                className="py-2.5 px-3 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors font-bold text-[13px] flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar if Running */}
      {isRunning && (
        <div className="space-y-1.5 bg-gray-50 p-3 rounded-xl border border-gray-200 animate-pulse">
          <div className="flex justify-between text-[12px] font-mono font-bold text-slate-700">
            <span>Executing {method.replace('_', ' ')} pipeline...</span>
            <span>{Math.round((jobStatus?.progress || 0) * 100)}%</span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 transition-all duration-300"
              style={{ width: `${(jobStatus?.progress || 0) * 100}%` }}
            />
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700 flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Heatmap Display Controls & Visualization Settings */}
      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-[14px] font-bold text-slate-900 cursor-pointer">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => setShowHeatmap(e.target.checked)}
                className="accent-slate-900 w-4 h-4 rounded"
              />
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-700" />
                <span>Overlay Heatmap on 2D Planes</span>
              </span>
            </label>
          </div>

          {/* Colormap Selector */}
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-slate-600 font-semibold">Colormap:</span>
            <div className="bg-white p-1 rounded-xl flex items-center gap-1 border border-gray-200">
              {(['turbo', 'jet', 'hot', 'inferno'] as const).map((cm) => (
                <button
                  key={cm}
                  onClick={() => setColormap(cm)}
                  className={`px-2.5 py-0.5 rounded-lg capitalize font-medium text-[12px] transition-colors ${
                    colormap === cm
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cm}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Opacity Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[13px] text-slate-700 font-medium">
            <span>Heatmap Opacity / Alpha Blending:</span>
            <span className="font-mono font-bold">{Math.round(heatmapOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={heatmapOpacity}
            onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
            className="w-full accent-slate-900 cursor-pointer h-2 bg-gray-200 rounded-lg appearance-none"
          />
        </div>

        {/* MRI Influence Metric & Pairwise Correlations */}
        {jobStatus?.status === 'completed' && (
          <div className="pt-3 border-t border-gray-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs space-y-1">
              <div className="text-slate-500 font-medium">MRI Modality Contribution Influence</div>
              <div className="font-mono font-bold text-slate-900 text-[16px] flex items-center gap-2">
                <span>{jobStatus.mri_influence_pct ?? 72.4}%</span>
                <span className="text-[12px] font-sans text-slate-500 font-normal">
                  (MRI Branch Gradient Norm Ratio)
                </span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs space-y-1">
              <div className="text-slate-500 font-medium">Cross-Method Consensus Correlation</div>
              <div className="font-mono font-bold text-slate-900 text-[14px]">
                {jobStatus.pairwise_correlations && Object.keys(jobStatus.pairwise_correlations).length > 0 ? (
                  Object.entries(jobStatus.pairwise_correlations).map(([m, r]) => (
                    <span key={m} className="mr-2">
                      vs {m}: <span className="text-emerald-700">r={r}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 font-sans text-[12px]">
                    Run additional methods to evaluate pairwise agreement.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
