/* ============================================================================
   SINCRETISMO DE SILICIO — Resolución de base de despliegue y endpoints
   ----------------------------------------------------------------------------
   Permite que el MISMO frontend funcione en:
     - raíz del dominio        https://vps-4455523-x.dattaweb.com/
     - subpath                 https://vps-4455523-x.dattaweb.com/sincretismo/
     - localhost / file://     (desarrollo con el Express local en 6932)
     - hosting estático (FTP)  https://fullscreencode.com/sincretismodesilicio/

   REGLA DE ORO DE LOS MODELOS:
   Los modelos de lenguaje SIEMPRE se piden a la máquina del VISITANTE
   (Ollama local en http://localhost:11434). El servidor web nunca ejecuta
   la inferencia: la app funciona igual estando en la web.
   ============================================================================ */
(function () {
  'use strict';

  var SUBPATHS = ['sincretismo', 'sincretismodesilicio'];
  var match = window.location.pathname.match(new RegExp('^/(' + SUBPATHS.join('|') + ')(?=/|$)'));
  var SB_BASE = match ? '/' + match[1] : '';

  var isFile = window.location.protocol === 'file:';
  var host = window.location.hostname || '';
  // Hostings estáticos (FTP/Apache) que NO tienen backend Node propio.
  var isStaticHost = /(^|\.)fullscreencode\.com$|(^|\.)ferozo\.com$/i.test(host);

  var VPS_ORIGIN = 'https://vps-4455523-x.dattaweb.com';

  // '' = mismo origen. En hosting estático apuntamos al backend del VPS.
  var apiBase = SB_BASE;        // base primaria (mutable)
  var apiAlt = null;            // base alternativa si la primaria no tiene backend
  var wsBase = SB_BASE;         // prefijo del bus WebSocket (mutable)
  var VPS_WS = 'wss://vps-4455523-x.dattaweb.com';

  if (isStaticHost) {
    apiBase = VPS_ORIGIN + '/sincretismo'; // requiere el location /sincretismo/ en nginx
    apiAlt = VPS_ORIGIN;                   // respaldo: slot raíz del VPS (puerto 3000)
    wsBase = '/sincretismo';
  } else if (isFile) {
    apiBase = 'http://localhost:6932';
  } else if (SB_BASE) {
    apiAlt = '';                           // subpath en el VPS: la raíz del dominio sirve igual
  }

  // Override manual: ?api=https://otro-host/ruta  (queda guardado en localStorage)
  try {
    var qp = new URLSearchParams(window.location.search).get('api');
    if (qp) localStorage.setItem('sincretismo_api_base', qp);
    var savedApi = localStorage.getItem('sincretismo_api_base');
    if (savedApi !== null) {
      apiBase = String(savedApi).replace(/\/+$/, '');
      apiAlt = null;
      wsBase = SB_BASE;
    }
  } catch (e) {}

  function promoteAlt() {
    if (apiAlt === null) return false;
    apiBase = apiAlt;
    wsBase = isStaticHost ? '' : '';
    window.SB_API_BASE = apiBase;
    console.warn('[SB] El prefijo "' + SB_BASE + '" todavía no tiene backend. API re-apuntada a "' + apiBase + '".');
    return true;
  }

  window.SB_BASE = SB_BASE;
  window.SB_API_BASE = apiBase;

  window.sbUrl = function (p) { return SB_BASE + (p || ''); };
  window.sbApi = function (p) { return apiBase + (p || ''); };

  // fetch con auto-reparación: si la base primaria devuelve HTML/404 (catch-all
  // del servidor) o falla la red, se reintenta UNA vez contra la base alterna.
  function looksLikeNoBackend(r) {
    var ct = (r.headers.get('content-type') || '').toLowerCase();
    return ct.indexOf('text/html') !== -1;
  }

  window.sbFetch = function (p, opts) {
    return fetch(apiBase + (p || ''), opts).then(function (r) {
      if (!looksLikeNoBackend(r) || apiAlt === null) return r;
      promoteAlt();
      return fetch(apiBase + (p || ''), opts);
    }).catch(function (err) {
      if (apiAlt === null) throw err;
      promoteAlt();
      return fetch(apiBase + (p || ''), opts);
    });
  };

  window.sbWsUrl = function () {
    if (isFile) return 'ws://localhost:6932/ws';
    if (isStaticHost) return VPS_WS + (wsBase || '') + '/ws';
    var proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return proto + '//' + window.location.host + wsBase + '/ws';
  };

  // --------------------------------------------------------------------------
  // SONDA DE BASE (arranque)
  // Detecta temprano si el prefijo no tiene backend y re-apunta la API a la
  // raíz del dominio / al VPS. Así la app funciona ANTES y DESPUÉS de agregar
  // el location de nginx, y también desde el FTP estático.
  // --------------------------------------------------------------------------
  if (apiAlt !== null) {
    try {
      var ctrl = new AbortController();
      var timer = setTimeout(function () { ctrl.abort(); }, 4000);
      fetch(apiBase + '/api/ollama/models', { signal: ctrl.signal, headers: { Accept: 'application/json' } })
        .then(function (r) {
          clearTimeout(timer);
          if (!r.ok || looksLikeNoBackend(r)) promoteAlt();
        })
        .catch(function () { clearTimeout(timer); promoteAlt(); });
    } catch (e) {}
  }

  // --------------------------------------------------------------------------
  // OLLAMA LOCAL (los modelos viven en la máquina del visitante)
  // --------------------------------------------------------------------------
  var OLLAMA_DEFAULT = 'http://localhost:11434';
  window.SB_OLLAMA_DEFAULT = OLLAMA_DEFAULT;

  window.getOllamaUrl = function () {
    try {
      var q = new URLSearchParams(window.location.search).get('ollama');
      if (q) { localStorage.setItem('sincretismo_ollama_url', q); return String(q).replace(/\/+$/, ''); }
      var saved = localStorage.getItem('sincretismo_ollama_url');
      if (saved) return String(saved).replace(/\/+$/, '');
    } catch (e) {}
    return OLLAMA_DEFAULT;
  };

  window.setOllamaUrl = function (u) {
    try {
      if (u) localStorage.setItem('sincretismo_ollama_url', String(u).replace(/\/+$/, ''));
      else localStorage.removeItem('sincretismo_ollama_url');
    } catch (e) {}
  };

  // Candidatos en orden: el configurado por el usuario, luego los clásicos locales.
  window.getOllamaUrls = function () {
    var out = [window.getOllamaUrl()];
    [OLLAMA_DEFAULT, 'http://127.0.0.1:11434'].forEach(function (u) {
      if (out.indexOf(u) === -1) out.push(u);
    });
    return out;
  };
})();
