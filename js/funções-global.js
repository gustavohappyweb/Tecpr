/* ==========================================================================
   TECPR — comportamento compartilhado por todas as páginas
   ========================================================================== */

/*
 * Configuração dos canais de contato.
 * Enquanto um valor estiver vazio, o site mostra "A confirmar" e não cria
 * links para ele. O botão flutuante verde do WhatsApp aparece sempre: sem número,
 * leva ao formulário de contato; com número, abre a conversa no WhatsApp.
 *   whatsapp: somente dígitos com DDI e DDD, ex.: "5546999999999"
 *   telefone: como deve aparecer no site, ex.: "(46) 3000-0000"
 *   email:    ex.: "contato@tecpr.com.br"
 *   formularioEndpoint: URL do serviço aprovado que recebe o formulário (POST)
 */
var TECPR_CONFIG = {
  whatsapp: "",
  telefone: "",
  email: "",
  formularioEndpoint: "",
  mensagemWhatsapp: "Olá, TECPR! Gostaria de conversar sobre uma pesquisa."
};

(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Medição ----------
   * Os eventos vão para window.dataLayer. Nenhuma ferramenta de análise está
   * instalada; quando o GTM/GA4 for configurado, ele passa a ler estes eventos.
   */
  window.dataLayer = window.dataLayer || [];

  function registrarEvento(nome, dados) {
    var evento = { event: nome };
    if (dados) {
      for (var chave in dados) {
        if (Object.prototype.hasOwnProperty.call(dados, chave)) {
          evento[chave] = dados[chave];
        }
      }
    }
    window.dataLayer.push(evento);
  }

  /* Origem do primeiro acesso da visita (UTM, referência e página de entrada) */
  function registrarOrigem() {
    var chave = "tecpr_origem";
    try {
      if (sessionStorage.getItem(chave)) return;
      var parametros = new URLSearchParams(window.location.search);
      var origem = {
        utm_source: parametros.get("utm_source") || "",
        utm_medium: parametros.get("utm_medium") || "",
        utm_campaign: parametros.get("utm_campaign") || "",
        referencia: document.referrer ? new URL(document.referrer).hostname : "",
        pagina_entrada: window.location.pathname
      };
      sessionStorage.setItem(chave, JSON.stringify(origem));
    } catch (erro) {
      /* Armazenamento indisponível: o site funciona normalmente sem origem. */
    }
  }

  function lerOrigem() {
    try {
      return JSON.parse(sessionStorage.getItem("tecpr_origem")) || {};
    } catch (erro) {
      return {};
    }
  }

  /* ---------- Canais de contato ---------- */

  function linkWhatsapp(mensagem) {
    if (!TECPR_CONFIG.whatsapp) return "";
    var texto = encodeURIComponent(mensagem || TECPR_CONFIG.mensagemWhatsapp);
    return "https://wa.me/" + TECPR_CONFIG.whatsapp + "?text=" + texto;
  }

  function marcadorPendente() {
    var marcador = document.createElement("span");
    marcador.className = "pendente";
    marcador.setAttribute("data-pendente", "");
    marcador.textContent = "A confirmar";
    return marcador;
  }

  function preencherContatos() {
    var campos = document.querySelectorAll("[data-contato]");
    campos.forEach(function (campo) {
      var tipo = campo.getAttribute("data-contato");
      var valor = TECPR_CONFIG[tipo];
      campo.textContent = "";

      if (!valor) {
        campo.appendChild(marcadorPendente());
        return;
      }

      var link = document.createElement("a");
      if (tipo === "whatsapp") {
        link.href = linkWhatsapp();
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = formatarWhatsapp(valor);
        link.setAttribute("data-whatsapp", "contato");
      } else if (tipo === "telefone") {
        link.href = "tel:+55" + valor.replace(/\D/g, "");
        link.textContent = valor;
      } else if (tipo === "email") {
        link.href = "mailto:" + valor;
        link.textContent = valor;
      }
      campo.appendChild(link);
    });
  }

  function formatarWhatsapp(numero) {
    var d = numero.replace(/\D/g, "").replace(/^55/, "");
    if (d.length === 11) return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
    return numero;
  }

  /* Botões "Conversar sobre sua pesquisa": vão para o WhatsApp quando houver número;
     sem número, mantêm o link para a página de contato. */
  function prepararWhatsapp() {
    var url = linkWhatsapp();

    if (url) {
      document.querySelectorAll("[data-whatsapp-cta]").forEach(function (botao) {
        botao.href = url;
        botao.target = "_blank";
        botao.rel = "noopener noreferrer";
      });
    }

    /* Botão redondo verde com o símbolo do WhatsApp.
       Enquanto não houver número, leva ao formulário de contato (mesma janela). */
    var formulario = document.querySelector(".botao-orcamento");
    var flutuante = document.createElement("a");
    flutuante.className = "whatsapp-flutuante";
    flutuante.setAttribute("data-whatsapp", "flutuante");
    if (url) {
      flutuante.href = url;
      flutuante.target = "_blank";
      flutuante.rel = "noopener noreferrer";
    } else {
      flutuante.href = formulario ? formulario.getAttribute("href") : "#";
      flutuante.setAttribute("data-whatsapp-pendente", "");
    }
    /* Ícone enviado pelo usuário (whatsapp-svgrepo-com.svg) */
    flutuante.innerHTML =
      '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path fill="currentColor" d="' +
      'M26.576 5.363c-2.69-2.69-6.406-4.354-10.511-4.354-8.209 0-14.865 6.655-14.865 14.865 0 2.732 0.737 5.291 2.022' +
      ' 7.491l-0.038-0.070-2.109 7.702 7.879-2.067c2.051 1.139 4.498 1.809 7.102 1.809h0.006c8.209-0.003 14.862-6.659' +
      ' 14.862-14.868 0-4.103-1.662-7.817-4.349-10.507l0 0zM16.062 28.228h-0.005c-0 0-0.001 0-0.001 0-2.319 0-4.489-0' +
      '.64-6.342-1.753l0.056 0.031-0.451-0.267-4.675 1.227 1.247-4.559-0.294-0.467c-1.185-1.862-1.889-4.131-1.889-6.5' +
      '65 0-6.822 5.531-12.353 12.353-12.353s12.353 5.531 12.353 12.353c0 6.822-5.53 12.353-12.353 12.353h-0zM22.838 ' +
      '18.977c-0.371-0.186-2.197-1.083-2.537-1.208-0.341-0.124-0.589-0.185-0.837 0.187-0.246 0.371-0.958 1.207-1.175 ' +
      '1.455-0.216 0.249-0.434 0.279-0.805 0.094-1.15-0.466-2.138-1.087-2.997-1.852l0.010 0.009c-0.799-0.74-1.484-1.5' +
      '87-2.037-2.521l-0.028-0.052c-0.216-0.371-0.023-0.572 0.162-0.757 0.167-0.166 0.372-0.434 0.557-0.65 0.146-0.17' +
      '9 0.271-0.384 0.366-0.604l0.006-0.017c0.043-0.087 0.068-0.188 0.068-0.296 0-0.131-0.037-0.253-0.101-0.357l0.00' +
      '2 0.003c-0.094-0.186-0.836-2.014-1.145-2.758-0.302-0.724-0.609-0.625-0.836-0.637-0.216-0.010-0.464-0.012-0.712' +
      '-0.012-0.395 0.010-0.746 0.188-0.988 0.463l-0.001 0.002c-0.802 0.761-1.3 1.834-1.3 3.023 0 0.026 0 0.053 0.001' +
      ' 0.079l-0-0.004c0.131 1.467 0.681 2.784 1.527 3.857l-0.012-0.015c1.604 2.379 3.742 4.282 6.251 5.564l0.094 0.0' +
      '43c0.548 0.248 1.25 0.513 1.968 0.74l0.149 0.041c0.442 0.14 0.951 0.221 1.479 0.221 0.303 0 0.601-0.027 0.889-' +
      '0.078l-0.031 0.004c1.069-0.223 1.956-0.868 2.497-1.749l0.009-0.017c0.165-0.366 0.261-0.793 0.261-1.242 0-0.185' +
      '-0.016-0.366-0.047-0.542l0.003 0.019c-0.092-0.155-0.34-0.247-0.712-0.434z' +
      '"/></svg>';
    flutuante.setAttribute(
      "aria-label",
      url
        ? "Conversar com a TECPR pelo WhatsApp (abre em nova janela)"
        : "Fale com a TECPR pelo formulário de contato (WhatsApp em breve)"
    );
    document.body.appendChild(flutuante);

    document.addEventListener("click", function (evento) {
      var alvo = evento.target.closest("a[href^='https://wa.me/']");
      if (!alvo) return;
      registrarEvento("whatsapp_clique", {
        posicao: alvo.getAttribute("data-whatsapp") || alvo.getAttribute("data-whatsapp-cta") || "link",
        pagina: window.location.pathname
      });
    });
  }

  /* ---------- Cabeçalho ---------- */

  function prepararCabecalho() {
    var cabecalho = document.querySelector(".cabecalho");
    if (!cabecalho) return;

    var ultimoTopo = window.scrollY;
    var agendado = false;

    function atualizar() {
      var topo = window.scrollY;
      cabecalho.classList.toggle("is-rolado", topo > 24);
      var descendo = topo > ultimoTopo && topo > 320;
      if (!document.body.classList.contains("menu-aberto") && !cabecalho.contains(document.activeElement)) {
        cabecalho.classList.toggle("is-oculto", descendo);
      }
      ultimoTopo = topo;
      agendado = false;
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
    atualizar();
  }

  /* Submenu "Pesquisas" no desktop: abre por hover, clique e teclado */
  function prepararSubmenu() {
    document.querySelectorAll(".navegacao__item--submenu").forEach(function (item) {
      var botao = item.querySelector(".navegacao__link");
      var temporizador;

      function definir(aberto) {
        item.setAttribute("data-aberto", aberto ? "true" : "false");
        botao.setAttribute("aria-expanded", aberto ? "true" : "false");
      }

      botao.addEventListener("click", function () {
        definir(item.getAttribute("data-aberto") !== "true");
      });

      item.addEventListener("mouseenter", function () {
        if (!window.matchMedia("(hover: hover)").matches) return;
        clearTimeout(temporizador);
        definir(true);
      });

      item.addEventListener("mouseleave", function () {
        if (!window.matchMedia("(hover: hover)").matches) return;
        temporizador = setTimeout(function () {
          definir(false);
        }, 160);
      });

      item.addEventListener("focusout", function (evento) {
        if (!item.contains(evento.relatedTarget)) definir(false);
      });

      item.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape") {
          definir(false);
          botao.focus();
        }
      });
    });

    document.addEventListener("click", function (evento) {
      document.querySelectorAll(".navegacao__item--submenu[data-aberto='true']").forEach(function (item) {
        if (!item.contains(evento.target)) {
          item.setAttribute("data-aberto", "false");
          item.querySelector(".navegacao__link").setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  /* Menu mobile */
  function prepararMenuMobile() {
    var botao = document.querySelector(".botao-menu");
    var menu = document.getElementById("menu-mobile");
    var cabecalho = document.querySelector(".cabecalho");
    if (!botao || !menu) return;

    function definir(aberto) {
      botao.setAttribute("aria-expanded", aberto ? "true" : "false");
      botao.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
      menu.classList.toggle("is-aberto", aberto);
      menu.setAttribute("aria-hidden", aberto ? "false" : "true");
      document.body.classList.toggle("menu-aberto", aberto);
      cabecalho.classList.toggle("menu-ativo", aberto);
      cabecalho.classList.remove("is-oculto");
      if ("inert" in menu) menu.inert = !aberto;
      if (aberto) {
        var primeiro = menu.querySelector("a, button");
        if (primeiro) primeiro.focus({ preventScroll: true });
      }
    }

    if ("inert" in menu) menu.inert = true;

    botao.addEventListener("click", function () {
      definir(botao.getAttribute("aria-expanded") !== "true");
    });

    menu.addEventListener("click", function (evento) {
      if (evento.target.closest("a")) definir(false);
    });

    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape" && botao.getAttribute("aria-expanded") === "true") {
        definir(false);
        botao.focus();
      }
    });

    window.matchMedia("(min-width: 1181px)").addEventListener("change", function (consulta) {
      if (consulta.matches) definir(false);
    });
  }

  /* ---------- Perguntas frequentes ---------- */

  function prepararFaq() {
    document.querySelectorAll(".faq__botao").forEach(function (botao) {
      var resposta = document.getElementById(botao.getAttribute("aria-controls"));
      if (!resposta) return;

      botao.addEventListener("click", function () {
        var aberta = botao.getAttribute("aria-expanded") === "true";
        botao.setAttribute("aria-expanded", aberta ? "false" : "true");
        resposta.setAttribute("data-aberta", aberta ? "false" : "true");
        resposta.setAttribute("aria-hidden", aberta ? "true" : "false");
        if ("inert" in resposta) resposta.inert = aberta;
      });

      if ("inert" in resposta) resposta.inert = botao.getAttribute("aria-expanded") !== "true";
    });
  }

  /* ---------- Revelação no scroll (reverte ao subir) ---------- */

  function prepararRevelacao() {
    var elementos = document.querySelectorAll(".revelar, .revelar-linha");
    if (!elementos.length) return;

    if (reduzirMovimento || !("IntersectionObserver" in window)) {
      elementos.forEach(function (el) {
        el.classList.add("is-visivel");
      });
      return;
    }

    var observador = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          if (entrada.isIntersecting) {
            entrada.target.classList.add("is-visivel");
          } else if (entrada.boundingClientRect.top > 0) {
            /* Saiu por baixo (o usuário subiu a página): volta ao estado inicial */
            entrada.target.classList.remove("is-visivel");
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    elementos.forEach(function (el) {
      observador.observe(el);
    });
  }

  /* ---------- Linha de progresso das etapas (acompanha o scroll nos dois sentidos) ---------- */

  function prepararEtapas() {
    var blocos = document.querySelectorAll("[data-etapas]");
    if (!blocos.length) return;

    var agendado = false;

    function atualizar() {
      var altura = window.innerHeight;
      blocos.forEach(function (bloco) {
        var caixa = bloco.getBoundingClientRect();
        var inicio = altura * 0.8;
        var percurso = caixa.height + altura * 0.35;
        var progresso = Math.min(1, Math.max(0, (inicio - caixa.top) / percurso));
        if (reduzirMovimento) progresso = 1;
        bloco.style.setProperty("--progresso", progresso.toFixed(3));

        var etapas = bloco.querySelectorAll(".etapa");
        etapas.forEach(function (etapa, indice) {
          etapa.classList.toggle("is-alcancada", progresso >= indice / Math.max(1, etapas.length - 1) - 0.001);
        });
      });
      agendado = false;
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

  /* ---------- Voltar ao topo, com anel de progresso da leitura ---------- */

  function prepararVoltarTopo() {
    var botao = document.createElement("button");
    botao.type = "button";
    botao.className = "voltar-topo";
    botao.setAttribute("aria-label", "Voltar ao topo da página");
    botao.innerHTML = '<svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/></svg><span aria-hidden="true"></span>';
    document.body.appendChild(botao);

    botao.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduzirMovimento ? "auto" : "smooth" });
    });

    var agendado = false;
    function atualizar() {
      agendado = false;
      var total = document.documentElement.scrollHeight - window.innerHeight;
      var leitura = total > 0 ? window.scrollY / total : 0;
      botao.style.setProperty("--leitura", leitura.toFixed(3));
      botao.classList.toggle("is-visivel", window.scrollY > window.innerHeight * 0.8);
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
    atualizar();
  }

  /* ---------- Rolagem suave da roda do mouse ----------
   * Só suaviza a roda do mouse em computador. Teclado, barra de rolagem, toque,
   * Ctrl + roda (zoom) e listas com rolagem própria continuam nativos, e nada
   * muda para quem pede menos movimento no sistema. A rolagem continua sendo a
   * do navegador (posição real da página), então âncoras, leitores de tela e
   * "buscar na página" seguem funcionando.
   */

  function prepararRolagemSuave() {
    if (reduzirMovimento) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    var raiz = document.documentElement;
    var alvo = window.scrollY;
    var animando = false;
    var ultimoQuadro = 0;
    var SUAVIDADE = 0.12; /* fração do caminho a cada quadro de 60 Hz */

    function limite() {
      return raiz.scrollHeight - window.innerHeight;
    }

    /* Deixa a rolagem com o elemento quando ele mesmo pode rolar nesse sentido */
    function rolaPorDentro(elemento, delta) {
      while (elemento && elemento !== document.body && elemento !== raiz) {
        var estilo = getComputedStyle(elemento);
        if (/(auto|scroll)/.test(estilo.overflowY) && elemento.scrollHeight > elemento.clientHeight) {
          if (delta < 0 ? elemento.scrollTop > 0 : elemento.scrollTop + elemento.clientHeight < elemento.scrollHeight) {
            return true;
          }
        }
        elemento = elemento.parentElement;
      }
      return false;
    }

    function parar() {
      animando = false;
      alvo = window.scrollY;
    }

    function passo(agora) {
      if (!animando) return;
      var quadros = ultimoQuadro ? Math.min((agora - ultimoQuadro) / 16.67, 4) : 1;
      ultimoQuadro = agora;
      var atual = window.scrollY;
      var diferenca = alvo - atual;
      if (Math.abs(diferenca) < 0.5) {
        window.scrollTo({ top: alvo, behavior: "instant" });
        animando = false;
        return;
      }
      var fator = 1 - Math.pow(1 - SUAVIDADE, quadros);
      window.scrollTo({ top: atual + diferenca * fator, behavior: "instant" });
      window.requestAnimationFrame(passo);
    }

    window.addEventListener(
      "wheel",
      function (evento) {
        if (evento.defaultPrevented || evento.ctrlKey || evento.metaKey) return;
        if (Math.abs(evento.deltaX) > Math.abs(evento.deltaY)) return;
        if (document.body.classList.contains("menu-aberto")) return;
        if (rolaPorDentro(evento.target, evento.deltaY)) return;

        var delta = evento.deltaY;
        if (evento.deltaMode === 1) delta *= 40;
        if (evento.deltaMode === 2) delta *= window.innerHeight;

        evento.preventDefault();
        if (!animando) alvo = window.scrollY;
        alvo = Math.max(0, Math.min(limite(), alvo + delta));
        if (!animando) {
          animando = true;
          ultimoQuadro = 0;
          window.requestAnimationFrame(passo);
        }
      },
      { passive: false }
    );

    /* Qualquer outra forma de rolar assume na hora */
    ["mousedown", "keydown", "touchstart"].forEach(function (tipo) {
      window.addEventListener(tipo, parar, { passive: true });
    });
    window.addEventListener("resize", function () {
      alvo = Math.min(alvo, limite());
    });
  }

  /* ---------- Links externos ----------
   * O gerador já marca os links do HTML; isto cobre links criados depois
   * (WhatsApp, contatos) ou acrescentados à mão. Tudo fora do domínio abre em nova janela.
   */

  function prepararLinksExternos() {
    var dominios = [window.location.hostname, "tecpr.com.br", "www.tecpr.com.br"];
    document.addEventListener(
      "click",
      function (evento) {
        var link = evento.target.closest("a[href]");
        if (!link || !/^https?:$/.test(link.protocol)) return;
        if (dominios.indexOf(link.hostname) !== -1) return;
        link.target = "_blank";
        if (!/noopener/.test(link.rel)) link.rel = (link.rel + " noopener noreferrer").trim();
      },
      true
    );
  }

  /* ---------- Aviso de cookies ----------
   * Aparece até a pessoa clicar em "Ok" ou fechar. A escolha fica guardada no
   * navegador; se o armazenamento estiver bloqueado, vale só para esta página.
   */

  function prepararAvisoCookies() {
    var aviso = document.getElementById("aviso-cookies");
    if (!aviso) return;
    var chave = "tecpr_aviso_cookies";

    try {
      if (localStorage.getItem(chave) === "ok") return;
    } catch (erro) {
      /* Armazenamento indisponível: o aviso aparece normalmente. */
    }

    var celular = window.matchMedia("(max-width: 700px)");

    /* No celular o aviso ocupa a largura toda: os botões flutuantes sobem junto */
    function ajustarFlutuantes() {
      var deslocamento = !aviso.hidden && celular.matches ? aviso.offsetHeight + 12 : 0;
      document.documentElement.style.setProperty("--desloca-flutuantes", deslocamento + "px");
    }

    function fechar() {
      try {
        localStorage.setItem(chave, "ok");
      } catch (erro) {
        /* Sem armazenamento: o aviso some só nesta visita à página. */
      }
      registrarEvento("aviso_cookies_ok");
      function esconder() {
        aviso.hidden = true;
        ajustarFlutuantes();
      }
      if (reduzirMovimento) {
        esconder();
        return;
      }
      aviso.classList.add("is-saindo");
      aviso.addEventListener("animationend", esconder, { once: true });
      setTimeout(esconder, 600);
    }

    aviso.hidden = false;
    ajustarFlutuantes();
    aviso.querySelectorAll("[data-cookies-ok]").forEach(function (botao) {
      botao.addEventListener("click", fechar);
    });
    window.addEventListener("resize", ajustarFlutuantes);
  }

  /* ---------- Ano do rodapé ---------- */

  function preencherAno() {
    document.querySelectorAll("[data-ano]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* Utilitários usados por scripts específicos de página */
  window.TECPR = {
    registrarEvento: registrarEvento,
    lerOrigem: lerOrigem,
    linkWhatsapp: linkWhatsapp,
    config: TECPR_CONFIG
  };

  registrarOrigem();
  preencherContatos();
  prepararWhatsapp();
  prepararCabecalho();
  prepararSubmenu();
  prepararMenuMobile();
  prepararFaq();
  prepararRevelacao();
  prepararEtapas();
  prepararVoltarTopo();
  prepararRolagemSuave();
  prepararLinksExternos();
  prepararAvisoCookies();
  preencherAno();
})();
