// =============================================================================
// admin.js: administração (admin.html). Uma parte por aba:
//   1. Pedidos e Histórico (admin e mestre)
//   2. Produtos (só mestre)
//   3. Alunos (só mestre)
// =============================================================================

let produtos = [];            // produtos carregados (o "Editar" pega os dados daqui)
let editandoProdutoId = null; // null = a janela de produto está cadastrando; um id = editando
let totalEmPreparo = null;    // quantos pedidos estavam em preparo (para avisar quando chega um novo)

iniciar();

// Ao abrir a página: carrega os pedidos e, para o mestre, produtos e alunos.
async function iniciar() {
  carregarPedidos();
  const aluno = await alunoInf();
  if (aluno && aluno.funcao === "mestre") {
    carregarProdutos();
    carregarAlunos();
  }
  // O admin deixa esta tela aberta: os pedidos se atualizam sozinhos a cada 15 segundos
  setInterval(carregarPedidos, 15000);
}

// =============================================================================
// 1. PEDIDOS E HISTÓRICO
// =============================================================================

// Busca todos os pedidos (GET /pedidos) e separa em três listas:
//   - Em preparo (botão "Pronto")
//   - Prontos para retirar (botão "Entregar")
//   - Histórico: entregues e cancelados, o mais novo primeiro
async function carregarPedidos() {
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos`);
    if (!res.ok) return;
    const pedidos = await res.json();

    let htmlPreparo = "";
    let htmlProntos = "";
    let htmlHistorico = "";
    let emPreparo = 0;
    let prontos = 0;
    pedidos.forEach((pedido) => {
      if (pedido.status === "Pendente") {
        htmlPreparo += cardPedidoAdmin(pedido);
        emPreparo++;
      } else if (pedido.status === "Pronto") {
        htmlProntos += cardPedidoAdmin(pedido);
        prontos++;
      } else {
        htmlHistorico = linhaHistorico(pedido) + htmlHistorico; // na frente: o mais novo fica em cima
      }
    });

    if (htmlPreparo === "") htmlPreparo = `<p class="text-body-secondary">Nenhum pedido em preparo.</p>`;
    if (htmlProntos === "") htmlProntos = `<p class="text-body-secondary">Nenhum pedido esperando retirada.</p>`;
    if (htmlHistorico === "") htmlHistorico = `<p class="text-center text-body-secondary py-4 mb-0">Nenhum pedido finalizado.</p>`;
    document.getElementById("lista-preparo").innerHTML = htmlPreparo;
    document.getElementById("lista-prontos").innerHTML = htmlProntos;
    document.getElementById("lista-historico-admin").innerHTML = htmlHistorico;

    // Números nas colunas, no menu e no título da aba do navegador ("(3) Administração")
    const esperando = emPreparo + prontos;
    document.getElementById("contador-preparo").textContent = emPreparo;
    document.getElementById("contador-prontos").textContent = prontos;
    const contador = document.getElementById("contador-pedidos-admin");
    contador.textContent = esperando;
    if (esperando > 0) {
      contador.classList.remove("d-none");
      document.title = `(${esperando}) Administração - Cantina Real`;
    } else {
      contador.classList.add("d-none");
      document.title = "Administração - Cantina Real";
    }

    // Chegou pedido novo desde a última atualização? Avisa.
    if (totalEmPreparo !== null && emPreparo > totalEmPreparo) {
      avisar("Novo pedido chegou!");
    }
    totalEmPreparo = emPreparo;
  } catch (erro) {
    console.error("Erro ao carregar pedidos:", erro);
  }
}

// Card de um pedido, com o código de retirada em destaque. O botão principal:
//   Pendente -> "Pronto" (avisa o aluno que já pode retirar)
//   Pronto   -> "Entregar" (o aluno retirou no balcão: fecha o pedido)
function cardPedidoAdmin(pedido) {
  const codigo = pedido.codigo || `#${pedido.id_pedido}`;

  let itens = "";
  pedido.itens.forEach((item) => {
    itens += `<li>${item.quantidade}x ${escaparTexto(item.produto_nome)}</li>`;
  });

  let selo = `<span class="badge rounded-pill text-bg-warning">Em preparo</span>`;
  let botao = `<button class="btn btn-warning rounded-pill" type="button" onclick="marcarPronto(${pedido.id_pedido})">Pronto</button>`;
  let borda = "border-warning";
  if (pedido.status === "Pronto") {
    selo = `<span class="badge rounded-pill text-bg-success">Esperando retirada</span>`;
    botao = `<button class="btn btn-success rounded-pill" type="button" onclick="entregarPedido(${pedido.id_pedido})">Entregar</button>`;
    borda = "border-success";
  }

  return `
    <div class="card border-0 border-start border-4 ${borda} shadow-sm rounded-4">
      <div class="card-body d-flex flex-column">
        <div class="d-flex justify-content-between">
          <small class="text-body-secondary">Código de retirada</small>
          ${selo}
        </div>
        <p class="fs-2 fw-bold font-monospace lh-1 mb-2">${codigo}</p>
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

// Linha do histórico: aluno, código, itens, status, total e data.
function linhaHistorico(pedido) {
  const codigo = pedido.codigo || `#${pedido.id_pedido}`;

  let itens = "";
  pedido.itens.forEach((item) => {
    itens += `${item.quantidade}x ${escaparTexto(item.produto_nome)}<br>`;
  });

  let selo = `<span class="badge rounded-pill text-bg-success">Entregue</span>`;
  if (pedido.status === "Cancelado") {
    selo = `<span class="badge rounded-pill text-bg-secondary">Cancelado</span>`;
  }

  return `
    <div class="list-group-item d-flex justify-content-between align-items-start gap-3 py-3">
      <div>
        <div class="fw-semibold">${escaparTexto(pedido.aluno_nome)} <small class="text-body-secondary fw-normal">${codigo}</small></div>
        <small class="text-body-secondary">${itens}</small>
      </div>
      <div class="text-end text-nowrap">
        ${selo}
        <div class="fw-semibold">${formatarPreco(pedido.valor_total)}</div>
        <small class="text-body-secondary">${new Date(pedido.data_hora_criacao + "Z").toLocaleString("pt-BR")}</small>
      </div>
    </div>`;
}

// Botão "Pronto": POST /pedidos/<id>/pronto. O aluno vê "Pronto para retirar".
async function marcarPronto(id_pedido) {
  await mudarPedido(id_pedido, "pronto", "Aluno avisado: pedido pronto");
}

// Botão "Entregar": POST /pedidos/<id>/concluir, quando o aluno retira no balcão.
async function entregarPedido(id_pedido) {
  if (!confirm("Confirmar que o aluno retirou o pedido?")) return;
  await mudarPedido(id_pedido, "concluir", "Pedido entregue");
}

// Botão "Cancelar": POST /pedidos/<id>/cancelar. O valor volta para a carteira
// do aluno e os produtos voltam para o estoque.
async function cancelarPedido(id_pedido) {
  if (!confirm("Cancelar o pedido? O valor volta para a carteira do aluno.")) return;
  await mudarPedido(id_pedido, "cancelar", "Pedido cancelado");
}

// Chama a rota (pronto, concluir ou cancelar) e recarrega os pedidos.
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

// =============================================================================
// 2. PRODUTOS (só mestre)
// =============================================================================

// Busca os produtos (GET /produtos) e mostra uma linha por produto, com Editar e Excluir.
async function carregarProdutos() {
  try {
    const res = await fetch(`${API_BASE_URL}/produtos`);
    if (!res.ok) return;
    produtos = await res.json();

    let html = "";
    produtos.forEach((produto) => {
      html += `
        <div class="list-group-item d-flex align-items-center gap-3 py-2">
          <img src="${API_BASE_URL}/produtos/${produto.id_produto}/imagem" alt="" width="48" height="48"
               class="rounded object-fit-contain bg-body-tertiary flex-shrink-0" loading="lazy" onerror="this.style.visibility='hidden'">
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

// Botão "Novo produto": abre a janela vazia.
function novoProduto() {
  editandoProdutoId = null;
  document.getElementById("form-produto").reset();
  document.getElementById("modal-produto-titulo").textContent = "Novo produto";
  document.getElementById("produto-imagem-previa").classList.add("d-none");
  bootstrap.Modal.getOrCreateInstance(document.getElementById("modal-produto")).show();
}

// Botão "Editar": abre a janela preenchida com os dados do produto.
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

  // Prévia da foto atual ("?v=" + hora evita mostrar uma foto antiga guardada no navegador)
  mostrarPrevia(`${API_BASE_URL}/produtos/${id_produto}/imagem?v=${Date.now()}`);
  bootstrap.Modal.getOrCreateInstance(document.getElementById("modal-produto")).show();
}

// Mostra a foto na janela de produto. Se o produto não tiver foto, a prévia fica escondida.
function mostrarPrevia(endereco) {
  const previa = document.getElementById("produto-imagem-previa");
  previa.classList.add("d-none");
  previa.onload = () => previa.classList.remove("d-none");
  previa.src = endereco;
}

// Ao escolher uma foto no campo, mostra a prévia dela antes de salvar.
document.getElementById("imagem").addEventListener("change", () => {
  const arquivo = document.getElementById("imagem").files[0];
  if (arquivo) mostrarPrevia(URL.createObjectURL(arquivo));
});

// "Salvar" da janela: POST /produtos (novo) ou PUT /produtos/<id> (editar).
// Depois envia a foto, se foi escolhida uma.
document.getElementById("form-produto").addEventListener("submit", async (e) => {
  e.preventDefault();
  const corpo = {
    nome: document.getElementById("produto-nome").value,
    preco_atual: Number(document.getElementById("produto-preco").value),
    quantidade_estoque: Number(document.getElementById("produto-estoque").value),
    categoria: document.getElementById("produto-categoria").value,
    ingredientes: document.getElementById("produto-ingredientes").value,
  };

  // Novo produto: POST. Editando: PUT.
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

    // Se a foto falhar, a janela continua aberta em modo "editar": salvar de novo
    // tenta só a foto, sem cadastrar o produto duas vezes.
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

// Envia a foto escolhida para POST /produtos/<id>/imagem. Arquivo vai como
// FormData (formulário com arquivo), não como JSON.
// Devolve true se deu certo (ou se nenhuma foto foi escolhida).
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

// Botão "Excluir": DELETE /produtos/<id>. Os pedidos antigos continuam com o nome do produto.
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

// =============================================================================
// 3. ALUNOS (só mestre)
// =============================================================================

// Busca os alunos (GET /alunos) e mostra uma linha por aluno.
// O mestre não pode ser promovido nem excluído.
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

// Botão "Tornar admin": PUT /alunos/<id> com { funcao: "admin" }.
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

// Botão "Excluir": DELETE /alunos/<id>. Os pedidos do aluno continuam no histórico.
async function excluirAluno(id_aluno) {
  if (!confirm("Deseja realmente excluir este aluno?")) return;
  try {
    const res = await fetch(`${API_BASE_URL}/alunos/${id_aluno}`, { method: "DELETE" });
    if (!res.ok) {
      const erro = await res.json();
      alert(erro.erro || "Não foi possível excluir o aluno.");
      return;
    }
    carregarAlunos();
  } catch (erro) {
    console.error("Erro ao excluir aluno:", erro);
  }
}
