import { pipeline } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LayaSemanticService {
  constructor() {
    this.extractor = null;
    this.classifier = null;
    this.vectorCache = new Map();
    this.isReady = false;
    this.loadingPromise = null;

    // Vocabulario y matriz precomputada Laya (384D)
    this.vocab = [];
    this.matrix = null; // Float32Array (10000 * 384)
    this.dimensions = 384;
    this.wordToIndex = new Map();
  }

  async init() {
    if (this.isReady) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      console.log('[Laya Engine] Inicializando modelo Transformer ONNX Laya Multilingüe (Español NATIVO)...');
      // paraphrase-multilingual-MiniLM-L12-v2 has native Spanish tokenizer and embeddings (384D)
      this.extractor = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');

      // Cargar matriz base precomputada si existe en public/data
      const publicDataDir = path.join(__dirname, '..', 'public', 'data');
      const vocabPath = path.join(publicDataDir, 'vocab.json');
      const binPath = path.join(publicDataDir, 'laya_embeddings.bin');

      if (fs.existsSync(vocabPath) && fs.existsSync(binPath)) {
        try {
          const vocabData = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));
          this.vocab = vocabData.words;
          this.dimensions = vocabData.dimensions || 384;

          const binBuffer = fs.readFileSync(binPath);
          this.matrix = new Float32Array(binBuffer.buffer, binBuffer.byteOffset, binBuffer.byteLength / 4);

          for (let i = 0; i < this.vocab.length; i++) {
            const w = this.vocab[i].toLowerCase().trim();
            this.wordToIndex.set(w, i);
            const offset = i * this.dimensions;
            const vec = Array.from(this.matrix.subarray(offset, offset + this.dimensions));
            this.vectorCache.set(w, vec);
          }
          console.log(`[Laya Engine] Matriz base cargada: ${this.vocab.length} palabras (${this.dimensions}D).`);
        } catch (e) {
          console.warn('[Laya Engine] Advertencia al precargar matriz:', e.message);
        }
      }

      this.isReady = true;
      console.log('[Laya Engine] Motor Laya ONNX Multilingüe listo y verificado.');
    })();

    return this.loadingPromise;
  }

  async getVector(word) {
    await this.init();
    const clean = word.toLowerCase().trim();
    if (this.vectorCache.has(clean)) {
      return this.vectorCache.get(clean);
    }

    // Extracción en tiempo real vía Transformer ONNX para palabras fuera del vocabulario
    const output = await this.extractor(clean, { pooling: 'mean', normalize: true });
    const vec = Array.from(output.data);
    this.vectorCache.set(clean, vec);
    return vec;
  }

  async getVectors(words = []) {
    await this.init();
    const results = {};
    const missing = [];

    for (const w of words) {
      const clean = w.toLowerCase().trim();
      if (this.vectorCache.has(clean)) {
        results[clean] = this.vectorCache.get(clean);
      } else {
        missing.push(clean);
      }
    }

    if (missing.length > 0) {
      const output = await this.extractor(missing, { pooling: 'mean', normalize: true });
      for (let i = 0; i < missing.length; i++) {
        const vec = Array.from(output[i].data);
        const w = missing[i];
        this.vectorCache.set(w, vec);
        results[w] = vec;
      }
    }

    return results;
  }

  async calculateSimilarity(wordA, wordB) {
    const vecA = await this.getVector(wordA);
    const vecB = await this.getVector(wordB);

    let dot = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
    }
    dot = Math.max(-1, Math.min(1, dot));

    const distance = 1 - dot;
    const angleRad = Math.acos(dot);
    const angleDeg = (angleRad * 180) / Math.PI;

    return {
      wordA,
      wordB,
      similarity: dot,
      similarityPercent: Math.max(0, dot * 100),
      distance,
      angleDegrees: angleDeg
    };
  }

  async classifyWord(word, categories = []) {
    if (!categories || categories.length === 0) return [];
    
    // Cargar clusters de usuario si están disponibles para enriquecer la clasificación
    let userClusters = [];
    try {
      const clustersPath = path.join(__dirname, '..', 'public', 'data', 'user_clusters.json');
      if (fs.existsSync(clustersPath)) {
        userClusters = JSON.parse(fs.readFileSync(clustersPath, 'utf-8'));
      }
    } catch (e) {}

    const scores = [];
    for (const catItem of categories) {
      const catName = typeof catItem === 'string' ? catItem : (catItem.name || '');
      const catObj = (typeof catItem === 'object' && catItem.words)
        ? catItem
        : userClusters.find(c => c.name.toLowerCase() === catName.toLowerCase());

      // 1. Similitud con el nombre de la categoría
      const simName = await this.calculateSimilarity(word, catName);

      // 2. Similitud con los miembros del cluster
      let memberScore = simName.similarity;
      if (catObj && Array.isArray(catObj.words) && catObj.words.length > 0) {
        const memberSims = [];
        for (const mw of catObj.words) {
          const s = await this.calculateSimilarity(word, mw);
          memberSims.push(s.similarity);
        }
        memberSims.sort((a, b) => b - a);
        const topK = Math.min(4, memberSims.length);
        let sum = 0;
        for (let k = 0; k < topK; k++) sum += memberSims[k];
        memberScore = sum / topK;
      }

      // Ponderación: 70% afinidad con palabras miembro + 30% afinidad con nombre del cluster
      const combinedScore = (memberScore * 0.70) + (simName.similarity * 0.30);

      scores.push({
        category: catName,
        similarity: combinedScore,
        distance: 1 - combinedScore
      });
    }

    // Softmax probabilities con temperatura adecuada
    const exps = scores.map(s => Math.exp(s.similarity * 6.0));
    const sumExps = exps.reduce((a, b) => a + b, 0);

    return scores.map((s, idx) => ({
      ...s,
      probability: (exps[idx] / sumExps)
    })).sort((a, b) => b.probability - a.probability);
  }

  async getNearestNeighbors(targetWord, { k = 8 } = {}) {
    await this.init();
    const targetVec = await this.getVector(targetWord);
    if (!this.matrix || this.vocab.length === 0) {
      return { targetWord, neighbors: [] };
    }

    const clean = targetWord.toLowerCase().trim();
    const N = this.vocab.length;
    const D = this.dimensions;
    const candidates = [];

    for (let i = 0; i < N; i++) {
      const candWord = this.vocab[i];
      if (candWord === clean) continue;

      const offset = i * D;
      let dot = 0;
      for (let d = 0; d < D; d++) {
        dot += targetVec[d] * this.matrix[offset + d];
      }

      candidates.push({
        word: candWord,
        similarity: dot,
        distance: 1 - dot,
        index: i
      });
    }

    candidates.sort((a, b) => b.similarity - a.similarity);
    return {
      targetWord: clean,
      neighbors: candidates.slice(0, k)
    };
  }
}

export const layaService = new LayaSemanticService();
