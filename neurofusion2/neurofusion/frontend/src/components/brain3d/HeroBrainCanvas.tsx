import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { createProceduralBrainGeometry } from './proceduralBrain';
import { RotateCw, Sparkles, Layers, Volume2 } from 'lucide-react';

interface BrainMeshProps {
  isInteracting: boolean;
  reducedMotion: boolean;
}

const BrainModel: React.FC<BrainMeshProps> = ({ isInteracting, reducedMotion }) => {
  const meshRef = useRef<THREE.Group>(null);
  const pulseUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPulse: { value: 0 },
    }),
    []
  );

  const geometry = useMemo(() => createProceduralBrainGeometry(), []);

  // Neural particle points on brain surface
  const particles = useMemo(() => {
    const pos = geometry.attributes.position;
    const count = 1800;
    const pArr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pos.count);
      pArr[i * 3 + 0] = pos.getX(idx) * 1.02 + (Math.random() - 0.5) * 0.04;
      pArr[i * 3 + 1] = pos.getY(idx) * 1.02 + (Math.random() - 0.5) * 0.04;
      pArr[i * 3 + 2] = pos.getZ(idx) * 1.02 + (Math.random() - 0.5) * 0.04;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pArr, 3));
    return pGeo;
  }, [geometry]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (!reducedMotion) {
      // Gentle floating sine motion
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.08;

      // Slow auto-rotation (pauses when user is dragging)
      if (!isInteracting) {
        meshRef.current.rotation.y += delta * 0.28;
      }

      pulseUniforms.uTime.value = state.clock.elapsedTime;
      pulseUniforms.uPulse.value = (Math.sin(state.clock.elapsedTime * 2.0) + 1.0) * 0.5;
    }
  });

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      {/* 1. Translucent Shaded Cortical Surface */}
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          color="#06b6d4"
          emissive="#083344"
          emissiveIntensity={0.6}
          roughness={0.35}
          metalness={0.2}
          transmission={0.65}
          thickness={1.2}
          transparent={true}
          opacity={0.82}
          wireframe={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Delicate Wireframe Accent Overlay */}
      <mesh geometry={geometry} scale={[1.002, 1.002, 1.002]}>
        <meshBasicMaterial
          color="#38bdf8"
          wireframe={true}
          transparent={true}
          opacity={0.16}
        />
      </mesh>

      {/* 3. Neural Synaptic Particle Constellation */}
      <points geometry={particles}>
        <pointsMaterial
          size={0.038}
          color="#2dd4bf"
          transparent={true}
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 4. Internal Fusion Core Glow */}
      <mesh position={[0, -0.1, 0]}>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshBasicMaterial
          color="#14b8a6"
          transparent={true}
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

export const HeroBrainCanvas: React.FC = () => {
  const [isInteracting, setIsInteracting] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hasWebGl, setHasWebGl] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<number | null>(null);

  // Check WebGL and reduced-motion
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);
    const motionListener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionQuery.addEventListener('change', motionListener);

    // Test WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setHasWebGl(!!gl);
    } catch {
      setHasWebGl(false);
    }

    return () => motionQuery.removeEventListener('change', motionListener);
  }, []);

  // Pause rendering when off-screen via IntersectionObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleStartInteraction = () => {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    setIsInteracting(true);
  };

  const handleEndInteraction = () => {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      setIsInteracting(false);
    }, 2400);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[380px] sm:h-[440px] rounded-3xl glass-panel glass-panel-glow overflow-hidden border border-cyan-500/30 bg-gradient-to-b from-[#071329]/70 via-[#050b1a]/80 to-[#03060f]/90 flex flex-col"
      aria-label="Interactive 3D procedural brain representation visualizing multimodal feature extraction"
      role="region"
    >
      {/* Top HUD Badges */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md text-[11px] font-mono text-cyan-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>3D Cortical Isosurface</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-[10px] font-mono text-slate-400">
          <span>Drag to Rotate</span>
        </div>
      </div>

      {/* 3D Canvas */}
      {!hasWebGl ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
          <Layers className="w-10 h-10 text-cyan-400 mb-2 opacity-60" />
          <p className="text-xs">WebGL is not enabled on this device.</p>
        </div>
      ) : (
        <div className="flex-1 w-full h-full cursor-grab active:cursor-grabbing">
          {isVisible && (
            <Canvas
              camera={{ position: [0, 0.4, 3.8], fov: 42 }}
              dpr={[1, 2]}
              gl={{ antialias: true, alpha: true }}
              onPointerDown={handleStartInteraction}
              onPointerUp={handleEndInteraction}
            >
              <ambientLight intensity={0.65} />
              <directionalLight position={[4, 5, 4]} intensity={1.2} color="#38bdf8" />
              <directionalLight position={[-4, -3, -4]} intensity={0.7} color="#2dd4bf" />
              <pointLight position={[0, 0, 0]} intensity={1.5} color="#06b6d4" distance={3.5} />

              <BrainModel isInteracting={isInteracting} reducedMotion={reducedMotion} />

              <OrbitControls
                enablePan={false}
                enableZoom={true}
                minDistance={2.6}
                maxDistance={5.8}
                rotateSpeed={0.8}
                onStart={handleStartInteraction}
                onEnd={handleEndInteraction}
              />
            </Canvas>
          )}
        </div>
      )}

      {/* Bottom Controls / Indicator HUD */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-md flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5 text-cyan-400">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>Procedural Gyri &amp; Sulci</span>
        </span>
        <span className="text-[10px] text-slate-500">
          {isInteracting ? 'Free Orbit Active' : 'Auto-Rotating'}
        </span>
      </div>
    </div>
  );
};
export default HeroBrainCanvas;
