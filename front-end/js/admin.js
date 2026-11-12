let produtos = [];
let editandoProdutoId = null; // null = cadastrando; um id = editando
let totalEmPreparo = null;    // para avisar quando chega pedido novo

iniciar();

async function iniciar() {
  carregarPedidos();
  const aluno = await alunoInf();
  if (aluno && aluno.funcao === "mestre") {
    carregarProdutos();
    carregarAlunos();
    carregarAvaliacoes();
  }
  // Atualiza os pedidos a cada 15 segundos
  setInterval(carregarPedidos, 15000);
}

// Pedidos e histórico

async function carregarPedidos() {
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos`);
    if (!res.ok) return;
    const pedidos = await res.json();

    let htmlemPreparo = "";
    pedidos.preparo.forEach((pedido) => {
      htmlemPreparo += cardPedidoAdmin(pedido);
    });
    let htmlProntos = "";
    pedidos.prontos.forEach((pedido) => {
      htmlProntos += cardPedidoAdmin(pedido);
    });
    let htmlHistorico = "";
    pedidos.historico.forEach((pedido) => {
      htmlHistorico += linhaHistorico(pedido);
    });

    if (htmlemPreparo === "") htmlemPreparo = `<p class="text-body-secondary">Nenhum pedido em preparo.</p>`;
    if (htmlProntos === "") htmlProntos = `<p class="text-body-secondary">Nenhum pedido esperando retirada.</p>`;
    if (htmlHistorico === "") htmlHistorico = `<p class="text-center text-body-secondary py-4 mb-0">Nenhum pedido finalizado.</p>`;
    document.getElementById("lista-preparo").innerHTML = htmlemPreparo;
    document.getElementById("lista-prontos").innerHTML = htmlProntos;
    document.getElementById("lista-historico-admin").innerHTML = htmlHistorico;

    // Contadores e título da aba ("(3) Administração")
    const emPreparo = pedidos.preparo.length;
    const esperando = emPreparo + pedidos.prontos.length;
    document.getElementById("contador-preparo").textContent = emPreparo;
    document.getElementById("contador-prontos").textContent = pedidos.prontos.length;
    const contador = document.getElementById("contador-pedidos-admin");
    contador.textContent = esperando;
    if (esperando > 0) {
      contador.classList.remove("d-none");
      document.title = `(${esperando}) Administração - Cantina Real`;
    } else {
      contador.classList.add("d-none");
      document.title = "Administração - Cantina Real";
    }

    if (totalEmPreparo !== null && emPreparo > totalEmPreparo) {
      avisar("Novo pedido chegou!");
    }
    totalEmPreparo = emPreparo;
  } catch (erro) {
    console.error("Erro ao carregar pedidos:", erro);
  }
}

// Pendente -> botão "Pronto"; Pronto -> botão "Entregar"
function cardPedidoAdmin(pedido) {
  let itens = "";
  pedido.itens.forEach((item) => {
    itens += `<li>${item.quantidade}x ${escaparTexto(item.produto_nome)}</li>`;
  });

  let cor = "warning";
  let botao = `<button class="btn btn-warning rounded-pill" type="button" onclick="marcarPronto(${pedido.id_pedido})">Pronto</button>`;
  if (pedido.status === "Pronto") {
    cor = "success";
    botao = `<button class="btn btn-success rounded-pill" type="button" onclick="entregarPedido(${pedido.id_pedido})">Entregar</button>`;
  }

  return `
    <div class="card border-0 border-start border-4 border-${cor} shadow-sm rounded-4">
      <div class="card-body d-flex flex-column">
        <div class="d-flex justify-content-between">
          <small class="text-body-secondary">Código de retirada</small>
          <span class="badge rounded-pill text-bg-${cor}">${pedido.status_texto}</span>
        </div>
        <p class="fs-2 fw-bold font-monospace lh-1 mb-2">${pedido.codigo}</p>
        <p class="fw-semibold mb-1">${escaparTexto(pedido.aluno_nome)}
          <small class="text-body-secondary fw-normal">· ${new Date(pedido.data_hora_criacao + "Z").toLocaleString("pt-BR")}</small></p>
        <ul class="small mb-3 ps-3">${itens}</ul>
        <div class="mt-auto d-flex align-items-center gap-2">
          <span class="fw-bold me-auto">${formatarPreco(pedido.valor_total)}</span>
          <button class="btn btn-sm btn-outline-danger rounded-pill" type="button" onclick="cancelarPedido(${pedido.id_pedido})">Cancelar</button>
          ${botao}
        </div>
      </div>
    </div>`;
}

function linhaHistorico(pedido) {
  let itens = "";
  pedido.itens.forEach((item) => {
    itens += `${item.quantidade}x ${escaparTexto(item.produto_nome)}<br>`;
  });

  let cor = "success";
  if (pedido.status === "Cancelado") cor = "secondary";

  return `
    <div class="list-group-item d-flex justify-content-between align-items-start gap-3 py-3">
      <div>
        <div class="fw-semibold">${escaparTexto(pedido.aluno_nome)} <small class="text-body-secondary fw-normal">${pedido.codigo}</small></div>
        <small class="text-body-secondary">${itens}</small>
      </div>
      <div class="text-end text-nowrap">
        <span class="badge rounded-pill text-bg-${cor}">${pedido.status_texto}</span>
        <div class="fw-semibold">${formatarPreco(pedido.valor_total)}</div>
        <small class="text-body-secondary">${new Date(pedido.data_hora_criacao + "Z").toLocaleString("pt-BR")}</small>
      </div>
    </div>`;
}

async function marcarPronto(id_pedido) {
  await mudarPedido(id_pedido, "pronto", "Aluno avisado: pedido pronto");
}

async function entregarPedido(id_pedido) {
  if (!confirm("Confirmar que o aluno retirou o pedido?")) return;
  await mudarPedido(id_pedido, "concluir", "Pedido entregue");
}

// Cancelar devolve o saldo do aluno e o estoque
async function cancelarPedido(id_pedido) {
  if (!confirm("Cancelar o pedido? O valor volta para a carteira do aluno.")) return;
  await mudarPedido(id_pedido, "cancelar", "Pedido cancelado");
}

async function mudarPedido(id_pedido, acao, mensagem) {
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos/${id_pedido}/${acao}`, { method: "POST" });
    if (!res.ok) {
      const erro = await res.json();
      alert(erro.erro || "Não foi possível atualizar o pedido.");
      return;
    }
    avisar(mensagem);
    carregarPedidos();
  } catch (erro) {
    console.error("Erro ao atualizar pedido:", erro);
  }
}

// Produtos (só mestre)

async function carregarProdutos() {
  try {
    const res = await fetch(`${API_BASE_URL}/produtos`);
    if (!res.ok) return;
    produtos = await res.json();

    let html = "";
    produtos.forEach((produto) => {
      let foto = `<div class="flex-shrink-0" style="width: 48px; height: 48px"></div>`;
      if (produto.imagem) {
        foto = `<img src="${API_BASE_URL}/produtos/${produto.id_produto}/imagem?v=${produto.imagem}" alt="" width="48" height="48"
                     class="rounded object-fit-contain bg-body-tertiary flex-shrink-0" loading="lazy">`;
      }
      html += `
        <div class="list-group-item d-flex align-items-center gap-3 py-2">
          ${foto}
          <div class="flex-grow-1">
            <div class="fw-semibold">${escaparTexto(produto.nome)}</div>
            <small class="text-body-secondary">${escaparTexto(produto.categoria || "")} · ${formatarPreco(produto.preco_atual)} · ${produto.quantidade_estoque} em estoque</small>
          </div>
          <button class="btn btn-sm btn-outline-secondary rounded-pill" type="button" onclick="editarProduto(${produto.id_produto})">Editar</button>
          <button class="btn btn-sm btn-outline-danger rounded-pill" type="button" onclick="removerProduto(${produto.id_produto})">Excluir</button>
        </div>`;
    });
    document.getElementById("lista-produtos-admin").innerHTML = html;
  } catch (erro) {
    console.error("Erro ao carregar produtos:", erro);
  }
}

function novoProduto() {
  editandoProdutoId = null;
  document.getElementById("form-produto").reset();
  document.getElementById("modal-produto-titulo").textContent = "Novo produto";
  bootstrap.Modal.getOrCreateInstance(document.getElementById("modal-produto")).show();
}

function editarProduto(id_produto) {
  const produto = produtos.find((p) => p.id_produto === id_produto);
  editandoProdutoId = id_produto;
  document.getElementById("form-produto").reset();
  document.getElementById("produto-nome").value = produto.nome;
  document.getElementById("produto-preco").value = produto.preco_atual;
  document.getElementById("produto-estoque").value = produto.quantidade_estoque;
  document.getElementById("produto-categoria").value = produto.categoria || "";
  document.getElementById("produto-ingredientes").value = produto.ingredientes || "";
  document.getElementById("modal-produto-titulo").textContent = "Editar produto";
  bootstrap.Modal.getOrCreateInstance(document.getElementById("modal-produto")).show();
}

// POST /produtos (novo) ou PUT /produtos/<id> (editar), depois envia a foto
document.getElementById("form-produto").addEventListener("submit", async (e) => {
  e.preventDefault();
  const corpo = {
    nome: document.getElementById("produto-nome").value,
    preco_atual: Number(document.getElementById("produto-preco").value),
    quantidade_estoque: Number(document.getElementById("produto-estoque").value),
    categoria: document.getElementById("produto-categoria").value,
    ingredientes: document.getElementById("produto-ingredientes").value,
  };

  let url = `${API_BASE_URL}/produtos`;
  let metodo = "POST";
  if (editandoProdutoId) {
    url = `${API_BASE_URL}/produtos/${editandoProdutoId}`;
    metodo = "PUT";
  }

  try {
    const res = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });
    const produtoSalvo = await res.json();
    if (!res.ok) {
      alert(produtoSalvo.erro || "Não foi possível salvar o produto.");
      return;
    }

    // Se a foto falhar, a janela fica em modo "editar" para não cadastrar o produto duas vezes
    editandoProdutoId = produtoSalvo.id_produto;
    const fotoDeuCerto = await enviarImagem(produtoSalvo.id_produto);
    if (!fotoDeuCerto) return;

    bootstrap.Modal.getInstance(document.getElementById("modal-produto")).hide();
    avisar("Produto salvo");
    carregarProdutos();
  } catch (erro) {
    console.error("Erro ao salvar produto:", erro);
  }
});

// A foto vai como FormData, não como JSON. Sem foto escolhida, devolve true
async function enviarImagem(id_produto) {
  const arquivo = document.getElementById("imagem").files[0];
  if (!arquivo) return true;

  const dados = new FormData();
  dados.append("imagem", arquivo);
  const res = await fetch(`${API_BASE_URL}/produtos/${id_produto}/imagem`, { method: "POST", body: dados });
  if (!res.ok) {
    const erro = await res.json();
    alert(`O produto foi salvo, mas a foto não: ${erro.erro || "tente de novo"}`);
    return false;
  }
  return true;
}

async function removerProduto(id_produto) {
  const produto = produtos.find((p) => p.id_produto === id_produto);
  if (!confirm(`Excluir ${produto.nome} do cardápio?`)) return;
  try {
    const res = await fetch(`${API_BASE_URL}/produtos/${id_produto}`, { method: "DELETE" });
    if (!res.ok) {
      const erro = await res.json();
      alert(erro.erro || "Não foi possível excluir o produto.");
      return;
    }
    avisar("Produto excluído");
    carregarProdutos();
  } catch (erro) {
    console.error("Erro ao excluir produto:", erro);
  }
}

async function carregarAvaliacoes() {
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos/avaliacao`);
    if (!res.ok) return;
    const avaliacoes = await res.json();

    let ratehtml = "";

    avaliacoes.forEach((avaliacao) => {
      const data = new Date(avaliacao.data_avaliacao + "Z").toLocaleDateString("pt-BR");

      let itens = "";
      avaliacao.itens.forEach((item) => {
        itens += `${item.quantidade}x ${escaparTexto(item.produto_nome)}<br>`;
      });

      ratehtml += `
        <div class="list-group-item d-flex justify-content-between align-items-start gap-3 py-3">
          <div>
            <div class="fw-semibold">Pedido #${avaliacao.id_pedido}</div>
            <small class="text-body-secondary">${itens}</small>
            <p class="fst-italic mt-2 mb-0">•  ${escaparTexto(avaliacao.comentario || "Sem comentário")}</p>
          </div>
          <div class="text-end text-nowrap">
            <span class="badge rounded-pill text-bg-warning">${avaliacao.nota} ★</span>
            <div><small class="text-body-secondary">${data}</small></div>
          </div>
        </div>`;
    });
    if (ratehtml === "") ratehtml = `<p class="text-body-secondary">Nenhum pedido avaliado</p>`

    document.getElementById("lista-avaliacoes").innerHTML = ratehtml;
  } catch (erro) {
    console.error("Erro ao carregar avaliações:", erro);
  }
}

// Alunos (só mestre)

// O mestre não pode ser promovido nem excluído
async function carregarAlunos() {
  try {
    const res = await fetch(`${API_BASE_URL}/alunos`);
    if (!res.ok) return;
    const alunos = await res.json();

    let html = "";
    alunos.forEach((aluno) => {
      let botoes = "";
      if (aluno.funcao === "aluno") {
        botoes += `<button class="btn btn-sm btn-outline-secondary rounded-pill" type="button" onclick="promoverAluno(${aluno.id_aluno})">Tornar admin</button>`;
      }
      if (aluno.funcao !== "mestre") {
        botoes += ` <button class="btn btn-sm btn-outline-danger rounded-pill" type="button" onclick="excluirAluno(${aluno.id_aluno})">Excluir</button>`;
      }
      html += `
        <div class="list-group-item d-flex flex-wrap align-items-center gap-2 py-2">
          <div class="flex-grow-1">
            <div class="fw-semibold">${escaparTexto(aluno.nome)}
              <span class="badge rounded-pill text-bg-light border text-capitalize">${aluno.funcao}</span></div>
            <small class="text-body-secondary">${escaparTexto(aluno.email)} · ${formatarPreco(aluno.saldo)}</small>
          </div>
          ${botoes}
        </div>`;
    });
    document.getElementById("lista-alunos").innerHTML = html;
  } catch (erro) {
    console.error("Erro ao carregar alunos:", erro);
  }
}

async function promoverAluno(id_aluno) {
  if (!confirm("Tornar este aluno admin? Ele poderá entregar e cancelar pedidos.")) return;
  try {
    const res = await fetch(`${API_BASE_URL}/alunos/${id_aluno}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funcao: "admin" }),
    });
    if (!res.ok) {
      const erro = await res.json();
      alert(erro.erro || "Não foi possível promover o aluno.");
      return;
    }
    carregarAlunos();
  } catch (erro) {
    console.error("Erro ao promover aluno:", erro);
  }
}

async function excluirAluno(id_aluno) {
  if (!confirm("Deseja realmente excluir este aluno?")) return;
  try {
    const res = await fetch(`${API_BASE_URL}/alunos/${id_aluno}`, { method: "DELETE" });
    if (!res.ok) {
      const erro = await res.json();
      alert(erro.erro || "Não foi possível excluir o aluno.");
      return;
    }
    avisar("Aluno excluído")
    carregarAlunos();
  } catch (erro) {
    console.error("Erro ao excluir aluno:", erro);
  }
}
