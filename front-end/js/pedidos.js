// =============================================================================
// pedidos.js: "Meus pedidos" do aluno (pedidos.html).
//   - aba "Em andamento": em preparo e prontos para retirar
//   - aba "Histórico": entregues e cancelados, com "Pedir de novo" e "Avaliar"
// =============================================================================

let pedidoAvaliando = null; // pedido que a janela de avaliação está avaliando

carregarAluno();
carregarMeusPedidos();

// GET /pedidos/meus (o mais recente primeiro) e separa nas duas abas.
async function carregarMeusPedidos() {
  const { ok, dados: pedidos } = await api("/pedidos/meus");
  if (!ok) return;

  const andamento = pedidos.filter((p) => p.status === "Pendente" || p.status === "Pronto");
  const historico = pedidos.filter((p) => p.status === "Concluído" || p.status === "Cancelado");

  document.getElementById("lista-andamento").innerHTML = andamento.length
    ? andamento.map(cardPedido).join("")
    : `<p class="text-center text-body-secondary py-5">Nenhum pedido em andamento.</p>`;
  document.getElementById("lista-historico").innerHTML = historico.length
    ? historico.map(cardPedido).join("")
    : `<p class="text-center text-body-secondary py-5">Nenhum pedido finalizado ainda.</p>`;

  const contador = document.getElementById("contador-andamento");
  contador.textContent = andamento.length;
  contador.classList.toggle("d-none", andamento.length === 0);
}

// Como cada status aparece: texto e cor (do selo e da faixa do card).
// Caminho de um pedido: Pendente -> Pronto -> Concluído (ou Cancelado).
const STATUS = {
  Pendente: { texto: "Em preparo", cor: "warning" },
  Pronto: { texto: "Pronto para retirar", cor: "success" },
  "Concluído": { texto: "Entregue", cor: "secondary" },
  Cancelado: { texto: "Cancelado", cor: "danger" },
};

// HTML do card de um pedido. Os botões mudam conforme o status.
function cardPedido(pedido) {
  const status = STATUS[pedido.status];

  const itens = pedido.itens.map((item) => `
    <li class="d-flex justify-content-between">
      <span>${item.quantidade}x ${escapeHtml(item.produto_nome)}</span>
      <span class="text-body-secondary">${reais(item.subtotal)}</span>
    </li>`).join("");

  // Pronto: destaque para o aluno ir buscar, com o código que ele mostra no balcão
  const retirar = pedido.status === "Pronto"
    ? `<div class="alert alert-success py-2 mb-2">Seu pedido está pronto! Retire no balcão com o código <strong>${escapeHtml(codigoPedido(pedido))}</strong>.</div>`
    : "";

  // Botões do rodapé: só pedidos que já terminaram
  let botoes = "";
  if (pedido.status === "Concluído" || pedido.status === "Cancelado") {
    botoes = `<button class="btn btn-outline-primary btn-sm rounded-pill" type="button" onclick="pedirDeNovo(${pedido.id_pedido})">Pedir de novo</button>`;
  }
  if (pedido.status === "Concluído" && !pedido.avaliado) {
    botoes = `<button class="btn btn-warning btn-sm rounded-pill" type="button" onclick="abrirAvaliacao(${pedido.id_pedido})">Avaliar</button> ` + botoes;
  }
  if (pedido.status === "Cancelado") {
    botoes = `<small class="text-body-secondary me-auto">Valor devolvido à carteira</small> ` + botoes;
  }

  return `
    <div class="card border-0 border-start border-4 border-${status.cor} shadow-sm rounded-4 mb-3">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h2 class="h6 fw-bold mb-0">Pedido ${escapeHtml(codigoPedido(pedido))}</h2>
            <small class="text-body-secondary">${formatarData(pedido.data_hora_criacao)}</small>
          </div>
          <span class="badge rounded-pill text-bg-${status.cor}">${status.texto}</span>
        </div>
        ${retirar}
        <ul class="list-unstyled small mb-2">${itens}</ul>
        <div class="d-flex flex-wrap align-items-center gap-2 border-top pt-2">
          <span class="fw-bold me-auto">${reais(pedido.valor_total)}</span>
          ${botoes}
        </div>
      </div>
    </div>`;
}

// "Pedir de novo": POST /carrinho/repetir/<id> coloca os mesmos itens no carrinho
// e leva para o cardápio com o carrinho aberto.
async function pedirDeNovo(id_pedido) {
  const { ok, dados } = await api(`/carrinho/repetir/${id_pedido}`, "POST");
  if (!ok) return avisar(dados.erro || "Não foi possível repetir o pedido.", "erro");
  window.location.href = "/#carrinho";
}

// "Avaliar": abre a janela de avaliação (nota de 1 a 5 e comentário).
function abrirAvaliacao(id_pedido) {
  pedidoAvaliando = id_pedido;
  document.getElementById("form-avaliacao").reset();
  bootstrap.Modal.getOrCreateInstance("#modal-avaliacao").show();
}

// Envio da avaliação: POST /pedidos/<id>/avaliacao
document.getElementById("form-avaliacao").addEventListener("submit", async (e) => {
  e.preventDefault();
  const { ok, dados } = await api(`/pedidos/${pedidoAvaliando}/avaliacao`, "POST", {
    nota: Number(document.querySelector('input[name="nota"]:checked').value),
    comentario: document.getElementById("avaliacao-comentario").value,
  });
  bootstrap.Modal.getInstance("#modal-avaliacao").hide();
  if (!ok) return avisar(dados.erro || "Não foi possível enviar a avaliação.", "erro");
  avisar("Obrigado pela avaliação!");
  carregarMeusPedidos(); // some o botão "Avaliar"
});
