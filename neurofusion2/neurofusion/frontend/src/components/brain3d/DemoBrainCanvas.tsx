import React, { useRef, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { createProceduralBrainGeometry } from './proceduralBrain';
import { RotateCcw, Layers } from 'lucide-react';
import type { SliceData } from '../../lib/types';

interface DemoBrainCanvasProps {
  slices: SliceData | null;
  axialVal: number;
  coronalVal: number;
  sagittalVal: number;
  onSliceClick?: (plane: 'axial' | 'coronal' | 'sagittal', value: number) => void;
}

// 3D Slicing Plane Quads inside the Brain
const SlicePlanes: React.FC<{
  axialVal: number;
  coronalVal: number;
  sagittalVal: number;
  visible: boolean;
}> = ({ axialVal, coronalVal, sagittalVal, visible }) => {
  if (!visible) return null;

  // Normalized coordinate mapping (-1.1 to 1.1)
  const normX = ((sagittalVal / 127) - 0.5) * 2.2; // Sagittal (Left - Right)
  const normY = ((axialVal / 127) - 0.5) * 2.2;    // Axial (Inferior - Superior)
  const normZ = ((coronalVal / 127) - 0.5) * 2.2;  // Coronal (Posterior - Anterior)

  return (
    <group>
      {/* 1. Axial Plane (Horizontal cross-section across Y) */}
      <group position={[0, normY, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.5, 2.7]} />
          <meshBasicMaterial
            color="#06b6d4"
            transparent={true}
            opacity={0.32}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(2.5, 2.7)]} />
          <lineBasicMaterial color="#38bdf8" transparent={true} opacity={0.7} />
        </lineSegments>
      </group>

      {/* 2. Coronal Plane (Vertical cross-section across Z) */}
      <group position={[0, 0, normZ]}>
        <mesh>
          <planeGeometry args={[2.5, 2.3]} />
          <meshBasicMaterial
            color="#14b8a6"
            transparent={true}
            opacity={0.32}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.PlaneGeometry(2.5, 2.3)]} />
          <lineBasicMaterial color="#2dd4bf" transparent={true} opacity={0.7} />
        </lineSegments>
      </group>

      {/* 3. Sagittal Plane (Side profile cross-section across X) */}
      <group position={[normX, 0, 0]}>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[2.7, 2.3]} />
          <meshBasicMaterial
            color="#818cf8"
            transparent={true}
            opacity={0.32}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <lineSegments rotation={[0, Math.PI / 2, 0]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(2.7, 2.3)]} />
          <lineBasicMaterial color="#a5b4fc" transparent={true} opacity={0.7} />
        </lineSegments>
      </group>
    </group>
  );
};

// Brain Representation (Surface or Volume particle cloud)
const VolumetricBrainRepresentation: React.FC<{
  mode: 'surface' | 'volume';
  opacity: number;
  hasScan: boolean;
}> = ({ mode, opacity, hasScan }) => {
  const meshRef = useRef<THREE.Group>(null);
  const baseGeometry = useMemo(() => createProceduralBrainGeometry(), []);

  // 3D density cloud for "Volume" mode
  const volumeParticles = useMemo(() => {
    const count = 4200;
    const pArr = new Float32Array(count * 3);
    const colorArr = new Float32Array(count * 3);
    const pos = baseGeometry.attributes.position;

    const cTeal = new THREE.Color('#14b8a6');
    const cCyan = new THREE.Color('#06b6d4');
    const cCore = new THREE.Color('#38bdf8');

    for (let i = 0; i < count; i++) {
      // Stratified radial sampling from surface to center core
      const vIdx = Math.floor(Math.random() * pos.count);
      const rScale = Math.pow(Math.random(), 0.45); // Denser near cortex

      const px = pos.getX(vIdx) * rScale;
      const py = pos.getY(vIdx) * rScale;
      const pz = pos.getZ(vIdx) * rScale;

      pArr[i * 3 + 0] = px;
      pArr[i * 3 + 1] = py;
      pArr[i * 3 + 2] = pz;

      // Color based on radial depth
      const interpColor = rScale > 0.7 ? cCyan : (rScale > 0.4 ? cTeal : cCore);
      colorArr[i * 3 + 0] = interpColor.r;
      colorArr[i * 3 + 1] = interpColor.g;
      colorArr[i * 3 + 2] = interpColor.b;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pArr, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));
    return pGeo;
  }, [baseGeometry]);

  return (
    <group ref={meshRef}>
      {mode === 'surface' ? (
        <group>
          {/* Cortical Surface */}
          <mesh geometry={baseGeometry}>
            <meshStandardMaterial
              color={hasScan ? '#0284c7' : '#0891b2'}
              roughness={0.4}
              metalness={0.15}
              transparent={true}
              opacity={opacity * 0.78}
              side={THREE.DoubleSide}
              wireframe={false}
            />
          </mesh>
          {/* Subtle Wireframe Structure */}
          <mesh geometry={baseGeometry} scale={[1.001, 1.001, 1.001]}>
            <meshBasicMaterial
              color="#38bdf8"
              wireframe={true}
              transparent={true}
              opacity={opacity * 0.22}
            />
          </mesh>
        </group>
      ) : (
        /* Volumetric 3D Density Point Cloud */
        <points geometry={volumeParticles}>
          <pointsMaterial
            size={0.042}
            vertexColors={true}
            transparent={true}
            opacity={opacity * 0.9}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}

      {/* Bounding box guide */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(2.6, 2.5, 2.8)]} />
        <lineBasicMaterial color="#334155" transparent={true} opacity={0.3} />
      </lineSegments>
    </group>
  );
};

export const DemoBrainCanvas: React.FC<DemoBrainCanvasProps> = ({
  slices,
  axialVal,
  coronalVal,
  sagittalVal,
}) => {
  const [mode, setMode] = useState<'surface' | 'volume'>('surface');
  const [opacity, setOpacity] = useState<number>(0.85);
  const [showPlanes, setShowPlanes] = useState<boolean>(true);
  const controlsRef = useRef<any>(null);

  const resetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const hasScan = !!slices;

  return (
    <div className="relative w-full h-[360px] sm:h-[400px] bg-black rounded-2xl overflow-hidden border border-slate-800 flex flex-col">
      {/* 3D Viewer Toolbar */}
      <div className="p-3 bg-slate-950/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="bg-slate-900 border border-slate-700 p-0.5 rounded-xl flex items-center text-[14px] font-semibold">
            <button
              type="button"
              onClick={() => setMode('surface')}
              className={`min-h-[34px] px-3 py-1 rounded-lg transition-colors ${
                mode === 'surface'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Surface
            </button>
            <button
              type="button"
              onClick={() => setMode('volume')}
              className={`min-h-[34px] px-3 py-1 rounded-lg transition-colors ${
                mode === 'volume'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Volume
            </button>
          </div>

          {/* Slices toggle */}
          <button
            type="button"
            onClick={() => setShowPlanes(!showPlanes)}
            className={`min-h-[34px] px-3 py-1 rounded-xl border text-[14px] font-semibold transition-colors flex items-center gap-1.5 ${
              showPlanes
                ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300 font-bold'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Planes</span>
          </button>
        </div>

        {/* Sliders & Reset View */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2 text-[13px] sm:text-[14px] font-mono text-slate-300 font-medium">
            <span>Opacity:</span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-20 h-1.5 bg-slate-700 rounded appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <button
            type="button"
            onClick={resetView}
            className="min-h-[34px] px-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors"
            title="Reset 3D camera"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        <Canvas
          camera={{ position: [2.6, 1.8, 2.9], fov: 45 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[4, 5, 3]} intensity={1.1} color="#38bdf8" />
          <directionalLight position={[-3, -2, -3]} intensity={0.6} color="#2dd4bf" />

          <VolumetricBrainRepresentation mode={mode} opacity={opacity} hasScan={hasScan} />

          <SlicePlanes
            axialVal={axialVal}
            coronalVal={coronalVal}
            sagittalVal={sagittalVal}
            visible={showPlanes}
          />

          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            minDistance={1.8}
            maxDistance={6.0}
            rotateSpeed={0.8}
          />
        </Canvas>

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
          <div className="px-3 py-1 rounded-lg bg-black/90 border border-slate-800 text-[12px] sm:text-[13px] font-mono flex items-center gap-3 font-semibold shadow">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-1 bg-cyan-400 inline-block rounded-full" /> Axial (Z:{axialVal})
            </span>
            <span className="flex items-center gap-1.5 text-teal-400">
              <span className="w-2.5 h-1 bg-teal-400 inline-block rounded-full" /> Coronal (Y:{coronalVal})
            </span>
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-2.5 h-1 bg-indigo-400 inline-block rounded-full" /> Sagittal (X:{sagittalVal})
            </span>
          </div>
        </div>

        {/* Placeholder hint when no volume uploaded */}
        {!hasScan && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-800 text-[12px] sm:text-[13px] font-mono text-cyan-300 shadow-lg backdrop-blur-md pointer-events-none font-medium whitespace-nowrap">
            Anatomical 3D Coordinate Grid • Select patient or upload MRI
          </div>
        )}
      </div>
    </div>
  );
};
export default DemoBrainCanvas;
