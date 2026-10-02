import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, ReferenceLine, Cell
} from 'recharts';
import type { ResearchMetrics } from '../lib/types';
import { TrendingUp, Grid, Award } from 'lucide-react';

interface ResultsSectionProps {
  metrics: ResearchMetrics;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({ metrics }) => {
  const ablationChartData = metrics.ablation_study.map(a => ({
    name: a.features.length > 28 ? a.features.slice(0, 26) + '…' : a.features,
    auc: a.auc,
    fullName: a.features,
  }));

  const perClassData = metrics.per_class.map(c => ({
    class: c.class_name.replace('Cognitively Normal (CN)', 'CN').replace("Alzheimer's Disease", 'AD'),
    Precision: +(c.precision * 100).toFixed(1),
    Recall: +(c.recall * 100).toFixed(1),
    F1: +(c.f1_score * 100).toFixed(1),
    Support: c.support,
  }));

  const cm = metrics.confusion_matrix;

  // Ablation bar color: emerald = best, slate = mid, amber = weak
  const ablationColor = (auc: number) => {
    if (auc >= 0.99) return '#10b981'; // emerald
    if (auc >= 0.69) return '#64748b'; // slate
    return '#f59e0b';                  // amber
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-300 rounded-xl p-3.5 text-[13px] shadow-lg">
          <div className="font-bold text-[#0a0a0a] mb-1.5 max-w-[200px]">{label}</div>
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex justify-between gap-4 text-slate-700 font-medium">
              <span>{entry.name}:</span>
              <span className="font-mono font-bold text-[#0a0a0a]">{entry.value}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const AblationTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white border border-gray-300 rounded-xl p-3.5 text-[13px] shadow-lg max-w-[240px]">
          <div className="font-bold text-[#0a0a0a] mb-1">{d.fullName}</div>
          <div className="font-mono text-emerald-800 text-[16px] font-extrabold">AUC = {d.auc.toFixed(3)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <section id="results" className="py-16 sm:py-20 bg-[#f8f9fa] border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <p className="text-[13px] sm:text-[14px] font-semibold uppercase tracking-[0.06em] text-emerald-700 mb-2 font-mono">
            ADNI Test Set Results
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a0a0a] tracking-tight">
            Results &amp; Ablation Study
          </h2>
          <p className="mt-3 text-[16px] text-slate-600 leading-relaxed">
            Systematic feature attribution across five experimental conditions reveals that cognitive biomarkers dominate.
            The imaging contribution is rigorously quantified at AUC 0.699.
          </p>
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: 'AUC-ROC', value: '0.997', sub: '95% CI [0.935, 1.000]' },

            { label: 'Dementia Recall', value: '86.4%', sub: '19 of 22 identified' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="text-[13px] sm:text-[14px] font-semibold uppercase tracking-[0.06em] text-slate-600 mb-2">{stat.label}</div>
              <div className="text-[32px] sm:text-[36px] font-extrabold text-[#0a0a0a] font-mono tabular-nums leading-none">{stat.value}</div>
              <div className="text-[13px] sm:text-[14px] text-slate-600 font-medium mt-2">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 1. Ablation Study bar chart */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h3 className="text-[17px] font-bold text-[#0a0a0a] mb-1 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              Ablation Study: AUC-ROC by Feature Set
            </h3>
            <p className="text-[14px] text-slate-600 mb-5 font-medium">
              Systematic isolation of imaging vs clinical feature contributions on held-out ADNI test subjects.
            </p>
            <div aria-label="Ablation Study AUC Bar Chart" className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ablationChartData} layout="vertical" margin={{ left: 4, right: 24, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                  <XAxis type="number" domain={[0, 1]} tickFormatter={v => v.toFixed(2)} tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }} width={130} />
                  <Tooltip content={<AblationTooltip />} />
                  <ReferenceLine x={0.5} stroke="rgba(0,0,0,0.15)" strokeDasharray="4 4" />
                  <Bar dataKey="auc" radius={[0, 6, 6, 0]}>
                    {ablationChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ablationColor(entry.auc)} fillOpacity={0.9} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Per-class report */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h3 className="text-[17px] font-bold text-[#0a0a0a] mb-1 flex items-center gap-2">
              <Grid className="w-5 h-5 text-slate-600" />
              Per-Class Classification Report
            </h3>
            <p className="text-[14px] text-slate-600 mb-5 font-medium">
              CN n=70, Dementia n=22 subjects in held-out test split (stratified).
            </p>
            <div aria-label="Per-Class Performance Bar Chart" className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perClassData} margin={{ left: 4, right: 8, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                  <XAxis dataKey="class" tick={{ fill: '#334155', fontSize: 13, fontWeight: 600 }} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 13, color: '#475569', paddingTop: 8, fontWeight: 500 }} />
                  <Bar dataKey="Precision" fill="#0ea5e9" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Recall" fill="#10b981" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="F1" fill="#6366f1" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Confusion matrix */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h3 className="text-[17px] font-bold text-[#0a0a0a] mb-1 flex items-center gap-2">
              <Grid className="w-5 h-5 text-slate-500" />
              Confusion Matrix (Test Set, n=92)
            </h3>
            <p className="text-[14px] text-slate-600 mb-5 font-medium">
              MultimodalResNet predictions vs ground truth ADNI diagnoses.
            </p>
            <div className="flex justify-center items-center h-56">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 ml-28">
                  {cm.labels.map(l => (
                    <div key={l} className="w-32 text-center text-[14px] text-slate-700 font-bold truncate px-1">
                      Pred: {l.includes('Normal') ? 'CN' : 'Dementia'}
                    </div>
                  ))}
                </div>
                {cm.matrix.map((row, ri) => (
                  <div key={ri} className="flex items-center gap-2">
                    <div className="w-28 text-right text-[14px] text-slate-700 font-bold pr-2 truncate">
                      True: {cm.labels[ri].includes('Normal') ? 'CN' : 'Dementia'}
                    </div>
                    {row.map((val, ci) => {
                      const isCorrect = ri === ci;
                      const pct = (val / cm.total * 100).toFixed(1);
                      return (
                        <div
                          key={ci}
                          className={`w-32 h-16 flex flex-col items-center justify-center rounded-2xl border font-mono transition-all ${
                            isCorrect
                              ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900 shadow-sm'
                              : val === 0
                              ? 'bg-gray-50 border-gray-200 text-slate-400'
                              : 'bg-red-100/70 border-red-300 text-red-900 shadow-sm'
                          }`}
                        >
                          <span className="text-2xl font-extrabold">{val}</span>
                          <span className="text-[12px] font-bold opacity-80">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-center gap-6 text-[13px] text-slate-700 font-mono font-medium">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-emerald-200 border border-emerald-300" />
                <span>True Positive</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-red-200 border border-red-300" />
                <span>Misclassification</span>
              </div>
            </div>
          </div>

          {/* 4. ROC Curve */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h3 className="text-[17px] font-bold text-[#0a0a0a] mb-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              ROC Curve Comparison (Ablation Conditions)
            </h3>
            <p className="text-[14px] text-slate-600 mb-5 font-medium">
              True Positive Rate vs. False Positive Rate across all five experimental conditions.
            </p>
            <div aria-label="ROC Curve Chart" className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.roc_curves} margin={{ left: 4, right: 8, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="fpr" tickFormatter={v => v.toFixed(1)} tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                    label={{ value: 'FPR', position: 'insideBottomRight', fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                  <YAxis domain={[0, 1]} tickFormatter={v => v.toFixed(1)} tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                    label={{ value: 'TPR', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 12, fontSize: 13, color: '#0a0a0a', fontWeight: 500 }} />
                  <ReferenceLine x={0} y={0} stroke="rgba(0,0,0,0.12)" />
                  <Line type="monotone" dataKey="mri_only_bin" name="MRI Only (binary)" stroke="#f59e0b" dot={false} strokeWidth={2} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="mri_only_3c" name="MRI Only (3-class)" stroke="#fb923c" dot={false} strokeWidth={2} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="mri_demog" name="MRI + Demographics" stroke="#64748b" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="multimodal" name="Full Multimodal" stroke="#10b981" dot={false} strokeWidth={3} />
                  <Line type="monotone" dataKey="clinical_only" name="Clinical Scores Only" stroke="#0a0a0a" dot={false} strokeWidth={2} strokeDasharray="6 2" />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#475569', paddingTop: 8, fontWeight: 500 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
