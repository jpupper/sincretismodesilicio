import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function prepareEmbeddings() {
  const publicDataDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(publicDataDir)) {
    fs.mkdirSync(publicDataDir, { recursive: true });
  }

  const binPath = path.join(publicDataDir, 'embeddings.bin');
  const vocabPath = path.join(publicDataDir, 'vocab.json');

  if (fs.existsSync(binPath) && fs.existsSync(vocabPath)) {
    console.log('Embeddings and vocab already exist. Checking integrity...');
    const stats = fs.statSync(binPath);
    if (stats.size > 1000000) {
      console.log(`Embeddings found (${(stats.size / 1024 / 1024).toFixed(2)} MB). Skipping download.`);
      return;
    }
  }

  console.log('Fetching FastText Spanish embeddings chunk from Facebook AI public files (~36 MB)...');
  const res = await fetch('https://dl.fbaipublicfiles.com/fasttext/vectors-wiki/wiki.es.vec', {
    headers: { 'Range': 'bytes=0-36000000' }
  });

  if (!res.ok && res.status !== 206) {
    throw new Error(`Failed to fetch embeddings: HTTP ${res.status}`);
  }

  const buffer = await res.arrayBuffer();
  console.log(`Downloaded ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB. Parsing vectors...`);

  const text = new TextDecoder().decode(buffer);
  const lines = text.split('\n');

  const TARGET_WORDS = 10000;
  const DIMENSIONS = 300;

  const vocab = [];
  const vectorList = [];
  const seen = new Set();

  for (let i = 1; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const firstSpace = line.indexOf(' ');
    if (firstSpace === -1) continue;

    const rawWord = line.slice(0, firstSpace);
    const word = rawWord.toLowerCase();

    // Word cleaning: only spanish alphabetic characters, length between 3 and 22
    if (!/^[a-záéíóúüñ]{3,22}$/.test(word)) continue;
    if (seen.has(word)) continue;

    const parts = line.slice(firstSpace + 1).trim().split(/\s+/);
    if (parts.length < DIMENSIONS) continue;

    const vec = new Float32Array(DIMENSIONS);
    let norm = 0;
    for (let d = 0; d < DIMENSIONS; d++) {
      const val = parseFloat(parts[d]);
      vec[d] = val;
      norm += val * val;
    }

    norm = Math.sqrt(norm);
    if (norm === 0 || isNaN(norm)) continue;

    // Normalize to unit vector for instant dot-product cosine similarity
    for (let d = 0; d < DIMENSIONS; d++) {
      vec[d] /= norm;
    }

    seen.add(word);
    vocab.push(word);
    vectorList.push(vec);

    if (vocab.length >= TARGET_WORDS) break;
  }

  console.log(`Extracted ${vocab.length} valid Spanish words with ${DIMENSIONS}-dimensional normalized vectors.`);

  // Write binary vector matrix
  const totalFloats = vocab.length * DIMENSIONS;
  const flatMatrix = new Float32Array(totalFloats);
  for (let i = 0; i < vocab.length; i++) {
    flatMatrix.set(vectorList[i], i * DIMENSIONS);
  }

  fs.writeFileSync(binPath, Buffer.from(flatMatrix.buffer));
  console.log(`Saved binary embeddings to ${binPath} (${(flatMatrix.byteLength / 1024 / 1024).toFixed(2)} MB).`);

  // Write vocab metadata
  const vocabData = {
    count: vocab.length,
    dimensions: DIMENSIONS,
    words: vocab
  };
  fs.writeFileSync(vocabPath, JSON.stringify(vocabData));
  console.log(`Saved vocabulary index to ${vocabPath} (${(fs.statSync(vocabPath).size / 1024).toFixed(1)} KB).`);

  // Compute 3D PCA Coordinates for 3D Cosmos Visualizer
  console.log('Computing 3D PCA coordinates for 3D Cosmos Visualizer...');
  const N = vocab.length;
  const D = DIMENSIONS;

  const mean = new Float32Array(D);
  for (let i = 0; i < N; i++) {
    const off = i * D;
    for (let d = 0; d < D; d++) mean[d] += flatMatrix[off + d];
  }
  for (let d = 0; d < D; d++) mean[d] /= N;

  const components = [];
  for (let c = 0; c < 3; c++) {
    let v = new Float32Array(D);
    for (let d = 0; d < D; d++) v[d] = Math.random() - 0.5;
    let norm = Math.hypot(...v);
    for (let d = 0; d < D; d++) v[d] /= norm;

    for (let iter = 0; iter < 15; iter++) {
      for (let prev of components) {
        let dot = 0;
        for (let d = 0; d < D; d++) dot += v[d] * prev[d];
        for (let d = 0; d < D; d++) v[d] -= dot * prev[d];
      }
      const p = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const off = i * D;
        let sum = 0;
        for (let d = 0; d < D; d++) sum += (flatMatrix[off + d] - mean[d]) * v[d];
        p[i] = sum;
      }
      const nextV = new Float32Array(D);
      for (let i = 0; i < N; i++) {
        const off = i * D;
        const pi = p[i];
        for (let d = 0; d < D; d++) nextV[d] += (flatMatrix[off + d] - mean[d]) * pi;
      }
      let nextNorm = 0;
      for (let d = 0; d < D; d++) nextNorm += nextV[d] * nextV[d];
      nextNorm = Math.sqrt(nextNorm);
      if (nextNorm > 0) {
        for (let d = 0; d < D; d++) v[d] = nextV[d] / nextNorm;
      }
    }
    components.push(v);
  }

  const coords3d = new Float32Array(N * 3);
  let maxDist = 0;
  for (let i = 0; i < N; i++) {
    const off = i * D;
    let x = 0, y = 0, z = 0;
    for (let d = 0; d < D; d++) {
      const val = flatMatrix[off + d] - mean[d];
      x += val * components[0][d];
      y += val * components[1][d];
      z += val * components[2][d];
    }
    coords3d[i * 3 + 0] = x;
    coords3d[i * 3 + 1] = y;
    coords3d[i * 3 + 2] = z;
    const dist = Math.hypot(x, y, z);
    if (dist > maxDist) maxDist = dist;
  }

  const GALAXY_SCALE = 1800 / (maxDist || 1);
  for (let i = 0; i < N * 3; i++) {
    coords3d[i] *= GALAXY_SCALE;
  }

  const coordsPath = path.join(publicDataDir, 'coords3d.bin');
  fs.writeFileSync(coordsPath, Buffer.from(coords3d.buffer));
  console.log(`Saved 3D coordinates to ${coordsPath} (${(coords3d.byteLength / 1024).toFixed(1)} KB).`);
  console.log('Embeddings and 3D coordinates preparation completed successfully!');
}

prepareEmbeddings().catch(err => {
  console.error('Error preparing embeddings:', err);
  process.exit(1);
});
