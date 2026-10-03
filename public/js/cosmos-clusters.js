/**
 * SINCRETISMO DE SILICIO // CÚMULO 3D DE NEURONAS & SINAPSIS
 * Script de inicialización y control dedicado para cosmos-clusters.html
 */
import { ClusterCosmos3D } from './visualizer/clusterCosmos3D.js?v=3.30';

let visualizer = null;

/* ============================================================================
   PANEL DE CONFIGURACIÓN (tecla P) — con pestañas
   ----------------------------------------------------------------------------
   El operador de la sala decide EN VIVO, desde el navegador, tres familias de
   cosas:

     TEXTOS   · tamaño de las palabras, de los carteles de categoría, del cartel
                de la palabra capturada y de los carteles del HUD de Sicre2.
     PLANETAS · tamaño de los planetas de palabras, de los de categoría y de las
                pelotitas (impulsos de axón + pulso de plasma de los puentes).
     CÁMARA   · velocidades del movimiento automático de cámara (modo animación)
                y del vuelo manual.

   TODOS los rangos arrancan en 0 (0 = apagado / quieto). Los rangos salen del
   propio visualizador (getRangosAjustes) para que no se desincronicen nunca.
   Los controles se generan desde la tabla GRUPOS_AJUSTES.

   Los tres carteles 3D se controlan por ESCALA (% de su tamano base), que es lo que
   de verdad importa: cuanto ocupan en el espacio al lado del planeta. La tipografia
   del lienzo la calcula el visualizador solo, con densidad fija y piso, asi que
   achicar el cartel NO pixela el texto.
   ============================================================================ */
const SEP = '\u00b7';

/* Colores listos para las pelotitas (sin di\u00e1logos nativos: se eligen con swatches). */
const COLORES_PELOTITA = [
  ['#ffd6d6', 'Blanco el\u00e9ctrico'], ['#ffffff', 'Blanco puro'], ['#ff000d', 'Rojo'],
  ['#ff7a1a', 'Naranja'], ['#ffc44d', '\u00c1mbar'], ['#38ff9c', 'Verde el\u00e9ctrico'],
  ['#4df0ff', 'Cian'], ['#4d8cff', 'Azul'], ['#c04dff', 'Violeta']
];
const NOMBRE_COLOR = {};
COLORES_PELOTITA.forEach(([hex, nombre]) => { NOMBRE_COLOR[hex] = nombre; });

/** HSL (h 0-360, s/l 0-100) -> '#rrggbb'. Para el slider de matiz. */
function hslAHex(h, sat, luz) {
  const s2 = sat / 100, l2 = luz / 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s2 * Math.min(l2, 1 - l2);
  const f = (n) => l2 - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const dos = (x) => Math.round(255 * x).toString(16).padStart(2, '0');
  return '#' + dos(f(0)) + dos(f(8)) + dos(f(4));
}

/** '#rrggbb' -> matiz 0-360 (null si es gris/blanco puro). */
function hexAMatiz(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d < 0.001) return null;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return h;
}

const GRUPOS_AJUSTES = [
  { tab: 'textos', key: 'cartelPalabraPct', titulo: '1 \u00b7 TAMA\u00d1O DEL CARTEL DE PALABRA', sufijo: '%',
    nota: 'Escala de los carteles que aparecen sobre las neuronas, respecto del planeta (100% = como estaba).' },
  { tab: 'textos', key: 'cartelCategoriaPct', titulo: '2 \u00b7 TAMA\u00d1O DE LOS CARTELES DE CATEGOR\u00cdA', sufijo: '%',
    nota: 'Escala del cartel de cada c\u00famulo, respecto del n\u00facleo.' },
  { tab: 'textos', key: 'cartelCapturaPct', titulo: '3 \u00b7 TAMA\u00d1O DEL CARTEL DE LA PALABRA CAPTURADA', sufijo: '%',
    nota: 'El cartel \u201c\u26a1 \u00d3RDEN CEREBRAL // SICRE2\u201d con la palabra capturada.' },
  { tab: 'textos', key: 'hudPct', titulo: '4 \u00b7 CARTELES DEL HUD (SICRE2)', sufijo: '%',
    nota: 'Las p\u00edldoras de orden, la frase y la barra de estado de arriba a la izquierda.' },

  { tab: 'planetas', key: 'planetaPalabraPct', titulo: '1 \u00b7 PLANETAS DE PALABRAS', sufijo: '%' },
  { tab: 'planetas', key: 'planetaCategoriaPct', titulo: '2 \u00b7 PLANETAS DE CATEGOR\u00cdA', sufijo: '%' },
  { tab: 'planetas', key: 'pelotitaPct', titulo: '3 \u00b7 TAMA\u00d1O DE LAS PELOTITAS DE NEURONA', sufijo: '%',
    nota: 'Las bolitas que viajan por los axones y el pulso de plasma de los puentes SICRE2. Menos de 100% = m\u00e1s chicas.' },
  { tab: 'planetas', tipo: 'color', key: 'pelotitaColor', titulo: '4 \u00b7 COLOR DE LAS PELOTITAS' },
  { tab: 'planetas', key: 'pelotitaElec', titulo: '5 \u00b7 ELECTRICIDAD DE LAS PELOTITAS (pulso)', sufijo: '%',
    nota: 'Anima escala y color de cada pelotita, con fase propia. 0% = quietas \u00b7 100% = sutil \u00b7 300% = muy el\u00e9ctricas.' },
  { tab: 'planetas', key: 'pulsoVel', titulo: '6 \u00b7 VELOCIDAD DEL PULSO DE LAS NEURONAS', sufijo: '%',
    nota: 'Qu\u00e9 tan r\u00e1pido viajan los impulsos por los axones y laten las neuronas. 0% = todo congelado \u00b7 100% = normal \u00b7 400% = muy r\u00e1pido. Es INDEPENDIENTE de la velocidad de los rayos (control 7).' },
  { tab: 'planetas', key: 'rayosVel', titulo: '7 \u00b7 VELOCIDAD DE LOS RAYOS (PLANETA SELECCIONADO)', sufijo: '%',
    nota: 'Qu\u00e9 tan r\u00e1pido se mueven los rayos y la corona del planeta seleccionado/seguido. No tiene nada que ver con el pulso de las pelotitas. 0% = rayos quietos.' },
  { tab: 'planetas', key: 'llegadaGlowPct', titulo: '8 \u00b7 GLOW AL LLEGAR UN IMPULSO', sufijo: '%',
    nota: 'Cuando un impulso llega a un planeta: halo sutil + destello de la neurona + los rayos de ESE planeta bajan la velocidad un instante. 0% = sin efecto.' },

  { tab: 'fondo', key: 'fondoIntensidad', titulo: '1 \u00b7 INTENSIDAD DEL FONDO (estrellas + c\u00e9lulas)', sufijo: '%',
    nota: 'Cu\u00e1nto se ve el fondo animado de estrellas y membranas celulares. 0% = negro puro.' },
  { tab: 'fondo', key: 'fondoVel', titulo: '2 \u00b7 VELOCIDAD DEL FONDO', sufijo: '%',
    nota: 'Qu\u00e9 tan r\u00e1pido titilan las estrellas y derivan las membranas. 0% = fondo quieto \u00b7 100% = como est\u00e1.' },

  { tab: 'camara', key: 'camAnimVel', titulo: '1 \u00b7 VELOCIDAD DEL VIAJE AUTOM\u00c1TICO', sufijo: '%',
    nota: 'El recorrido que hace la c\u00e1mara sola entre las palabras (modo animaci\u00f3n).' },
  { tab: 'camara', key: 'camWarpVel', titulo: '2 \u00b7 VELOCIDAD DE ACERCAMIENTO', sufijo: '%',
    nota: 'Qu\u00e9 tan r\u00e1pido se lanza la c\u00e1mara hacia el planeta al enfocarlo.' },
  { tab: 'camara', key: 'camSeguirDist', titulo: '3 \u00b7 DISTANCIA DE SEGUIMIENTO', sufijo: ' u',
    nota: 'A qu\u00e9 distancia queda la c\u00e1mara del planeta que est\u00e1 siguiendo.' },
  { tab: 'camara', key: 'camManualVel', titulo: '4 \u00b7 VUELO MANUAL (WASD)', sufijo: '%' },
  { tab: 'camara', key: 'camGiroPct', titulo: '5 \u00b7 SENSIBILIDAD DE GIRO (MOUSE)', sufijo: '%' }
];

function initPanelAjustes(viz) {
  const panel = document.getElementById('panel-ajustes-cosmos');
  if (!panel || !viz) return;

  const btn = document.getElementById('btn-cosmos-ajustes');
  const nota = document.getElementById('pa-aplicado-nota');
  const rangos = viz.getRangosAjustes();
  const controles = {};

  // El panel vive DENTRO del viewport (para pantalla completa), así que hay que
  // frenar sus eventos: si no, arrastrar un slider giraría la cámara y el click
  // haría warp a una neurona.
  ['mousedown', 'mouseup', 'click', 'dblclick', 'wheel', 'pointerdown'].forEach((ev) => {
    panel.addEventListener(ev, (e) => e.stopPropagation());
  });

  /* ---------- construcción de los controles desde la tabla ---------- */
  GRUPOS_AJUSTES.forEach((g) => {
    const seccion = document.getElementById('pa-seccion-' + g.tab);
    const r = rangos[g.key] || { min: 0, max: 100 };
    const grupo = document.createElement('div');
    grupo.className = 'pa-grupo';

    const label = document.createElement('div');
    label.className = 'pa-label';
    const titulo = document.createElement('span');
    titulo.textContent = g.titulo;
    const valor = document.createElement('span');
    valor.className = 'pa-valor';
    label.appendChild(titulo);
    label.appendChild(valor);

    if (g.tipo === 'color') {
      // Swatches + matiz fino: sin <input type=color> (nada de diálogos nativos).
      const fila = document.createElement('div');
      fila.className = 'pa-colores';
      COLORES_PELOTITA.forEach(([hex, nombre]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pa-color';
        b.dataset.color = hex;
        b.style.background = hex;
        b.title = nombre;
        b.addEventListener('click', () => aplicar({ [g.key]: hex }));
        fila.appendChild(b);
      });
      const matiz = document.createElement('input');
      matiz.type = 'range';
      matiz.className = 'pa-slider';
      matiz.dataset.key = g.key + 'Matiz';
      matiz.min = '0';
      matiz.max = '360';
      matiz.step = '5';
      matiz.value = '0';
      matiz.addEventListener('input', () => aplicar({ [g.key]: hslAHex(Number(matiz.value), 100, 80) }));
      const pistasMatiz = document.createElement('div');
      pistasMatiz.className = 'pa-pistas';
      const m1 = document.createElement('span'); m1.textContent = '0 \u00b7 rojo';
      const m2 = document.createElement('span'); m2.textContent = '360 \u00b7 rojo';
      pistasMatiz.appendChild(m1); pistasMatiz.appendChild(m2);

      grupo.appendChild(label);
      grupo.appendChild(fila);
      grupo.appendChild(matiz);
      grupo.appendChild(pistasMatiz);
      if (g.nota) {
        const n2 = document.createElement('div');
        n2.className = 'pa-nota';
        n2.textContent = g.nota;
        grupo.appendChild(n2);
      }
      if (seccion) seccion.appendChild(grupo);
      controles[g.key] = { valor: valor, swatches: fila, matiz: matiz };
      return;
    }

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'pa-slider';
    slider.dataset.key = g.key;   // identificable desde afuera (debug / pruebas)
    slider.min = String(r.min);
    slider.max = String(r.max);
    slider.step = g.key === 'camSeguirDist' ? '2' : (g.sufijo === '%' ? '5' : '2');
    slider.value = '0';

    const pistas = document.createElement('div');
    pistas.className = 'pa-pistas';
    const p1 = document.createElement('span');
    p1.textContent = r.min + g.sufijo + ' \u00b7 m\u00ednimo (apagado)';
    const p2 = document.createElement('span');
    p2.textContent = r.max + g.sufijo + ' \u00b7 m\u00e1ximo';
    pistas.appendChild(p1);
    pistas.appendChild(p2);

    grupo.appendChild(label);
    grupo.appendChild(slider);
    grupo.appendChild(pistas);
    if (g.nota) {
      const n = document.createElement('div');
      n.className = 'pa-nota';
      n.textContent = g.nota;
      grupo.appendChild(n);
    }
    if (seccion) seccion.appendChild(grupo);

    controles[g.key] = { slider: slider, valor: valor, sufijo: g.sufijo };
    slider.addEventListener('input', () => aplicar({ [g.key]: Number(slider.value) }));
  });

  /* ---------- pestañas ---------- */
  const botonesTab = Array.prototype.slice.call(document.querySelectorAll('#pa-tabs .pa-tab'));
  function abrirTab(nombre) {
    botonesTab.forEach((b) => b.classList.toggle('activo', b.dataset.tab === nombre));
    ['textos', 'planetas', 'fondo', 'camara'].forEach((t) => {
      const sec = document.getElementById('pa-seccion-' + t);
      if (sec) sec.classList.toggle('activo', t === nombre);
    });
  }
  botonesTab.forEach((b) => b.addEventListener('click', () => abrirTab(b.dataset.tab)));

  /* ---------- valores ---------- */
  function sincronizar() {
    const a = viz.getAjustesTexto();
    Object.keys(controles).forEach((k) => {
      const c = controles[k];
      const v = a[k];
      if (c.swatches) {
        // control de color: swatch activo, matiz y nombre/hex
        const hex = String(v || '').toLowerCase();
        Array.prototype.forEach.call(c.swatches.children, (b) => {
          b.classList.toggle('activo', (b.dataset.color || '').toLowerCase() === hex);
        });
        const matiz = hexAMatiz(/^#[0-9a-f]{6}$/.test(hex) ? hex : '#ffffff');
        if (matiz !== null && Number(c.matiz.value) !== matiz) c.matiz.value = matiz;
        c.valor.textContent = NOMBRE_COLOR[hex] || hex;
        return;
      }
      c.valor.textContent = v + c.sufijo;
      if (Number(c.slider.value) !== v) c.slider.value = v;
    });
  }

  function aplicar(parcial) {
    const res = viz.setAjustesTexto(parcial);
    sincronizar();
    if (!nota || !res) return;
    const pl = res.planetas || {};
    const ca = res.camara || {};
    const fo = res.fondo || {};
    nota.textContent = 'Aplicado en vivo: ' + res.palabras + ' palabras ' + SEP + res.carteles +
      ' carteles de categor\u00eda ' + SEP + res.ordenes + ' de captura ' + SEP + 'HUD ' + res.hudPct + '% ' + SEP +
      'planetas ' + pl.palabra + '/' + pl.categoria + '/' + pl.pelotita + '% ' + SEP +
      'pelotitas ' + (res.pelotitas ? res.pelotitas.tamano + '% ' + res.pelotitas.color + ' elec ' + res.pelotitas.elec + '%' : '?') + ' ' + SEP +
      'pulso ' + res.pulsoVel + '% ' + SEP + 'rayos ' + res.rayosVel + '% ' + SEP +
      'llegada ' + res.llegadaGlowPct + '% ' + SEP +
      'fondo ' + fo.intensidad + '/' + fo.velocidad + '% ' + SEP +
      'c\u00e1mara ' + ca.animVel + '/' + ca.warpVel + '/' + ca.seguirDist + '/' +
      ca.manualVel + '/' + ca.giro + '%.';
  }

  const btnReset = document.getElementById('pa-reset');
  if (btnReset) btnReset.addEventListener('click', () => {
    viz.restablecerAjustesTexto();
    sincronizar();
    if (nota) nota.textContent = 'Restablecido a los valores originales de f\u00e1brica.';
  });

  const btnCerrar = document.getElementById('pa-cerrar');
  if (btnCerrar) btnCerrar.addEventListener('click', () => abrir(false));
  if (btn) btn.addEventListener('click', () => abrir());

  function abrir(estado) {
    const on = (estado === undefined) ? !panel.classList.contains('abierto') : !!estado;
    panel.classList.toggle('abierto', on);
    if (on) sincronizar();
  }

  document.addEventListener('click', (e) => {
    if (!panel.classList.contains('abierto')) return;
    if (panel.contains(e.target)) return;
    if (btn && btn.contains(e.target)) return;
    abrir(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { abrir(false); return; }
    if (e.key !== 'p' && e.key !== 'P') return;
    const t = e.target || {};
    const tag = String(t.tagName || '').toUpperCase();
    const escribiendo = tag === 'TEXTAREA' || (tag === 'INPUT' && t.type !== 'range' && t.type !== 'checkbox');
    if (escribiendo) return;
    e.preventDefault();
    abrir();
  });

  abrirTab('textos');
  sincronizar();
}

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

  initPanelAjustes(visualizer);

  // Tecla 'F' para pantalla completa
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.code === 'KeyF' && !e.ctrlKey && !e.altKey) {
      visualizer.toggleFullscreen();
    }
    // Tecla 'M' para simular selección de 3 órdenes / esferas
    if ((e.code === 'KeyM' || e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.altKey && !e.metaKey) {
      if (visualizer && typeof visualizer.simulateDemoOrders === 'function') {
        console.log('[Cosmos] ⚡ Tecla M presionada: Simulando selección de 3 esferas...');
        visualizer.simulateDemoOrders();
      }
    }
  });
});
