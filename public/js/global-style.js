/**
 * GLOBALSTYLE — cargador común de diseño (SINCRETISMO DE SILICIO)
 * ----------------------------------------------------------------------------
 * Un solo lugar decide TODO lo de diseño: la tipografía de todas las páginas,
 * la paleta y el diseño de los contenedores (fondo, borde, radio, padding,
 * blur y sombra). La config vive en `public/data/global_style.json` y se edita
 * en `/globalstyle.html` (que la guarda por `POST /api/global-style`).
 *
 * Sincronización instantánea multi-canal en vivo:
 *   1. BroadcastChannel: comunicación inmediata entre pestañas del mismo navegador (< 1ms)
 *   2. WebSocket (/ws): difusión inmediata a todos los clientes (móviles, pantallas, otras máquinas)
 *   3. localStorage + evento storage: persistencia y fallback
 *   4. document.fonts / Redibujo 3D: recarga Three.js y consola tras descargar la tipografía
 */
(function () {
  'use strict';

  var RUTA = 'data/global_style.json';
  var RUTA_BASE64 = 'fonts/fonts_base64.json';
  var ID_ESTILO = 'globalstyle-reglas';
  var ID_FUENTE = 'globalstyle-fuente';
  var LS_KEY = 'sincretismo_global_style';
  var BC_NAME = 'sincretismo_global_style';

  /* Tipografias ofrecidas con soporte tanto local (public/fonts) como Google Fonts. */
  var FUENTES = {
    'Share Tech Mono': 'Share+Tech+Mono',
    'VT323': 'VT323',
    'IBM Plex Mono': 'IBM+Plex+Mono:wght@400;500;700',
    'Space Mono': 'Space+Mono:wght@400;700',
    'Cutive Mono': 'Cutive+Mono',
    'Anonymous Pro': 'Anonymous+Pro:wght@400;700',
    'Nova Mono': 'Nova+Mono',
    'Cousine': 'Cousine:wght@400;700',
    'Fira Code': 'Fira+Code:wght@400;500;700',
    'JetBrains Mono': 'JetBrains+Mono:wght@400;700',
    'Major Mono Display': 'Major+Mono+Display',
    'VCR OSD Mono': null
  };

  var ARCHIVOS_LOCALES = {
    'Share Tech Mono': 'share_tech_mono.woff2',
    'VT323': 'vt323.woff2',
    'IBM Plex Mono': 'ibm_plex_mono.woff2',
    'Space Mono': 'space_mono.woff2',
    'Cutive Mono': 'cutive_mono.woff2',
    'Anonymous Pro': 'anonymous_pro.woff2',
    'Nova Mono': 'nova_mono.woff2',
    'Cousine': 'cousine.woff2',
    'Fira Code': 'fira_code.woff2',
    'JetBrains Mono': 'jetbrains_mono.woff2',
    'Major Mono Display': 'major_mono_display.woff2',
    'VCR OSD Mono': 'vcr.ttf'
  };

  var DEFECTO = {
    fuente: 'Share Tech Mono',
    colores: {
      fondo: '#070303', panel: '#140708', panel2: '#1e0a0c', borde: '#ff000d',
      acento: '#ff000d', acento2: '#e88f93', texto: '#e88f93', textoDim: '#8b4f52',
      clusterEsfera: '#ff000d', clusterNucleo: '#9a000d', clusterPelotita: '#ffd6d6',
      clusterCajaFill: '#140708', clusterCajaBorde: '#ff000d',
      logFondo: '#070303', logTexto: '#e88f93', logAcento: '#ff000d', logPanel: '#140708',
      cambiaFondo: '#070303', cambiaHud: '#140708', cambiaAcento: '#ff000d', cambiaPalabra: '#e88f93'
    },
    contenedores: { radio: 10, bordeAncho: 1, padding: 16, blur: 10, opacidadPanel: 0.85, sombra: 18 }
  };

  /* Cache en memoria de base64 de fuentes para inlining directo en SVG foreignObjects */
  var fontsBase64Map = {};

  /* Canal BroadcastChannel nativo para sincronización instantánea inter-pestañas */
  var broadcastChannel = null;
  try {
    if (typeof window.BroadcastChannel === 'function') {
      broadcastChannel = new window.BroadcastChannel(BC_NAME);
    }
  } catch (e) {}

  /* Socket global dedicado o compartido */
  var wsBus = null;

  /* Selectores de TEXTO y de ACENTO de cada página */
  var TEXTO = {
    log: [
      '#thought-terminal', '#thought-terminal.manifest-mode', '#thought-content',
      '#thought-terminal.manifest-mode #thought-content', '.thought-chunk-output',
      '.thought-chunk-narr', '#thought-status-hint', '#status', '.haiku-text'
    ],
    cosmos: [
      '.cosmos-standalone-header', '.neural-orders-hud', '.cosmos-hud-telemetry',
      '.order-slot-pill', '.speech-text', '#orders-speech-text'
    ],
    cambia: [
      '#cctv-hud', '.cctv-node-id', '.cctv-timestamp', '.modal-card',
      '.modal-body', '.modal-footer', '.cctv-tag'
    ],
    biblioteca: [
      '.cluster-lib-header', '.cluster-card', '.cluster-lib-container',
      '.cluster-automap-container'
    ],
    globalstyle: ['.gs-seccion', '.gs-preview-panel', '.gs-preview-cuerpo']
  };

  var ACENTO = {
    log: ['.agent-badge', '#mode-badge', '.pa-titulo-seccion', '.gs-punto', '#thought-status-hint b', '#status b', '.haiku-header'],
    cosmos: ['.header-brand-title', '.orders-title', '.tel-val.highlight', '.pa-titulo', '.orders-pulse-dot', '.connector-spark'],
    cambia: ['.blinking-dot', '.cctv-tag', '.cctv-btn', '.modal-tab-btn.activo', '.modal-close-btn'],
    biblioteca: ['.lib-badge', '.cluster-lib-header h2', '.btn-primary', '.hint-3d'],
    globalstyle: ['.gs-punto', '.gs-titulo', '.gs-titulo-seccion', '.gs-btn-primario']
  };

  /* Contenedores de cada página que pasan a manejarse desde acá */
  var CONTENEDORES = {
    log: ['#status', '#main-container', '.thought-stream-container', '#thought-terminal', '#haiku-banner', '#panel-ajustes', '.word-pill-slot', '.words-pipeline'],
    cosmos: ['.cosmos-standalone-header', '.btn-standalone-nav', '.neural-orders-hud', '.order-slot-pill', '#panel-ajustes-cosmos', '.cosmos-hud-telemetry', '.hint-chip'],
    cambia: ['#cctv-hud', '.cctv-indicator', '.modal-overlay', '.modal-card', '.modal-header', '.modal-footer', '.modal-tab-btn', '.cctv-btn', '.cctv-preview-card'],
    biblioteca: ['.cluster-lib-container', '.cluster-lib-header', '.cluster-card', '.cluster-automap-container', '.word-tag'],
    globalstyle: ['.gs-seccion', '.gs-preview-panel', '.gs-card']
  };

  function hexARgba(hex, alfa) {
    var h = String(hex || '#000000').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (!isFinite(n)) n = 0;
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alfa + ')';
  }

  function familia(fuente) {
    return '"' + fuente + '", monospace';
  }

  function paginaActual() {
    var p = (location.pathname || '').toLowerCase();
    if (p.indexOf('globalstyle') !== -1) return 'globalstyle';
    if (p.indexOf('cosmos') !== -1 || p.indexOf('clusters3d') !== -1) return 'cosmos';
    if (p.indexOf('log') !== -1) return 'log';
    if (p.indexOf('cambiapalabras') !== -1 || p.indexOf('game3') !== -1 || p.indexOf('cyber-hijack') !== -1) return 'cambia';
    return 'biblioteca';
  }

  function inyectarFuente(fuente) {
    // 100% LOCAL: la tipografia ya viene de public/css/fonts-local.css (vendorizada,
    // public/fonts/webfonts/*.woff2). NO se pide nada a fonts.googleapis.com.
    var viejo = document.getElementById(ID_FUENTE);
    if (viejo && viejo.getAttribute('data-fuente') === fuente) return;
    if (viejo && viejo.parentNode) viejo.parentNode.removeChild(viejo);
    refrescarVisualizadores();
  }

  function reglas(cfg, pagina) {
    var c = cfg.colores, d = cfg.contenedores, f = familia(cfg.fuente);
    var panelRgba = hexARgba(c.panel, d.opacidadPanel);
    var sombra = '0 ' + Math.round(d.sombra * 0.4) + 'px ' + d.sombra + 'px rgba(0,0,0,' + Math.min(0.95, 0.35 + d.sombra / 60).toFixed(2) + ')';
    var s = [];

    // Fallbacks para tokens modulares
    var clusterEsfera = c.clusterEsfera || c.acento || '#ff000d';
    var clusterNucleo = c.clusterNucleo || c.acento2 || '#9a000d';
    var clusterPelotita = c.clusterPelotita || c.acento2 || '#ffd6d6';
    var clusterCajaFill = c.clusterCajaFill || c.panel || '#140708';
    var clusterCajaBorde = c.clusterCajaBorde || c.borde || '#ff000d';

    var logFondo = c.logFondo || c.fondo || '#070303';
    var logTexto = c.logTexto || c.texto || '#e88f93';
    var logAcento = c.logAcento || c.acento || '#ff000d';
    var logPanel = c.logPanel || c.panel || '#140708';

    var cambiaFondo = c.cambiaFondo || c.fondo || '#070303';
    var cambiaHud = c.cambiaHud || c.panel || '#140708';
    var cambiaAcento = c.cambiaAcento || c.acento || '#ff000d';
    var cambiaPalabra = c.cambiaPalabra || c.acento2 || '#e88f93';

    var logPanelRgba = hexARgba(logPanel, d.opacidadPanel);
    var cambiaHudRgba = hexARgba(cambiaHud, d.opacidadPanel);
    var clusterCajaFillRgba = hexARgba(clusterCajaFill, d.opacidadPanel);

    // Definición @font-face local directa para la tipografía activa con soporte para normal, bold y 900
    var archLocal = ARCHIVOS_LOCALES[cfg.fuente];
    if (archLocal) {
      var formato = archLocal.endsWith('.woff2') ? 'woff2' : 'truetype';
      var fontUrl = (typeof window.sbUrl === 'function') ? window.sbUrl('/fonts/' + archLocal) : ('fonts/' + archLocal);
      s.push('@font-face{font-family:"' + cfg.fuente + '";src:url("' + fontUrl + '") format("' + formato + '");font-weight:normal;font-style:normal;font-display:swap;}');
      s.push('@font-face{font-family:"' + cfg.fuente + '";src:url("' + fontUrl + '") format("' + formato + '");font-weight:bold;font-style:normal;font-display:swap;}');
      s.push('@font-face{font-family:"' + cfg.fuente + '";src:url("' + fontUrl + '") format("' + formato + '");font-weight:900;font-style:normal;font-display:swap;}');
    }
    s.push('@font-face{font-family:"VCR OSD Mono";src:url("fonts/vcr.ttf") format("truetype");font-display:swap;}');

    s.push(':root{');
    s.push('  --gs-fuente:' + f + ';');
    s.push('  --font-cyber:' + f + ' !important;');
    s.push('  --font-organic:' + f + ' !important;');
    s.push('  --word-font-family:' + f + ' !important;');
    s.push('  --font-mono:' + f + ' !important;');
    s.push('  --font-sans:' + f + ' !important;');
    s.push('  --gs-fondo:' + c.fondo + ';');
    s.push('  --gs-panel:' + panelRgba + ';');
    s.push('  --gs-panel-solido:' + c.panel + ';');
    s.push('  --gs-panel2:' + hexARgba(c.panel2, d.opacidadPanel) + ';');
    s.push('  --gs-borde:' + c.borde + ';');
    s.push('  --gs-acento:' + c.acento + ';');
    s.push('  --gs-acento2:' + c.acento2 + ';');
    s.push('  --gs-texto:' + c.texto + ';');
    s.push('  --gs-texto-dim:' + c.textoDim + ';');

    // Módulos específicos
    s.push('  --gs-cluster-esfera:' + clusterEsfera + ';');
    s.push('  --gs-cluster-nucleo:' + clusterNucleo + ';');
    s.push('  --gs-cluster-pelotita:' + clusterPelotita + ';');
    s.push('  --gs-cluster-caja-fill:' + clusterCajaFillRgba + ';');
    s.push('  --gs-cluster-caja-borde:' + clusterCajaBorde + ';');

    s.push('  --gs-log-fondo:' + logFondo + ';');
    s.push('  --gs-log-texto:' + logTexto + ';');
    s.push('  --gs-log-acento:' + logAcento + ';');
    s.push('  --gs-log-panel:' + logPanelRgba + ';');

    s.push('  --gs-cambia-fondo:' + cambiaFondo + ';');
    s.push('  --gs-cambia-hud:' + cambiaHudRgba + ';');
    s.push('  --gs-cambia-acento:' + cambiaAcento + ';');
    s.push('  --gs-cambia-palabra:' + cambiaPalabra + ';');
    // PUNTEROS (retículos de mouse / tracking de cambiapalabras): se pueden fijar
    // desde /globalstyle.html y el JS los lee de GlobalStyleConfig.colores.
    s.push('  --gs-puntero:' + (c.puntero || cambiaAcento) + ';');
    s.push('  --gs-puntero-fijo:' + (c.punteroFijo || cambiaPalabra) + ';');

    s.push('  --gs-radio:' + d.radio + 'px;');
    s.push('  --gs-borde-ancho:' + d.bordeAncho + 'px;');
    s.push('  --gs-padding:' + d.padding + 'px;');
    s.push('  --gs-blur:' + d.blur + 'px;');
    s.push('  --gs-sombra:' + sombra + ';');

    // Mapeo hacia variables de cambiapalabras y cosmos-clusters
    s.push('  --bg-dark:' + cambiaFondo + ' !important;');
    s.push('  --bg-surface:' + cambiaHudRgba + ' !important;');
    s.push('  --bg-hud:' + cambiaHudRgba + ' !important;');
    s.push('  --border-cyan:' + cambiaAcento + ' !important;');
    s.push('  --border-color:' + cambiaAcento + ' !important;');
    s.push('  --accent-cyan:' + cambiaAcento + ' !important;');
    s.push('  --text-main:' + cambiaPalabra + ' !important;');
    s.push('  --text-muted:' + c.textoDim + ' !important;');
    s.push('  --text-cctv:' + cambiaAcento + ' !important;');
    s.push('}');

    /* Tipografía y fondo global de TODAS las páginas */
    s.push('html,body{font-family:var(--gs-fuente) !important;background-color:var(--gs-fondo) !important;color:var(--gs-texto) !important;}');
    s.push('button,input,select,textarea,#thought-terminal,#thought-terminal.manifest-mode,.manifest-mode,.thought-chunk-think,.thought-chunk-output,.thought-chunk-narr,.thought-chunk-json,.thought-chunk-poem,pre,code,.cluster-name-input,.word-tag,.haiku-text{font-family:var(--gs-fuente) !important;}');

    /* TODO EN MAYÚSCULAS en log, cluster y cambiapalabras (Requerimiento global) */
    s.push('*, html, body, button, input, select, textarea, div, p, span, h1, h2, h3, h4, h5, h6, a, label, pre, code, .thought-chunk-think, .thought-chunk-output, .thought-chunk-narr, .thought-chunk-json, .thought-chunk-poem, .haiku-text, .organic-word-item, .organic-word-item *, .cctv-word, .modal-card, .modal-card *, .speech-text-output, .word-chip, #cctv-hud, #cctv-hud *, #thought-terminal, #thought-terminal *, #thought-content, #orders-speech-text, .speech-text, .cctv-tag, .chip-btn, .modal-tab-btn, .cctv-preview-card, .order-slot-pill, .cosmos-hud-telemetry, .semantic-tree-hud, .semantic-tree-hud *{text-transform:uppercase !important;}');

    /* Selectores específicos de cambiapalabras para que las palabras capturadas y el HUD cambien de inmediato */
    s.push('.organic-word-item,.organic-word-item *,.cctv-word,.modal-card,.modal-card *,.speech-text-output,.word-chip,.chip-btn,.tab-badge,.banner-status-tag,#cctv-hud,#cctv-hud *{font-family:var(--gs-fuente) !important;}');

    /* Reglas específicas para el terminal y modo manifiesto de log.html */
    s.push('#thought-terminal.manifest-mode{font-family:var(--gs-fuente) !important;color:var(--gs-log-texto) !important;}');
    s.push('#thought-terminal.manifest-mode #thought-content{color:var(--gs-log-texto) !important;}');

    /* Reglas específicas por pantalla */
    if (pagina === 'log') {
      s.push('html,body{background-color:var(--gs-log-fondo) !important;color:var(--gs-log-texto) !important;}');
      s.push('#thought-terminal,#thought-terminal.manifest-mode,#thought-content,#thought-terminal.manifest-mode #thought-content,.thought-chunk-output,.thought-chunk-narr,#thought-status-hint,#status,.haiku-text{color:var(--gs-log-texto) !important;}');
      s.push('.agent-badge,#mode-badge,.pa-titulo-seccion,.gs-punto,#thought-status-hint b,#status b,.haiku-header{color:var(--gs-log-acento) !important;border-color:var(--gs-log-acento) !important;}');
      s.push('#status,#main-container,.thought-stream-container,#thought-terminal,#haiku-banner,#panel-ajustes,.word-pill-slot,.words-pipeline{background:var(--gs-log-panel) !important;border-color:var(--gs-log-acento) !important;}');
    } else if (pagina === 'cambia') {
      s.push('html,body{background-color:var(--gs-cambia-fondo) !important;}');
      s.push('#cctv-hud,.cctv-indicator,.modal-overlay,.modal-card,.modal-header,.modal-footer,.cctv-btn,.cctv-preview-card{background:var(--gs-cambia-hud) !important;border-color:var(--gs-cambia-acento) !important;}');
      s.push('.blinking-dot,.cctv-tag,.cctv-btn,.modal-tab-btn.activo,.modal-close-btn{color:var(--gs-cambia-acento) !important;border-color:var(--gs-cambia-acento) !important;}');
      /* OJO: las palabras ('.organic-word-item') NO se pintan desde acá. Su color
         sale de style.css -> `color: var(--word-color, #ffffff)`, o sea del control
         "Color de la Palabra" de la pestaña PARTÍCULAS (y es BLANCO por defecto).
         Antes esta regla las pisaba con --gs-cambia-palabra aunque tuviera
         !important, y el control del modal no servía para nada. */
      s.push('.cctv-word,.speech-text-output,.word-chip{color:var(--gs-cambia-palabra) !important;}');
    } else if (pagina === 'cosmos') {
      s.push('.cosmos-standalone-header,.neural-orders-hud,.order-slot-pill,#panel-ajustes-cosmos,.cosmos-hud-telemetry{background:var(--gs-cluster-caja-fill) !important;border-color:var(--gs-cluster-caja-borde) !important;}');
      s.push('.header-brand-title,.orders-title,.tel-val.highlight,.orders-pulse-dot{color:var(--gs-cluster-esfera) !important;}');
    }

    /* Contenedores de ESTA página (coincide tanto en body como en div wrapper de foreignObject) */
    var sels = CONTENEDORES[pagina] || [];
    if (sels.length) {
      var listado = sels.join(',');
      s.push('[data-gs-pagina] ' + listado.replace(/,/g, ',[data-gs-pagina] ') + '{' +
        'background:var(--gs-panel) !important;' +
        'border:var(--gs-borde-ancho) solid var(--gs-borde) !important;' +
        'border-radius:var(--gs-radio) !important;' +
        'box-shadow:var(--gs-sombra) !important;' +
        'color:var(--gs-texto) !important;}');
      s.push('[data-gs-pagina] ' + listado.replace(/,/g, ',[data-gs-pagina] ') + ' .gs-acento,[data-gs-pagina] ' +
        listado.replace(/,/g, ' .gs-acento,[data-gs-pagina] ') + ' .gs-acento{color:var(--gs-acento) !important;}');
    }

    /* Texto y acentos de ESTA página */
    var tsel = TEXTO[pagina] || [];
    var asel = ACENTO[pagina] || [];
    if (tsel.length) {
      s.push('[data-gs-pagina] ' + tsel.join(',[data-gs-pagina] ') + '{color:var(--gs-texto) !important;}');
      s.push(tsel.join(',') + '{color:var(--gs-texto) !important;}');
    }
    if (asel.length) {
      s.push('[data-gs-pagina] ' + asel.join(',[data-gs-pagina] ') + '{color:var(--gs-acento) !important;border-color:var(--gs-acento) !important;}');
    }

    /* Botones/acentos comunes */
    s.push('.btn-standalone-nav,.cctv-btn,.modal-tab-btn{border-radius:var(--gs-radio);border-color:var(--gs-borde);}');
    s.push('.btn-standalone-nav:hover,.cctv-btn:hover{border-color:var(--gs-acento);color:var(--gs-acento2);}');

    return s.join('\n');
  }

  function refrescarVisualizadores() {
    try {
      if (window.cosmosVisualizer) {
        if (typeof window.cosmosVisualizer.aplicarColoresEsferas === 'function') {
          window.cosmosVisualizer.aplicarColoresEsferas();
        } else if (typeof window.cosmosVisualizer.forzarRedibujoTextos === 'function') {
          window.cosmosVisualizer.forzarRedibujoTextos();
        }
      }
      if (typeof window.scheduleLogCapture === 'function') {
        window.scheduleLogCapture();
      }
      window.dispatchEvent(new CustomEvent('globalstyle:applied', { detail: window.GlobalStyleConfig }));
    } catch (e) {}
  }

  function aplicar(cfg) {
    if (!cfg || !cfg.colores) cfg = DEFECTO;
    var pagina = paginaActual();

    if (document.body) {
      document.body.setAttribute('data-gs-pagina', pagina);
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        try { document.body.setAttribute('data-gs-pagina', pagina); } catch (e) {}
      });
    }

    inyectarFuente(cfg.fuente);

    var famStr = familia(cfg.fuente);
    try {
      document.documentElement.style.setProperty('--gs-fuente', famStr);
      document.documentElement.style.setProperty('--font-cyber', famStr);
      document.documentElement.style.setProperty('--font-organic', famStr);
      document.documentElement.style.setProperty('--word-font-family', famStr);
      document.documentElement.style.setProperty('--font-sans', famStr);
      document.documentElement.style.setProperty('--font-mono', famStr);
    } catch (e) {}

    var st = document.getElementById(ID_ESTILO);
    if (!st) {
      st = document.createElement('style');
      st.id = ID_ESTILO;
    }
    st.textContent = reglas(cfg, pagina);
    if (document.head) document.head.appendChild(st);

    window.GlobalStyleConfig = cfg;
    window.GS_FONT_FAMILY = famStr;

    // Intentar esperar a que el motor tipográfico cargue la fuente
    if (document.fonts && typeof document.fonts.load === 'function') {
      document.fonts.load('16px "' + cfg.fuente + '"').then(function () {
        refrescarVisualizadores();
      }).catch(function () {});
    }
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(function () {
        refrescarVisualizadores();
      });
    }

    // Refrescos preventivos escalonados para Three.js y WebGL
    refrescarVisualizadores();
    setTimeout(refrescarVisualizadores, 60);
    setTimeout(refrescarVisualizadores, 220);
    setTimeout(refrescarVisualizadores, 550);

    return cfg;
  }

  function rutaConfig() {
    if (typeof window.sbUrl === 'function') {
      try { return window.sbUrl('/' + RUTA); } catch (e) {}
    }
    return (document.currentScript && document.currentScript.src
      ? document.currentScript.src.replace(/js\/global-style\.js.*$/, '') + RUTA
      : RUTA);
  }

  function leerLocal() {
    try {
      var raw = window.localStorage.getItem(LS_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      return (o && o.cfg && o.cfg.colores) ? o : null;
    } catch (e) { return null; }
  }

  function cargarY_Aplicar() {
    var local = leerLocal();
    var url = rutaConfig();
    try {
      url += (url.indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now();
    } catch (e) {}

    fetch(url, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (cfg) {
        var selloServidor = Number(cfg && cfg.guardado) || 0;
        if (local && Number(local.t) > selloServidor) {
          aplicar(local.cfg);
        } else {
          aplicar(cfg);
        }
      })
      .catch(function (e) {
        if (local) { aplicar(local.cfg); return; }
        aplicar(DEFECTO);
      });

    // Cargar mapa base64 de fuentes en segundo plano para SVG inlining
    var urlB64 = (typeof window.sbUrl === 'function') ? window.sbUrl('/' + RUTA_BASE64) : RUTA_BASE64;
    fetch(urlB64, { cache: 'force-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (m) {
        if (m) {
          fontsBase64Map = m;
          window.__fontsBase64 = m;
          refrescarVisualizadores();
        }
      })
      .catch(function () {});
  }

  /* Publicación instantánea a todos los clientes por todos los medios */
  function publicar(cfg) {
    if (!cfg) return;
    cfg.guardado = Date.now();

    // 1. localStorage (persistente)
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify({ cfg: cfg, t: cfg.guardado }));
    } catch (e) {}

    // 2. BroadcastChannel (0ms entre pestañas)
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type: 'globalstyle:update', config: cfg, timestamp: cfg.guardado });
      } catch (e) {}
    }

    // 3. WebSocket bus
    if (wsBus && wsBus.readyState === 1) {
      try {
        wsBus.send(JSON.stringify({ type: 'globalstyle:update', config: cfg, timestamp: cfg.guardado }));
      } catch (e) {}
    }

    // 4. Aplicar en la propia página
    aplicar(cfg);
  }

  /* Escuchar BroadcastChannel inter-pestañas */
  if (broadcastChannel) {
    broadcastChannel.onmessage = function (ev) {
      if (ev && ev.data && ev.data.config) {
        aplicar(ev.data.config);
      }
    };
  }

  /* Escuchar cambios en localStorage (otras pestañas) */
  window.addEventListener('storage', function (e) {
    if (e && e.key && e.key !== LS_KEY) return;
    var local = leerLocal();
    if (local && local.cfg) aplicar(local.cfg);
  });

  /* Conexión ligera WebSocket para sincronización bidireccional si la página no tiene una */
  function initWsSync() {
    try {
      var wsUrl = (typeof window.sbWsUrl === 'function')
        ? window.sbWsUrl()
        : ((location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host + '/ws');

      wsBus = new WebSocket(wsUrl);

      wsBus.addEventListener('message', function (ev) {
        try {
          var msg = JSON.parse(ev.data);
          if (msg.type === 'globalstyle:update' && msg.config) {
            aplicar(msg.config);
          }
        } catch (e) {}
      });

      wsBus.addEventListener('close', function () {
        setTimeout(initWsSync, 4000);
      });
    } catch (e) {}
  }

  // Iniciar enlace WebSocket para sync global
  setTimeout(initWsSync, 100);

  window.GlobalStyle = {
    lsKey: LS_KEY,
    aplicar: aplicar,
    publicar: publicar,
    defecto: DEFECTO,
    fuentes: FUENTES,
    archivosLocales: ARCHIVOS_LOCALES,
    contenedores: CONTENEDORES,
    paginaActual: paginaActual,
    familia: familia,
    hexARgba: hexARgba,
    refrescarVisualizadores: refrescarVisualizadores,
    getBase64DataUri: function (fuente) {
      var arch = ARCHIVOS_LOCALES[fuente];
      return arch ? (fontsBase64Map[arch] || null) : null;
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cargarY_Aplicar);
  else cargarY_Aplicar();
})();
