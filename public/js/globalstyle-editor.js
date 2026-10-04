/**
 * GLOBALSTYLE — editor de diseño global (SINCRETISMO DE SILICIO)
 * ----------------------------------------------------------------------------
 * Lee y guarda `public/data/global_style.json` (POST /api/global-style) y aplica
 * los cambios EN VIVO sobre esta misma página para ver el resultado: tipografía
 * de todas las páginas, paleta diferenciada por módulo (Log, Cosmos Cluster,
 * CambiaPalabras y Global) y diseño de los contenedores.
 */
(function () {
  'use strict';

  var API = '/api/global-style';
  var RUTA_JSON = 'data/global_style.json';
  var LS_CUSTOM_PALETAS = 'sincretismo_custom_paletas';

  var GRUPOS_TOKENS = [
    {
      id: 'cluster',
      titulo: '🌌 COSMOS CLUSTERS (Universo 3D)',
      desc: 'Esferas neuronales, núcleos, pelotitas de impulso y cajas 3D',
      tokens: [
        ['clusterEsfera', 'ESFERAS / NEURONAS (BASE)'],
        ['clusterNucleo', 'NÚCLEO / SOMA INTERNO'],
        ['clusterPelotita', 'IMPULSOS / PELOTITAS ELÉCTRICAS'],
        ['clusterCajaFill', 'FILL / FONDO CAJAS 3D'],
        ['clusterCajaBorde', 'BORDE CAJAS 3D']
      ]
    },
    {
      id: 'log',
      titulo: '📋 LOG (Consola Cognitiva & Terminal)',
      desc: 'Terminal de pensamientos, manifiesto y estados',
      tokens: [
        ['logFondo', 'FONDO TERMINAL LOG'],
        ['logTexto', 'TEXTO PENSAMIENTOS LOG'],
        ['logAcento', 'ACENTO / BADGES LOG'],
        ['logPanel', 'PANEL / ESTADO LOG']
      ]
    },
    {
      id: 'cambia',
      titulo: '📹 CAMBIAPALABRAS (CCTV & Secuestro)',
      desc: 'HUD de vigilancia, modal y palabras capturadas',
      tokens: [
        ['cambiaFondo', 'FONDO CCTV / CAMBIAPALABRAS'],
        ['cambiaHud', 'PANELES HUD / MODALES'],
        ['cambiaAcento', 'ACENTO / BOTONES / TAGS'],
        ['cambiaPalabra', 'PALABRAS SECUESTRADAS']
      ]
    },
    {
      id: 'global',
      titulo: '⚙️ GLOBAL / BASE',
      desc: 'Colores base compartidos y valores por defecto',
      tokens: [
        ['fondo', 'FONDO GENERAL'],
        ['panel', 'PANEL / CONTENEDOR BASE'],
        ['panel2', 'PANEL SECUNDARIO'],
        ['borde', 'BORDE GENERAL'],
        ['acento', 'ACENTO GENERAL'],
        ['acento2', 'ACENTO SECUNDARIO'],
        ['texto', 'TEXTO GENERAL'],
        ['textoDim', 'TEXTO ATENUADO']
      ]
    }
  ];

  var TOKENS = [];
  GRUPOS_TOKENS.forEach(function (g) {
    g.tokens.forEach(function (t) {
      TOKENS.push(t);
    });
  });

  var PALETAS = [
    ['STEAMPUNK COBRE', {
      fondo: '#0c0705', panel: '#1b0f0a', panel2: '#2a170f', borde: '#c85a32',
      acento: '#d46238', acento2: '#dca876', texto: '#edd3be', textoDim: '#8f634b',
      clusterEsfera: '#c85a32', clusterNucleo: '#8a3318', clusterPelotita: '#ffe2c8',
      clusterCajaFill: '#1b0f0a', clusterCajaBorde: '#c85a32',
      logFondo: '#0c0705', logTexto: '#edd3be', logAcento: '#d46238', logPanel: '#1b0f0a',
      cambiaFondo: '#0c0705', cambiaHud: '#1b0f0a', cambiaAcento: '#d46238', cambiaPalabra: '#dca876'
    }],
    ['ROJO / NEGRO', {
      fondo: '#070303', panel: '#140708', panel2: '#1e0a0c', borde: '#ff000d',
      acento: '#ff000d', acento2: '#e88f93', texto: '#e88f93', textoDim: '#8b4f52',
      clusterEsfera: '#ff000d', clusterNucleo: '#9a000d', clusterPelotita: '#ffd6d6',
      clusterCajaFill: '#140708', clusterCajaBorde: '#ff000d',
      logFondo: '#070303', logTexto: '#e88f93', logAcento: '#ff000d', logPanel: '#140708',
      cambiaFondo: '#070303', cambiaHud: '#140708', cambiaAcento: '#ff000d', cambiaPalabra: '#e88f93'
    }],
    ['ÁMBAR CRT', {
      fondo: '#0a0702', panel: '#1a1204', panel2: '#261a06', borde: '#ffb000',
      acento: '#ffb000', acento2: '#ffd98a', texto: '#ffcf7a', textoDim: '#9a7538',
      clusterEsfera: '#ffb000', clusterNucleo: '#b37700', clusterPelotita: '#fff0cc',
      clusterCajaFill: '#1a1204', clusterCajaBorde: '#ffb000',
      logFondo: '#0a0702', logTexto: '#ffcf7a', logAcento: '#ffb000', logPanel: '#1a1204',
      cambiaFondo: '#0a0702', cambiaHud: '#1a1204', cambiaAcento: '#ffb000', cambiaPalabra: '#ffd98a'
    }],
    ['VERDE FÓSFORO', {
      fondo: '#020604', panel: '#04150c', panel2: '#07200f', borde: '#00ff88',
      acento: '#00ff88', acento2: '#8affc9', texto: '#8dffc4', textoDim: '#3d8a63',
      clusterEsfera: '#00ff88', clusterNucleo: '#008a49', clusterPelotita: '#d8ffef',
      clusterCajaFill: '#04150c', clusterCajaBorde: '#00ff88',
      logFondo: '#020604', logTexto: '#8dffc4', logAcento: '#00ff88', logPanel: '#04150c',
      cambiaFondo: '#020604', cambiaHud: '#04150c', cambiaAcento: '#00ff88', cambiaPalabra: '#8affc9'
    }],
    ['CIAN FRÍO', {
      fondo: '#020609', panel: '#04141a', panel2: '#07202a', borde: '#4df0ff',
      acento: '#4df0ff', acento2: '#b6f7ff', texto: '#a9e9f5', textoDim: '#3f7683',
      clusterEsfera: '#4df0ff', clusterNucleo: '#1a8a99', clusterPelotita: '#e0fbff',
      clusterCajaFill: '#04141a', clusterCajaBorde: '#4df0ff',
      logFondo: '#020609', logTexto: '#a9e9f5', logAcento: '#4df0ff', logPanel: '#04141a',
      cambiaFondo: '#020609', cambiaHud: '#04141a', cambiaAcento: '#4df0ff', cambiaPalabra: '#b6f7ff'
    }],
    ['MAGENTA NEÓN', {
      fondo: '#07020a', panel: '#160419', panel2: '#22062a', borde: '#ff3df0',
      acento: '#ff3df0', acento2: '#ffb6f7', texto: '#f3a9ee', textoDim: '#87407f',
      clusterEsfera: '#ff3df0', clusterNucleo: '#99158f', clusterPelotita: '#ffe6fd',
      clusterCajaFill: '#160419', clusterCajaBorde: '#ff3df0',
      logFondo: '#07020a', logTexto: '#f3a9ee', logAcento: '#ff3df0', logPanel: '#160419',
      cambiaFondo: '#07020a', cambiaHud: '#160419', cambiaAcento: '#ff3df0', cambiaPalabra: '#ffb6f7'
    }],
    ['BLANCO / NEGRO', {
      fondo: '#050505', panel: '#141414', panel2: '#1f1f1f', borde: '#ffffff',
      acento: '#ffffff', acento2: '#cccccc', texto: '#dddddd', textoDim: '#8a8a8a',
      clusterEsfera: '#dddddd', clusterNucleo: '#777777', clusterPelotita: '#ffffff',
      clusterCajaFill: '#141414', clusterCajaBorde: '#ffffff',
      logFondo: '#050505', logTexto: '#dddddd', logAcento: '#ffffff', logPanel: '#141414',
      cambiaFondo: '#050505', cambiaHud: '#141414', cambiaAcento: '#ffffff', cambiaPalabra: '#ffffff'
    }]
  ];

  /* Muestras para los swatches de cada color (rampa + acentos). */
  var SWATCHES = [
    '#000000', '#070303', '#0c0705', '#140708', '#1b0f0a', '#241012', '#2a170f', '#3a1a1e',
    '#c85a32', '#d46238', '#8a3318', '#dca876', '#edd3be', '#8f634b', '#ffe2c8',
    '#ff000d', '#ff3b45', '#ff7a1a', '#ffb000', '#ffd98a',
    '#00ff88', '#4df0ff', '#3d6bff', '#c04dff', '#ff3df0',
    '#ffffff', '#dddddd', '#8a8a8a', '#e88f93', '#8b4f52'
  ];

  var CONTENEDORES = [
    ['radio', 'RADIO DE ESQUINAS', 0, 28, 1, 'px'],
    ['bordeAncho', 'GROSOR DE BORDE', 0, 6, 1, 'px'],
    ['padding', 'PADDING INTERNO', 0, 40, 1, 'px'],
    ['blur', 'BLUR DEL FONDO', 0, 30, 1, 'px'],
    ['opacidadPanel', 'OPACIDAD DEL PANEL', 0.1, 1, 0.01, ''],
    ['sombra', 'SOMBRA / PROFUNDIDAD', 0, 48, 1, 'px']
  ];

  var cfg = null;
  var previas = {};
  var customPaletas = [];

  function $(id) { return document.getElementById(id); }

  function toast(msg, error, ms) {
    var t = $('gs-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.toggle('is-error', !!error);
    t.style.display = 'block';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.style.display = 'none'; }, ms || 3600);
  }

  function clonar(o) { return JSON.parse(JSON.stringify(o)); }

  function leerCustomPaletas() {
    try {
      var raw = window.localStorage.getItem(LS_CUSTOM_PALETAS);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function guardarCustomPaletas() {
    try {
      window.localStorage.setItem(LS_CUSTOM_PALETAS, JSON.stringify(customPaletas));
    } catch (e) {}
  }

  /* ---------------------------------------------------------------- estado */
  function normalizar(o) {
    var base = clonar(window.GlobalStyle.defecto);
    if (!o) return base;
    base.fuente = o.fuente || base.fuente;
    if (o.colores) {
      Object.keys(base.colores).forEach(function (k) {
        if (o.colores[k]) base.colores[k] = o.colores[k];
      });
      // Fallbacks inteligentes si provienen de configs anteriores
      if (!base.colores.clusterEsfera) base.colores.clusterEsfera = base.colores.acento;
      if (!base.colores.clusterNucleo) base.colores.clusterNucleo = base.colores.acento2;
      if (!base.colores.clusterPelotita) base.colores.clusterPelotita = base.colores.acento2;
      if (!base.colores.clusterCajaFill) base.colores.clusterCajaFill = base.colores.panel;
      if (!base.colores.clusterCajaBorde) base.colores.clusterCajaBorde = base.colores.borde;

      if (!base.colores.logFondo) base.colores.logFondo = base.colores.fondo;
      if (!base.colores.logTexto) base.colores.logTexto = base.colores.texto;
      if (!base.colores.logAcento) base.colores.logAcento = base.colores.acento;
      if (!base.colores.logPanel) base.colores.logPanel = base.colores.panel;

      if (!base.colores.cambiaFondo) base.colores.cambiaFondo = base.colores.fondo;
      if (!base.colores.cambiaHud) base.colores.cambiaHud = base.colores.panel;
      if (!base.colores.cambiaAcento) base.colores.cambiaAcento = base.colores.acento;
      if (!base.colores.cambiaPalabra) base.colores.cambiaPalabra = base.colores.acento2;
    }
    if (o.contenedores) {
      Object.keys(base.contenedores).forEach(function (k) {
        var v = Number(o.contenedores[k]);
        if (isFinite(v)) base.contenedores[k] = v;
      });
    }
    previas.escala = isFinite(Number(o.escala)) && Number(o.escala) > 0 ? Number(o.escala) : 1;
    return base;
  }

  /* Publica la config en vivo en TODOS los clientes (BroadcastChannel, WebSocket, localStorage). */
  function publicarLocal() {
    try {
      cfg.guardado = Date.now();
      cfg.escala = previas.escala || 1;
      if (window.GlobalStyle && typeof window.GlobalStyle.publicar === 'function') {
        window.GlobalStyle.publicar(cfg);
      } else {
        window.localStorage.setItem(window.GlobalStyle.lsKey || 'sincretismo_global_style',
          JSON.stringify({ cfg: cfg, t: cfg.guardado }));
      }
      return true;
    } catch (e) { return false; }
  }
  var _publicarTimer = null;
  function publicarLocalDebounce() {
    clearTimeout(_publicarTimer);
    _publicarTimer = setTimeout(publicarLocal, 45);
  }

  function aplicarVivo(inmediato) {
    var vista = clonar(cfg);
    window.GlobalStyle.aplicar(vista);
    document.documentElement.style.setProperty('--gs-escala', String(previas.escala || 1));
    document.body.style.fontSize = 'calc(13px * ' + (previas.escala || 1) + ')';
    if (inmediato) {
      publicarLocal();
    } else {
      publicarLocalDebounce();
    }
  }

  function guardarConfig(notificar) {
    publicarLocal();
    return fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (j) {
      if (notificar) toast('✓ Diseño guardado en el servidor y en este navegador.');
      return j;
    }).catch(function (e) {
      toast('⚠ Guardado SÓLO en este navegador: el servidor no lo tomó (' + e.message +
            '). Acá ya se ve; para que quede para todos, reiniciá npm start y volvé a guardar.', true, 11000);
      throw e;
    });
  }

  /* ------------------------------------------------------------------ UI */
  function construirFuentes() {
    var sel = $('gs-fuente');
    var fuentes = window.GlobalStyle.fuentes;
    Object.keys(fuentes).forEach(function (nombre) {
      var o = document.createElement('option');
      o.value = nombre;
      o.textContent = nombre + (fuentes[nombre] ? '' : '  (local)');
      o.style.fontFamily = '"' + nombre + '", monospace';
      sel.appendChild(o);
    });
    sel.value = cfg.fuente;
    sel.addEventListener('change', function () {
      cfg.fuente = sel.value;
      toast('Tipografía: ' + cfg.fuente);
      aplicarVivo(true);
    });
  }

  function renderBotonPaleta(cont, nombre, paletaData, esCustom, customIdx) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'gs-paleta' + (esCustom ? ' gs-paleta-custom' : '');
    var col1 = paletaData.clusterEsfera || paletaData.acento || '#ff000d';
    var col2 = paletaData.clusterCajaFill || paletaData.panel2 || '#1a1204';
    var col3 = paletaData.logTexto || paletaData.texto || '#ffffff';

    var innerHtml = '<i style="background:' + col1 + '" title="Esferas/Acento"></i>' +
                    '<i style="background:' + col2 + '" title="Caja/Panel"></i>' +
                    '<i style="background:' + col3 + '" title="Texto"></i>' +
                    '<span>' + nombre + '</span>';

    if (esCustom) {
      innerHtml += '<span class="gs-paleta-del" title="Eliminar paleta personalizada">&times;</span>';
    }

    b.innerHTML = innerHtml;

    b.addEventListener('click', function (e) {
      if (e.target.classList.contains('gs-paleta-del')) return;
      cfg.colores = clonar(paletaData);
      pintarColores();
      aplicarVivo(true);
      toast('Paleta aplicada: ' + nombre + ' (acordate de GUARDAR)');
    });

    if (esCustom) {
      var delBtn = b.querySelector('.gs-paleta-del');
      if (delBtn) {
        delBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (confirm('¿Eliminar la paleta personalizada "' + nombre + '"?')) {
            customPaletas.splice(customIdx, 1);
            guardarCustomPaletas();
            construirPaletas();
            toast('Paleta "' + nombre + '" eliminada.');
          }
        });
      }
    }

    cont.appendChild(b);
  }

  function construirPaletas() {
    var cont = $('gs-paletas');
    cont.innerHTML = '';

    // Paletas estándar de sistema
    PALETAS.forEach(function (par) {
      renderBotonPaleta(cont, par[0], par[1], false);
    });

    // Paletas personalizadas del usuario
    customPaletas.forEach(function (par, idx) {
      renderBotonPaleta(cont, par[0], par[1], true, idx);
    });
  }

  function agregarPaletaPersonalizada() {
    var defNombre = 'Mi Paleta ' + (customPaletas.length + 1);
    var nombre = window.prompt('Ingresá un nombre para tu paleta rápida:', defNombre);
    if (!nombre || !nombre.trim()) return;
    nombre = nombre.trim();

    var copiaColores = clonar(cfg.colores);
    customPaletas.push([nombre, copiaColores]);
    guardarCustomPaletas();
    construirPaletas();
    toast('✓ Paleta "' + nombre + '" agregada a tus paletas rápidas.');
  }

  function hslAHex(h, s, l) {
    s /= 100; l /= 100;
    var k = function (n) { return (n + h / 30) % 12; };
    var a = s * Math.min(l, 1 - l);
    var f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
    var dos = function (x) { return Math.round(255 * x).toString(16).padStart(2, '0'); };
    return '#' + dos(f(0)) + dos(f(8)) + dos(f(4));
  }

  function hexAHsl(hex) {
    var h = String(hex || '#000000').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16) || 0;
    var r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    var l = (max + min) / 2, s = 0, hue = 0;
    if (d > 0.0001) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (max === r) hue = ((g - b) / d) % 6;
      else if (max === g) hue = (b - r) / d + 2;
      else hue = (r - g) / d + 4;
      hue = Math.round(hue * 60); if (hue < 0) hue += 360;
    }
    return { h: hue, s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function pintarColores() {
    TOKENS.forEach(function (tok) {
      var k = tok[0];
      var fila = document.querySelector('.gs-color-fila[data-token="' + k + '"]');
      if (!fila) return;
      var hex = String(cfg.colores[k] || '#000000').toLowerCase();
      fila.querySelector('.gs-hex').textContent = hex;
      Array.prototype.forEach.call(fila.querySelectorAll('.gs-swatch'), function (sw) {
        sw.classList.toggle('activo', sw.dataset.color === hex);
      });
      var hsl = hexAHsl(hex);
      fila.querySelector('.gs-matiz').value = hsl.h;
      fila.querySelector('.gs-luz').value = hsl.l;
      fila.querySelector('.gs-matiz-val').textContent = hsl.h + '°';
      fila.querySelector('.gs-luz-val').textContent = hsl.l + '%';
    });
  }

  function construirColores() {
    var cont = $('gs-colores');
    cont.innerHTML = '';

    GRUPOS_TOKENS.forEach(function (grupo) {
      var gDiv = document.createElement('div');
      gDiv.className = 'gs-grupo-colores';
      gDiv.dataset.modulo = grupo.id;

      var gCab = document.createElement('div');
      gCab.className = 'gs-grupo-cab';
      gCab.innerHTML = '<span class="gs-grupo-titulo">' + grupo.titulo + '</span><span class="gs-grupo-desc">' + grupo.desc + '</span>';
      gDiv.appendChild(gCab);

      grupo.tokens.forEach(function (tok) {
        var k = tok[0];
        var fila = document.createElement('div');
        fila.className = 'gs-color-fila';
        fila.dataset.token = k;

        var cab = document.createElement('div');
        cab.className = 'gs-color-cab';
        cab.innerHTML = '<span>' + tok[1] + '</span><span class="gs-hex">#000000</span>';
        fila.appendChild(cab);

        var sws = document.createElement('div');
        sws.className = 'gs-swatches';
        SWATCHES.forEach(function (col) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'gs-swatch';
          b.dataset.color = col.toLowerCase();
          b.style.background = col;
          b.title = col;
          b.addEventListener('click', function () {
            cfg.colores[k] = col.toLowerCase();
            pintarColores();
            aplicarVivo(true);
          });
          sws.appendChild(b);
        });
        fila.appendChild(sws);

        var mini = document.createElement('div');
        mini.className = 'gs-mini';
        var matiz = document.createElement('input');
        matiz.type = 'range'; matiz.className = 'gs-slider gs-matiz'; matiz.min = '0'; matiz.max = '360'; matiz.step = '1';
        var mVal = document.createElement('span'); mVal.className = 'gs-valor gs-matiz-val';
        var luz = document.createElement('input');
        luz.type = 'range'; luz.className = 'gs-slider gs-luz'; luz.min = '4'; luz.max = '96'; luz.step = '1';
        var lVal = document.createElement('span'); lVal.className = 'gs-valor gs-luz-val';
        mini.appendChild(matiz); mini.appendChild(mVal); mini.appendChild(luz); mini.appendChild(lVal);
        fila.appendChild(mini);

        var refrescar = function () {
          var actual = cfg.colores[k];
          var hsl = hexAHsl(actual);
          cfg.colores[k] = hslAHex(Number(matiz.value), hsl.s < 12 ? 100 : hsl.s, Number(luz.value));
          pintarColores();
          aplicarVivo();
        };
        matiz.addEventListener('input', refrescar);
        luz.addEventListener('input', refrescar);

        gDiv.appendChild(fila);
      });

      cont.appendChild(gDiv);
    });

    pintarColores();
  }

  function initTabsModulos() {
    var nav = $('gs-colores-nav');
    if (!nav) return;
    nav.addEventListener('click', function (e) {
      var btn = e.target.closest('.gs-tab-btn');
      if (!btn) return;
      Array.prototype.forEach.call(nav.querySelectorAll('.gs-tab-btn'), function (b) {
        b.classList.remove('activo');
      });
      btn.classList.add('activo');
      var tab = btn.dataset.tab;
      var grupos = document.querySelectorAll('.gs-grupo-colores');
      Array.prototype.forEach.call(grupos, function (g) {
        if (tab === 'todos' || g.dataset.modulo === tab) {
          g.classList.remove('oculto');
        } else {
          g.classList.add('oculto');
        }
      });
    });
  }

  function construirContenedores() {
    var cont = $('gs-contenedores');
    cont.innerHTML = '';
    CONTENEDORES.forEach(function (def) {
      var k = def[0];
      var fila = document.createElement('div');
      fila.className = 'gs-fila';
      var lab = document.createElement('span');
      lab.className = 'gs-label';
      lab.textContent = def[1];
      var sl = document.createElement('input');
      sl.type = 'range'; sl.className = 'gs-slider';
      sl.min = String(def[2]); sl.max = String(def[3]); sl.step = String(def[4]);
      sl.value = String(cfg.contenedores[k]);
      var val = document.createElement('span');
      val.className = 'gs-valor';
      val.textContent = cfg.contenedores[k] + def[5];
      sl.addEventListener('input', function () {
        cfg.contenedores[k] = Number(sl.value);
        val.textContent = cfg.contenedores[k] + def[5];
        aplicarVivo();
      });
      fila.appendChild(lab); fila.appendChild(sl); fila.appendChild(val);
      cont.appendChild(fila);
    });
  }

  /* ------------------------------------------------------------- arranque */
  function cargar() {
    return fetch(API + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .catch(function () {
        return fetch(RUTA_JSON + '?t=' + Date.now(), { cache: 'no-store' })
          .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
          .catch(function () { return null; });
      });
  }

  function init() {
    customPaletas = leerCustomPaletas();
    cargar().then(function (o) {
      cfg = normalizar(o);
      construirFuentes();
      construirPaletas();
      construirColores();
      initTabsModulos();
      construirContenedores();

      var esc = $('gs-escala');
      esc.value = String(Math.round((previas.escala || 1) * 100));
      $('gs-escala-val').textContent = Math.round((previas.escala || 1) * 100) + '%';
      esc.addEventListener('input', function () {
        previas.escala = Number(esc.value) / 100;
        $('gs-escala-val').textContent = esc.value + '%';
        aplicarVivo();
      });

      var btnAddPal = $('gs-btn-agregar-paleta');
      if (btnAddPal) {
        btnAddPal.addEventListener('click', agregarPaletaPersonalizada);
      }

      aplicarVivo();
      if (!o) toast('No se pudo leer la config (¿npm start?): se muestra el diseño por defecto.', true, 6000);
    });

    $('gs-save').addEventListener('click', function () {
      guardarConfig(true).catch(function () { /* ya se publico local: se avisa en el toast */ });
    });
    $('gs-reload').addEventListener('click', function () {
      location.reload();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
