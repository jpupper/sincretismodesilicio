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
    const vocabRes = await fetch('/data/vocab.json');
    if (!vocabRes.ok) throw new Error(`Error al cargar vocabulario: ${vocabRes.status}`);
    const vocabData = await vocabRes.json();
    this.vocab = vocabData.words;
    this.dimensions = vocabData.dimensions || 300;

    for (let i = 0; i < this.vocab.length; i++) {
      this.wordToIndex.set(this.vocab[i], i);
    }

    onProgress({ status: 'Cargando matriz de vectores (300D)...', progress: 0.4 });
    const binRes = await fetch('/data/embeddings.bin');
    if (!binRes.ok) throw new Error(`Error al cargar vectores: ${binRes.status}`);
    const arrayBuffer = await binRes.arrayBuffer();

    this.matrix = new Float32Array(arrayBuffer);
    this.isLoaded = true;
    onProgress({ status: 'Espacio vectorial sincronizado', progress: 1.0 });
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

    // Example: perro/perros (len 5 vs 6, prefix 5), musica/musical (prefix 5), rey/reyes (prefix 3)
    if (commonPrefix >= 4 && (s1.length - commonPrefix <= 3 && s2.length - commonPrefix <= 3)) {
      return true;
    }
    if (commonPrefix >= 3 && minLen <= 4 && (s1.length - commonPrefix <= 2 && s2.length - commonPrefix <= 2)) {
      return true;
    }

    // Check Levenshtein distance for very close strings (typos or 1 letter swap)
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
    // Clamp to [-1, 1]
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
   * Allows filtering morphological clones (Significante) to show pure concepts (Significado).
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

      // Check signifier filter if requested
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

    // Sort by descending similarity (ascending semantic distance)
    candidates.sort((a, b) => b.similarity - a.similarity);

    // If filterSignifier was false, we still ensure diversity if there are multiple plurals in top results
    let filteredResults = [];
    if (!filterSignifier) {
      filteredResults = candidates.slice(0, k);
    } else {
      // Further deduplicate between neighbors (e.g., avoid having both 'gato' and 'gatos')
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

  /**
   * Fast prefix and substring search for instant autocomplete
   */
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
    // Pick from words between index 500 and 6000 (richest conceptual vocabulary)
    const min = Math.min(300, this.vocab.length - 1);
    const max = Math.min(5000, this.vocab.length - 1);
    const randIdx = Math.floor(Math.random() * (max - min + 1)) + min;
    return this.vocab[randIdx];
  }

  /**
   * Generates a 5-choice game challenge:
   * 1 center word + 5 options around it.
   * 1 option is the CLOSEST semantic neighbor (lowest semantic distance).
   * The other 4 are distractors (higher semantic distance).
   */
  generateGameRound() {
    let target = this.getRandomWord();
    let neighborsData = this.getNearestNeighbors(target, { k: 12, filterSignifier: true });

    // Retry if neighbors are too few
    let tries = 0;
    while ((!neighborsData || neighborsData.neighbors.length < 5) && tries < 10) {
      target = this.getRandomWord();
      neighborsData = this.getNearestNeighbors(target, { k: 12, filterSignifier: true });
      tries++;
    }

    const correctNeighbor = neighborsData.neighbors[0]; // Lowest semantic distance

    // Select 4 distractors:
    // 1 distractor with medium similarity (rank 5-10 or distance ~0.60)
    // 1 distractor that is a morphological signifier trap (rhymes or sounds similar, but semantically distant) if possible, or far word
    // 2 far words (distance > 0.70)
    const distractors = [];

    // Medium distractor
    if (neighborsData.neighbors.length > 5) {
      distractors.push(neighborsData.neighbors[4]);
    }

    // Random far words
    while (distractors.length < 4) {
      const randomWord = this.getRandomWord();
      if (randomWord === target || randomWord === correctNeighbor.word) continue;
      if (distractors.some(d => d.word === randomWord)) continue;

      const simData = this.calculateSimilarity(target, randomWord);
      // Ensure distance is distinctly greater than correct option
      if (simData.distance > correctNeighbor.distance + 0.15) {
        distractors.push({
          word: randomWord,
          similarity: simData.similarity,
          distance: simData.distance,
          isSignifierTwin: simData.isSignifierTwin
        });
      }
    }

    // Assemble 5 options and shuffle
    const allOptions = [
      { ...correctNeighbor, isCorrect: true },
      ...distractors.slice(0, 4).map(d => ({ ...d, isCorrect: false }))
    ];

    // Shuffle
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
}

export const semanticEngine = new SemanticVectorEngine();
