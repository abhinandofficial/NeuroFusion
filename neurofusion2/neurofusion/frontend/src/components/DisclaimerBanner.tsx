import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return (
      <aside aria-label="Research Disclaimer Notice" className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-full text-[14px] font-bold shadow-lg hover:bg-amber-100 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
          title="Show Research & Privacy Disclaimer"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Research Disclaimer</span>
        </button>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Research Disclaimer Banner"
      className="relative z-50 bg-amber-50 border-b border-amber-300 text-amber-950 text-[14px] px-4 sm:px-6 py-3"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3.5">
        <div className="flex items-start sm:items-center gap-3 flex-1">
          <div className="p-1.5 rounded-lg bg-amber-200/80 text-amber-800 mt-0.5 sm:mt-0 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 leading-relaxed font-normal">
            <span className="font-extrabold text-amber-900 uppercase tracking-wider text-[12px] bg-amber-200/80 px-2 py-0.5 rounded-md shrink-0">
              Research Prototype Only
            </span>
            <span className="text-amber-950">
              NeuroFusion is an academic portfolio project and <strong>not a medical device</strong>. It must not be used for diagnosis or clinical decision-making.
              Predictions are predominantly driven by cognitive test scores (MMSE &amp; CDRSB).
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-slate-700 pl-2 border-l border-amber-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-700" /> In-memory processing; scans are instantly purged.
            </span>
          </div>
        </div>

        <button
          onClick={() => setMinimized(true)}
          className="text-amber-700 hover:text-amber-950 p-1.5 rounded-lg hover:bg-amber-200/60 transition-colors shrink-0"
          aria-label="Minimize disclaimer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
