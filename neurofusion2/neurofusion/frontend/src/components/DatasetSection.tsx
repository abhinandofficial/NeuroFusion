import React from 'react';
import type { ResearchMetrics } from '../lib/types';
import { Database, ExternalLink } from 'lucide-react';

interface DatasetSectionProps {
  metrics: ResearchMetrics;
}

const TECH_BADGES = [
  { name: 'Python 3.12', cls: 'bg-blue-50 border-blue-200 text-blue-700' },
  { name: 'PyTorch 2.x', cls: 'bg-orange-50 border-orange-200 text-orange-700' },
  { name: 'MONAI', cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { name: 'MedicalNet', cls: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { name: 'FastAPI', cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { name: 'React + Vite', cls: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  { name: 'TypeScript', cls: 'bg-blue-50 border-blue-200 text-blue-700' },
  { name: 'Tailwind CSS', cls: 'bg-sky-50 border-sky-200 text-sky-700' },
  { name: 'three.js / R3F', cls: 'bg-slate-100 border-slate-200 text-slate-700' },
  { name: 'Recharts', cls: 'bg-purple-50 border-purple-200 text-purple-700' },
  { name: 'nibabel', cls: 'bg-gray-100 border-gray-200 text-gray-700' },
  { name: 'scikit-learn', cls: 'bg-amber-50 border-amber-200 text-amber-700' },
  { name: 'ADNI Dataset', cls: 'bg-red-50 border-red-200 text-red-700' },
];

export const DatasetSection: React.FC<DatasetSectionProps> = ({ metrics }) => {
  const ds = metrics.dataset_info;
  const dataRows = Object.entries(ds);

  return (
    <section id="dataset" className="py-16 sm:py-20 bg-[#f8f9fa] border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* Header */}
          <div className="text-center">
            <p className="eyebrow text-slate-400 mb-2 flex items-center justify-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              ADNI — Alzheimer's Disease Neuroimaging Initiative
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a0a0a] tracking-tight">
              Dataset &amp; Tech Stack
            </h2>
          </div>

          {/* Dataset specifications table */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-[#0a0a0a]">ADNI1 Dataset Specifications</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {dataRows.map(([key, value]) => (
                <div key={key} className="grid grid-cols-2 px-5 py-3 text-xs hover:bg-gray-50 transition-colors">
                  <span className="text-slate-500 font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-[#0a0a0a] font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tech stack badges */}
          <div>
            <h3 className="text-sm font-bold text-[#0a0a0a] mb-4">Technology Stack</h3>
            <div className="flex flex-wrap gap-2">
              {TECH_BADGES.map((tech) => (
                <span
                  key={tech.name}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-medium border ${tech.cls}`}
                >
                  {tech.name}
                </span>
              ))}
            </div>
          </div>

          {/* Citations */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#0a0a0a]">Citations</h3>
            {[
              {
                title: 'ADNI Dataset',
                body: "Data used in preparation of this article were obtained from the Alzheimer's Disease Neuroimaging Initiative (ADNI) database (adni.loni.usc.edu). The ADNI was launched in 2003 as a public-private partnership, led by Principal Investigator Michael W. Weiner, MD.",
              },
              {
                title: 'MedicalNet / Med3D',
                body: 'Chen, S., Ma, K., & Zheng, Y. (2019). Med3D: Transfer Learning for 3D Medical Image Analysis. arXiv:1904.00625.',
              },
            ].map((cite, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 text-xs text-slate-500 leading-relaxed shadow-sm">
                <div className="font-bold text-[#0a0a0a] mb-1">{cite.title}</div>
                {cite.body}
              </div>
            ))}
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-3">
            <a
              href="https://adni.loni.usc.edu"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-gray-200 text-sm font-medium text-slate-600 hover:border-emerald-400 hover:text-emerald-700 transition-colors shadow-sm"
            >
              <Database className="w-4 h-4" />
              ADNI Database
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>
      </div>
    </section>
  );
};
