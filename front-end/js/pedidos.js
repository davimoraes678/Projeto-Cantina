// =============================================================================
// pedidos.js: "Meus pedidos" do aluno (pedidos.html).
//   - aba "Em andamento": pedidos em preparo e prontos para retirar
//   - aba "Histórico": entregues e cancelados, com "Pedir de novo" e "Avaliar"
// =============================================================================

let pedidoAvaliando = null; // pedido que a janela de avaliação está avaliando

alunoInf();
carregarMeusPedidos();

// Busca os pedidos do aluno (GET /pedidos/meus). O back-end já manda separado:
// { andamento: [...], historico: [...] }, o mais recente primeiro.
async function carregarMeusPedidos() {
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos/meus`);
    if (!res.ok) return;
    const pedidos = await res.json();

    let htmlAndamento = "";
    pedidos.andamento.forEach((pedido) => {
      htmlAndamento += cardPedido(pedido);
    });
    let htmlHistorico = "";
    pedidos.historico.forEach((pedido) => {
      htmlHistorico += cardPedido(pedido);
    });

    if (htmlAndamento === "") htmlAndamento = `<p class="text-center text-body-secondary py-5">Nenhum pedido em andamento.</p>`;
    if (htmlHistorico === "") htmlHistorico = `<p class="text-center text-body-secondary py-5">Nenhum pedido finalizado ainda.</p>`;
    document.getElementById("lista-andamento").innerHTML = htmlAndamento;
    document.getElementById("lista-historico").innerHTML = htmlHistorico;

    // Número na aba "Em andamento"
    const contador = document.getElementById("contador-andamento");
    contador.textContent = pedidos.andamento.length;
    if (pedidos.andamento.length > 0) {
      contador.classList.remove("d-none");
    } else {
      contador.classList.add("d-none");
    }
  } catch (erro) {
    console.error("Erro ao carregar pedidos:", erro);
  }
}

// HTML do card de um pedido. O texto do status vem pronto do back-end
// (status_texto); aqui só escolhemos a cor e os botões:
//   Pendente  -> amarelo
//   Pronto    -> verde, com o código para mostrar no balcão
//   Concluído -> cinza, com "Avaliar" e "Pedir de novo"
//   Cancelado -> vermelho, com "Pedir de novo"
function cardPedido(pedido) {
  let cor = "warning";
  if (pedido.status === "Pronto") cor = "success";
  if (pedido.status === "Concluído") cor = "secondary";
  if (pedido.status === "Cancelado") cor = "danger";

  // Itens: "2x Coxinha ... R$ 13,00"
  let itens = "";
  pedido.itens.forEach((item) => {
    itens += `
      <li class="d-flex justify-content-between">
        <span>${item.quantidade}x ${escaparTexto(item.produto_nome)}</span>
        <span class="text-body-secondary">${formatarPreco(item.subtotal)}</span>
      </li>`;
  });

  // Pronto: aviso para o aluno ir buscar
  let retirar = "";
  if (pedido.status === "Pronto") {
    retirar = `<div class="alert alert-success py-2 mb-2">Seu pedido está pronto! Retire no balcão com o código <strong>${pedido.codigo}</strong>.</div>`;
  }

  // Botões do rodapé (só para pedidos que já terminaram)
  let botoes = "";
  if (pedido.status === "Cancelado") {
    botoes += `<small class="text-body-secondary me-auto">Valor devolvido à carteira</small>`;
  }
  if (pedido.status === "Concluído" && !pedido.avaliado) {
    botoes += `<button class="btn btn-warning btn-sm rounded-pill" type="button" onclick="abrirAvaliacao(${pedido.id_pedido})">Avaliar</button>`;
  }
  if (pedido.status === "Concluído" || pedido.status === "Cancelado") {
    botoes += `<button class="btn btn-outline-primary btn-sm rounded-pill" type="button" onclick="pedirDeNovo(${pedido.id_pedido})">Pedir de novo</button>`;
  }

  return `
    <div class="card border-0 border-start border-4 border-${cor} shadow-sm rounded-4 mb-3">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h2 class="h6 fw-bold mb-0">Pedido ${pedido.codigo}</h2>
            <small class="text-body-secondary">${new Date(pedido.data_hora_criacao + "Z").toLocaleString("pt-BR")}</small>
          </div>
          <span class="badge rounded-pill text-bg-${cor}">${pedido.status_texto}</span>
        </div>
        ${retirar}
        <ul class="list-unstyled small mb-2">${itens}</ul>
        <div class="d-flex flex-wrap align-items-center gap-2 border-top pt-2">
          <span class="fw-bold me-auto">${formatarPreco(pedido.valor_total)}</span>
          ${botoes}
        </div>
      </div>
    </div>`;
}

// "Pedir de novo": POST /carrinho/repetir/<id> coloca os mesmos itens no carrinho
// e leva para o cardápio com o carrinho aberto.
async function pedirDeNovo(id_pedido) {
  try {
    const res = await fetch(`${API_BASE_URL}/carrinho/repetir/${id_pedido}`, { method: "POST" });
    if (!res.ok) {
      const erro = await res.json();
      alert(erro.erro || "Não foi possível repetir o pedido.");
      return;
    }
    window.location.href = "/#carrinho";
  } catch (erro) {
    console.error("Erro ao repetir pedido:", erro);
  }
}

// "Avaliar": abre a janela de avaliação (nota de 1 a 5 e comentário).
function abrirAvaliacao(id_pedido) {
  pedidoAvaliando = id_pedido;
  document.getElementById("form-avaliacao").reset();
  bootstrap.Modal.getOrCreateInstance(document.getElementById("modal-avaliacao")).show();
}

// Envio da avaliação: POST /pedidos/<id>/avaliacao com { nota, comentario }
document.getElementById("form-avaliacao").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nota = Number(document.querySelector('input[name="nota"]:checked').value);
  const comentario = document.getElementById("avaliacao-comentario").value;

  try {
    const res = await fetch(`${API_BASE_URL}/pedidos/${pedidoAvaliando}/avaliacao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nota, comentario }),
    });
    bootstrap.Modal.getInstance(document.getElementById("modal-avaliacao")).hide();
    if (!res.ok) {
      const erro = await res.json();
      alert(erro.erro || "Não foi possível enviar a avaliação.");
      return;
    }
    avisar("Obrigado pela avaliação!");
    carregarMeusPedidos(); // some o botão "Avaliar"
  } catch (erro) {
    console.error("Erro ao avaliar:", erro);
  }
});
