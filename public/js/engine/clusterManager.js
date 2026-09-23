/**
 * Cluster Manager
 * Handles user-defined word categories/clusters, persistence via server API & localStorage,
 * and notifies listeners when clusters are updated.
 */
export class ClusterManager {
  constructor() {
    this.clusters = [];
    this.listeners = new Set();
    this.isLoaded = false;
  }

  async load() {
    try {
      // 1. Try loading from server API
      const res = await fetch('./api/clusters');
      if (res.ok) {
        this.clusters = await res.json();
      } else {
        throw new Error('API server returned error');
      }
    } catch (e) {
      console.warn('Fallback: loading clusters from localStorage or defaults', e);
      const local = localStorage.getItem('sincretismo_user_clusters');
      if (local) {
        try {
          this.clusters = JSON.parse(local);
        } catch (err) {
          this.clusters = this.getDefaultClusters();
        }
      } else {
        this.clusters = this.getDefaultClusters();
      }
    }

    this.isLoaded = true;
    return this.clusters;
  }

  getDefaultClusters() {
    return [
      {
        id: 'poder',
        name: 'PODER Y POLÍTICA',
        color: '#ef4444',
        words: ['política', 'izquierda', 'derecha', 'fascismo', 'comunismo', 'gobierno', 'estado', 'democracia']
      },
      {
        id: 'animales',
        name: 'ANIMALES & FAUNA',
        color: '#10b981',
        words: ['perro', 'gato', 'elefante', 'tigre', 'león', 'caballo', 'lobo', 'águila']
      },
      {
        id: 'filosofia',
        name: 'FILOSOFÍA & COSMOS',
        color: '#8b5cf6',
        words: ['existencia', 'tiempo', 'filosofía', 'mente', 'alma', 'verdad', 'conciencia', 'universo']
      },
      {
        id: 'tecnologia',
        name: 'TECNOLOGÍA & SILICIO',
        color: '#06b6d4',
        words: ['computadora', 'robot', 'código', 'algoritmo', 'futuro', 'silicio', 'red', 'memoria']
      }
    ];
  }

  async save(newClusters) {
    this.clusters = newClusters;

    // Save to localStorage immediately
    try {
      localStorage.setItem('sincretismo_user_clusters', JSON.stringify(this.clusters));
    } catch (err) {
      console.warn('localStorage error:', err);
    }

    // Save to server API
    let serverSaved = false;
    try {
      const res = await fetch('./api/clusters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.clusters)
      });
      if (res.ok) {
        serverSaved = true;
      }
    } catch (err) {
      console.warn('Error saving clusters to server:', err);
    }

    this.notify();
    return { success: true, serverSaved };
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    for (const cb of this.listeners) {
      try {
        cb(this.clusters);
      } catch (err) {
        console.error('Error in cluster listener:', err);
      }
    }
  }

  getClusters() {
    return this.clusters;
  }
}

export const clusterManager = new ClusterManager();
