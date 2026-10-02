import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Crosshair, RotateCcw, Scan, Box, Grid, Columns } from 'lucide-react';
import type { SliceData } from '../../lib/types';

// Lazy load 3D Demo Brain for bundle splitting and fast initial paint
const DemoBrainCanvas = lazy(() => import('../brain3d/DemoBrainCanvas'));

function colormapRGB(val: number, cmap: 'turbo' | 'jet' | 'hot' | 'inferno'): [number, number, number] {
  val = Math.max(0, Math.min(1, val));
  if (cmap === 'hot') {
    if (val < 0.33) return [Math.round((val / 0.33) * 255), 0, 0];
    if (val < 0.66) return [255, Math.round(((val - 0.33) / 0.33) * 255), 0];
    return [255, 255, Math.round(((val - 0.66) / 0.34) * 255)];
  }
  if (cmap === 'jet') {
    const r = Math.max(0, Math.min(1, 1.5 - Math.abs(val * 4 - 3)));
    const g = Math.max(0, Math.min(1, 1.5 - Math.abs(val * 4 - 2)));
    const b = Math.max(0, Math.min(1, 1.5 - Math.abs(val * 4 - 1)));
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
  if (cmap === 'inferno') {
    const r = Math.round(255 * Math.min(1, Math.max(0, 1.3 * val)));
    const g = Math.round(255 * Math.min(1, Math.max(0, val * val * 1.5)));
    const b = Math.round(255 * Math.min(1, Math.max(0, Math.sin(val * Math.PI))));
    return [r, g, b];
  }
  // Turbo colormap approximation
  const r = Math.round(255 * Math.sin(val * Math.PI * 0.9 + 0.1));
  const g = Math.round(255 * Math.sin(val * Math.PI * 0.8 + 0.3));
  const b = Math.round(255 * Math.cos(val * Math.PI * 0.9));
  return [Math.max(0, r), Math.max(0, g), Math.max(0, b)];
}

interface SliceCanvasOverlayProps {
  plane: 'axial' | 'coronal' | 'sagittal';
  sliceIdx: number;
  heatmapVolume?: { data: Float32Array; shape: [number, number, number] } | null;
  opacity: number;
  colormap: 'turbo' | 'jet' | 'hot' | 'inferno';
  showHeatmap: boolean;
}

const SliceCanvasOverlay: React.FC<SliceCanvasOverlayProps> = ({
  plane,
  sliceIdx,
  heatmapVolume,
  opacity,
  colormap,
  showHeatmap
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !heatmapVolume || !showHeatmap || opacity <= 0) return;

    const [D, H, W] = heatmapVolume.shape;
    const { data } = heatmapVolume;

    let width = W;
    let height = H;
    if (plane === 'coronal') { width = W; height = D; }
    if (plane === 'sagittal') { width = H; height = D; }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.createImageData(width, height);
    const buf = imgData.data;

    const clampedIdx = Math.max(0, Math.min(sliceIdx, (plane === 'axial' ? D : (plane === 'coronal' ? H : W)) - 1));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let val = 0;
        if (plane === 'axial') {
          val = data[clampedIdx * H * W + y * W + x] || 0;
        } else if (plane === 'coronal') {
          const z = height - 1 - y;
          val = data[z * H * W + clampedIdx * W + x] || 0;
        } else if (plane === 'sagittal') {
          const z = height - 1 - y;
          val = data[z * H * W + x * W + clampedIdx] || 0;
        }

        const pixelOffset = (y * width + x) * 4;
        if (val > 0.04) {
          const [r, g, b] = colormapRGB(val, colormap);
          buf[pixelOffset] = r;
          buf[pixelOffset + 1] = g;
          buf[pixelOffset + 2] = b;
          buf[pixelOffset + 3] = Math.round(opacity * 255 * Math.min(1.0, val * 1.5));
        } else {
          buf[pixelOffset + 3] = 0;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [plane, sliceIdx, heatmapVolume, opacity, colormap, showHeatmap]);

  if (!showHeatmap || !heatmapVolume || opacity <= 0) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-5 mix-blend-screen"
    />
  );
};

interface MriViewerProps {
  slices: SliceData | null;
  onSliceChange: (plane: 'axial' | 'coronal' | 'sagittal', value: number) => void;
  heatmapVolume?: { data: Float32Array; shape: [number, number, number] } | null;
  heatmapOpacity?: number;
  heatmapColormap?: 'turbo' | 'jet' | 'hot' | 'inferno';
  showHeatmap?: boolean;
}

export const MriViewer: React.FC<MriViewerProps> = ({
  slices,
  onSliceChange,
  heatmapVolume,
  heatmapOpacity = 0.65,
  heatmapColormap = 'turbo',
  showHeatmap = true,
}) => {
  const [showCrosshairs, setShowCrosshairs] = useState(true);
  const [viewMode, setViewMode] = useState<'multi' | 'quad' | '3d'>('multi');

  // Local slice state for fast sliding responsiveness
  const [axialVal, setAxialVal] = useState<number>(64);
  const [coronalVal, setCoronalVal] = useState<number>(64);
  const [sagittalVal, setSagittalVal] = useState<number>(64);

  useEffect(() => {
    if (slices?.current_slices) {
      setAxialVal(slices.current_slices.axial);
      setCoronalVal(slices.current_slices.coronal);
      setSagittalVal(slices.current_slices.sagittal);
    }
  }, [slices]);

  const handleSliderChange = (plane: 'axial' | 'coronal' | 'sagittal', val: number) => {
    if (plane === 'axial') setAxialVal(val);
    if (plane === 'coronal') setCoronalVal(val);
    if (plane === 'sagittal') setSagittalVal(val);
    onSliceChange(plane, val);
  };

  const resetToCenter = () => {
    const defaultCenter = 64;
    setAxialVal(defaultCenter);
    setCoronalVal(defaultCenter);
    setSagittalVal(defaultCenter);
    onSliceChange('axial', defaultCenter);
    onSliceChange('coronal', defaultCenter);
    onSliceChange('sagittal', defaultCenter);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 flex flex-col h-full shadow-sm relative overflow-hidden">
      {/* Viewer Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-gray-100 mb-4 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gray-100 text-slate-800">
            <Scan className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[17px] sm:text-[18px] font-bold text-[#0a0a0a] tracking-tight flex items-center gap-2">
              <span>Multi-Planar &amp; 3D Reconstruction</span>
              <span className="text-[12px] font-mono px-2 py-0.5 rounded-full bg-gray-100 border border-gray-300 text-slate-700 font-bold">
                128³ RAS
              </span>
            </h3>
            <p className="text-[14px] text-slate-600 font-medium mt-0.5">
              Synchronized 3-Plane Orthogonal Projection &amp; 3D Volume Mesh
            </p>
          </div>
        </div>

        {/* View Switcher Tabs & Controls */}
        <div className="flex items-center gap-2">
          {/* View Mode Chips (>= 40px tall, 15px font, 18px icons) */}
          <div className="bg-gray-100 border border-gray-200 p-1 rounded-full flex items-center text-[15px] font-medium">
            <button
              type="button"
              onClick={() => setViewMode('multi')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-2 font-semibold ${
                viewMode === 'multi'
                  ? 'bg-[#0a0a0a] text-white shadow-sm'
                  : 'text-slate-600 hover:text-black hover:bg-gray-200/60'
              }`}
              title="3-Plane Orthogonal View"
            >
              <Columns className="w-[18px] h-[18px]" />
              <span>3-Plane</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('quad')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-2 font-semibold ${
                viewMode === 'quad'
                  ? 'bg-[#0a0a0a] text-white shadow-sm'
                  : 'text-slate-600 hover:text-black hover:bg-gray-200/60'
              }`}
              title="Quad View: 2D Planes + 3D Brain"
            >
              <Grid className="w-[18px] h-[18px]" />
              <span>Quad View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-2 font-semibold ${
                viewMode === '3d'
                  ? 'bg-[#0a0a0a] text-white shadow-sm'
                  : 'text-slate-600 hover:text-black hover:bg-gray-200/60'
              }`}
              title="Interactive 3D Brain Surface & Volume"
            >
              <Box className="w-[18px] h-[18px]" />
              <span>3D Brain</span>
            </button>
          </div>

          {/* Crosshairs & Center */}
          <button
            type="button"
            onClick={() => setShowCrosshairs(!showCrosshairs)}
            className={`min-h-[40px] px-3 rounded-full text-xs transition-colors flex items-center gap-1.5 border ${
              showCrosshairs
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                : 'bg-white text-slate-600 border-gray-300 hover:text-slate-900 hover:bg-gray-50'
            }`}
            title="Toggle Crosshairs"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={resetToCenter}
            disabled={!slices}
            className="min-h-[40px] px-3 rounded-full text-slate-600 hover:text-slate-900 hover:bg-gray-100 border border-gray-300 transition-colors text-xs flex items-center gap-1.5 disabled:opacity-40"
            title="Reset slices to volume center (64, 64, 64)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Display Area */}
      {!slices && viewMode !== '3d' ? (
        <div className="flex-1 min-h-[360px] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50/80 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-slate-500 mb-3.5">
            <Scan className="w-7 h-7" />
          </div>
          <h4 className="text-[20px] font-bold text-[#0a0a0a] mb-1.5">No MRI Volume Loaded</h4>
          <p className="text-[16px] text-slate-600 max-w-md leading-relaxed">
            Upload an ADNI NIfTI scan or click a sample patient on the left to activate 3-plane interactive slicing and 3D reconstruction.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between gap-3.5">
          {/* VIEW MODE 1: Standard 3-Plane View */}
          {viewMode === 'multi' && slices && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Axial Plane */}
              <div className="relative bg-black rounded-2xl overflow-hidden border border-gray-900 group shadow-inner">
                <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-md bg-black/90 border border-gray-800 text-[13px] sm:text-[14px] font-mono font-semibold text-cyan-300 shadow">
                  Axial (Z: {axialVal})
                </div>
                <div className="absolute top-2.5 right-2.5 z-10 text-[12px] font-mono font-bold text-slate-400 bg-black/80 px-1.5 py-0.5 rounded">A</div>
                <div className="absolute bottom-2.5 right-2.5 z-10 text-[12px] font-mono font-bold text-slate-400 bg-black/80 px-1.5 py-0.5 rounded">P</div>
                <div className="absolute top-1/2 left-2.5 -translate-y-1/2 z-10 text-[12px] font-mono font-bold text-slate-400 bg-black/80 px-1 py-0.5 rounded">R</div>
                <div className="absolute top-1/2 right-2.5 -translate-y-1/2 z-10 text-[12px] font-mono font-bold text-slate-400 bg-black/80 px-1 py-0.5 rounded">L</div>

                <div className="aspect-square relative flex items-center justify-center bg-black">
                  <img src={slices.axial} alt="Axial MRI Slice" className="w-full h-full object-contain filter contrast-125 select-none" />
                  <SliceCanvasOverlay
                    plane="axial"
                    sliceIdx={axialVal}
                    heatmapVolume={heatmapVolume}
                    opacity={heatmapOpacity}
                    colormap={heatmapColormap}
                    showHeatmap={showHeatmap}
                  />
                  {showCrosshairs && (
                    <div className="absolute inset-0 pointer-events-none z-10">
                      <div className="absolute top-0 bottom-0 border-l-2 border-cyan-400/60" style={{ left: `${(sagittalVal / 128) * 100}%` }} />
                      <div className="absolute left-0 right-0 border-t-2 border-cyan-400/60" style={{ top: `${(coronalVal / 128) * 100}%` }} />
                    </div>
                  )}
                </div>
                <div className="p-2.5 bg-gray-950 border-t border-gray-900">
                  <input type="range" min="0" max="127" value={axialVal} onChange={(e) => handleSliderChange('axial', parseInt(e.target.value))} className="w-full h-2 bg-gray-800 rounded appearance-none cursor-pointer accent-cyan-400" />
                </div>
              </div>

              {/* Coronal Plane */}
              <div className="relative bg-black rounded-2xl overflow-hidden border border-gray-900 group shadow-inner">
                <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-md bg-black/90 border border-gray-800 text-[13px] sm:text-[14px] font-mono font-semibold text-teal-300 shadow">
                  Coronal (Y: {coronalVal})
                </div>
                <div className="absolute top-2.5 right-2.5 z-10 text-[12px] font-mono font-bold text-slate-400 bg-black/80 px-1.5 py-0.5 rounded">S</div>
                <div className="absolute bottom-2.5 right-2.5 z-10 text-[12px] font-mono font-bold text-slate-400 bg-black/80 px-1.5 py-0.5 rounded">I</div>
                <div className="absolute top-1/2 left-2.5 -translate-y-1/2 z-10 text-[12px] font-mono font-bold text-slate-400 bg-black/80 px-1 py-0.5 rounded">R</div>
                <div className="absolute top-1/2 right-2.5 -translate-y-1/2 z-10 text-[12px] font-mono font-bold text-slate-400 bg-black/80 px-1 py-0.5 rounded">L</div>

                <div className="aspect-square relative flex items-center justify-center bg-black">
                  <img src={slices.coronal} alt="Coronal MRI Slice" className="w-full h-full object-contain filter contrast-125 select-none" />
                  <SliceCanvasOverlay
                    plane="coronal"
                    sliceIdx={coronalVal}
                    heatmapVolume={heatmapVolume}
                    opacity={heatmapOpacity}
                    colormap={heatmapColormap}
                    showHeatmap={showHeatmap}
                  />
                  {showCrosshairs && (
                    <div className="absolute inset-0 pointer-events-none z-10">
                      <div className="absolute top-0 bottom-0 border-l-2 border-teal-400/60" style={{ left: `${(sagittalVal / 128) * 100}%` }} />
                      <div className="absolute left-0 right-0 border-t-2 border-teal-400/60" style={{ top: `${(100 - (axialVal / 128) * 100)}%` }} />
                    </div>
                  )}
                </div>
                <div className="p-2.5 bg-gray-950 border-t border-gray-900">
                  <input type="range" min="0" max="127" value={coronalVal} onChange={(e) => handleSliderChange('coronal', parseInt(e.target.value))} className="w-full h-2 bg-gray-800 rounded appearance-none cursor-pointer accent-teal-400" />
                </div>
              </div>

              {/* Sagittal Plane */}
              <div className="relative bg-black rounded-2xl overflow-hidden border border-gray-900 group shadow-inner">
                <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-md bg-black/90 border border-gray-800 text-[13px] sm:text-[14px] font-mono font-semibold text-indigo-300 shadow">
                  Sagittal (X: {sagittalVal})
                </div>
                <div className="absolute top-2.5 right-2.5 z-10 text-[12px] font-mono font-bold text-slate-400 bg-black/80 px-1.5 py-0.5 rounded">S</div>
                <div className="absolute bottom-2.5 right-2.5 z-10 text-[12px] font-mono font-bold text-slate-400 bg-black/80 px-1.5 py-0.5 rounded">I</div>
                <div className="absolute top-1/2 left-2.5 -translate-y-1/2 z-10 text-[12px] font-mono font-bold text-slate-400 bg-black/80 px-1 py-0.5 rounded">A</div>
                <div className="absolute top-1/2 right-2.5 -translate-y-1/2 z-10 text-[12px] font-mono font-bold text-slate-400 bg-black/80 px-1 py-0.5 rounded">P</div>

                <div className="aspect-square relative flex items-center justify-center bg-black">
                  <img src={slices.sagittal} alt="Sagittal MRI Slice" className="w-full h-full object-contain filter contrast-125 select-none" />
                  <SliceCanvasOverlay
                    plane="sagittal"
                    sliceIdx={sagittalVal}
                    heatmapVolume={heatmapVolume}
                    opacity={heatmapOpacity}
                    colormap={heatmapColormap}
                    showHeatmap={showHeatmap}
                  />
                  {showCrosshairs && (
                    <div className="absolute inset-0 pointer-events-none z-10">
                      <div className="absolute top-0 bottom-0 border-l-2 border-indigo-400/60" style={{ left: `${(coronalVal / 128) * 100}%` }} />
                      <div className="absolute left-0 right-0 border-t-2 border-indigo-400/60" style={{ top: `${(100 - (axialVal / 128) * 100)}%` }} />
                    </div>
                  )}
                </div>
                <div className="p-2.5 bg-gray-950 border-t border-gray-900">
                  <input type="range" min="0" max="127" value={sagittalVal} onChange={(e) => handleSliderChange('sagittal', parseInt(e.target.value))} className="w-full h-2 bg-gray-800 rounded appearance-none cursor-pointer accent-indigo-400" />
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: Quad View (2x2: Axial, Coronal, Sagittal + 3D Brain) */}
          {viewMode === 'quad' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Axial */}
              {slices && (
                <div className="relative bg-black rounded-2xl overflow-hidden border border-gray-900">
                  <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded bg-black/90 text-[13px] font-mono font-semibold text-cyan-300">
                    Axial (Z: {axialVal})
                  </div>
                  <div className="aspect-video relative flex items-center justify-center bg-black">
                    <img src={slices.axial} alt="Axial Slice" className="h-full object-contain filter contrast-125 select-none" />
                    <SliceCanvasOverlay
                      plane="axial"
                      sliceIdx={axialVal}
                      heatmapVolume={heatmapVolume}
                      opacity={heatmapOpacity}
                      colormap={heatmapColormap}
                      showHeatmap={showHeatmap}
                    />
                  </div>
                  <div className="p-2 bg-gray-950 border-t border-gray-900">
                    <input type="range" min="0" max="127" value={axialVal} onChange={(e) => handleSliderChange('axial', parseInt(e.target.value))} className="w-full h-2 bg-gray-800 rounded appearance-none cursor-pointer accent-cyan-400" />
                  </div>
                </div>
              )}

              {/* Coronal */}
              {slices && (
                <div className="relative bg-black rounded-2xl overflow-hidden border border-gray-900">
                  <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded bg-black/90 text-[13px] font-mono font-semibold text-teal-300">
                    Coronal (Y: {coronalVal})
                  </div>
                  <div className="aspect-video relative flex items-center justify-center bg-black">
                    <img src={slices.coronal} alt="Coronal Slice" className="h-full object-contain filter contrast-125 select-none" />
                    <SliceCanvasOverlay
                      plane="coronal"
                      sliceIdx={coronalVal}
                      heatmapVolume={heatmapVolume}
                      opacity={heatmapOpacity}
                      colormap={heatmapColormap}
                      showHeatmap={showHeatmap}
                    />
                  </div>
                  <div className="p-2 bg-gray-950 border-t border-gray-900">
                    <input type="range" min="0" max="127" value={coronalVal} onChange={(e) => handleSliderChange('coronal', parseInt(e.target.value))} className="w-full h-2 bg-gray-800 rounded appearance-none cursor-pointer accent-teal-400" />
                  </div>
                </div>
              )}

              {/* Sagittal */}
              {slices && (
                <div className="relative bg-black rounded-2xl overflow-hidden border border-gray-900">
                  <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded bg-black/90 text-[13px] font-mono font-semibold text-indigo-300">
                    Sagittal (X: {sagittalVal})
                  </div>
                  <div className="aspect-video relative flex items-center justify-center bg-black">
                    <img src={slices.sagittal} alt="Sagittal Slice" className="h-full object-contain filter contrast-125 select-none" />
                    <SliceCanvasOverlay
                      plane="sagittal"
                      sliceIdx={sagittalVal}
                      heatmapVolume={heatmapVolume}
                      opacity={heatmapOpacity}
                      colormap={heatmapColormap}
                      showHeatmap={showHeatmap}
                    />
                  </div>
                  <div className="p-2 bg-gray-950 border-t border-gray-900">
                    <input type="range" min="0" max="127" value={sagittalVal} onChange={(e) => handleSliderChange('sagittal', parseInt(e.target.value))} className="w-full h-2 bg-gray-800 rounded appearance-none cursor-pointer accent-indigo-400" />
                  </div>
                </div>
              )}

              {/* 3D Brain Quad */}
              <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-[#050811]">
                <Suspense fallback={<div className="h-full flex items-center justify-center text-sm font-medium text-slate-400">Loading 3D Engine...</div>}>
                  <DemoBrainCanvas slices={slices} axialVal={axialVal} coronalVal={coronalVal} sagittalVal={sagittalVal} />
                </Suspense>
              </div>
            </div>
          )}

          {/* VIEW MODE 3: Dedicated Full 3D Brain Canvas */}
          {viewMode === '3d' && (
            <div className="rounded-2xl overflow-hidden border border-gray-800 bg-[#050811]">
              <Suspense fallback={<div className="h-[400px] flex items-center justify-center text-sm font-medium text-slate-400">Loading 3D Engine...</div>}>
                <DemoBrainCanvas slices={slices} axialVal={axialVal} coronalVal={coronalVal} sagittalVal={sagittalVal} />
              </Suspense>
            </div>
          )}

          {/* Coordinate Readout */}
          <div className="flex flex-wrap items-center justify-between text-[13px] sm:text-[14px] text-slate-600 pt-3 border-t border-gray-100 font-mono">
            <span className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Standardized RAS coordinate alignment
            </span>
            <div className="flex items-center gap-3.5 font-bold">
              <span className="text-slate-700">Axial: {axialVal}</span>
              <span className="text-slate-700">Coronal: {coronalVal}</span>
              <span className="text-slate-700">Sagittal: {sagittalVal}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
