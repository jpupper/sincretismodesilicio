/* ============================================================================
   SINCRETISMO DE SILICIO — MODO EMBED (ventanita dentro de otra experiencia)
   ----------------------------------------------------------------------------
   Cuando una página se abre DENTRO de una ventanita del sistema de ventanas de
   Sicre2 (cambiapalabras), el sistema la pide con ?embed=1 para que se muestre
   como MINI-MONITOR: sin la barra de navegación propia y sin paneles de ajustes.

   La escala la aplica el padre (la ventana escala el iframe); acá sólo se marca
   el modo y se avisa por consola, así el CSS de embed-mode.css sabe qué esconder.
   ============================================================================ */
(function () {
  'use strict';

  var esEmbed = false;
  try {
    var qp = new URLSearchParams(window.location.search);
    esEmbed = qp.get('embed') === '1' || qp.get('embed') === 'true';
  } catch (e) {
    esEmbed = /[?&]embed=(1|true)/.test(window.location.search || '');
  }

  if (!esEmbed) return;

  window.__SS_EMBED__ = true;
  document.documentElement.classList.add('modo-embed');
  if (document.body) document.body.classList.add('modo-embed');
  else document.addEventListener('DOMContentLoaded', function () {
    document.body.classList.add('modo-embed');
  });

  // Sin barra de scroll: la ventanita es un monitor, no una página navegable.
  document.addEventListener('DOMContentLoaded', function () {
    document.documentElement.style.overflow = 'hidden';
    if (document.body) document.body.style.overflow = 'hidden';
  });

  console.log('[Embed] página en modo ventanita (mini-monitor)');
})();
