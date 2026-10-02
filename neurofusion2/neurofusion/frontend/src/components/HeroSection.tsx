import React, { lazy, Suspense } from 'react';
import { Play, BookOpen, Sparkles, ArrowRight, ShieldCheck, Layers, Brain, Database } from 'lucide-react';

const HeroBrainCanvas = lazy(() => import('./brain3d/HeroBrainCanvas'));

// Illustrative sample result cards for the browser-window mockup
const ILLUSTRATIVE_CARDS = [
  {
    label: 'Cognitively Normal',
    shortLabel: 'CN',
    confidence: 97,
    detail: 'MMSE 29 · CDRSB 0.0 · Age 74',
    isPositive: true,
    tier: 'Low Risk',
  },
  {
    label: "Alzheimer's Disease",
    shortLabel: 'AD',
    confidence: 91,
    detail: 'MMSE 20 · CDRSB 6.0 · Age 88',
    isPositive: false,
    tier: 'Very High Risk',
  },
  {
    label: 'Cognitively Normal',
    shortLabel: 'CN',
    confidence: 72,
    detail: 'MMSE 26 · CDRSB 1.5 · Age 69',
    isPositive: true,
    tier: 'Moderate',
  },
];

const ConfidenceRing: React.FC<{ value: number; isPositive: boolean }> = ({ value, isPositive }) => {
  const radius = 20;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r={radius} fill="none" strokeWidth="4" className="stroke-gray-100" />
        <circle
          cx="25" cy="25" r={radius} fill="none" strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-700 ${isPositive ? 'stroke-emerald-500' : 'stroke-red-500'}`}
        />
      </svg>
      <span className={`absolute text-xs font-mono font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
        {value}%
      </span>
    </div>
  );
};

export const HeroSection: React.FC = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden bg-white pt-14 pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ─── Main hero grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center pb-16 lg:pb-20">

          {/* Left: Text + CTAs (7 cols) */}
          <div className="lg:col-span-7 space-y-7 text-left">

            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-slate-500 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Multimodal Alzheimer's MRI Research</span>
            </div>

            {/* Two-tone headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              <span className="text-[#0a0a0a]">Don't just classify scans.</span>
              <br />
              <span className="text-slate-400">Know what drives the prediction.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-xl">
              <strong className="text-[#0a0a0a]">NeuroFusion</strong> fuses MedicalNet 3D ResNet-10 volumetric embeddings (512-dim) with MMSE, CDRSB, age, sex, and education — then rigorously ablates each contribution on 92 held-out ADNI subjects.
            </p>

            {/* Three-button row */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => scrollTo('demo')}
                className="btn btn-black"
                aria-label="Launch live 3D demo"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Launch Demo
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollTo('results')}
                className="btn btn-emerald"
                aria-label="View research results"
              >
                <BookOpen className="w-3.5 h-3.5" />
                VIEW RESEARCH
              </button>
              <button
                type="button"
                onClick={() => scrollTo('results')}
                className="btn btn-outline"
                aria-label="See ablation study"
              >
                <Sparkles className="w-3.5 h-3.5" />
                See Ablation Study
              </button>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 pt-1 text-xs text-slate-500">
              <span className="px-3 py-1 rounded-full bg-gray-50 border border-gray-200 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-slate-400" />
                MedicalNet ResNet-10 (Pretrained)
              </span>
              <span className="px-3 py-1 rounded-full bg-gray-50 border border-gray-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                544d Dual-Stream Fusion
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Honest AUC 0.699 (MRI + Demographics)
              </span>
            </div>
          </div>

          {/* Right: 3D Brain (5 cols) */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden bg-[#050811]">
              <Suspense
                fallback={
                  <div className="w-full h-[400px] flex flex-col items-center justify-center text-slate-500 gap-3 bg-[#050811]">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-mono text-slate-400">Initializing 3D Brain…</span>
                  </div>
                }
              >
                <HeroBrainCanvas />
              </Suspense>
            </div>
          </div>
        </div>

        {/* ─── Stat Cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6">
          {[
            { label: 'AUC-ROC', value: '0.997', unit: '', sub: '95% CI [0.935, 1.000]', icon: ShieldCheck, color: 'text-emerald-500' },
            { label: 'ADNI Cohort', value: '559', unit: '', sub: '330 CN + Dementia binary subset', icon: Database, color: 'text-slate-400' },
            { label: 'Multimodal Fusion', value: '544', unit: 'd', sub: '512d MRI + 32d Clinical MLP', icon: Layers, color: 'text-slate-400' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="eyebrow text-slate-400">{stat.label}</span>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#0a0a0a] font-mono tabular-nums leading-none">
                  {stat.value}
                  {stat.unit && <span className="text-xl text-slate-400 font-normal">{stat.unit}</span>}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">{stat.sub}</p>
              </div>
            );
          })}
        </div>

        {/* ─── Browser-window mockup ───────────────────────────────────── */}
        <div className="pb-16 sm:pb-20">
          <div className="rounded-2xl border border-gray-200 shadow-lg overflow-hidden bg-white">
            {/* Browser chrome */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="max-w-sm mx-auto bg-white border border-gray-200 rounded-full px-4 py-1 text-xs text-slate-400 font-mono text-center">
                  neurofusion.local / inference-demo
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-mono text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </div>
            </div>

            {/* Cards inside browser */}
            <div className="p-5 sm:p-6">
              <p className="text-[11px] text-slate-400 text-center mb-4 font-mono">
                ✦ Illustrative example — sample ADNI subject predictions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {ILLUSTRATIVE_CARDS.map((card, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl border p-4 ${
                      card.isPositive
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className={`text-xs font-semibold ${card.isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
                          {card.label}
                        </div>
                        <div className={`text-[10px] font-mono mt-0.5 ${card.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                          {card.tier}
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        card.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {card.shortLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ConfidenceRing value={card.confidence} isPositive={card.isPositive} />
                      <div>
                        <div className="text-[10px] text-slate-500 font-mono leading-relaxed">{card.detail}</div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Confidence: <span className="font-bold">{card.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
