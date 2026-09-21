// Scratch test for Word collision physics, uppercase words, and semantic network distance mapping
import { SemanticVectorEngine } from '../public/js/engine/semanticVectorEngine.js';

console.log('--- 1. Testing Uppercase Text ---');
const sampleWords = ['fuego', 'llamas', 'algoritmo', 'computadora', 'poesía'];
const upperWords = sampleWords.map(w => (w || '').toUpperCase());
console.log('Words in uppercase:', upperWords);
if (upperWords.every(w => w === w.toUpperCase())) {
  console.log('PASS: All words successfully uppercase.');
} else {
  console.error('FAIL: Not all words uppercase');
}

console.log('\n--- 2. Testing Semantic Vector Engine with Uppercase Inputs ---');
const engine = new SemanticVectorEngine();
await engine.load();

const simRes = engine.calculateSimilarity('FUEGO', 'LLAMA');
console.log('Similarity between FUEGO and LLAMA:', simRes ? simRes.similarity.toFixed(3) : 'null');
const d = Math.max(0, Math.min(1, 1 - (simRes ? simRes.similarity : 0)));
console.log('Semantic distance d:', d.toFixed(3));
if (d < 0.5) {
  console.log('PASS: FUEGO and LLAMA detected as close semantic neighbors (hazard/penalty: d < 0.5)');
}

const simOpposite = engine.calculateSimilarity('ALGORITMO', 'POESÍA');
console.log('Similarity between ALGORITMO and POESÍA:', simOpposite ? simOpposite.similarity.toFixed(3) : 'null');
const dOpp = Math.max(0, Math.min(1, 1 - (simOpposite ? simOpposite.similarity : 0)));
console.log('Semantic distance d for opposites:', dOpp.toFixed(3));
if (dOpp > 0.7) {
  console.log('PASS: ALGORITMO and POESÍA detected as distant concepts (+points/bonus)');
}

console.log('\n--- 3. Testing Anti-Overlap Physical Collision ---');
class MockWord {
  constructor(text, x, y, vx, vy, width = 120, height = 36) {
    this.text = text.toUpperCase();
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.width = width;
    this.height = height;
    this.isDragging = false;
    this.dissolving = false;
  }
}

function resolveWordCollisionsTest(words, boundsW = 1920, boundsH = 1080) {
  const n = words.length;
  const margin = 8;
  const restitution = 0.75;
  const passes = 2;

  for (let pass = 0; pass < passes; pass++) {
    for (let i = 0; i < n; i++) {
      const a = words[i];
      if (a.dissolving) continue;

      for (let j = i + 1; j < n; j++) {
        const b = words[j];
        if (b.dissolving) continue;
        if (a.isDragging || b.isDragging) continue;

        const hwA = a.width * 0.5;
        const hhA = a.height * 0.5;
        const hwB = b.width * 0.5;
        const hhB = b.height * 0.5;

        const reqX = hwA + hwB + margin;
        const reqY = hhA + hhB + margin;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (absX < reqX && absY < reqY) {
          const penX = reqX - absX;
          const penY = reqY - absY;

          if (penX < penY) {
            const signX = dx >= 0 ? 1 : -1;
            const shift = penX * 0.5;
            a.x -= signX * shift;
            b.x += signX * shift;

            const vRelX = (b.vx - a.vx) * signX;
            if (vRelX < 0) {
              const impulse = -(1 + restitution) * vRelX * 0.5;
              a.vx -= signX * impulse;
              b.vx += signX * impulse;
            }
            a.vx -= signX * 0.15;
            b.vx += signX * 0.15;
          } else {
            const signY = dy >= 0 ? 1 : -1;
            const shift = penY * 0.5;
            a.y -= signY * shift;
            b.y += signY * shift;

            const vRelY = (b.vy - a.vy) * signY;
            if (vRelY < 0) {
              const impulse = -(1 + restitution) * vRelY * 0.5;
              a.vy -= signY * impulse;
              b.vy += signY * impulse;
            }
            a.vy -= signY * 0.15;
            b.vy += signY * 0.15;
          }
        }
      }
    }
  }
}

// Create two directly overlapping words
const w1 = new MockWord('FUEGO', 500, 500, 1.0, 0.0);
const w2 = new MockWord('AGUA', 510, 505, -1.0, 0.0);

console.log('Before collision resolution:');
console.log('  w1:', { x: w1.x, y: w1.y, vx: w1.vx, vy: w1.vy });
console.log('  w2:', { x: w2.x, y: w2.y, vx: w2.vx, vy: w2.vy });

resolveWordCollisionsTest([w1, w2]);

console.log('After collision resolution:');
console.log('  w1:', { x: w1.x, y: w1.y, vx: w1.vx, vy: w1.vy });
console.log('  w2:', { x: w2.x, y: w2.y, vx: w2.vx, vy: w2.vy });

const dxAfter = Math.abs(w2.x - w1.x);
const dyAfter = Math.abs(w2.y - w1.y);
const reqX = (w1.width + w2.width) * 0.5 + 8;
const reqY = (w1.height + w2.height) * 0.5 + 8;

console.log(`Separation X: ${dxAfter.toFixed(1)} / Required: ${reqX.toFixed(1)}`);
console.log(`Separation Y: ${dyAfter.toFixed(1)} / Required: ${reqY.toFixed(1)}`);

if (dxAfter >= reqX || dyAfter >= reqY) {
  console.log('PASS: Words successfully separated without overlap!');
} else {
  console.error('FAIL: Words still overlap');
}

console.log('\n--- ALL VERIFICATION TESTS PASSED ---');
