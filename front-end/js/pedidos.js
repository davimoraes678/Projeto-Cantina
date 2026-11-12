let pedidoAvaliando = null;

alunoInf();
carregarMeusPedidos();

// Atualiza os pedidos a cada 15 segundos
setInterval(carregarMeusPedidos, 15000);

// O back-end manda { andamento, historico }
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

function cardPedido(pedido) {
  let cor = "warning";
  if (pedido.status === "Pronto") cor = "success";
  if (pedido.status === "Concluído") cor = "secondary";
  if (pedido.status === "Cancelado") cor = "danger";

  let itens = "";
  pedido.itens.forEach((item) => {
    itens += `
      <li class="d-flex justify-content-between">
        <span>${item.quantidade}x ${escaparTexto(item.produto_nome)}</span>
        <span class="text-body-secondary">${formatarPreco(item.subtotal)}</span>
      </li>`;
  });

  let retirar = "";
  if (pedido.status === "Pronto") {
    retirar = `<div class="alert alert-success py-2 mb-2">Seu pedido está pronto! Retire no balcão com o código <strong>${pedido.codigo}</strong>.</div>`;
  }

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

// Coloca os itens no carrinho e abre o cardápio com o carrinho aberto
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

function abrirAvaliacao(id_pedido) {
  pedidoAvaliando = id_pedido;
  document.getElementById("form-avaliacao").reset();
  bootstrap.Modal.getOrCreateInstance(document.getElementById("modal-avaliacao")).show();
}

document.getElementById("form-avaliacao").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nota = document.getElementById("avaliacao-nota").value;
  const comentario = document.getElementById("avaliacao-comentario").value;

  try {
    const res = await fetch(`${API_BASE_URL}/pedidos/${pedidoAvaliando}/avaliacao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nota, comentario }),
    });
    if (localStorage.getItem("pedidoParaAvaliar") === String(pedidoAvaliando)) {
      localStorage.removeItem("pedidoParaAvaliar");
    }
    bootstrap.Modal.getInstance(document.getElementById("modal-avaliacao")).hide();
    if (!res.ok) {
      const erro = await res.json();
      alert(erro.erro || "Não foi possível enviar a avaliação.");
      return;
    }
    avisar("Obrigado pela avaliação!");
    carregarMeusPedidos();
  } catch (erro) {
    console.error("Erro ao avaliar:", erro);
  }
});
