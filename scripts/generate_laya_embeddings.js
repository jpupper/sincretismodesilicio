import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from '@xenova/transformers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateLayaEmbeddings() {
  console.log('================================================================');
  console.log('    GENERADOR DE EMBEDDINGS LAYA ONNX (384D) • ESPAÑOL');
  console.log('================================================================');

  const publicDataDir = path.join(__dirname, '..', 'public', 'data');
  const vocabPath = path.join(publicDataDir, 'vocab.json');

  if (!fs.existsSync(vocabPath)) {
    throw new Error(`No se encontró el vocabulario en ${vocabPath}`);
  }

  const vocabRaw = fs.readFileSync(vocabPath, 'utf-8');
  const vocabData = JSON.parse(vocabRaw);
  const words = vocabData.words;
  const N = words.length;
  const D = 384; // Laya / all-MiniLM-L6-v2 dimensionality

  console.log(`Vocabulario: ${N} palabras en español.`);
  console.log('Cargando pipeline ONNX de LAYA (@xenova/transformers)...');

  const t0 = Date.now();
  const extractor = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');
  console.log(`Modelo LAYA ONNX listo en ${Date.now() - t0} ms.`);

  const matrix = new Float32Array(N * D);
  const BATCH_SIZE = 100;
  console.log(`Iniciando codificación por lotes (lotes de ${BATCH_SIZE})...`);

  for (let i = 0; i < N; i += BATCH_SIZE) {
    const chunk = words.slice(i, i + BATCH_SIZE);
    const output = await extractor(chunk, { pooling: 'mean', normalize: true });
    
    // output can be multi-dimensional tensor [batchLen, 384]
    for (let c = 0; c < chunk.length; c++) {
      const vec = output[c].data;
      const destOffset = (i + c) * D;
      for (let d = 0; d < D; d++) {
        matrix[destOffset + d] = vec[d];
      }
    }

    if ((i + BATCH_SIZE) % 1000 === 0 || i + BATCH_SIZE >= N) {
      const done = Math.min(N, i + BATCH_SIZE);
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`Codificadas ${done}/${N} palabras (${((done / N) * 100).toFixed(0)}%) [${elapsed}s]`);
    }
  }

  // Verificar integridad
  let hasNaN = false;
  for (let i = 0; i < matrix.length; i++) {
    if (isNaN(matrix[i])) {
      hasNaN = true;
      matrix[i] = 0;
    }
  }
  if (hasNaN) console.warn('Advertencia: Se detectaron y limpiaron valores NaN.');

  // Guardar archivo binario de embeddings LAYA
  const layaBinPath = path.join(publicDataDir, 'laya_embeddings.bin');
  fs.writeFileSync(layaBinPath, Buffer.from(matrix.buffer));
  console.log(`[OK] Guardado: ${layaBinPath} (${(matrix.byteLength / 1024 / 1024).toFixed(2)} MB).`);

  // Actualizar vocab.json
  vocabData.dimensions = D;
  vocabData.engine = 'laya';
  vocabData.model = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
  vocabData.updatedAt = new Date().toISOString();
  fs.writeFileSync(vocabPath, JSON.stringify(vocabData), 'utf-8');
  console.log(`[OK] Actualizado vocab.json con dimensiones ${D} y motor Laya.`);

  // Generar proyecciones 3D actualizadas a 384D
  console.log('\n--- Calculando Proyecciones 3D para el Cosmos basadas en LAYA ---');
  await generate3DProjections(matrix, words, N, D, publicDataDir);

  // Eliminar el archivo antiguo de Word2Vec si existe
  const oldWord2VecBin = path.join(publicDataDir, 'embeddings.bin');
  if (fs.existsSync(oldWord2VecBin)) {
    try {
      fs.unlinkSync(oldWord2VecBin);
      console.log(`[PURGA] Eliminado archivo obsoleto Word2Vec: ${oldWord2VecBin}`);
    } catch (e) {
      console.warn(`No se pudo eliminar embeddings.bin:`, e.message);
    }
  }

  console.log('\n================================================================');
  console.log('  ¡MIGRACIÓN A LAYA ONNX COMPLETADA CON ÉXITO!');
  console.log('================================================================');
}

/**
 * Genera PCA, UMAP y Cúmulos 3D a partir de la matriz LAYA de 384D
 */
async function generate3DProjections(matrix, vocab, N, D, publicDataDir) {
  // 1. PCA rápido usando Power Iteration en 3 componentes
  console.log('Calculando PCA 3D a partir del espacio 384D...');
  const pcaCoords = new Float32Array(N * 3);

  // Centrar datos
  const mean = new Float32Array(D);
  for (let i = 0; i < N; i++) {
    const off = i * D;
    for (let d = 0; d < D; d++) mean[d] += matrix[off + d];
  }
  for (let d = 0; d < D; d++) mean[d] /= N;

  // 3 Componentes Principales
  for (let comp = 0; comp < 3; comp++) {
    // Vector inicial aleatorio
    let v = new Float32Array(D);
    for (let d = 0; d < D; d++) v[d] = Math.random() - 0.5;

    // Normalizar v
    let norm = Math.hypot(...v);
    for (let d = 0; d < D; d++) v[d] /= (norm || 1);

    // 15 iteraciones de power iteration
    for (let iter = 0; iter < 15; iter++) {
      const vNext = new Float32Array(D);
      for (let i = 0; i < N; i++) {
        const off = i * D;
        let proj = 0;
        for (let d = 0; d < D; d++) proj += (matrix[off + d] - mean[d]) * v[d];
        for (let d = 0; d < D; d++) vNext[d] += (matrix[off + d] - mean[d]) * proj;
      }
      norm = Math.hypot(...vNext);
      for (let d = 0; d < D; d++) v[d] = vNext[d] / (norm || 1);
    }

    // Proyectar todos los puntos sobre v
    for (let i = 0; i < N; i++) {
      const off = i * D;
      let proj = 0;
      for (let d = 0; d < D; d++) proj += (matrix[off + d] - mean[d]) * v[d];
      pcaCoords[i * 3 + comp] = proj;
    }
  }

  // Escalar PCA a un volumen visible cómodo (~1400 radio)
  let maxPcaDist = 0;
  for (let i = 0; i < N; i++) {
    const d = Math.hypot(pcaCoords[i * 3], pcaCoords[i * 3 + 1], pcaCoords[i * 3 + 2]);
    if (d > maxPcaDist) maxPcaDist = d;
  }
  const PCA_SCALE = 1400 / (maxPcaDist || 1);
  for (let i = 0; i < N * 3; i++) pcaCoords[i] *= PCA_SCALE;

  const pcaPath = path.join(publicDataDir, 'coords3d_pca.bin');
  fs.writeFileSync(pcaPath, Buffer.from(pcaCoords.buffer));
  console.log(`[OK] Guardado PCA 3D: ${pcaPath}`);

  // 2. Proyección Manifold No Lineal (UMAP / t-SNE style)
  console.log('Calculando Manifold UMAP no lineal con atracción k-NN...');
  const K = 12;
  const edges = [];

  for (let i = 0; i < N; i++) {
    const offI = i * D;
    const topSims = new Float32Array(K).fill(-1);
    const topIdxs = new Int32Array(K).fill(-1);

    for (let j = 0; j < N; j++) {
      if (i === j) continue;
      const offJ = j * D;
      let dot = 0;
      for (let d = 0; d < D; d++) dot += matrix[offI + d] * matrix[offJ + d];

      if (dot > topSims[K - 1]) {
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
        const weight = Math.pow(Math.max(0, sim), 2.5);
        edges.push({ from: i, to: neighborIdx, weight });
      }
    }
  }

  // Inicializar UMAP desde PCA escalado
  const umapCoords = new Float32Array(N * 3);
  for (let i = 0; i < N * 3; i++) umapCoords[i] = pcaCoords[i] * 0.5;

  const ITERATIONS = 30;
  const vel = new Float32Array(N * 3);
  const NEG_SAMPLES = 8;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const decay = 1.0 - (iter / ITERATIONS);
    const lr = 0.85 * decay;

    // Atracción a lo largo de bordes semánticos LAYA
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

    // Repulsión
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
        if (distSq < 40000) {
          const dist = Math.sqrt(distSq);
          const repForce = (300.0 / distSq) * lr;

          vel[idxI] += (dx / dist) * repForce;
          vel[idxI + 1] += (dy / dist) * repForce;
          vel[idxI + 2] += (dz / dist) * repForce;
        }
      }
    }

    for (let i = 0; i < N * 3; i++) {
      umapCoords[i] += vel[i];
      vel[i] *= 0.65;
    }
  }

  // Escalar UMAP
  let maxUmapDist = 0;
  for (let i = 0; i < N; i++) {
    const dist = Math.hypot(umapCoords[i * 3], umapCoords[i * 3 + 1], umapCoords[i * 3 + 2]);
    if (dist > maxUmapDist) maxUmapDist = dist;
  }
  const UMAP_SCALE = 1600 / (maxUmapDist || 1);
  for (let i = 0; i < N * 3; i++) umapCoords[i] *= UMAP_SCALE;

  const umapPath = path.join(publicDataDir, 'coords3d_umap.bin');
  const defaultCoordsPath = path.join(publicDataDir, 'coords3d.bin');
  fs.writeFileSync(umapPath, Buffer.from(umapCoords.buffer));
  fs.writeFileSync(defaultCoordsPath, Buffer.from(umapCoords.buffer));
  console.log(`[OK] Guardado UMAP 3D: ${umapPath}`);

  // 3. Galactic Clusters layout
  console.log('Calculando Cúmulos Galácticos LAYA...');
  const K_CLUSTERS = 16;
  const centroids = new Float32Array(K_CLUSTERS * D);

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
    centroids.set(matrix.subarray(sIdx * D, (sIdx + 1) * D), c * D);
  }

  const clusterAssignments = new Int32Array(N);
  for (let i = 0; i < N; i++) {
    const offI = i * D;
    let bestC = 0;
    let bestDot = -999;
    for (let c = 0; c < K_CLUSTERS; c++) {
      const offC = c * D;
      let dot = 0;
      for (let d = 0; d < D; d++) dot += matrix[offI + d] * centroids[offC + d];
      if (dot > bestDot) {
        bestDot = dot;
        bestC = c;
      }
    }
    clusterAssignments[i] = bestC;
  }

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
    const lx = pcaCoords[i * 3] * 0.35;
    const ly = pcaCoords[i * 3 + 1] * 0.35;
    const lz = pcaCoords[i * 3 + 2] * 0.35;

    clusterCoords[i * 3] = center.x + lx;
    clusterCoords[i * 3 + 1] = center.y + ly;
    clusterCoords[i * 3 + 2] = center.z + lz;
  }

  const clusterPath = path.join(publicDataDir, 'coords3d_clusters.bin');
  fs.writeFileSync(clusterPath, Buffer.from(clusterCoords.buffer));
  console.log(`[OK] Guardado Cúmulos 3D: ${clusterPath}`);
}

generateLayaEmbeddings().catch(console.error);
