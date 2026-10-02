import * as THREE from 'three';

/**
 * Generates an anatomically structured procedural 3D human brain geometry.
 * Features:
 * - Left and Right cerebral hemispheres with longitudinal fissure (cleft along X=0)
 * - Layered harmonic displacement simulating cortical gyri and sulci convolutions
 * - Temporal, frontal, and occipital lobe contours
 * - Cerebellar bilateral posterior lobes
 * - Brainstem core
 */
export function createProceduralBrainGeometry(): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];

  // 1. Left and Right Cerebral Hemispheres
  for (const hemisphere of [-1, 1]) {
    // Sphere with enough radial/vertical segments for smooth cortical convolutions
    const sphere = new THREE.SphereGeometry(1.2, 64, 48);
    const posAttr = sphere.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < posAttr.count; i++) {
      vertex.fromBufferAttribute(posAttr, i);

      // Anatomical orientation: X = L/R, Y = S/I (Superior/Inferior), Z = A/P (Anterior/Posterior)
      const x = vertex.x;
      const y = vertex.y;
      const z = vertex.z;

      // Base hemisphere elongation and scaling
      // Brain is longer along Z (AP) than Y (SI), and each hemisphere is compressed along X
      let nx = (x * 0.75 + hemisphere * 0.52);
      let ny = y * 0.92;
      let nz = z * 1.15;

      // Flatten medial wall along the longitudinal fissure (interhemispheric cleft)
      const distFromFissure = Math.abs(nx);
      if (distFromFissure < 0.28) {
        const cleftFactor = Math.pow(distFromFissure / 0.28, 0.7);
        nx *= (0.75 + cleftFactor * 0.25);
      }

      // Temporal lobe depression and inferior protrusion
      if (nz > 0.05 && ny < 0.1) {
        nx *= 1.08;
        ny -= 0.12 * Math.cos(nz * 2.0);
      }

      // Frontal lobe rounding (Z > 0.5)
      if (nz > 0.5) {
        ny *= (1.0 - (nz - 0.5) * 0.18);
      }

      // Occipital lobe taper (Z < -0.4)
      if (nz < -0.4) {
        nx *= (1.0 + (nz + 0.4) * 0.12);
        ny *= (1.0 + (nz + 0.4) * 0.15);
      }

      // Cortical Convolutions (Gyri & Sulci folds)
      // Layered trigonometric harmonics creating biological folds
      const fold1 = Math.sin(nx * 8.5) * Math.cos(ny * 9.0) * Math.sin(nz * 8.0);
      const fold2 = Math.sin(nx * 16.0 + nz * 6.0) * Math.cos(ny * 15.0) * 0.45;
      const fold3 = Math.sin(nz * 24.0) * Math.cos(nx * 20.0 + ny * 10.0) * 0.25;

      // Total displacement vector along radial normal
      const displacement = (fold1 + fold2 + fold3) * 0.075;

      const norm = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      vertex.x = nx + (nx / norm) * displacement;
      vertex.y = ny + (ny / norm) * displacement;
      vertex.z = nz + (nz / norm) * displacement;

      posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    sphere.computeVertexNormals();
    geometries.push(sphere);
  }

  // 2. Cerebellum (Bilateral posterior-inferior lobes)
  for (const hemisphere of [-1, 1]) {
    const cerebSphere = new THREE.SphereGeometry(0.48, 36, 28);
    const posAttr = cerebSphere.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < posAttr.count; i++) {
      vertex.fromBufferAttribute(posAttr, i);
      // Fine cerebellar horizontal folia folds
      const folia = Math.sin(vertex.y * 36.0) * 0.035;
      vertex.x = (vertex.x * 0.85 + hemisphere * 0.42);
      vertex.y = vertex.y * 0.70 - 0.78 + folia;
      vertex.z = vertex.z * 0.90 - 0.65;
      posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    cerebSphere.computeVertexNormals();
    geometries.push(cerebSphere);
  }

  // 3. Brainstem (Central inferior stalk)
  const stem = new THREE.CylinderGeometry(0.18, 0.14, 0.75, 24);
  stem.translate(0, -1.05, -0.22);
  stem.computeVertexNormals();
  geometries.push(stem);

  // Merge geometries
  let totalVertices = 0;
  let totalIndices = 0;
  geometries.forEach(g => {
    totalVertices += g.attributes.position.count;
    totalIndices += g.index ? g.index.count : 0;
  });

  const merged = new THREE.BufferGeometry();
  const mergedPos = new Float32Array(totalVertices * 3);
  const mergedNorm = new Float32Array(totalVertices * 3);
  const mergedIndex = new Uint32Array(totalIndices);

  let vOffset = 0;
  let iOffset = 0;

  geometries.forEach(g => {
    const p = g.attributes.position;
    const n = g.attributes.normal;
    const idx = g.index;

    mergedPos.set(p.array, vOffset * 3);
    if (n) mergedNorm.set(n.array, vOffset * 3);

    if (idx) {
      for (let j = 0; j < idx.count; j++) {
        mergedIndex[iOffset + j] = idx.getX(j) + vOffset;
      }
      iOffset += idx.count;
    }

    vOffset += p.count;
    g.dispose();
  });

  merged.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3));
  merged.setIndex(new THREE.BufferAttribute(mergedIndex, 1));
  merged.computeVertexNormals();

  return merged;
}

/**
 * Generate a point cloud particle distribution on the brain surface with neural sparks.
 */
export function createBrainParticles(count = 2800): { positions: Float32Array; sizes: Float32Array } {
  const geometry = createProceduralBrainGeometry();
  const posAttr = geometry.attributes.position;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  const numVertices = posAttr.count;
  for (let i = 0; i < count; i++) {
    // Random vertex from procedural brain
    const vIdx = Math.floor(Math.random() * numVertices);
    positions[i * 3 + 0] = posAttr.getX(vIdx) + (Math.random() - 0.5) * 0.05;
    positions[i * 3 + 1] = posAttr.getY(vIdx) + (Math.random() - 0.5) * 0.05;
    positions[i * 3 + 2] = posAttr.getZ(vIdx) + (Math.random() - 0.5) * 0.05;

    // Particle sizes with varied intensities
    sizes[i] = Math.random() < 0.08 ? 3.5 : 1.8;
  }

  geometry.dispose();
  return { positions, sizes };
}
