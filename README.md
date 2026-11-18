# TECPR

Site institucional da TECPR, empresa de pesquisas de Pato Branco – PR.

Esta é a **versão publicada** do site: os arquivos ficam exatamente como vão para a raiz do domínio (https://tecpr.com.br).

- Páginas: `/`, `/sobre/`, as quatro pesquisas, `/metodologia/`, `/perguntas-frequentes/`, `/contato/`, `/politica-de-privacidade/` e `404.html`.
- Os links internos começam na raiz (`/css/…`, `/sobre/`). Por isso a pasta precisa ser servida como raiz de um domínio; aberta direto pelo arquivo ou numa subpasta, os estilos não carregam.
- Para ver localmente: `python -m http.server 8000` nesta pasta e abrir http://localhost:8000.

Ainda pendentes: número do WhatsApp, e-mail, telefone e o serviço que recebe o formulário (aparecem como "A confirmar" no site).

Desenvolvido por [Happy Web](https://happyweb.com.br/).
