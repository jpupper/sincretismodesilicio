/**
 * Semantic Vector Engine (Word2Vec / FastText 300D in Spanish)
 * Computes cosine similarities, semantic distances, and distinguishes
 * semantic meaning (significado) from morphological form (significante).
 */
export class SemanticVectorEngine {
  constructor() {
    this.vocab = [];
    this.wordToIndex = new Map();
    this.matrix = null; // Float32Array
    this.dimensions = 300;
    this.isLoaded = false;
  }

  async load(onProgress = () => {}) {
    if (this.isLoaded) return;

    onProgress({ status: 'Cargando vocabulario...', progress: 0.1 });
    
    // In browser, use relative path; in node test scripts, read file directly or from localhost
    let vocabData;
    let arrayBuffer;

    if (typeof window === 'undefined') {
      const fs = await import('fs');
      const path = await import('path');
      const vocabRaw = fs.readFileSync(path.resolve('public/data/vocab.json'), 'utf-8');
      vocabData = JSON.parse(vocabRaw);
      const binBuffer = fs.readFileSync(path.resolve('public/data/embeddings.bin'));
      arrayBuffer = binBuffer.buffer.slice(binBuffer.byteOffset, binBuffer.byteOffset + binBuffer.byteLength);
    } else {
      const vocabRes = await fetch('./data/vocab.json');
      if (!vocabRes.ok) throw new Error(`Error al cargar vocabulario: ${vocabRes.status}`);
      vocabData = await vocabRes.json();

      onProgress({ status: 'Cargando matriz de vectores (300D)...', progress: 0.4 });
      const binRes = await fetch('./data/embeddings.bin');
      if (!binRes.ok) throw new Error(`Error al cargar vectores: ${binRes.status}`);
      arrayBuffer = await binRes.arrayBuffer();
    }

    this.vocab = vocabData.words;
    this.dimensions = vocabData.dimensions || 300;

    for (let i = 0; i < this.vocab.length; i++) {
      this.wordToIndex.set(this.vocab[i], i);
    }

    this.matrix = new Float32Array(arrayBuffer);

    // Load 3D PCA coordinates
    try {
      if (typeof window === 'undefined') {
        const fs = await import('fs');
        const path = await import('path');
        const bin3d = fs.readFileSync(path.resolve('public/data/coords3d.bin'));
        this.coords3d = new Float32Array(bin3d.buffer, bin3d.byteOffset, bin3d.byteLength / 4);
      } else {
        const res3d = await fetch('./data/coords3d.bin');
        if (res3d.ok) {
          const buf3d = await res3d.arrayBuffer();
          this.coords3d = new Float32Array(buf3d);
        }
      }
    } catch (e) {
      console.warn('Coords3d loading fallback:', e);
    }

    this.isLoaded = true;
    onProgress({ status: 'Espacio vectorial y cosmos 3D sincronizados', progress: 1.0 });
  }

  getWordCoord3D(word) {
    if (!this.coords3d) return null;
    const idx = this.wordToIndex.get(word.toLowerCase().trim());
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

  hasWord(word) {
    if (!word) return false;
    return this.wordToIndex.has(word.toLowerCase().trim());
  }

  getVector(word) {
    const idx = this.wordToIndex.get(word.toLowerCase().trim());
    if (idx === undefined) return null;
    const offset = idx * this.dimensions;
    return this.matrix.subarray(offset, offset + this.dimensions);
  }

  /**
   * Evaluates if two words share morphological roots (significante)
   * rather than being distinct conceptual representations (significado).
   */
  areSignifierTwins(w1, w2) {
    const s1 = w1.toLowerCase().trim();
    const s2 = w2.toLowerCase().trim();
    if (s1 === s2) return true;

    // Plural / feminine / simple ending variations
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
   * Calculates cosine similarity and semantic distance between two words
   */
  calculateSimilarity(wordA, wordB) {
    const vecA = this.getVector(wordA);
    const vecB = this.getVector(wordB);
    if (!vecA || !vecB) return null;

    let dot = 0;
    for (let i = 0; i < this.dimensions; i++) {
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
   * Retrieves the K nearest semantic neighbors in the 300D vector space.
   */
  getNearestNeighbors(targetWord, { k = 8, filterSignifier = false } = {}) {
    const cleanWord = targetWord.toLowerCase().trim();
    const targetIdx = this.wordToIndex.get(cleanWord);
    if (targetIdx === undefined) return null;

    const targetOffset = targetIdx * this.dimensions;
    const targetVec = this.matrix.subarray(targetOffset, targetOffset + this.dimensions);

    const candidates = [];
    const totalWords = this.vocab.length;

    for (let i = 0; i < totalWords; i++) {
      if (i === targetIdx) continue;

      const candidateWord = this.vocab[i];

      const isTwin = this.areSignifierTwins(cleanWord, candidateWord);
      if (filterSignifier && isTwin) {
        continue;
      }

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
      targetIndex: targetIdx,
      neighbors: filteredResults.slice(0, k)
    };
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

    const correctNeighbor = neighborsData.neighbors[0];

    const distractors = [];

    if (neighborsData.neighbors.length > 5) {
      distractors.push(neighborsData.neighbors[4]);
    }

    while (distractors.length < 4) {
      const randomWord = this.getRandomWord();
      if (randomWord === target || randomWord === correctNeighbor.word) continue;
      if (distractors.some(d => d.word === randomWord)) continue;

      const simData = this.calculateSimilarity(target, randomWord);
      if (simData.distance > correctNeighbor.distance + 0.15) {
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
   * Generates a 2-option game round adhering to the 3 balanced archetypes:
   * 1. 'both_close': Both words are in the target's semantic neighborhood (nuanced comparison).
   * 2. 'both_far': Both words are distant (subtle distinction).
   * 3. 'both_random': Both words are selected completely at random from vocabulary.
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
      archetypeLabel = 'Duelo de Conceptos Cercanos';
      let attempts = 0;
      while (attempts < 20) {
        attempts++;
        target = this.getRandomWord();
        const neighborsData = this.getNearestNeighbors(target, { k: 25, filterSignifier: true });
        if (neighborsData && neighborsData.neighbors.length >= 6) {
          const list = neighborsData.neighbors;
          const idx1 = Math.floor(Math.random() * 3); // top 3 neighbor
          let idx2 = idx1 + 2 + Math.floor(Math.random() * 6); // slightly further neighbor
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
      archetypeLabel = 'Duelo de Conceptos Lejanos';
      let attempts = 0;
      while (attempts < 35) {
        attempts++;
        let w1 = this.getRandomWord();
        let w2 = this.getRandomWord();
        if (w1 === target || w2 === target || w1 === w2) continue;

        let s1 = this.calculateSimilarity(target, w1);
        let s2 = this.calculateSimilarity(target, w2);

        // Both words must be distant (distance >= 0.65) with noticeable separation
        if (s1.distance >= 0.65 && s2.distance >= 0.65 && Math.abs(s1.distance - s2.distance) >= 0.06) {
          cand1 = w1;
          cand2 = w2;
          sim1 = s1;
          sim2 = s2;
          break;
        }
      }
    } else {
      // 'both_random': completely random words without pre-filtering
      archetypeLabel = 'Duelo de Palabras Aleatorias';
      let attempts = 0;
      while (attempts < 35) {
        attempts++;
        let w1 = this.getRandomWord();
        let w2 = this.getRandomWord();
        if (w1 === target || w2 === target || w1 === w2) continue;

        let s1 = this.calculateSimilarity(target, w1);
        let s2 = this.calculateSimilarity(target, w2);

        if (Math.abs(s1.distance - s2.distance) >= 0.06) {
          cand1 = w1;
          cand2 = w2;
          sim1 = s1;
          sim2 = s2;
          break;
        }
      }
    }

    // Safety fallback
    if (!cand1 || !cand2 || !sim1 || !sim2) {
      const neighborsData = this.getNearestNeighbors(target, { k: 6, filterSignifier: true });
      if (neighborsData && neighborsData.neighbors.length >= 2) {
        cand1 = neighborsData.neighbors[0].word;
        cand2 = neighborsData.neighbors[1].word;
        sim1 = this.calculateSimilarity(target, cand1);
        sim2 = this.calculateSimilarity(target, cand2);
        archetypeLabel = 'Duelo de Conceptos Cercanos';
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

    // Randomize position (Option A vs Option B)
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
