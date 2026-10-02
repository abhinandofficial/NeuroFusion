import React, { useState, useEffect, useMemo } from 'react';
import { Network, Eye, Filter, Info, MapPin } from 'lucide-react';
import type { RepresentationResponse, RepresentationPoint, ClinicalFormValues } from '../../lib/types';
import { getRepresentationPoints } from '../../lib/api';

interface RepresentationMapProps {
  clinicalValues?: ClinicalFormValues;
  currentPatientCoords?: { pca_x: number; pca_y: number; umap_x: number; umap_y: number };
}

export const RepresentationMap: React.FC<RepresentationMapProps> = ({
  clinicalValues,
  currentPatientCoords: propCoords,
}) => {
  const [data, setData] = useState<RepresentationResponse | null>(null);
  const [projection, setProjection] = useState<'umap' | 'pca'>('umap');
  const [splitFilter, setSplitFilter] = useState<'all' | 'test' | 'train_val'>('all');
  const [hoveredPoint, setHoveredPoint] = useState<RepresentationPoint | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    getRepresentationPoints(clinicalValues)
      .then((res) => {
        setData(res);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to load representation points:', err);
        setIsLoading(false);
      });
  }, [
    clinicalValues?.mmse,
    clinicalValues?.cdrsb,
    clinicalValues?.age,
    clinicalValues?.sex,
    clinicalValues?.education
  ]);

  const activePatientCoords = propCoords || data?.current_patient_coords;

  // Filter points based on split
  const filteredPoints = useMemo(() => {
    if (!data?.points) return [];
    if (splitFilter === 'all') return data.points;
    if (splitFilter === 'test') return data.points.filter((p) => p.split === 'test');
    return data.points.filter((p) => p.split === 'train' || p.split === 'val');
  }, [data?.points, splitFilter]);

  // Compute SVG plot bounds
  const { minX, maxX, minY, maxY } = useMemo(() => {
    if (!data?.points || data.points.length === 0) {
      return { minX: -10, maxX: 10, minY: -10, maxY: 10 };
    }
    const isUmap = projection === 'umap';
    const xs = data.points.map((p) => (isUmap ? p.umap_x : p.pca_x));
    const ys = data.points.map((p) => (isUmap ? p.umap_y : p.pca_y));

    if (activePatientCoords) {
      xs.push(isUmap ? activePatientCoords.umap_x : activePatientCoords.pca_x);
      ys.push(isUmap ? activePatientCoords.umap_y : activePatientCoords.pca_y);
    }

    const padX = (Math.max(...xs) - Math.min(...xs)) * 0.15 || 2.0;
    const padY = (Math.max(...ys) - Math.min(...ys)) * 0.15 || 2.0;

    return {
      minX: Math.min(...xs) - padX,
      maxX: Math.max(...xs) + padX,
      minY: Math.min(...ys) - padY,
      maxY: Math.max(...ys) + padY,
    };
  }, [data?.points, projection, activePatientCoords]);

  const mapToSvg = (x: number, y: number, width: number = 600, height: number = 360) => {
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const px = ((x - minX) / rangeX) * (width - 40) + 20;
    // Invert Y for SVG coordinates
    const py = height - (((y - minY) / rangeY) * (height - 40) + 20);
    return { px, py };
  };

  const metrics = projection === 'umap' ? data?.separation_metrics.umap : data?.separation_metrics.pca;

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-200 shadow-sm space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="space-y-1">
          <div className="text-[13px] sm:text-[14px] font-semibold uppercase tracking-[0.06em] text-slate-600 flex items-center gap-1.5">
            <Network className="w-4 h-4 text-emerald-600" />
            <span>Latent Representation Clustering</span>
          </div>
          <h3 className="text-[20px] sm:text-[24px] font-bold text-[#0a0a0a] tracking-tight">
            Cohort Manifold &amp; Patient Location
          </h3>
          <p className="text-[14px] text-slate-600">
            544-dimensional multimodal embeddings (512d 3D MRI + 32d clinical) projected to 2D manifold space.
          </p>
        </div>

        {/* Projection & Split Toggle Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* UMAP vs PCA */}
          <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200 text-[13px] font-medium">
            <button
              onClick={() => setProjection('umap')}
              className={`px-3 py-1 rounded-lg transition-colors font-semibold ${
                projection === 'umap'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              UMAP 2D
            </button>
            <button
              onClick={() => setProjection('pca')}
              className={`px-3 py-1 rounded-lg transition-colors font-semibold ${
                projection === 'pca'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PCA 2D
            </button>
          </div>

          {/* Split Filter */}
          <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200 text-[12px] font-medium">
            <button
              onClick={() => setSplitFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                splitFilter === 'all'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Cohort (183)
            </button>
            <button
              onClick={() => setSplitFilter('test')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                splitFilter === 'test'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Held-Out Test (92)
            </button>
            <button
              onClick={() => setSplitFilter('train_val')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                splitFilter === 'train_val'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Train/Val Ref (91)
            </button>
          </div>
        </div>
      </div>

      {/* Main Scatter Plot Visualizer */}
      <div className="relative w-full h-[360px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
        {isLoading ? (
          <div className="text-slate-400 font-mono text-sm flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            Projecting multimodal embeddings...
          </div>
        ) : (
          <svg className="w-full h-full cursor-crosshair select-none" viewBox="0 0 600 360">
            {/* Grid Lines */}
            <line x1="30" y1="180" x2="570" y2="180" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="300" y1="20" x2="300" y2="340" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />

            {/* Cohort Points */}
            {filteredPoints.map((pt) => {
              const xVal = projection === 'umap' ? pt.umap_x : pt.pca_x;
              const yVal = projection === 'umap' ? pt.umap_y : pt.pca_y;
              const { px, py } = mapToSvg(xVal, yVal);
              const isDementia = pt.diagnosis === 'Dementia';
              const isTest = pt.split === 'test';

              return (
                <circle
                  key={pt.id}
                  cx={px}
                  cy={py}
                  r={isTest ? 4.5 : 3.5}
                  className={`transition-all duration-200 cursor-pointer ${
                    isDementia
                      ? 'fill-rose-500 hover:fill-rose-300 stroke-rose-900'
                      : 'fill-emerald-500 hover:fill-emerald-300 stroke-emerald-900'
                  }`}
                  strokeWidth={isTest ? '1.5' : '0.5'}
                  opacity={hoveredPoint && hoveredPoint.id !== pt.id ? 0.35 : 0.85}
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}

            {/* Active Current Patient Reticle */}
            {activePatientCoords && (() => {
              const curX = projection === 'umap' ? activePatientCoords.umap_x : activePatientCoords.pca_x;
              const curY = projection === 'umap' ? activePatientCoords.umap_y : activePatientCoords.pca_y;
              const { px, py } = mapToSvg(curX, curY);

              return (
                <g className="cursor-pointer">
                  {/* Pulsing Outer Ring */}
                  <circle
                    cx={px}
                    cy={py}
                    r="14"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    className="animate-ping opacity-75 origin-center"
                  />
                  {/* Static Reticle Ring */}
                  <circle
                    cx={px}
                    cy={py}
                    r="9"
                    fill="#0284c7"
                    fillOpacity="0.4"
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />
                  {/* Center Dot */}
                  <circle cx={px} cy={py} r="3.5" fill="#ffffff" />
                  {/* Label */}
                  <text
                    x={px}
                    y={py - 16}
                    textAnchor="middle"
                    fill="#38bdf8"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    CURRENT PATIENT
                  </text>
                </g>
              );
            })()}
          </svg>
        )}

        {/* Legend Overlay */}
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-[12px] font-medium text-slate-300 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Cognitively Normal (CN)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Alzheimer's Disease</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-sky-400">
            <MapPin className="w-3.5 h-3.5" />
            <span>Active Patient</span>
          </div>
        </div>

        {/* Hovered Point Tooltip */}
        {hoveredPoint && (
          <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700 text-[12px] font-mono text-slate-200 shadow-xl space-y-0.5">
            <div className="font-bold text-white flex items-center justify-between gap-4">
              <span>{hoveredPoint.id}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                hoveredPoint.diagnosis === 'CN' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
              }`}>
                {hoveredPoint.diagnosis} ({hoveredPoint.split})
              </span>
            </div>
            <div>MMSE: <span className="text-white font-bold">{hoveredPoint.mmse}</span> • CDRSB: <span className="text-white font-bold">{hoveredPoint.cdrsb}</span></div>
            <div>Age: {hoveredPoint.age} • Sex: {hoveredPoint.sex} • Edu: {hoveredPoint.education}y</div>
            <div className="text-[11px] text-slate-400 pt-0.5">
              Coord: ({projection === 'umap' ? hoveredPoint.umap_x : hoveredPoint.pca_x}, {projection === 'umap' ? hoveredPoint.umap_y : hoveredPoint.pca_y})
            </div>
          </div>
        )}
      </div>

      {/* Separation Metrics & Generalization Gap Table */}
      {metrics && (
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2 text-[14px]">
            <div className="font-bold text-[#0a0a0a] flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-700" />
              <span>Manifold Separation Metrics ({projection.toUpperCase()})</span>
            </div>
            <span className="text-[12px] text-slate-500">
              Evaluated on Reference Cohort (n=91) vs Held-Out Test (n=92)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center text-[12px] sm:text-[13px]">
            <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
              <div className="text-slate-500 font-medium">Silhouette Score</div>
              <div className="font-mono font-bold text-slate-900 text-[15px]">
                {metrics.silhouette_score.test.toFixed(3)}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Train/Val: {metrics.silhouette_score.train_val.toFixed(3)}
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
              <div className="text-slate-500 font-medium">5-NN Accuracy</div>
              <div className="font-mono font-bold text-slate-900 text-[15px]">
                {(metrics.knn_5_accuracy.test * 100).toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Train/Val: {(metrics.knn_5_accuracy.train_val * 100).toFixed(1)}%
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
              <div className="text-slate-500 font-medium">Linear Probe AUC</div>
              <div className="font-mono font-bold text-slate-900 text-[15px]">
                {metrics.linear_probe_auc.test.toFixed(3)}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Train/Val: {metrics.linear_probe_auc.train_val.toFixed(3)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
