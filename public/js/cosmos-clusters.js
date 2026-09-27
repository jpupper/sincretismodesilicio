/**
 * SINCRETISMO DE SILICIO // CÚMULO 3D DE NEURONAS & SINAPSIS
 * Script de inicialización y control dedicado para cosmos-clusters.html
 */
import { ClusterCosmos3D } from './visualizer/clusterCosmos3D.js';

let visualizer = null;

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('cosmos-clusters-viewport');
  if (!container) return;

  visualizer = new ClusterCosmos3D(container, {});
  visualizer.start();

  window.cosmosVisualizer = visualizer;

  // Botón de pantalla completa
  const fsBtn = document.getElementById('btn-fullscreen-cluster-cosmos');
  if (fsBtn) {
    fsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      visualizer.toggleFullscreen();
    });
  }

  // Tecla 'F' para pantalla completa
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.code === 'KeyF' && !e.ctrlKey && !e.altKey) {
      visualizer.toggleFullscreen();
    }
  });
});
