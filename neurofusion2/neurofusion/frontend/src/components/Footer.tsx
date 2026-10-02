import React from 'react';
import { ExternalLink, Globe, ShieldCheck, Brain } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#f8f9fa] border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0a0a0a] flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-extrabold text-[#0a0a0a] tracking-tight">
                Neuro<span className="text-slate-400">Fusion</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              An end-to-end multimodal 3D deep learning pipeline for Alzheimer's classification from structural brain MRI and clinical biomarkers.
            </p>
            <p className="text-xs text-slate-400">
              Built by <span className="text-slate-600 font-medium">Arineh Khachikian</span> as a portfolio project for MS CS/AI applications.
            </p>

            {/* Privacy notice */}
            <div className="flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>
                <strong>Privacy:</strong> All MRI scans are processed in ephemeral server-side memory and deleted immediately after inference. No patient data is stored.
              </span>
            </div>
          </div>

          {/* Project links */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Project</div>
            <div className="space-y-2.5">
              {[
                { label: 'Inference Demo', id: 'demo' },
                { label: 'Results & Ablation', id: 'results' },
                { label: 'Architecture', id: 'architecture' },
                { label: 'Research Journey', id: 'journey' },
              ].map(link => (
                <button
                  key={link.id}
                  onClick={() => document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' })}
                  className="block text-sm text-slate-500 hover:text-[#0a0a0a] transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Legal / Resources */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Resources</div>
            <div className="space-y-2.5">
              <a
                href="https://adni.loni.usc.edu"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0a0a0a] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                ADNI Database
              </a>
            </div>
            <div className="mt-4 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Legal</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Research prototype only. Not a medical device. Not for clinical use.
              </p>
            </div>
          </div>
        </div>

        {/* ADNI acknowledgement */}
        <div className="mt-10 pt-6 border-t border-gray-200">
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-3xl">
            <strong className="text-slate-500">ADNI Acknowledgement:</strong> Data used in preparation of this article were obtained from the ADNI database (adni.loni.usc.edu). As such, the investigators within ADNI contributed to the design and implementation of ADNI and/or provided data but did not participate in analysis or writing of this report.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
          <span>© 2026 Arineh Khachikian · NeuroFusion v1.0</span>
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Research Portfolio · MS CS/AI
          </span>
        </div>
      </div>
    </footer>
  );
};
