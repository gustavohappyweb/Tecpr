/* ==========================================================================
   TECPR — formulário de solicitação de orçamento
   Envia somente quando TECPR_CONFIG.formularioEndpoint estiver configurado.
   Sem endpoint, avisa que o envio não está ativo: nunca simula sucesso.
   ========================================================================== */

(function () {
  "use strict";

  var formulario = document.querySelector("[data-formulario-orcamento]");
  if (!formulario || !window.TECPR) return;

  var config = window.TECPR.config;
  var status = formulario.querySelector(".formulario__status");
  var botao = formulario.querySelector(".formulario__enviar");
  var textoBotao = formulario.querySelector(".formulario__enviar-texto");
  var descricao = formulario.querySelector("#campo-descricao");
  var contador = formulario.querySelector("[data-contador]");

  var nomesServico = {
    politica: "Pesquisa política e de opinião",
    eleitoral: "Pesquisa eleitoral",
    gestao: "Avaliação da gestão e dos serviços públicos",
    mercado: "Pesquisa de mercado",
    educacao: "Pesquisa para instituição de ensino",
    academico: "Coleta de dados para projeto acadêmico",
    outro: "Outro / ainda não sei"
  };

  /* Pré-seleciona o tipo de pesquisa vindo das páginas de serviço (?servico=gestao) */
  var servicoUrl = new URLSearchParams(window.location.search).get("servico");
  if (servicoUrl && nomesServico[servicoUrl]) {
    formulario.elements.servico.value = servicoUrl;
  }

  /* ---------- Validação ---------- */

  var regras = {
    nome: function (valor) {
      if (!valor) return "Informe seu nome.";
      if (valor.length < 2) return "O nome parece incompleto.";
      return "";
    },
    contato: function (valor) {
      if (!valor) return "Informe um telefone, WhatsApp ou e-mail para retorno.";
      var email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
      var digitos = valor.replace(/\D/g, "");
      var telefone = !/@/.test(valor) && digitos.length >= 10 && digitos.length <= 13;
      if (!email && !telefone) return "Informe um e-mail válido ou um telefone com DDD.";
      return "";
    },
    cidade: function (valor) {
      return valor ? "" : "Informe a cidade.";
    },
    uf: function (valor) {
      return valor ? "" : "Selecione a UF.";
    },
    servico: function (valor) {
      return valor ? "" : "Selecione o tipo de pesquisa.";
    },
    descricao: function (valor) {
      if (!valor) return "Descreva brevemente sua necessidade.";
      if (valor.length < 20) return "Conte um pouco mais: pelo menos 20 caracteres.";
      return "";
    }
  };

  function validarCampo(nome) {
    var entrada = formulario.elements[nome];
    var campo = entrada.closest(".campo");
    var erro = document.getElementById("erro-" + nome);
    var mensagem = regras[nome](entrada.value.trim());

    campo.classList.toggle("is-invalido", Boolean(mensagem));
    campo.classList.toggle("is-valido", !mensagem && entrada.value.trim() !== "");
    entrada.setAttribute("aria-invalid", mensagem ? "true" : "false");
    erro.textContent = mensagem;
    erro.hidden = !mensagem;
    return !mensagem;
  }

  Object.keys(regras).forEach(function (nome) {
    var entrada = formulario.elements[nome];
    entrada.addEventListener("blur", function () {
      if (entrada.value.trim() !== "" || entrada.closest(".campo").classList.contains("is-invalido")) {
        validarCampo(nome);
      }
    });
    entrada.addEventListener("input", function () {
      if (entrada.closest(".campo").classList.contains("is-invalido")) validarCampo(nome);
    });
    entrada.addEventListener("change", function () {
      if (entrada.tagName === "SELECT") validarCampo(nome);
    });
  });

  function atualizarContador() {
    contador.textContent = descricao.value.length + " / " + descricao.maxLength;
  }

  descricao.addEventListener("input", atualizarContador);
  atualizarContador();

  /* ---------- Estados ---------- */

  function mostrarStatus(tipo, titulo, texto, acao) {
    status.hidden = false;
    status.setAttribute("data-tipo", tipo);
    status.innerHTML = "";

    var forte = document.createElement("strong");
    forte.textContent = titulo;
    status.appendChild(forte);

    var paragrafo = document.createElement("p");
    paragrafo.textContent = texto;
    status.appendChild(paragrafo);

    if (acao) status.appendChild(acao);
    status.focus();
  }

  function carregando(ativo) {
    botao.disabled = ativo;
    botao.setAttribute("aria-busy", ativo ? "true" : "false");
    textoBotao.textContent = ativo ? "Enviando…" : "Enviar solicitação";
  }

  function dadosDoFormulario() {
    var origem = window.TECPR.lerOrigem();
    var dados = new FormData(formulario);
    dados.delete("site");
    dados.set("servico_nome", nomesServico[dados.get("servico")] || "");
    Object.keys(origem).forEach(function (chave) {
      dados.set("origem_" + chave, origem[chave]);
    });
    dados.set("pagina_envio", window.location.pathname);
    return dados;
  }

  function mensagemWhatsapp(dados) {
    return (
      "Olá, TECPR! Gostaria de solicitar um orçamento.\n\n" +
      "Nome: " + dados.get("nome") + "\n" +
      "Contato: " + dados.get("contato") + "\n" +
      "Cidade/UF: " + dados.get("cidade") + "/" + dados.get("uf") + "\n" +
      "Tipo de pesquisa: " + dados.get("servico_nome") + "\n\n" +
      dados.get("descricao")
    );
  }

  function botaoWhatsapp(dados) {
    var url = window.TECPR.linkWhatsapp(mensagemWhatsapp(dados));
    if (!url) return null;
    var link = document.createElement("a");
    link.className = "botao";
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("data-whatsapp", "formulario");
    link.textContent = "Enviar pelo WhatsApp";
    return link;
  }

  /* ---------- Envio ---------- */

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    var nomes = Object.keys(regras);
    var validos = nomes.map(validarCampo);
    var primeiroInvalido = nomes[validos.indexOf(false)];

    if (primeiroInvalido) {
      status.hidden = true;
      formulario.elements[primeiroInvalido].focus();
      window.TECPR.registrarEvento("formulario_erro_validacao", { campo: primeiroInvalido });
      return;
    }

    /* Campo-armadilha preenchido: provável robô. Não envia e não informa. */
    if (formulario.elements.site.value) return;

    var dados = dadosDoFormulario();

    if (!config.formularioEndpoint) {
      mostrarStatus(
        "indisponivel",
        "O envio pelo site ainda não está ativo.",
        "Esta é a versão de revisão do site e o serviço de recebimento do formulário ainda não foi configurado. Nenhuma informação foi enviada.",
        botaoWhatsapp(dados)
      );
      window.TECPR.registrarEvento("formulario_envio_indisponivel", { servico: dados.get("servico") });
      return;
    }

    carregando(true);

    fetch(config.formularioEndpoint, {
      method: "POST",
      body: dados,
      headers: { Accept: "application/json" }
    })
      .then(function (resposta) {
        if (!resposta.ok) throw new Error("HTTP " + resposta.status);
        formulario.reset();
        atualizarContador();
        formulario.querySelectorAll(".campo").forEach(function (campo) {
          campo.classList.remove("is-valido", "is-invalido");
        });
        mostrarStatus(
          "sucesso",
          "Solicitação enviada. Obrigado!",
          "A TECPR vai analisar seu pedido e retornar pelo contato informado."
        );
        window.TECPR.registrarEvento("formulario_envio_concluido", {
          servico: dados.get("servico"),
          uf: dados.get("uf"),
          origem: dados.get("origem_utm_source") || dados.get("origem_referencia") || "direto"
        });
      })
      .catch(function () {
        mostrarStatus(
          "erro",
          "Não foi possível enviar agora.",
          "Verifique sua conexão e tente novamente em instantes. Seus dados continuam preenchidos.",
          botaoWhatsapp(dados)
        );
        window.TECPR.registrarEvento("formulario_erro_envio", { servico: dados.get("servico") });
      })
      .finally(function () {
        carregando(false);
      });
  });
})();
