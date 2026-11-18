/* ==========================================================================
   TECPR — comportamentos da página inicial
   Carrossel dos painéis, recuo dos painéis empilhados e profundidade do hero.
   ========================================================================== */

(function () {
  "use strict";

  var reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Carrossel dos painéis ---------- */

  function prepararCarrosseis() {
    document.querySelectorAll("[data-carrossel]").forEach(function (carrossel) {
      var trilho = carrossel.querySelector(".carrossel__trilho");
      var setas = carrossel.querySelectorAll(".carrossel__seta");
      if (!trilho || !setas.length) return;

      function passo() {
        var cartao = trilho.querySelector(".carrossel__cartao");
        if (!cartao) return trilho.clientWidth;
        var gap = parseFloat(getComputedStyle(trilho).columnGap) || 0;
        return cartao.getBoundingClientRect().width + gap;
      }

      function atualizar() {
        var maximo = trilho.scrollWidth - trilho.clientWidth - 2;
        setas[0].disabled = trilho.scrollLeft <= 2;
        setas[1].disabled = trilho.scrollLeft >= maximo;
      }

      setas.forEach(function (seta) {
        seta.addEventListener("click", function () {
          var direcao = Number(seta.getAttribute("data-direcao"));
          trilho.scrollBy({ left: direcao * passo(), behavior: reduzirMovimento ? "auto" : "smooth" });
        });
      });

      trilho.addEventListener("keydown", function (evento) {
        if (evento.key === "ArrowRight") {
          evento.preventDefault();
          trilho.scrollBy({ left: passo() });
        } else if (evento.key === "ArrowLeft") {
          evento.preventDefault();
          trilho.scrollBy({ left: -passo() });
        }
      });

      trilho.addEventListener("scroll", atualizar, { passive: true });
      window.addEventListener("resize", atualizar);
      atualizar();
    });
  }

  /* ---------- Painéis empilhados: o de baixo recua quando o próximo chega ---------- */

  function prepararPilha() {
    var pilha = document.querySelector("[data-pilha]");
    if (!pilha || reduzirMovimento) return;
    var paineis = Array.prototype.slice.call(pilha.querySelectorAll(".painel"));
    var empilha = window.matchMedia("(min-width: 1001px)");
    var agendado = false;

    function atualizar() {
      agendado = false;
      if (!empilha.matches) {
        paineis.forEach(function (painel) {
          painel.style.removeProperty("--encolher");
        });
        return;
      }
      paineis.forEach(function (painel, indice) {
        var proximo = paineis[indice + 1];
        if (!proximo) return;
        var topoAtual = painel.getBoundingClientRect().top;
        var topoProximo = proximo.getBoundingClientRect().top;
        var altura = painel.offsetHeight || 1;
        var aproximacao = 1 - Math.min(1, Math.max(0, (topoProximo - topoAtual) / altura));
        painel.style.setProperty("--encolher", (1 - aproximacao * 0.05).toFixed(4));
      });
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!agendado) {
          agendado = true;
          window.requestAnimationFrame(atualizar);
        }
      },
      { passive: true }
    );
    window.addEventListener("resize", atualizar);
    atualizar();
  }

  /* ---------- Profundidade do hero: camadas acompanham o ponteiro ---------- */

  function prepararProfundidade() {
    var area = document.querySelector("[data-profundidade]");
    if (!area || reduzirMovimento || !window.matchMedia("(hover: hover)").matches) return;
    var camadas = area.querySelectorAll("[data-camada]");
    var hero = area.closest("section") || area;

    hero.addEventListener("mousemove", function (evento) {
      var caixa = hero.getBoundingClientRect();
      var x = (evento.clientX - caixa.left) / caixa.width - 0.5;
      var y = (evento.clientY - caixa.top) / caixa.height - 0.5;
      camadas.forEach(function (camada) {
        var forca = Number(camada.getAttribute("data-camada")) * 14;
        camada.style.transform = "translate3d(" + (x * forca).toFixed(1) + "px," + (y * forca).toFixed(1) + "px,0)";
      });
    });

    hero.addEventListener("mouseleave", function () {
      camadas.forEach(function (camada) {
        camada.style.transform = "";
      });
    });
  }

  prepararCarrosseis();
  prepararPilha();
  prepararProfundidade();
})();
