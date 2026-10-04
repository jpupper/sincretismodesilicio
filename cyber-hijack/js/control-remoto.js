/* ============================================================================
   SINCRETISMO DE SILICIO — CONTROL REMOTO DE CLIENTES (teclas 1 2 3 4)
   ----------------------------------------------------------------------------
   Se incluye tal cual en las TRES experiencias (cambiapalabras, cluster, log)
   y en el panel de admin. Es un agregado independiente: NO depende de nada de
   la pagina, abre su PROPIO socket al bus y no interfiere con los WebSocket
   que ya usan las apps (los tipos de mensaje son distintos).

   TECLAS
     1  -> recarga los clientes de la experiencia asignada al MONITOR 1
     2  -> recarga los clientes de la experiencia asignada al MONITOR 2
     3  -> recarga los clientes de la experiencia asignada al MONITOR 3
     4  -> recarga TODOS los clientes conectados (incluida esta misma ventana)

   El mapeo MONITOR -> experiencia lo resuelve el SERVER (/api/monitors, que el
   panel de admin edita): la pagina solo manda "quiero reiniciar el monitor N" y
   el server decide a quien avisarle. La recarga es un HARD REFRESH sin cache.
   ============================================================================ */
(function () {
  'use strict';

  var EXPERIENCIAS = ['cambiapalabras', 'cluster', 'log'];

  function experienciaActual() {
    var p = (window.location.pathname || '').toLowerCase();
    if (p.indexOf('cambiapalabras') !== -1) return 'cambiapalabras';
    if (p.indexOf('cyber-hijack') !== -1) return 'cambiapalabras';
    if (p.indexOf('cosmos-clusters') !== -1) return 'cluster';
    if (p.indexOf('log') !== -1) return 'log';
    return '';                       // admin u otra pagina: no se auto-recarga
  }

  var MIA = experienciaActual();

  // ---------------------------------------------------------------------------
  // HARD REFRESH (sin cache): borra Cache Storage + registrations de SW y
  // recarga agregando un parametro anti-cache para forzar un documento nuevo.
  // ---------------------------------------------------------------------------
  function hardReload() {
    var hecho = false;
    function ir() {
      if (hecho) return;
      hecho = true;
      try {
        var u = new URL(window.location.href);
        u.searchParams.set('_r', Date.now());
        window.location.replace(u.toString());
      } catch (e) {
        window.location.reload(true);
      }
    }
    try {
      var tareas = [];
      if (window.caches && caches.keys) {
        tareas.push(caches.keys().then(function (ks) {
          return Promise.all(ks.map(function (k) { return caches.delete(k); }));
        }));
      }
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        tareas.push(navigator.serviceWorker.getRegistrations().then(function (rs) {
          return Promise.all(rs.map(function (r) { return r.unregister(); }));
        }));
      }
      if (tareas.length) {
        Promise.all(tareas).then(ir).catch(ir);
        setTimeout(ir, 500);          // tope: nunca colgarse esperando el cache
      } else {
        ir();
      }
    } catch (e) { ir(); }
  }

  // ---------------------------------------------------------------------------
  // AVISO EN PANTALLA (toast minimo, sin depender del toast de cada pagina)
  // ---------------------------------------------------------------------------
  var toastEl = null, toastTimer = null;
  function aviso(txt, ok) {
    try {
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.id = 'sincretismo-control-toast';
        toastEl.style.cssText = [
          'position:fixed', 'right:18px', 'bottom:18px', 'z-index:2147483600',
          'font:600 13px/1.3 ui-monospace,Consolas,monospace',
          'letter-spacing:.08em', 'text-transform:uppercase',
          'padding:10px 16px', 'border-radius:4px', 'pointer-events:none',
          'background:rgba(6,10,14,.92)', 'color:#7ef9ff',
          'border:1px solid rgba(126,249,255,.55)',
          'box-shadow:0 0 18px rgba(0,240,255,.28)',
          'transition:opacity .18s ease', 'opacity:0'
        ].join(';');
        document.body.appendChild(toastEl);
      }
      toastEl.textContent = txt;
      toastEl.style.color = ok === false ? '#ff5c7a' : '#7ef9ff';
      toastEl.style.borderColor = ok === false ? 'rgba(255,92,122,.6)' : 'rgba(126,249,255,.55)';
      toastEl.style.opacity = '1';
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { if (toastEl) toastEl.style.opacity = '0'; }, 1400);
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // BUS WEBSOCKET (socket propio y exclusivo de este control)
  // ---------------------------------------------------------------------------
  var ws = null, reintentos = 0, conectado = false;

  function wsUrl() {
    if (typeof window.sbWsUrl === 'function') return window.sbWsUrl();
    var proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return proto + '//' + window.location.host + '/ws';
  }

  function conectar() {
    try { ws = new WebSocket(wsUrl()); }
    catch (e) { setTimeout(conectar, 2000); return; }

    ws.addEventListener('open', function () {
      conectado = true;
      reintentos = 0;
      ws.send(JSON.stringify({ type: 'client:register', client: 'control-remoto' }));
    });

    ws.addEventListener('message', function (ev) {
      var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (!m || m.type !== 'client:reload') return;
      // Solo las experiencias se recargan solas (el admin queda a la escucha).
      if (MIA === '' || EXPERIENCIAS.indexOf(MIA) === -1) return;
      if (m.target === 'all' || m.target === MIA) hardReload();
    });

    ws.addEventListener('close', function () {
      conectado = false;
      setTimeout(conectar, Math.min(8000, 700 + (++reintentos) * 700));
    });

    ws.addEventListener('error', function () { conectado = false; });
  }

  function enviar(payload) {
    payload.type = 'client:reload';
    payload.ts = Date.now();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }
    aviso('SIN BUS — reintentando', false);
    return false;
  }

  function recargarMonitor(n) {
    n = Number(n);
    if (!(n >= 1 && n <= 3)) return false;
    if (enviar({ monitor: n })) aviso('MONITOR ' + n + ' ▸ RECARGAR');
    return true;
  }
  function recargarTodo() {
    if (enviar({ all: true })) aviso('TODOS ▸ RECARGAR');
    return true;
  }

  // ---------------------------------------------------------------------------
  // TECLAS 1 2 3 4 (captura, antes que los handlers de cada pagina)
  // ---------------------------------------------------------------------------
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    var t = e.target || {};
    var tag = String(t.tagName || '').toUpperCase();
    if (tag === 'TEXTAREA') return;
    if (tag === 'INPUT' && t.type !== 'range' && t.type !== 'checkbox') return;
    if (tag === 'SELECT') return;

    if (e.key === '1' || e.key === '2' || e.key === '3') {
      e.preventDefault();
      recargarMonitor(Number(e.key));
    } else if (e.key === '4') {
      e.preventDefault();
      recargarTodo();
    }
  }, true);

  conectar();

  // API publica (la usa el panel de admin para sus botones)
  window.SincretismoControl = {
    experiencia: MIA,
    recargarMonitor: recargarMonitor,
    recargarTodo: recargarTodo,
    enviar: enviar,
    hardReload: hardReload,
    estaConectado: function () { return conectado; }
  };
})();
