import React from 'react';
import { Activity, Database, Sparkles, ArrowRight } from 'lucide-react';

export const ArchitectureSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Preprocess',
      icon: Activity,
      description: 'NIfTI T1 MPRAGE volume is standardized to RAS orientation, intensity-normalized, and trilinearly resampled to a 128×128×128 voxel grid.',
    },
    {
      num: '02',
      title: 'Fuse',
      icon: Sparkles,
      description: 'MedicalNet ResNet-10 extracts a 512-dim volumetric embedding. A parallel 2-layer clinical MLP encodes MMSE, CDRSB, age, sex, and education into 32 dimensions. Both streams are concatenated into a 544-dim fused vector.',
    },
    {
      num: '03',
      title: 'Classify',
      icon: Database,
      description: 'A fully-connected classification head (544→128→2) with ReLU + Dropout(0.3) outputs softmax probabilities for Cognitively Normal (CN) vs Alzheimer\'s Disease.',
    },
  ];

  return (
    <section id="architecture" className="py-16 sm:py-24 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="mb-14 text-center max-w-2xl mx-auto">
          <p className="eyebrow text-slate-400 mb-2">Dual-Stream Multimodal Architecture</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a0a0a] tracking-tight">
            How NeuroFusion works
          </h2>
          <p className="mt-3 text-sm text-slate-500 leading-relaxed">
            Parallel volumetric and clinical encoders extract independent representations, concatenated
            into a 544-dimensional latent embedding for binary classification.
          </p>
        </div>

        {/* Numbered steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0a0a0a] text-white flex items-center justify-center font-mono text-sm font-bold shrink-0">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0a0a0a] mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Architecture diagram — light-themed cards */}
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Dual Input Streams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Stream 1: 3D MRI */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0a0a0a]">Stream 1: Volumetric 3D MRI</h3>
                    <p className="text-[11px] text-slate-400 font-mono">1 × 128 × 128 × 128 Voxels</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                  Pretrained Med3D
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { step: 'Input Tensor', spec: '1 × 128³ (RAS Voxel Grid)' },
                  { step: 'Backbone', spec: 'MedicalNet ResNet-10 (4 Residual Stages)' },
                  { step: 'Convolution', spec: 'Conv3d(7×7×7, stride=2) + MaxPool3d' },
                  { step: 'Pooling', spec: 'AdaptiveAvgPool3d(1,1,1) + Flatten' },
                  { step: 'Stream Embedding', spec: '512-Dimensional Latent Vector' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 text-[11px] font-mono">
                    <span className="text-slate-500">{item.step}</span>
                    <span className="text-emerald-700 font-semibold">{item.spec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stream 2: Clinical */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0a0a0a]">Stream 2: Clinical Biomarkers</h3>
                    <p className="text-[11px] text-slate-400 font-mono">5 Clinical Features</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
                  Clinical MLP
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { step: 'Input Vector', spec: '[MMSE, CDRSB, Age, Sex, Education]' },
                  { step: 'Dense Layer 1', spec: 'Linear(5 → 32) + ReLU' },
                  { step: 'Dense Layer 2', spec: 'Linear(32 → 32)' },
                  { step: 'Feature Dim', spec: '32-Dimensional Latent Vector' },
                  { step: 'Attributes', spec: 'Continuous & Binary Patient Scales' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 text-[11px] font-mono">
                    <span className="text-slate-500">{item.step}</span>
                    <span className="text-slate-700 font-semibold">{item.spec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Flow connector */}
          <div className="py-2 flex items-center justify-center">
            <svg className="w-full max-w-lg h-16 overflow-visible" viewBox="0 0 400 60" fill="none">
              <path d="M 100 0 C 100 30, 200 30, 200 60" stroke="#10b981" strokeWidth="2" strokeDasharray="6 4" className="opacity-60 animate-pulse" />
              <path d="M 300 0 C 300 30, 200 30, 200 60" stroke="#64748b" strokeWidth="2" strokeDasharray="6 4" className="opacity-60 animate-pulse" />
              <circle cx="200" cy="50" r="5" fill="#0a0a0a" className="opacity-80" />
            </svg>
          </div>

          {/* Concatenation bottleneck */}
          <div className="bg-[#0a0a0a] rounded-2xl p-5 text-center max-w-xl mx-auto shadow-lg">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-mono font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Late Multimodal Concatenation
            </div>
            <div className="text-2xl font-extrabold text-white font-mono tracking-tight tabular-nums">
              512<span className="text-emerald-400 text-sm">d (MRI)</span>
              {' '}+{' '}
              32<span className="text-slate-400 text-sm">d (Clinical)</span>
              {' '}={' '}
              <span className="text-emerald-400">544</span>
              <span className="text-white text-sm">d Fused Vector</span>
            </div>
          </div>

          {/* Classification head */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="eyebrow text-slate-400">Classification Head Pipeline</span>
              <span className="text-[11px] font-mono text-slate-400">Cross-Entropy Loss</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                { label: 'FC Layer 1', value: '544 → 128', sub: 'Linear Projection', color: 'text-[#0a0a0a]' },
                { label: 'Activation', value: 'ReLU', sub: 'Non-Linearity', color: 'text-emerald-600' },
                { label: 'Regularization', value: 'Dropout(0.3)', sub: 'Overfitting Guard', color: 'text-slate-600' },
                { label: 'Output Layer', value: 'Linear(128→2)', sub: 'Softmax Probabilities', color: 'text-emerald-600' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="text-[10px] uppercase font-mono text-slate-400">{item.label}</div>
                  <div className={`text-sm font-bold font-mono mt-0.5 ${item.color}`}>{item.value}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Output classes */}
          <div className="flex justify-center gap-4 pt-2">
            <div className="px-6 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Cognitively Normal (CN)
            </div>
            <div className="px-6 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Alzheimer's Disease
            </div>
          </div>

          {/* Arrow below */}
          <div className="flex justify-center pt-1">
            <ArrowRight className="w-5 h-5 text-slate-300 rotate-90" />
          </div>

        </div>
      </div>
    </section>
  );
};
