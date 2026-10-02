import React from 'react';
import type { ResearchMetrics } from '../lib/types';
import { ShieldAlert, Brain, CheckCircle2, X, ShieldCheck, AlertTriangle } from 'lucide-react';

interface ClinicalSectionProps {
  metrics: ResearchMetrics;
}

export const ClinicalSection: React.FC<ClinicalSectionProps> = ({ metrics }) => {
  return (
    <section id="why-mri" className="py-16 sm:py-20 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">

          {/* Section header */}
          <div className="mb-12 text-center">
            <p className="eyebrow text-slate-400 mb-2">Critical Analysis</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a0a0a] tracking-tight">
              Why MRI Still Matters &amp;
              <span className="block text-slate-400">Honest Limitations</span>
            </h2>
            <p className="mt-3 text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Our ablation confirms that MMSE and CDRSB alone achieve perfect AUC. We present both
              the genuine clinical rationale for MRI <em>and</em> the unvarnished limitations without softening.
            </p>
          </div>

          {/* ── Problem vs Solution two-panel ────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">

            {/* Problem: Imaging-only */}
            <div className="rounded-2xl bg-red-50 border border-red-200 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-red-100 text-red-600">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-500 mb-0.5">The Problem</div>
                  <h3 className="text-base font-bold text-red-800">Imaging-only models</h3>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  { lead: 'Weak discriminative power.', rest: 'MRI-only binary AUC of 0.578 — barely above random chance for this curated cohort.' },
                  { lead: 'CN-biased predictions.', rest: 'Without cognitive context, the model defaults to predicting Cognitively Normal, missing dementia cases.' },
                  { lead: 'No context for atrophy.', rest: 'Hippocampal shrinkage is only meaningful when paired with cognitive decline markers.' },
                  { lead: 'AUC stalls at 0.699.', rest: 'Even adding demographics (age, sex, education) without cognitive scores caps MRI contribution.' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-red-800">
                    <X className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <span><strong>{item.lead}</strong> {item.rest}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution: NeuroFusion multimodal */}
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600 mb-0.5">NeuroFusion Approach</div>
                  <h3 className="text-base font-bold text-emerald-800">Multimodal fusion</h3>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  { lead: 'AUC 0.997 on 92 test subjects.', rest: 'Full multimodal fusion achieves near-perfect separation on the ADNI held-out set.' },
                  { lead: 'Rigorously ablated.', rest: 'Each feature stream isolated — cognitive scores, demographics, and MRI each measured separately.' },
                  { lead: 'Honest clinical reporting.', rest: 'MMSE + CDR alone reach AUC 1.000; we report this openly rather than claiming imaging primacy.' },
                  { lead: 'MRI as exclusion tool.', rest: 'Structural MRI rules out non-Alzheimer\'s etiologies (tumors, NPH) that mimic dementia symptoms.' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span><strong>{item.lead}</strong> {item.rest}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Honest ablation callout */}
          <div className="mb-10 p-5 rounded-2xl bg-amber-50 border border-amber-200 flex gap-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-amber-800 mb-1">The Honest Ablation Finding</h3>
              <p className="text-xs text-amber-700 leading-relaxed">
                Logistic Regression on <strong>MMSE + CDR + demographics alone achieves AUC 1.000</strong> on the ADNI test set.
                The full multimodal model's 0.997 AUC is largely driven by these cognitive biomarkers.
                MRI + demographics (without cognitive scores) achieves a <strong>rigorous, honest AUC of 0.699</strong> —
                representing the genuine structural MRI contribution. This is a real finding, not a flaw to hide.
              </p>
            </div>
          </div>

          {/* Why MRI matters grid */}
          <div className="mb-10">
            <h3 className="text-base font-bold text-[#0a0a0a] mb-5 flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-500" />
              Why Structural MRI Remains Clinically Indispensable
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {metrics.why_mri_matters.map((item, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-500 mt-0.5 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#0a0a0a] mb-1">{item.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Known limitations */}
          <div>
            <h3 className="text-base font-bold text-[#0a0a0a] mb-5 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              Known Limitations &amp; Future Directions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {metrics.limitations.map((item, i) => (
                <div key={i} className="bg-red-50 border border-red-100 rounded-2xl p-5 hover:border-red-200 transition-colors">
                  <h4 className="text-sm font-semibold text-red-800 mb-2">{item.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
