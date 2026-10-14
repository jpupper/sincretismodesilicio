/* ============================================================================
   SINCRETISMO DE SILICIO — SISTEMA DE VENTANAS (CLASE MAESTRA)
   ----------------------------------------------------------------------------
   Una sola clase manda sobre TODAS las ventanitas de la experiencia Sicre2
   (cambiapalabras.html): las que ya existían (DEPTH MAP, BIOMETRÍA FACIAL,
   MANO IZQUIERDA, MANO DERECHA) y las nuevas (UNIVERSO 3D POR CÚMULOS y
   LOG.html), sin importar qué contenido muestran.

   QUÉ RESUELVE
     - Alta/baja de ventanas: cada ventana se declara UNA vez con su DESCRIPTOR
       (título, tamaño, tipo de contenido, ciclo de aparición, controles, etc.).
     - Ciclo automático: cada ventana tiene su PROPIO reloj; se prende por Y
       segundos y se apaga por Z, sorteados en cada vuelta. No se sincronizan.
     - Posición aleatoria en la periferia, sin solaparse con las otras.
     - Contenido por tipo: 'canvas' (lo pinta la página), 'iframe' (páginas
       enteras mostradas como mini-monitor escalado) o 'dom' (un nodo propio).
     - CONTROL POR MANOS (OpenPose): un punto de mano que se apoya en la barra
       de título AGARRA y ARRASTRA la ventana; un punto que se queda sobre la ✕
       la CIERRA por dwell (con anillo de progreso).
     - También se arrastra con el mouse/puntero por la barra de título.

   API RÁPIDA (window.SistemaVentanas)
     registrar(descriptor | [descriptores])
     abrir(id, motivo) / cerrar(id, motivo) / toggle(id) / cerrarTodas(motivo)
     abrirAleatoria(motivo) / abrirPesada(motivo)
     actualizarCiclo(performance.now())        // ciclo automático (por frame)
     controlPuntos(appState.activeInteractionPoints, dt)  // manos (por frame)
     el(id) / visible(id) / lista() / visibles()
     simularPunto(nombre, x, y, ms)            // calibrar sin cámara
     limpiarSimulacion()

   DESCRIPTOR (todo lo que define cómo funciona una ventana)
     {
       id: 'depth',                         // clave única
       titulo: 'DEPTH MAP',                 // rótulo legible
       tipo: 'canvas' | 'iframe' | 'dom',
       el: '#depth-map-pip',                // nodo de la ventana (o elemento)
       barra: '#depth-map-pip .pip-header', // barra de título (zona de agarre)
       btnCerrar: '#btn-close-depth-pip',
       contenido: '.pip-canvas-wrapper',    // caja donde va el contenido inyectado
       tamano: { ancho: 250, alto: 220 },   // px (para el sorteo de posición)
       ciclo: { activo: true, min: 5, max: 30 },  // segundos (usa los globales si se omite)
       grupo: 'pesadas', maxEnGrupo: 1,     // a lo sumo N de este grupo a la vez
       controles: { arrastrable: true, zonaArrastre: 'barra', cerrable: true, arrastraConMouse: true },
       iframe: { src: './log.html?embed=1', virtual: { ancho: 720, alto: 440 }, interactivo: false },
       requiere: (ventana) => true,         // condición extra para poder abrirse
       alAbrir: (ventana) => {}, alCerrar: (ventana) => {},
       alCambiarVisible: (ventana, visible) => {}   // espejo de estado del proyecto
     }
   ============================================================================ */
(function (global) {
  'use strict';

  var TIPO_CANVAS = 'canvas';
  var TIPO_IFRAME = 'iframe';
  var TIPO_DOM = 'dom';
  var NOMBRE_MANO = /(MANO|DEDO|CODO|FACIAL)/i;   // nombres que emite OpenPose

  var PIP_RANDOM_MIN_S = 5;
  var PIP_RANDOM_MAX_S = 30;
  var MARGEN_X = 20;
  var MARGEN_Y = 45;
  var MS_DESMONTAJE = 320;      // espera al fade-out antes de soltar el iframe

  function ahoraMs() {
    return (global.performance && global.performance.now) ? global.performance.now() : Date.now();
  }

  function limitar(valor, min, max) {
    return Math.max(min, Math.min(max, valor));
  }

  function resolverNodo(ref, raiz) {
    if (!ref) return null;
    if (typeof ref === 'string') return (raiz || document).querySelector(ref);
    return ref;
  }

  function dentroDePunto(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  /* ==========================================================================
     VENTANA — una ventanita concreta (estado + DOM + contenido)
     ========================================================================== */
  class Ventana {
    constructor(desc, sistema) {
      this.desc = desc || {};
      this.sistema = sistema;
      this.id = this.desc.id;
      this.titulo = this.desc.titulo || this.id;
      this.tipo = this.desc.tipo || TIPO_CANVAS;

      this.el = resolverNodo(this.desc.el);
      if (!this.el) throw new Error('[Ventanas] no existe el nodo de la ventana "' + this.id + '"');

      this.barraEl = resolverNodo(this.desc.barra, this.el);
      this.btnCerrarEl = resolverNodo(this.desc.btnCerrar, this.el);
      this.contenidoEl = resolverNodo(this.desc.contenido, this.el) || this.el;

      var t = this.desc.tamano || {};
      this.w = Math.round(t.ancho || this.el.offsetWidth || 240);
      this.h = Math.round(t.alto || this.el.offsetHeight || 200);
      this.barraAlto = (this.desc.barra && this.desc.barra.alto) || 26;

      this.tamanoContenido = this.desc.tamanoContenido || null;  // para tipo iframe

      this.x = 0;
      this.y = 0;
      this.visible = false;
      this.proximoCambio = null;      // reloj propio del ciclo automático
      this.agarreTimer = 0;           // tiempo apoyado en la barra (para agarrar)
      this.agarradaPor = null;        // nombre del punto que la tiene tomada
      this.agarreDesfase = { x: 0, y: 0 };
      this.progresoCierre = 0;        // 0..1 del dwell sobre la ✕
      this.iframe = null;
      this.tokenDesmontaje = 0;
      this.arrastrandoMouse = false;
      this._mouseOff = { x: 0, y: 0 };

      this.el.dataset.ventana = this.id;
      this.abiertaManual = false;      // abierta desde el panel: el ciclo no la cierra
      this.el.classList.add('ventana-sistema');
      if (this.barraEl) this.barraEl.classList.add('ventana-barra');

      if (this.btnCerrarEl) {
        this.btnCerrarEl.classList.add('ventana-cerrar');
        this.btnCerrarEl.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
        this.btnCerrarEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.cerrar('boton');
        });
      }

      var ctrl = this.desc.controles || {};
      if (ctrl.arrastraConMouse !== false && ctrl.arrastrable !== false) this._engancharArrastrePuntero();
    }

    /* ------------------------------------------------------------ DOM/medidas */
    rect() {
      return { x: this.x, y: this.y, w: this.w, h: this.h };
    }

    rectBarra() {
      var zona = (this.desc.controles && this.desc.controles.zonaArrastre) || 'barra';
      if (zona === 'ventana') return this.rect();
      return { x: this.x, y: this.y, w: this.w, h: this.barraAlto };
    }

    rectCerrar(margen) {
      if (!this.btnCerrarEl) return null;
      var r = this.btnCerrarEl.getBoundingClientRect();
      var m = margen === undefined ? 10 : margen;
      return { x: r.left - m, y: r.top - m, w: r.width + m * 2, h: r.height + m * 2 };
    }

    /* ------------------------------------------------------------- posición */
    posicionar(x, y) {
      var W = global.innerWidth || 1080;
      var H = global.innerHeight || 1920;
      this.x = Math.round(limitar(x, MARGEN_X, Math.max(MARGEN_X, W - this.w - MARGEN_X)));
      this.y = Math.round(limitar(y, MARGEN_Y, Math.max(MARGEN_Y, H - this.h - MARGEN_Y)));
      this.el.style.left = this.x + 'px';
      this.el.style.top = this.y + 'px';
      this.el.style.right = 'auto';
      this.el.style.bottom = 'auto';
    }

    /* -------------------------------------------------------------- contenido */
    montarContenido() {
      if (this.tipo !== TIPO_IFRAME) return;
      if (this.iframe) {
        // Reabierta antes de que terminara el desmontaje: se cancela el borrado.
        this.tokenDesmontaje++;
        return;
      }
      var cfg = this.desc.iframe || {};
      if (!cfg.src) return;

      var marco = document.createElement('iframe');
      marco.className = 'ventana-iframe';
      marco.setAttribute('title', this.titulo);
      marco.setAttribute('scrolling', 'no');
      marco.setAttribute('frameborder', '0');
      if (cfg.interactivo !== true) marco.style.pointerEvents = 'none';

      var vw = (cfg.virtual && cfg.virtual.ancho) || 720;
      var vh = (cfg.virtual && cfg.virtual.alto) || 440;
      marco.style.width = vw + 'px';
      marco.style.height = vh + 'px';

      var caja = this.contenidoEl;
      var cw = caja.clientWidth || (this.w - 2);
      var ch = caja.clientHeight || (this.h - this.barraAlto - 22);
      var escala = Math.min(cw / vw, ch / vh);
      marco.style.transformOrigin = 'top left';
      marco.style.transform = 'scale(' + escala.toFixed(4) + ')';
      marco.style.left = Math.max(0, Math.round((cw - vw * escala) / 2)) + 'px';
      marco.style.top = Math.max(0, Math.round((ch - vh * escala) / 2)) + 'px';

      caja.appendChild(marco);
      this.iframe = marco;
      requestAnimationFrame(() => { marco.src = cfg.src; });
    }

    desmontarContenido(retraso) {
      if (this.tipo !== TIPO_IFRAME) return;
      var token = ++this.tokenDesmontaje;
      var soltar = () => {
        if (token !== this.tokenDesmontaje) return;      // se reabrió: no borrar
        if (this.iframe && this.iframe.parentNode) this.iframe.parentNode.removeChild(this.iframe);
        this.iframe = null;
      };
      if (retraso) setTimeout(soltar, retraso); else soltar();
    }

    /* ------------------------------------------------------- abrir / cerrar */
    abrir(motivo, forzar) {
      if (this.visible) return false;
      if (!forzar && !this.sistema.puedeAbrirse(this)) return false;
      this.sistema.posicionAlAzar(this);
      this.abiertaManual = (forzar === true);
      this.visible = true;
      this.progresoCierre = 0;
      this.el.classList.remove('hidden');
      this.el.setAttribute('aria-hidden', 'false');
      this.montarContenido();
      if (typeof this.desc.alAbrir === 'function') this.desc.alAbrir(this);
      this.sistema._avisar(this, true, motivo);
      return true;
    }

    cerrar(motivo) {
      if (!this.visible) return false;
      this.visible = false;
      this.soltar();
      this.progresoCierre = 0;
      this.el.style.setProperty('--cierre', '0');
      this.el.classList.remove('arrastrando');
      this.el.classList.add('hidden');
      this.el.setAttribute('aria-hidden', 'true');
      this.desmontarContenido(MS_DESMONTAJE);
      if (typeof this.desc.alCerrar === 'function') this.desc.alCerrar(this);
      this.sistema._avisar(this, false, motivo);
      return true;
    }

    toggle(motivo) {
      return this.visible ? this.cerrar(motivo) : this.abrir(motivo);
    }

    /* ------------------------------------------------------- control por manos */
    hayManoEnPunto(puntos) {
      if (!puntos || !puntos.length) return false;
      var r = this.rect();
      for (var i = 0; i < puntos.length; i++) {
        var p = puntos[i];
        if (NOMBRE_MANO.test(p.name || '') && dentroDePunto(p.x, p.y, r)) return true;
      }
      return false;
    }

    soltar() {
      if (!this.agarradaPor) return;
      this.agarradaPor = null;
      this.agarreTimer = 0;
      this.el.classList.remove('arrastrando');
    }

    _engancharArrastrePuntero() {
      var barra = this.barraEl || this.el;
      barra.style.cursor = 'grab';
      barra.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        this.arrastrandoMouse = true;
        this._mouseOff = { x: e.clientX - this.x, y: e.clientY - this.y };
        this.el.classList.add('arrastrando');
        try { barra.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
        e.preventDefault();
      });
      barra.addEventListener('pointermove', (e) => {
        if (!this.arrastrandoMouse) return;
        this.posicionar(e.clientX - this._mouseOff.x, e.clientY - this._mouseOff.y);
      });
      var fin = (e) => {
        if (!this.arrastrandoMouse) return;
        this.arrastrandoMouse = false;
        this.el.classList.remove('arrastrando');
        try { barra.releasePointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
      };
      barra.addEventListener('pointerup', fin);
      barra.addEventListener('pointercancel', fin);
    }
  }

  /* ==========================================================================
     SISTEMA DE VENTANAS — registro + ciclo + control por puntos
     ========================================================================== */
  class SistemaVentanas {
    constructor() {
      this.ventanas = new Map();
      this.orden = [];
      this.control = {
        activo: true,              // maestro: control por puntos de mano
        puntosMano: true,          // acepta puntos de OpenPose (manos/dedos)
        puntosMouse: false,        // el puntero del mouse también arrastra (por defecto: no)
        dwellCierre: 1.2,          // segundos sobre la ✕ para cerrar
        dwellAgarre: 0.18,         // segundos apoyado en la barra para agarrar
        requiereHumano: true       // sin humano detectado, no se abre nada
      };
      this.cicloGlobal = { min: PIP_RANDOM_MIN_S, max: PIP_RANDOM_MAX_S };
      this.condicionGlobal = null;   // hook del proyecto: () => hasHuman && !haiku
      this.alCambiar = null;         // hook del proyecto: (ventana, visible, motivo)
      this.historial = [];
      this.puntosSimulados = [];
    }

    /* ------------------------------------------------------------- registro */
    registrar(desc) {
      var lista = Array.isArray(desc) ? desc : [desc];
      var creadas = [];
      lista.forEach((d) => {
        if (!d || !d.id) return;
        if (this.ventanas.has(d.id)) this.ventanas.delete(d.id);
        try {
          var v = new Ventana(d, this);
          this.ventanas.set(d.id, v);
          if (this.orden.indexOf(d.id) === -1) this.orden.push(d.id);
          creadas.push(v);
        } catch (err) {
          console.warn('[Ventanas] no se pudo registrar "' + d.id + '":', err.message);
        }
      });
      return creadas;
    }

    el(id) { var v = this.ventanas.get(id); return v ? v.el : null; }
    existe(id) { return this.ventanas.has(id); }
    porId(id) { return this.ventanas.get(id) || null; }
    visible(id) { var v = this.ventanas.get(id); return !!(v && v.visible); }
    lista() { return this.orden.map((id) => this.ventanas.get(id)).filter(Boolean); }
    visibles() { return this.lista().filter((v) => v.visible); }

    /* ------------------------------------------------------------- apertura */
    puedeAbrirse(v) {
      if (this.condicionGlobal && this.condicionGlobal() === false) return false;
      if (this.control.requiereHumano && v.desc.requiereHumano !== false && global.appState && global.appState.hasHuman === false) return false;
      if (typeof v.desc.requiere === 'function' && v.desc.requiere(v) !== true) return false;
      return !this._grupoLleno(v);
    }

    _grupoLleno(v) {
      var g = v.desc.grupo;
      if (!g) return false;
      var max = v.desc.maxEnGrupo || 1;
      var n = 0;
      this.visibles().forEach((o) => { if (o !== v && o.desc.grupo === g) n++; });
      return n >= max;
    }

    abrir(id, motivo, forzar) {
      var v = this.ventanas.get(id);
      if (!v) return false;
      if (!forzar && v.desc.grupo && this._grupoLleno(v)) return false;
      var ok = v.abrir(motivo || 'manual', forzar === true);
      if (ok) this._rearmarReloj(v);
      return ok;
    }

    cerrar(id, motivo) {
      var v = this.ventanas.get(id);
      if (!v) return false;
      var ok = v.cerrar(motivo || 'manual');
      if (ok) this._rearmarReloj(v);
      return ok;
    }

    toggle(id, motivo, forzar) {
      var v = this.ventanas.get(id);
      if (!v) return false;
      return v.visible ? this.cerrar(id, motivo) : this.abrir(id, motivo, forzar);
    }

    cerrarTodas(motivo, incluirManual) {
      this.visibles().forEach((v) => {
        // Una ventana abierta a mano desde el panel sobrevive al barrido por
        // "sin humano" (sirve para calibrar sin nadie delante). El modo haiku,
        // el reset y el secuestro SÍ cierran todo (ahí no se ve ninguna).
        if (!incluirManual && v.abiertaManual) return;
        v.cerrar(motivo || 'todas');
      });
    }

    abrirAleatoria(motivo, forzar) {
      var candidatas = this.lista().filter((v) => !v.visible && (forzar === true || this.puedeAbrirse(v)));
      if (!candidatas.length) return false;
      var elegida = candidatas[Math.floor(Math.random() * candidatas.length)];
      return this.abrir(elegida.id, motivo || 'aleatoria', forzar);
    }

    /* ------------------------------------------------- sorteo de posición */
    posicionAlAzar(v) {
      var W = global.innerWidth || 1080;
      var H = global.innerHeight || 1920;
      var cardW = v.w;
      var cardH = v.h;

      var otras = this.visibles()
        .filter((o) => o !== v)
        .map((o) => o.rect());

      var candidatas = [
        { x: MARGEN_X + Math.random() * Math.max(10, W * 0.15), y: MARGEN_Y + Math.random() * Math.max(10, H * 0.10) },
        { x: W - cardW - MARGEN_X - Math.random() * Math.max(10, W * 0.15), y: MARGEN_Y + Math.random() * Math.max(10, H * 0.10) },
        { x: MARGEN_X + Math.random() * Math.max(10, W * 0.15), y: H - cardH - MARGEN_Y - Math.random() * Math.max(10, H * 0.12) },
        { x: W - cardW - MARGEN_X - Math.random() * Math.max(10, W * 0.15), y: H - cardH - MARGEN_Y - Math.random() * Math.max(10, H * 0.12) },
        { x: MARGEN_X, y: H * 0.38 + (Math.random() - 0.5) * (H * 0.18) },
        { x: W - cardW - MARGEN_X, y: H * 0.38 + (Math.random() - 0.5) * (H * 0.18) }
      ];

      // Los monitores GRANDES (los de página) van SIEMPRE al pie: arriba están las
      // 3 palabras capturadas (20% del alto, en x 25/50/75) y no hay que taparlas.
      if (v.desc.zona === 'pie') candidatas = candidatas.slice(2, 6);

      var validas = candidatas;
      if (otras.length) {
        validas = candidatas.filter((c) => otras.every((o) => {
          var dx = Math.abs((c.x + cardW * 0.5) - (o.x + o.w * 0.5));
          var dy = Math.abs((c.y + cardH * 0.5) - (o.y + o.h * 0.5));
          return dx > (cardW * 0.95) || dy > (cardH * 0.95);
        }));
        if (!validas.length) validas = candidatas;
      }

      var elegida = validas[Math.floor(Math.random() * validas.length)];
      v.posicionar(elegida.x, elegida.y);
    }

    /* -------------------------------------------------- ciclo automático */
    _azarMs(min, max) {
      var s = min + Math.random() * (max - min);
      return Math.round(s * 1000);
    }

    _azarVentana(v) {
      var cfg = v.desc.ciclo || {};
      var min = cfg.min !== undefined ? cfg.min : this.cicloGlobal.min;
      var max = cfg.max !== undefined ? cfg.max : this.cicloGlobal.max;
      return this._azarMs(min, max);
    }

    _rearmarReloj(v) {
      v.proximoCambio = ahoraMs() + this._azarVentana(v);
    }

    // Se llama UNA vez por frame. Cada ventana con ciclo activo se prende/apaga
    // con su propio reloj; las que están agarradas por una mano no cambian.
    actualizarCiclo(now) {
      var t = now === undefined ? ahoraMs() : now;
      this.lista().forEach((v) => {
        var cfg = v.desc.ciclo || {};
        if (cfg.activo === false) return;
        if (!v.proximoCambio) { this._rearmarReloj(v); return; }
        if (t < v.proximoCambio) return;
        // Las abiertas a mano (panel P) quedan bajo control del usuario: el ciclo
        // no las cierra; se cierran con la ✕, con el panel o en modo haiku.
        if (v.abiertaManual) return;
        if (v.agarradaPor || v.arrastrandoMouse) { this._rearmarReloj(v); return; }
        this.toggle(v.id, 'ciclo');
      });
    }

    /* -------------------------------------------------- control por puntos */
    _puntosEfectivos(puntos) {
      var t = ahoraMs();
      this.puntosSimulados = this.puntosSimulados.filter((p) => p.hasta > t);
      var lista = [];
      if (puntos && puntos.length) {
        for (var i = 0; i < puntos.length; i++) {
          var esMano = NOMBRE_MANO.test(puntos[i].name || '');
          if ((esMano && this.control.puntosMano) || (!esMano && this.control.puntosMouse)) lista.push(puntos[i]);
        }
      }
      return lista.concat(this.puntosSimulados.map((p) => ({ x: p.x, y: p.y, name: p.nombre })));
    }

    /* Zona de cierre: un punto que se queda quieto sobre la ✕ la cierra. */
    _controlCierre(v, puntos, dt) {
      if (v.desc.controles && v.desc.controles.cerrable === false) return false;
      var r = v.rectCerrar();
      if (!r) return false;
      var enCerrar = null;
      for (var i = 0; i < puntos.length; i++) {
        if (dentroDePunto(puntos[i].x, puntos[i].y, r)) { enCerrar = puntos[i]; break; }
      }
      if (!enCerrar) {
        if (v.progresoCierre > 0) {
          v.progresoCierre = 0;
          v.el.style.setProperty('--cierre', '0');
          v.el.classList.remove('cerrando');
        }
        return false;
      }
      var dur = Math.max(0.15, Number(this.control.dwellCierre) || 1.2);
      v.progresoCierre = Math.min(1, v.progresoCierre + dt / dur);
      v.el.style.setProperty('--cierre', v.progresoCierre.toFixed(3));
      v.el.classList.add('cerrando');
      if (v.progresoCierre >= 1) {
        v.cerrar('mano');
        return true;
      }
      return false;
    }

    /* Zona de agarre: un punto apoyado en la barra toma la ventana y la mueve.
       La ✕ queda EXCLUIDA: si la mano se posa ahí, la ventana se suelta y empieza
       el dwell de cierre (si no, el arrastre se llevaba la ✕ detrás de la mano). */
    _controlAgarre(v, puntos, dt) {
      if (v.desc.controles && v.desc.controles.arrastrable === false) return;
      var zonaCerrar = v.rectCerrar();

      if (v.agarradaPor) {
        var p = null;
        for (var i = 0; i < puntos.length; i++) {
          if (puntos[i].name === v.agarradaPor) { p = puntos[i]; break; }
        }
        if (!p) { v.soltar(); return; }
        if (zonaCerrar && dentroDePunto(p.x, p.y, zonaCerrar)) { v.soltar(); return; }
        v.posicionar(p.x - v.agarreDesfase.x, p.y - v.agarreDesfase.y);
        return;
      }

      var r = v.rectBarra();
      var candidato = null;
      for (var j = 0; j < puntos.length; j++) {
        var pt = puntos[j];
        if (!dentroDePunto(pt.x, pt.y, r)) continue;
        if (zonaCerrar && dentroDePunto(pt.x, pt.y, zonaCerrar)) continue;
        if (this._puntoOcupado(pt.name, v)) continue;
        candidato = pt;
        break;
      }

      if (!candidato) { v.agarreTimer = 0; return; }

      v.agarreTimer += dt;
      if (v.el.classList.contains('cerrando')) return;
      v.el.classList.add('agarrando');
      if (v.agarreTimer >= (Number(this.control.dwellAgarre) || 0.18)) {
        v.el.classList.remove('agarrando');
        v.agarradaPor = candidato.name;
        v.agarreDesfase = { x: candidato.x - v.x, y: candidato.y - v.y };
        v.el.classList.add('arrastrando');
        this._rearmarReloj(v);
      }
    }

    _puntoOcupado(nombre, excepto) {
      var ocupado = false;
      this.visibles().forEach((v) => {
        if (v !== excepto && v.agarradaPor === nombre) ocupado = true;
      });
      return ocupado;
    }

    controlPuntos(puntos, dt) {
      if (!this.control.activo) { this.visibles().forEach((v) => v.soltar()); return; }
      var lista = this._puntosEfectivos(puntos);
      if (!lista.length) {
        this.visibles().forEach((v) => { v.soltar(); v.agarreTimer = 0; });
        return;
      }
      var d = (dt === undefined || dt === null) ? 0.016 : dt;
      this.visibles().forEach((v) => {
        var cerrada = this._controlCierre(v, lista, d);
        if (!cerrada) this._controlAgarre(v, lista, d);
      });
    }

    /* -------------------------------------------------- simulación (calibrar) */
    simularPunto(nombre, x, y, ms) {
      this.puntosSimulados.push({
        nombre: nombre || 'MANO_DER_SIM',
        x: x, y: y,
        hasta: ahoraMs() + (ms === undefined ? 3000 : ms)
      });
    }

    limpiarSimulacion() { this.puntosSimulados = []; }

    /* --------------------------------------------------------------- avisos */
    _avisar(v, visible, motivo) {
      this.historial.push({ id: v.id, visible: visible, motivo: motivo || '', t: Date.now() });
      if (this.historial.length > 60) this.historial.shift();
      if (typeof v.desc.alCambiarVisible === 'function') v.desc.alCambiarVisible(v, visible, motivo);
      if (typeof this.alCambiar === 'function') this.alCambiar(v, visible, motivo);
    }

    /* Catálogo legible (lo usa el panel de configuración del proyecto) */
    catalogo() {
      return this.lista().map((v) => ({
        id: v.id,
        titulo: v.titulo,
        tipo: v.tipo,
        visible: v.visible,
        tamano: { ancho: v.w, alto: v.h },
        ciclo: v.desc.ciclo || {},
        grupo: v.desc.grupo || null,
        controles: v.desc.controles || {},
        descripcion: v.desc.descripcion || ''
      }));
    }
  }

  var instancia = new SistemaVentanas();

  global.SistemaVentanas = instancia;
  global.Ventana = Ventana;
  global.SistemaVentanasClase = SistemaVentanas;
  global.SistemaVentanas.TIPOS = { CANVAS: TIPO_CANVAS, IFRAME: TIPO_IFRAME, DOM: TIPO_DOM };
})(window);
