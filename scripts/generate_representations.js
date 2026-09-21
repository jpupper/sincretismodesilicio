import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const publicDataDir = path.join(__dirname, '..', 'public', 'data');
  const binPath = path.join(publicDataDir, 'embeddings.bin');
  const vocabPath = path.join(publicDataDir, 'vocab.json');

  console.log('Loading embeddings and vocab...');
  const vocabRaw = fs.readFileSync(vocabPath, 'utf-8');
  const vocabData = JSON.parse(vocabRaw);
  const vocab = vocabData.words;
  const N = vocab.length;
  const D = vocabData.dimensions || 300;

  const binBuffer = fs.readFileSync(binPath);
  const flatMatrix = new Float32Array(binBuffer.buffer, binBuffer.byteOffset, N * D);

  console.log(`Loaded ${N} words with ${D} dimensions.`);

  // 1. Ensure PCA coordinates are saved as coords3d_pca.bin
  const origCoordsPath = path.join(publicDataDir, 'coords3d.bin');
  const pcaCoordsPath = path.join(publicDataDir, 'coords3d_pca.bin');
  if (fs.existsSync(origCoordsPath)) {
    fs.copyFileSync(origCoordsPath, pcaCoordsPath);
    console.log('Copied coords3d.bin -> coords3d_pca.bin');
  }

  // Load existing PCA coords as initial layout base
  const pcaBuffer = fs.readFileSync(pcaCoordsPath);
  const initialCoords = new Float32Array(pcaBuffer.buffer, pcaBuffer.byteOffset, N * 3);

  // 2. Build UMAP / Non-linear k-NN Manifold Projection
  console.log('\n--- Computing Non-Linear Semantic Manifold (UMAP / t-SNE style) ---');
  console.log('Finding k-NN semantic neighbors for each word...');
  
  const K = 12;
  const edges = []; // { from, to, weight }

  // For speed and memory, find top K neighbors for each word
  for (let i = 0; i < N; i++) {
    if (i % 2000 === 0) console.log(`Processed k-NN for ${i}/${N} words...`);
    const offI = i * D;
    
    // Quick candidate search: keep top K similarities
    const topSims = new Float32Array(K).fill(-1);
    const topIdxs = new Int32Array(K).fill(-1);

    for (let j = 0; j < N; j++) {
      if (i === j) continue;
      const offJ = j * D;
      let dot = 0;
      for (let d = 0; d < D; d++) {
        dot += flatMatrix[offI + d] * flatMatrix[offJ + d];
      }

      if (dot > topSims[K - 1]) {
        // Insert in sorted order
        let pos = K - 1;
        while (pos > 0 && dot > topSims[pos - 1]) {
          topSims[pos] = topSims[pos - 1];
          topIdxs[pos] = topIdxs[pos - 1];
          pos--;
        }
        topSims[pos] = dot;
        topIdxs[pos] = j;
      }
    }

    for (let k = 0; k < K; k++) {
      const neighborIdx = topIdxs[k];
      const sim = topSims[k];
      if (neighborIdx !== -1 && sim > 0.25) {
        // Higher weight for strongly related words
        const weight = Math.pow(Math.max(0, sim), 2.5);
        edges.push({ from: i, to: neighborIdx, weight });
      }
    }
  }

  console.log(`Generated ${edges.length} semantic attraction edges.`);

  // Initialize UMAP positions from scaled PCA
  const umapCoords = new Float32Array(N * 3);
  for (let i = 0; i < N * 3; i++) {
    umapCoords[i] = initialCoords[i] * 0.5;
  }

  // Optimize coordinates via SGD with attractive and repulsive forces
  console.log('Running force relaxation iterations (clustering similar words, repelling distant words)...');
  const ITERATIONS = 35;
  let learningRate = 0.85;

  const vel = new Float32Array(N * 3);

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const decay = 1.0 - (iter / ITERATIONS);
    const lr = learningRate * decay;

    // 1. Attractive forces along semantic edges
    for (let e = 0; e < edges.length; e++) {
      const edge = edges[e];
      const i = edge.from;
      const j = edge.to;
      const w = edge.weight;

      const idxI = i * 3;
      const idxJ = j * 3;

      const dx = umapCoords[idxJ] - umapCoords[idxI];
      const dy = umapCoords[idxJ + 1] - umapCoords[idxI + 1];
      const dz = umapCoords[idxJ + 2] - umapCoords[idxI + 2];

      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1;
      const force = Math.min(25, (dist - 15) * 0.04 * w);

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      const fz = (dz / dist) * force;

      vel[idxI] += fx * lr;
      vel[idxI + 1] += fy * lr;
      vel[idxI + 2] += fz * lr;

      vel[idxJ] -= fx * lr;
      vel[idxJ + 1] -= fy * lr;
      vel[idxJ + 2] -= fz * lr;
    }

    // 2. Negative sampling (Repulsive forces between non-neighbors)
    const NEG_SAMPLES = 8;
    for (let i = 0; i < N; i++) {
      const idxI = i * 3;
      const xi = umapCoords[idxI];
      const yi = umapCoords[idxI + 1];
      const zi = umapCoords[idxI + 2];

      for (let s = 0; s < NEG_SAMPLES; s++) {
        const j = Math.floor(Math.random() * N);
        if (i === j) continue;
        const idxJ = j * 3;

        const dx = xi - umapCoords[idxJ];
        const dy = yi - umapCoords[idxJ + 1];
        const dz = zi - umapCoords[idxJ + 2];

        const distSq = dx * dx + dy * dy + dz * dz + 1.0;
        if (distSq < 40000) { // repulsive within ~200 units
          const dist = Math.sqrt(distSq);
          const repForce = (300.0 / distSq) * lr;

          vel[idxI] += (dx / dist) * repForce;
          vel[idxI + 1] += (dy / dist) * repForce;
          vel[idxI + 2] += (dz / dist) * repForce;
        }
      }
    }

    // Apply velocities with damping
    for (let i = 0; i < N * 3; i++) {
      umapCoords[i] += vel[i];
      vel[i] *= 0.65; // friction / damping
    }

    if ((iter + 1) % 5 === 0 || iter === ITERATIONS - 1) {
      console.log(`Iteration ${iter + 1}/${ITERATIONS} complete.`);
    }
  }

  // Normalize and scale UMAP coordinates
  let maxUmapDist = 0;
  for (let i = 0; i < N; i++) {
    const dist = Math.hypot(umapCoords[i * 3], umapCoords[i * 3 + 1], umapCoords[i * 3 + 2]);
    if (dist > maxUmapDist) maxUmapDist = dist;
  }
  const UMAP_SCALE = 1600 / (maxUmapDist || 1);
  for (let i = 0; i < N * 3; i++) {
    umapCoords[i] *= UMAP_SCALE;
  }

  const umapCoordsPath = path.join(publicDataDir, 'coords3d_umap.bin');
  fs.writeFileSync(umapCoordsPath, Buffer.from(umapCoords.buffer));
  console.log(`Saved UMAP coordinates to ${umapCoordsPath} (${(umapCoords.byteLength / 1024).toFixed(1)} KB).`);

  // 3. Build Semantic Galaxy / Clustering layout
  console.log('\n--- Computing Galactic Clusters Layout ---');
  // K-Means clustering in 300D with 16 galactic hubs
  const K_CLUSTERS = 16;
  const centroids = new Float32Array(K_CLUSTERS * D);

  // Initialize centroids with 16 distinct anchor words
  const seedIndices = [
    vocab.indexOf('ciencia'), vocab.indexOf('arte'), vocab.indexOf('animal'),
    vocab.indexOf('tiempo'), vocab.indexOf('filosofía'), vocab.indexOf('política'),
    vocab.indexOf('cuerpo'), vocab.indexOf('amor'), vocab.indexOf('mundo'),
    vocab.indexOf('música'), vocab.indexOf('trabajo'), vocab.indexOf('comida'),
    vocab.indexOf('naturaleza'), vocab.indexOf('espacio'), vocab.indexOf('lenguaje'),
    vocab.indexOf('dinero')
  ];

  for (let c = 0; c < K_CLUSTERS; c++) {
    const sIdx = seedIndices[c] !== -1 ? seedIndices[c] : Math.floor(c * (N / K_CLUSTERS));
    centroids.set(flatMatrix.subarray(sIdx * D, (sIdx + 1) * D), c * D);
  }

  // Assign clusters
  const clusterAssignments = new Int32Array(N);
  for (let i = 0; i < N; i++) {
    const offI = i * D;
    let bestC = 0;
    let bestDot = -999;
    for (let c = 0; c < K_CLUSTERS; c++) {
      const offC = c * D;
      let dot = 0;
      for (let d = 0; d < D; d++) dot += flatMatrix[offI + d] * centroids[offC + d];
      if (dot > bestDot) {
        bestDot = dot;
        bestC = c;
      }
    }
    clusterAssignments[i] = bestC;
  }

  // Arrange the 16 clusters on a cosmic sphere with local intra-cluster spread
  const clusterCoords = new Float32Array(N * 3);
  const clusterCenters = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  for (let c = 0; c < K_CLUSTERS; c++) {
    const theta = 2 * Math.PI * c / goldenRatio;
    const phi = Math.acos(1 - 2 * (c + 0.5) / K_CLUSTERS);
    const R = 850;
    clusterCenters.push({
      x: R * Math.sin(phi) * Math.cos(theta),
      y: R * Math.cos(phi),
      z: R * Math.sin(phi) * Math.sin(theta)
    });
  }

  for (let i = 0; i < N; i++) {
    const c = clusterAssignments[i];
    const center = clusterCenters[c];
    // Blend local PCA variation around the galactic cluster center
    const lx = initialCoords[i * 3] * 0.35;
    const ly = initialCoords[i * 3 + 1] * 0.35;
    const lz = initialCoords[i * 3 + 2] * 0.35;

    clusterCoords[i * 3] = center.x + lx;
    clusterCoords[i * 3 + 1] = center.y + ly;
    clusterCoords[i * 3 + 2] = center.z + lz;
  }

  const clusterCoordsPath = path.join(publicDataDir, 'coords3d_clusters.bin');
  fs.writeFileSync(clusterCoordsPath, Buffer.from(clusterCoords.buffer));
  console.log(`Saved Cluster coordinates to ${clusterCoordsPath} (${(clusterCoords.byteLength / 1024).toFixed(1)} KB).`);

  // Default coords3d.bin will be the UMAP non-linear layout (or keep current and let user select!)
  console.log('\nAll 3 projection models (PCA, UMAP, Cúmulos) are ready!');
}

run().catch(console.error);
