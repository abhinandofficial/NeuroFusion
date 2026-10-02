import React from 'react';
import type { ResearchJourneyItem } from '../lib/types';
import { XCircle, AlertCircle, Sparkles, FlaskConical } from 'lucide-react';

interface JourneySectionProps {
  journey: ResearchJourneyItem[];
}

const STATUS_CONFIG = {
  Failed: {
    icon: XCircle,
    badge: 'bg-red-50 text-red-600 border-red-200',
    dot: 'bg-red-400',
    border: 'border-red-100',
    iconColor: 'text-red-500',
    dotBorder: 'border-red-200',
  },
  Promising: {
    icon: AlertCircle,
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-400',
    border: 'border-amber-100',
    iconColor: 'text-amber-500',
    dotBorder: 'border-amber-200',
  },
  Suboptimal: {
    icon: AlertCircle,
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-400',
    border: 'border-orange-100',
    iconColor: 'text-orange-500',
    dotBorder: 'border-orange-200',
  },
  Breakthrough: {
    icon: Sparkles,
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    border: 'border-emerald-100',
    iconColor: 'text-emerald-500',
    dotBorder: 'border-emerald-200',
  },
} as const;

export const JourneySection: React.FC<JourneySectionProps> = ({ journey }) => {
  return (
    <section id="journey" className="py-16 sm:py-20 bg-[#f8f9fa] border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <p className="eyebrow text-slate-400 mb-2 flex items-center justify-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5" />
            Honest Experimental Narrative
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a0a0a] tracking-tight">The Research Journey</h2>
          <p className="mt-3 text-sm text-slate-500 leading-relaxed">
            Four systematic iterations from catastrophic overfitting to multimodal fusion — including the uncomfortable finding about clinical score dominance.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative max-w-3xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-8 top-4 bottom-4 w-px bg-gradient-to-b from-red-200 via-amber-200 to-emerald-300 hidden sm:block" />

          <div className="space-y-6">
            {journey.map((item) => {
              const cfg = STATUS_CONFIG[item.status];
              const StatusIcon = cfg.icon;
              return (
                <div key={item.step} className="flex gap-4 sm:gap-6 items-start relative">

                  {/* Step indicator */}
                  <div className="relative z-10 hidden sm:flex flex-col items-center shrink-0 w-16">
                    <div className={`w-10 h-10 rounded-full bg-white border-2 ${cfg.dotBorder} flex items-center justify-center shadow-sm`}>
                      <StatusIcon className={`w-4.5 h-4.5 ${cfg.iconColor}`} />
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">#{item.step}</div>
                  </div>

                  {/* Card */}
                  <div className={`flex-1 bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow ${cfg.border}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-bold text-[#0a0a0a] leading-tight">{item.title}</h3>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${cfg.badge} shrink-0`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-mono font-bold ${cfg.iconColor}`}>
                        <span>→</span>
                        <span>{item.metric}</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
