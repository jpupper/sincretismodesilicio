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
      "id": "humana",
      "name": "HUMANA",
      "color": "#f43f5e",
      "words": [
            "Anónimo",
            "Ciberperson",
            "Transhumanismo",
            "Cyborgs",
            "transexual",
            "pansexual",
            "bisexual",
            "lesbiana",
            "homosexual",
            "gay",
            "LGBT",
            "lgtbyq",
            "placer",
            "poliamor",
            "poliamoroso",
            "cuidado",
            "autocuidado",
            "sonreír",
            "UBA",
            "UNSAM",
            "UNTREF",
            "UNLAM",
            "polvo",
            "asado",
            "vino",
            "conección",
            "desconexión",
            "UTP",
            "notebooks",
            "kinect",
            "lidar",
            "github",
            "git",
            "nodos",
            "emulador",
            "llegar",
            "montaje",
            "127.0.0.1",
            "install.bat",
            ".env",
            "apikey",
            "key",
            "api",
            "sockets",
            "MongoDB",
            "php",
            "Phpmyadmin",
            "handcode",
            "vibecode",
            "freebuff",
            "antigravity",
            "node",
            "server.js",
            "index.html",
            "style.css",
            "javascript.js",
            "script.js",
            "font.ttf",
            "model.obj",
            "model.gltf",
            "exitos2000.wav",
            "dreamcore",
            "hardcore",
            "synthcore",
            "softcore",
            "chillstep",
            "everynoiseatonce",
            "música",
            "tango",
            "rock",
            "sky",
            "mate",
            "cancha",
            "maíz",
            "mejoramiento",
            "incas",
            "aztecas",
            "mayas",
            "Kipu",
            "telares",
            "códices",
            "textos",
            "libros",
            "información",
            "historia",
            "política",
            "sociología",
            "economía",
            "industria",
            "descolonización",
            "laico",
            "gratuito",
            "una",
            "clases",
            "pedagogía",
            "Duolingo",
            "lenguaje",
            "teatro",
            "improvisación",
            "Chéjov",
            "impro",
            "transitarlo",
            "vivirlo",
            "Relajarse",
            "encurtidos",
            "pica",
            "Marcas",
            "productora",
            "TECNOPOLIS",
            "comunicaciones",
            "radio",
            "cine",
            "reel",
            "mapping",
            "pantalla",
            "salida",
            "DNS",
            "ipconfig",
            "ipv4",
            "ipv6",
            "QR",
            "doomscrolling",
            "dopamina",
            "serotonina",
            "superar",
            "mejorar",
            "integridad",
            "ética",
            "moral",
            "salvación",
            "Words",
            "phonocentrico",
            "ideogramas",
            "prompting",
            "promptear",
            "4k",
            "bloom",
            "blur",
            "lighting3d",
            "Input",
            "output",
            "entrada",
            "Esperar",
            "paciencia",
            "ansiedad",
            "pensar",
            "accionar",
            "archivo",
            "archivado",
            "dato",
            ".json",
            "Sostener",
            "membresías",
            "programa",
            "INADI",
            "contratar",
            "conocido",
            "referido",
            "charlar"
      ]
},
      {
        id: 'poder',
        name: 'PODER',
        color: '#ef4444',
        words: ['política', 'izquierda', 'derecha', 'fascismo', 'comunismo', 'gobierno', 'estado', 'democracia', 'ideología', 'justicia', 'ley', 'soberanía', 'república', 'autoridad', 'libertad', 'imperio']
      },
      {
        id: 'animales',
        name: 'ANIMALES',
        color: '#10b981',
        words: ['perro', 'gato', 'elefante', 'tigre', 'león', 'caballo', 'lobo', 'águila', 'ballena', 'delfín', 'oso', 'serpiente', 'halcón', 'zorro', 'ciervo', 'pantera']
      },
      {
        id: 'filosofia',
        name: 'FILOSOFÍA',
        color: '#8b5cf6',
        words: ['existencia', 'tiempo', 'filosofía', 'mente', 'alma', 'verdad', 'conciencia', 'universo', 'destino', 'razón', 'muerte', 'infinito', 'ética', 'esencia', 'duda', 'conocimiento']
      },
      {
        id: 'tecnologia',
        name: 'TECNOLOGÍA',
        color: '#06b6d4',
        words: ['computadora', 'robot', 'código', 'algoritmo', 'futuro', 'silicio', 'red', 'memoria', 'procesador', 'sistema', 'inteligencia', 'interfaz', 'servidor', 'cibernética', 'datos', 'enlace']
      },
      {
        id: 'emociones',
        name: 'EMOCIONES',
        color: '#ec4899',
        words: ['amor', 'nostalgia', 'ternura', 'tristeza', 'alegría', 'fragilidad', 'esperanza', 'miedo', 'anhelo', 'soledad', 'duelo', 'calma', 'pasión', 'desvelo', 'empatía', 'consuelo']
      },
      {
        id: 'poesia',
        name: 'POESÍA',
        color: '#f59e0b',
        words: ['verso', 'metáfora', 'ritmo', 'silencio', 'belleza', 'poema', 'sombra', 'eco', 'espejo', 'misterio', 'ceniza', 'aurora', 'abismo', 'origen', 'creación', 'armonía']
      },
      {
        id: 'naturaleza',
        name: 'NATURALEZA',
        color: '#84cc16',
        words: ['bosque', 'río', 'montaña', 'océano', 'viento', 'lluvia', 'raíz', 'tierra', 'semilla', 'flor', 'cielo', 'hoja', 'tormenta', 'desierto', 'nieve', 'sol']
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
