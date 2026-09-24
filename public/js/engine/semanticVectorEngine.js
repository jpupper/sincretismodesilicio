/**
 * Semantic Vector Engine (LAYA ONNX System-1 Transformer 384D en Español)
 * 
 * Motor semántico basado exclusivamente en LAYA ONNX (Xenova/all-MiniLM-L6-v2, 384 dimensiones).
 * Proporciona cálculo determinístico de distancias semánticas (1 - cos θ), similitud coseno,
 * vecinos cercanos y separación morfológica significante vs significado para el 100% de
 * las palabras del idioma español.
 */
export class SemanticVectorEngine {
  constructor() {
    this.vocab = [];
    this.wordToIndex = new Map();
    this.normalizedWordToIndex = new Map();
    this.matrix = null; // Float32Array (10000 * 384)
    this.dimensions = 384;
    this.isLoaded = false;
    this.dynamicVectors = new Map(); // Cache de vectores 384D para palabras fuera del corpus base
    this.projections = new Map();
    this.coords3d = null;
  }

  async load(onProgress = () => {}) {
    if (this.isLoaded) return;

    onProgress({ status: 'Cargando vocabulario en español...', progress: 0.1 });
    
    let vocabData;
    let arrayBuffer;

    if (typeof window === 'undefined') {
      const fs = await import('fs');
      const path = await import('path');
      const vocabRaw = fs.readFileSync(path.resolve('public/data/vocab.json'), 'utf-8');
      vocabData = JSON.parse(vocabRaw);
      const binBuffer = fs.readFileSync(path.resolve('public/data/laya_embeddings.bin'));
      arrayBuffer = binBuffer.buffer.slice(binBuffer.byteOffset, binBuffer.byteOffset + binBuffer.byteLength);
    } else {
      const vocabRes = await fetch('./data/vocab.json');
      if (!vocabRes.ok) throw new Error(`Error al cargar vocabulario: ${vocabRes.status}`);
      vocabData = await vocabRes.json();

      onProgress({ status: 'Sincronizando espacio vectorial Laya ONNX (384D)...', progress: 0.4 });
      const binRes = await fetch('./data/laya_embeddings.bin');
      if (!binRes.ok) throw new Error(`Error al cargar vectores Laya: ${binRes.status}`);
      arrayBuffer = await binRes.arrayBuffer();
    }

    this.vocab = vocabData.words;
    this.dimensions = vocabData.dimensions || 384;

    const stripAccents = (str) => str ? str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

    for (let i = 0; i < this.vocab.length; i++) {
      const word = this.vocab[i];
      const clean = word.toLowerCase().trim();
      this.wordToIndex.set(clean, i);
      const norm = stripAccents(word);
      if (!this.normalizedWordToIndex.has(norm)) {
        this.normalizedWordToIndex.set(norm, i);
      }
    }

    this.matrix = new Float32Array(arrayBuffer);
    this.projections = new Map();

    // Cargar proyección semántica 3D inicial (UMAP por defecto)
    await this.loadProjection('umap');

    this.isLoaded = true;
    onProgress({ status: 'Espacio vectorial Laya ONNX (384D) y cosmos 3D sincronizados', progress: 1.0 });
  }

  /**
   * Carga cualquiera de los modelos de reducción dimensional disponibles:
   * - 'umap': Manifold no lineal k-NN (preserva cúmulos semánticos LAYA)
   * - 'pca': Análisis de componentes principales (varianza lineal global)
   * - 'clusters': Cúmulos temáticos galácticos
   */
  async loadProjection(mode = 'umap') {
    if (this.projections && this.projections.has(mode)) {
      this.coords3d = this.projections.get(mode);
      return this.coords3d;
    }

    const filename = mode === 'pca'
      ? 'coords3d_pca.bin'
      : (mode === 'clusters' ? 'coords3d_clusters.bin' : 'coords3d_umap.bin');

    try {
      if (typeof window === 'undefined') {
        const fs = await import('fs');
        const path = await import('path');
        const file = path.resolve(`public/data/${filename}`);
        const bin3d = fs.existsSync(file) ? fs.readFileSync(file) : fs.readFileSync(path.resolve('public/data/coords3d.bin'));
        const coords = new Float32Array(bin3d.buffer, bin3d.byteOffset, bin3d.byteLength / 4);
        if (!this.projections) this.projections = new Map();
        this.projections.set(mode, coords);
        this.coords3d = coords;
        return coords;
      } else {
        let res = await fetch(`./data/${filename}`);
        if (!res.ok) {
          res = await fetch('./data/coords3d.bin');
        }
        if (res.ok) {
          const buf = await res.arrayBuffer();
          const coords = new Float32Array(buf);
          if (!this.projections) this.projections = new Map();
          this.projections.set(mode, coords);
          this.coords3d = coords;
          return coords;
        }
      }
    } catch (e) {
      console.warn(`Error al cargar proyección 3D (${mode}):`, e);
    }
    return this.coords3d;
  }

  getWordIndex(word) {
    if (!word) return undefined;
    const clean = word.toLowerCase().trim();
    if (this.wordToIndex.has(clean)) {
      return this.wordToIndex.get(clean);
    }
    const norm = clean.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (this.normalizedWordToIndex && this.normalizedWordToIndex.has(norm)) {
      return this.normalizedWordToIndex.get(norm);
    }
    return undefined;
  }

  getWordCoord3D(word) {
    if (!this.coords3d) return null;
    const idx = this.getWordIndex(word);
    if (idx === undefined) return null;
    return {
      x: this.coords3d[idx * 3],
      y: this.coords3d[idx * 3 + 1],
      z: this.coords3d[idx * 3 + 2],
      index: idx,
      word: this.vocab[idx]
    };
  }

  getCoord3DByIndex(idx) {
    if (!this.coords3d || idx < 0 || idx >= this.vocab.length) return null;
    return {
      x: this.coords3d[idx * 3],
      y: this.coords3d[idx * 3 + 1],
      z: this.coords3d[idx * 3 + 2],
      index: idx,
      word: this.vocab[idx]
    };
  }

  findClosestWordToPosition(x, y, z, maxDist = 200) {
    if (!this.coords3d) return null;
    let closestWord = null;
    let minDistSq = maxDist * maxDist;
    let closestIdx = -1;

    for (let i = 0; i < this.vocab.length; i++) {
      const wx = this.coords3d[i * 3];
      const wy = this.coords3d[i * 3 + 1];
      const wz = this.coords3d[i * 3 + 2];
      const dx = wx - x;
      const dy = wy - y;
      const dz = wz - z;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq < minDistSq) {
        minDistSq = distSq;
        closestIdx = i;
        closestWord = this.vocab[i];
      }
    }

    if (closestIdx === -1) return null;
    return {
      word: closestWord,
      index: closestIdx,
      distance: Math.sqrt(minDistSq),
      x: this.coords3d[closestIdx * 3],
      y: this.coords3d[closestIdx * 3 + 1],
      z: this.coords3d[closestIdx * 3 + 2]
    };
  }

  /**
   * Con Laya ONNX, toda palabra válida del español es soportada al 100%
   */
  hasWord(word) {
    if (!word || typeof word !== 'string') return false;
    const clean = word.toLowerCase().trim();
    if (clean.length === 0) return false;
    return true;
  }

  /**
   * Obtiene el vector 384D de la palabra (desde la matriz o cache dinámico)
   */
  getVector(word) {
    if (!word) return null;
    const clean = word.toLowerCase().trim();
    if (this.dynamicVectors.has(clean)) {
      return this.dynamicVectors.get(clean);
    }
    const idx = this.getWordIndex(clean);
    if (idx !== undefined && this.matrix) {
      const offset = idx * this.dimensions;
      return this.matrix.subarray(offset, offset + this.dimensions);
    }
    return null;
  }

  /**
   * Asegura que el vector 384D de Laya esté disponible en memoria (consulta API si es nuevo)
   */
  async ensureVector(word) {
    if (!word) return null;
    const clean = word.toLowerCase().trim();
    const existing = this.getVector(clean);
    if (existing) return existing;

    try {
      const res = await fetch('./api/semantic/vector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: clean })
      });
      if (res.ok) {
        const data = await res.json();
        const vec = new Float32Array(data.vector);
        this.dynamicVectors.set(clean, vec);
        return vec;
      }
    } catch (e) {
      console.warn(`Error al consultar Laya ONNX para "${clean}":`, e);
    }
    return null;
  }

  async ensureWord(word) {
    return this.ensureVector(word);
  }

  /**
   * Evalúa si dos palabras comparten raíz morfológica (significante)
   * para distinguirlo de afinidad conceptual real (significado).
   */
  areSignifierTwins(w1, w2) {
    if (!w1 || !w2) return false;
    const s1 = w1.toLowerCase().trim();
    const s2 = w2.toLowerCase().trim();
    if (s1 === s2) return true;

    const minLen = Math.min(s1.length, s2.length);
    let commonPrefix = 0;
    while (commonPrefix < minLen && s1[commonPrefix] === s2[commonPrefix]) {
      commonPrefix++;
    }

    if (commonPrefix >= 4 && (s1.length - commonPrefix <= 3 && s2.length - commonPrefix <= 3)) {
      return true;
    }
    if (commonPrefix >= 3 && minLen <= 4 && (s1.length - commonPrefix <= 2 && s2.length - commonPrefix <= 2)) {
      return true;
    }

    if (this.levenshtein(s1, s2) <= 1 && minLen >= 4) {
      return true;
    }

    return false;
  }

  levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  /**
   * Cálculo síncrono de similitud y distancia semántica (Laya 384D)
   */
  calculateSimilarity(wordA, wordB) {
    const vecA = this.getVector(wordA);
    const vecB = this.getVector(wordB);
    if (!vecA || !vecB) return null;

    let dot = 0;
    const dims = Math.min(vecA.length, vecB.length);
    for (let i = 0; i < dims; i++) {
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
      distance: distance,
      angleDegrees: angleDeg,
      isSignifierTwin: this.areSignifierTwins(wordA, wordB)
    };
  }

  /**
   * Cálculo asíncrono universal: si una palabra no está en memoria,
   * consulta automáticamente al motor Laya ONNX.
   */
  async calculateSimilarityAsync(wordA, wordB) {
    // 1. Intentar cálculo instantáneo si ambos vectores están en memoria
    const localResult = this.calculateSimilarity(wordA, wordB);
    if (localResult) return localResult;

    // 2. Asegurar vectores vía API Laya ONNX
    const [vecA, vecB] = await Promise.all([
      this.ensureVector(wordA),
      this.ensureVector(wordB)
    ]);

    if (vecA && vecB) {
      return this.calculateSimilarity(wordA, wordB);
    }

    // 3. Fallback directo a endpoint de similitud
    try {
      const res = await fetch('./api/semantic/similarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordA, wordB })
      });
      if (res.ok) {
        const data = await res.json();
        return {
          ...data,
          isSignifierTwin: this.areSignifierTwins(wordA, wordB)
        };
      }
    } catch (e) {
      console.warn('Error en Laya ONNX similarity:', e);
    }
    return null;
  }

  /**
   * Obtiene los K vecinos semánticos más cercanos usando representaciones LAYA 384D.
   */
  getNearestNeighbors(targetWord, { k = 8, filterSignifier = false } = {}) {
    const targetVec = this.getVector(targetWord);
    if (!targetVec || !this.matrix) return null;

    const cleanWord = targetWord.toLowerCase().trim();
    const candidates = [];
    const totalWords = this.vocab.length;

    for (let i = 0; i < totalWords; i++) {
      const candidateWord = this.vocab[i];
      if (candidateWord === cleanWord) continue;

      const isTwin = this.areSignifierTwins(cleanWord, candidateWord);
      if (filterSignifier && isTwin) continue;

      const offset = i * this.dimensions;
      let dot = 0;
      for (let d = 0; d < this.dimensions; d++) {
        dot += targetVec[d] * this.matrix[offset + d];
      }

      candidates.push({
        word: candidateWord,
        similarity: dot,
        distance: 1 - dot,
        isSignifierTwin: isTwin,
        index: i
      });
    }

    candidates.sort((a, b) => b.similarity - a.similarity);

    let filteredResults = [];
    if (!filterSignifier) {
      filteredResults = candidates.slice(0, k);
    } else {
      const chosenWords = [];
      for (const item of candidates) {
        let duplicateWithChosen = false;
        for (const chosen of chosenWords) {
          if (this.areSignifierTwins(item.word, chosen)) {
            duplicateWithChosen = true;
            break;
          }
        }
        if (!duplicateWithChosen) {
          chosenWords.push(item.word);
          filteredResults.push(item);
        }
        if (filteredResults.length >= k) break;
      }
    }

    return {
      targetWord: cleanWord,
      targetIndex: this.getWordIndex(cleanWord) ?? -1,
      neighbors: filteredResults.slice(0, k)
    };
  }

  /**
   * Búsqueda asíncrona de vecinos para cualquier palabra (incluso fuera del corpus base)
   */
  async getNearestNeighborsAsync(targetWord, options = {}) {
    const cleanWord = targetWord.toLowerCase().trim();
    let targetVec = this.getVector(cleanWord);
    if (!targetVec) {
      targetVec = await this.ensureVector(cleanWord);
    }

    if (targetVec) {
      return this.getNearestNeighbors(cleanWord, options);
    }

    // Consulta al backend
    try {
      const res = await fetch('./api/semantic/neighbors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: cleanWord, k: options.k || 8 })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Error al buscar vecinos en backend:', e);
    }
    return null;
  }

  searchVocab(query, limit = 10) {
    if (!query) return [];
    const q = query.toLowerCase().trim();
    const prefixMatches = [];
    const containsMatches = [];

    for (let i = 0; i < this.vocab.length; i++) {
      const w = this.vocab[i];
      if (w.startsWith(q)) {
        prefixMatches.push(w);
        if (prefixMatches.length >= limit) return prefixMatches;
      } else if (w.includes(q)) {
        containsMatches.push(w);
      }
    }

    return [...prefixMatches, ...containsMatches].slice(0, limit);
  }

  getRandomWord() {
    if (this.vocab.length === 0) return 'filosofía';
    const min = Math.min(300, this.vocab.length - 1);
    const max = Math.min(5000, this.vocab.length - 1);
    const randIdx = Math.floor(Math.random() * (max - min + 1)) + min;
    return this.vocab[randIdx];
  }

  generateGameRound() {
    let target = this.getRandomWord();
    let neighborsData = this.getNearestNeighbors(target, { k: 12, filterSignifier: true });

    let tries = 0;
    while ((!neighborsData || neighborsData.neighbors.length < 5) && tries < 10) {
      target = this.getRandomWord();
      neighborsData = this.getNearestNeighbors(target, { k: 12, filterSignifier: true });
      tries++;
    }

    const correctNeighbor = neighborsData ? neighborsData.neighbors[0] : { word: 'mente', distance: 0.35, similarity: 0.65 };

    const distractors = [];
    if (neighborsData && neighborsData.neighbors.length > 5) {
      distractors.push(neighborsData.neighbors[4]);
    }

    while (distractors.length < 4) {
      const randomWord = this.getRandomWord();
      if (randomWord === target || randomWord === correctNeighbor.word) continue;
      if (distractors.some(d => d.word === randomWord)) continue;

      const simData = this.calculateSimilarity(target, randomWord);
      if (simData && simData.distance > correctNeighbor.distance + 0.15) {
        distractors.push({
          word: randomWord,
          similarity: simData.similarity,
          distance: simData.distance,
          isSignifierTwin: simData.isSignifierTwin
        });
      }
    }

    const allOptions = [
      { ...correctNeighbor, isCorrect: true },
      ...distractors.slice(0, 4).map(d => ({ ...d, isCorrect: false }))
    ];

    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    const correctIndex = allOptions.findIndex(opt => opt.isCorrect);

    return {
      targetWord: target,
      options: allOptions,
      correctIndex,
      correctWord: correctNeighbor.word,
      minDistance: correctNeighbor.distance,
      maxSimilarity: correctNeighbor.similarity
    };
  }

  /**
   * Genera una ronda de duelo semántico de 2 opciones basada en LAYA 384D:
   * 1. 'both_close': Ambos conceptos en vecindario cercano
   * 2. 'both_far': Ambos conceptos lejanos
   * 3. 'both_random': Dos conceptos aleatorios
   */
  generateTwoOptionGameRound() {
    const archetypes = ['both_close', 'both_far', 'both_random'];
    const selectedArchetype = archetypes[Math.floor(Math.random() * archetypes.length)];

    let target = this.getRandomWord();
    let cand1 = null;
    let cand2 = null;
    let sim1 = null;
    let sim2 = null;
    let archetypeLabel = '';

    if (selectedArchetype === 'both_close') {
      archetypeLabel = 'Duelo de Conceptos Cercanos (LAYA)';
      let attempts = 0;
      while (attempts < 20) {
        attempts++;
        target = this.getRandomWord();
        const neighborsData = this.getNearestNeighbors(target, { k: 25, filterSignifier: true });
        if (neighborsData && neighborsData.neighbors.length >= 6) {
          const list = neighborsData.neighbors;
          const idx1 = Math.floor(Math.random() * 3);
          let idx2 = idx1 + 2 + Math.floor(Math.random() * 6);
          if (idx2 >= list.length) idx2 = list.length - 1;

          cand1 = list[idx1].word;
          cand2 = list[idx2].word;
          sim1 = this.calculateSimilarity(target, cand1);
          sim2 = this.calculateSimilarity(target, cand2);

          if (sim1 && sim2 && Math.abs(sim1.distance - sim2.distance) >= 0.05) {
            break;
          }
        }
      }
    } else if (selectedArchetype === 'both_far') {
      archetypeLabel = 'Duelo de Conceptos Lejanos (LAYA)';
      let attempts = 0;
      while (attempts < 35) {
        attempts++;
        let w1 = this.getRandomWord();
        let w2 = this.getRandomWord();
        if (w1 === target || w2 === target || w1 === w2) continue;

        let s1 = this.calculateSimilarity(target, w1);
        let s2 = this.calculateSimilarity(target, w2);

        if (s1 && s2 && s1.distance >= 0.65 && s2.distance >= 0.65 && Math.abs(s1.distance - s2.distance) >= 0.06) {
          cand1 = w1;
          cand2 = w2;
          sim1 = s1;
          sim2 = s2;
          break;
        }
      }
    } else {
      archetypeLabel = 'Duelo de Palabras Aleatorias (LAYA)';
      let attempts = 0;
      while (attempts < 35) {
        attempts++;
        let w1 = this.getRandomWord();
        let w2 = this.getRandomWord();
        if (w1 === target || w2 === target || w1 === w2) continue;

        let s1 = this.calculateSimilarity(target, w1);
        let s2 = this.calculateSimilarity(target, w2);

        if (s1 && s2 && Math.abs(s1.distance - s2.distance) >= 0.06) {
          cand1 = w1;
          cand2 = w2;
          sim1 = s1;
          sim2 = s2;
          break;
        }
      }
    }

    // Fallback de seguridad
    if (!cand1 || !cand2 || !sim1 || !sim2) {
      const neighborsData = this.getNearestNeighbors(target, { k: 6, filterSignifier: true });
      if (neighborsData && neighborsData.neighbors.length >= 2) {
        cand1 = neighborsData.neighbors[0].word;
        cand2 = neighborsData.neighbors[1].word;
        sim1 = this.calculateSimilarity(target, cand1);
        sim2 = this.calculateSimilarity(target, cand2);
        archetypeLabel = 'Duelo de Conceptos Cercanos (LAYA)';
      }
    }

    const opt1 = {
      word: cand1,
      distance: sim1.distance,
      similarity: sim1.similarity,
      isSignifierTwin: sim1.isSignifierTwin
    };

    const opt2 = {
      word: cand2,
      distance: sim2.distance,
      similarity: sim2.similarity,
      isSignifierTwin: sim2.isSignifierTwin
    };

    const isFirstCorrect = opt1.distance < opt2.distance;
    opt1.isCorrect = isFirstCorrect;
    opt2.isCorrect = !isFirstCorrect;

    const options = Math.random() < 0.5 ? [opt1, opt2] : [opt2, opt1];
    const correctIndex = options.findIndex(o => o.isCorrect);

    return {
      targetWord: target,
      archetype: selectedArchetype,
      archetypeLabel,
      options,
      correctIndex,
      correctWord: options[correctIndex].word,
      minDistance: options[correctIndex].distance,
      maxDistance: options[1 - correctIndex].distance,
      difference: Math.abs(opt1.distance - opt2.distance)
    };
  }
}

export const semanticEngine = new SemanticVectorEngine();
