/* ==========================================================================
   TECPR — Metodologia: destaca no índice a etapa que está na tela
   ========================================================================== */

(function () {
  "use strict";

  var links = document.querySelectorAll(".etapas-longas__indice a");
  if (!links.length || !("IntersectionObserver" in window)) return;

  var porId = {};
  links.forEach(function (link) {
    porId[link.getAttribute("href").slice(1)] = link;
  });

  var observador = new IntersectionObserver(
    function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        links.forEach(function (link) {
          link.classList.remove("is-atual");
          link.removeAttribute("aria-current");
        });
        var atual = porId[entrada.target.id];
        if (atual) {
          atual.classList.add("is-atual");
          atual.setAttribute("aria-current", "step");
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );

  Object.keys(porId).forEach(function (id) {
    var etapa = document.getElementById(id);
    if (etapa) observador.observe(etapa);
  });
})();
