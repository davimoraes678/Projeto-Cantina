// =============================================================================
// admin.js: administração (admin.html). Uma parte por aba:
//   1. Pedidos e Histórico (admin e mestre)
//   2. Produtos (só mestre)
//   3. Alunos (só mestre)
// =============================================================================

let produtos = [];          // produtos carregados (o "Editar" pega os dados daqui)
let alunos = [];            // alunos carregados
let editandoProdutoId = null; // null = a janela de produto está cadastrando; um id = editando

iniciar();

async function iniciar() {
  const aluno = await carregarAluno();
  carregarPedidos();
  if (aluno.funcao === "mestre") {
    carregarProdutos();
    carregarAlunos();
  }
}

// -----------------------------------------------------------------------------
// 1. PEDIDOS E HISTÓRICO
// -----------------------------------------------------------------------------

// GET /pedidos: os em preparo e os prontos vão para a aba Pedidos (o mais antigo
// primeiro) e os entregues e cancelados para a aba Histórico (o mais novo primeiro).
async function carregarPedidos() {
  const { ok, dados: pedidos } = await api("/pedidos");
  if (!ok) return;

  const andamento = pedidos.filter((p) => p.status === "Pendente" || p.status === "Pronto");
  const historico = pedidos.filter((p) => p.status === "Concluído" || p.status === "Cancelado").reverse();

  document.getElementById("lista-pedidos-admin").innerHTML = andamento.length
    ? andamento.map(cardPedidoAdmin).join("")
    : `<p class="text-center text-body-secondary py-5">Nenhum pedido esperando.</p>`;
  document.getElementById("lista-historico-admin").innerHTML = historico.length
    ? historico.map(linhaHistorico).join("")
    : `<p class="text-center text-body-secondary py-4 mb-0">Nenhum pedido finalizado.</p>`;

  const contador = document.getElementById("contador-pedidos-admin");
  contador.textContent = andamento.length;
  contador.classList.toggle("d-none", andamento.length === 0);
}

// Card de um pedido, com o código de retirada em destaque. O botão principal
// depende do status:
//   Pendente -> "Pronto" (avisa o aluno que já pode retirar)
//   Pronto   -> "Entregar" (o aluno retirou no balcão: fecha o pedido)
function cardPedidoAdmin(pedido) {
  const pronto = pedido.status === "Pronto";
  const itens = pedido.itens.map((item) => `<li>${item.quantidade}x ${escapeHtml(item.produto_nome)}</li>`).join("");
  const botao = pronto
    ? `<button class="btn btn-success rounded-pill" type="button" onclick="mudarPedido(${pedido.id_pedido}, 'concluir')">Entregar</button>`
    : `<button class="btn btn-warning rounded-pill" type="button" onclick="mudarPedido(${pedido.id_pedido}, 'pronto')">Pronto</button>`;
  return `
    <div class="col">
      <div class="card h-100 border-0 border-start border-4 ${pronto ? "border-success" : "border-warning"} shadow-sm rounded-4">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between">
            <small class="text-body-secondary">Código de retirada</small>
            <span class="badge rounded-pill ${pronto ? "text-bg-success" : "text-bg-warning"}">${pronto ? "Esperando retirada" : "Em preparo"}</span>
          </div>
          <p class="fs-2 fw-bold font-monospace lh-1 mb-2">${escapeHtml(codigoPedido(pedido))}</p>
          <p class="fw-semibold mb-1">${escapeHtml(pedido.aluno_nome)}
            <small class="text-body-secondary fw-normal">· ${formatarData(pedido.data_hora_criacao)}</small></p>
          <ul class="small mb-3 ps-3">${itens}</ul>
          <div class="mt-auto d-flex align-items-center gap-2">
            <span class="fw-bold me-auto">${reais(pedido.valor_total)}</span>
            <button class="btn btn-sm btn-outline-danger rounded-pill" type="button" onclick="mudarPedido(${pedido.id_pedido}, 'cancelar')">Cancelar</button>
            ${botao}
          </div>
        </div>
      </div>
    </div>`;
}

// Linha do histórico: aluno, código, itens, status, total e data.
function linhaHistorico(pedido) {
  const entregue = pedido.status === "Concluído";
  const itens = pedido.itens.map((item) => `${item.quantidade}x ${escapeHtml(item.produto_nome)}`).join(", ");
  return `
    <div class="list-group-item d-flex justify-content-between align-items-start gap-3 py-3">
      <div>
        <div class="fw-semibold">${escapeHtml(pedido.aluno_nome)}
          <small class="text-body-secondary fw-normal">${escapeHtml(codigoPedido(pedido))}</small></div>
        <small class="text-body-secondary">${itens}</small>
      </div>
      <div class="text-end text-nowrap">
        <span class="badge rounded-pill ${entregue ? "text-bg-success" : "text-bg-secondary"}">${entregue ? "Entregue" : "Cancelado"}</span>
        <div class="fw-semibold">${reais(pedido.valor_total)}</div>
        <small class="text-body-secondary">${formatarData(pedido.data_hora_criacao)}</small>
      </div>
    </div>`;
}

// Botões dos cards: POST /pedidos/<id>/pronto, /concluir ou /cancelar.
// Cancelar devolve o valor para a carteira do aluno e os produtos para o estoque.
const ACOES = {
  pronto: { pergunta: null, aviso: "Aluno avisado: pedido pronto" },
  concluir: { pergunta: "Confirmar que o aluno retirou o pedido?", aviso: "Pedido entregue" },
  cancelar: { pergunta: "Cancelar o pedido? O valor volta para a carteira do aluno.", aviso: "Pedido cancelado" },
};

async function mudarPedido(id_pedido, acao) {
  const { pergunta, aviso } = ACOES[acao];
  if (pergunta && !confirm(pergunta)) return;

  const { ok, dados } = await api(`/pedidos/${id_pedido}/${acao}`, "POST");
  if (!ok) return avisar(dados.erro || "Não foi possível atualizar o pedido.", "erro");
  avisar(aviso);
  carregarPedidos();
}

// -----------------------------------------------------------------------------
// 2. PRODUTOS (só mestre)
// -----------------------------------------------------------------------------

// GET /produtos e uma linha por produto, com os botões Editar e Excluir.
async function carregarProdutos() {
  const { ok, dados } = await api("/produtos");
  if (!ok) return;
  produtos = dados;

  document.getElementById("lista-produtos-admin").innerHTML = produtos.map((produto) => `
    <div class="list-group-item d-flex align-items-center gap-3 py-2">
      <img src="/api/produtos/${produto.id_produto}/imagem" alt="" width="48" height="48"
           class="rounded object-fit-contain bg-body-tertiary flex-shrink-0" loading="lazy" onerror="this.style.visibility='hidden'">
      <div class="flex-grow-1">
        <div class="fw-semibold">${escapeHtml(produto.nome)}</div>
        <small class="text-body-secondary">${escapeHtml(produto.categoria || "")} · ${reais(produto.preco_atual)} · ${produto.quantidade_estoque} em estoque</small>
      </div>
      <button class="btn btn-sm btn-outline-secondary rounded-pill" type="button" onclick="editarProduto(${produto.id_produto})">Editar</button>
      <button class="btn btn-sm btn-outline-danger rounded-pill" type="button" onclick="excluirProduto(${produto.id_produto})">Excluir</button>
    </div>`).join("");
}

// "Novo produto": abre a janela vazia.
function novoProduto() {
  editandoProdutoId = null;
  document.getElementById("form-produto").reset();
  document.getElementById("modal-produto-titulo").textContent = "Novo produto";
  mostrarPrevia("");
  bootstrap.Modal.getOrCreateInstance("#modal-produto").show();
}

// "Editar": abre a janela preenchida com os dados do produto.
function editarProduto(id_produto) {
  const produto = produtos.find((p) => p.id_produto === id_produto);
  editandoProdutoId = id_produto;
  document.getElementById("form-produto").reset();
  document.getElementById("produto-nome").value = produto.nome;
  document.getElementById("produto-preco").value = produto.preco_atual;
  document.getElementById("produto-estoque").value = produto.quantidade_estoque;
  document.getElementById("produto-categoria").value = produto.categoria || "";
  document.getElementById("modal-produto-titulo").textContent = "Editar produto";
  mostrarPrevia(`/api/produtos/${id_produto}/imagem?v=${Date.now()}`); // ?v= evita a foto antiga guardada no navegador
  bootstrap.Modal.getOrCreateInstance("#modal-produto").show();
}

// Prévia da foto na janela: a atual (ao editar) ou a que acabou de ser escolhida.
// Se o endereço estiver vazio ou o produto não tiver foto, a prévia some.
function mostrarPrevia(endereco) {
  const previa = document.getElementById("produto-imagem-previa");
  previa.classList.add("d-none");
  previa.onload = () => previa.classList.remove("d-none");
  if (endereco) previa.src = endereco;
}
document.getElementById("imagem").addEventListener("change", (e) => {
  const arquivo = e.target.files[0];
  if (arquivo) mostrarPrevia(URL.createObjectURL(arquivo));
});

// "Salvar" da janela: POST /produtos (novo) ou PUT /produtos/<id> (editar),
// e depois envia a foto, se foi escolhida uma.
document.getElementById("form-produto").addEventListener("submit", async (e) => {
  e.preventDefault();
  const dados = {
    nome: document.getElementById("produto-nome").value,
    preco_atual: Number(document.getElementById("produto-preco").value),
    quantidade_estoque: Number(document.getElementById("produto-estoque").value),
    categoria: document.getElementById("produto-categoria").value,
  };
  const resposta = editandoProdutoId
    ? await api(`/produtos/${editandoProdutoId}`, "PUT", dados)
    : await api("/produtos", "POST", dados);
  if (!resposta.ok) return avisar(resposta.dados.erro || "Não foi possível salvar o produto.", "erro");

  // Se a foto falhar, a janela continua aberta em modo "editar": salvar de novo
  // tenta só a foto, sem cadastrar o produto duas vezes.
  editandoProdutoId = resposta.dados.id_produto;
  const fotoDeuCerto = await enviarImagem(editandoProdutoId);
  if (!fotoDeuCerto) return;

  bootstrap.Modal.getInstance("#modal-produto").hide();
  avisar("Produto salvo");
  carregarProdutos();
});

// Envia a foto escolhida para POST /produtos/<id>/imagem. Arquivo vai como
// FormData (formulário com arquivo), por isso não usa a função api().
// Devolve true se deu certo ou se nenhuma foto foi escolhida.
async function enviarImagem(id_produto) {
  const arquivo = document.getElementById("imagem").files[0];
  if (!arquivo) return true;

  const formulario = new FormData();
  formulario.append("imagem", arquivo);
  const res = await fetch(`/api/produtos/${id_produto}/imagem`, { method: "POST", body: formulario });
  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    avisar(`O produto foi salvo, mas a foto não: ${erro.erro || "tente de novo"}`, "erro");
    return false;
  }
  return true;
}

// "Excluir": DELETE /produtos/<id>. Os pedidos antigos continuam com o nome do produto.
async function excluirProduto(id_produto) {
  const produto = produtos.find((p) => p.id_produto === id_produto);
  if (!confirm(`Excluir ${produto.nome} do cardápio?`)) return;
  const { ok, dados } = await api(`/produtos/${id_produto}`, "DELETE");
  if (!ok) return avisar(dados.erro || "Não foi possível excluir o produto.", "erro");
  avisar("Produto excluído");
  carregarProdutos();
}

// -----------------------------------------------------------------------------
// 3. ALUNOS (só mestre)
// -----------------------------------------------------------------------------

// GET /alunos e uma linha por aluno. O mestre não pode ser promovido nem excluído.
async function carregarAlunos() {
  const { ok, dados } = await api("/alunos");
  if (!ok) return;
  alunos = dados;

  document.getElementById("lista-alunos").innerHTML = alunos.map((aluno) => {
    const promover = aluno.funcao === "aluno"
      ? `<button class="btn btn-sm btn-outline-secondary rounded-pill" type="button" onclick="promoverAluno(${aluno.id_aluno})">Tornar admin</button>` : "";
    const excluir = aluno.funcao !== "mestre"
      ? `<button class="btn btn-sm btn-outline-danger rounded-pill" type="button" onclick="excluirAluno(${aluno.id_aluno})">Excluir</button>` : "";
    return `
      <div class="list-group-item d-flex flex-wrap align-items-center gap-2 py-2">
        <div class="flex-grow-1">
          <div class="fw-semibold">${escapeHtml(aluno.nome)}
            <span class="badge rounded-pill text-bg-light border text-capitalize">${aluno.funcao}</span></div>
          <small class="text-body-secondary">${escapeHtml(aluno.email)} · ${reais(aluno.saldo)}</small>
        </div>
        ${promover} ${excluir}
      </div>`;
  }).join("");
}

// "Tornar admin": PUT /alunos/<id>. O admin pode entregar e cancelar pedidos.
async function promoverAluno(id_aluno) {
  const aluno = alunos.find((a) => a.id_aluno === id_aluno);
  if (!confirm(`Tornar ${aluno.nome} admin?`)) return;
  const { ok, dados } = await api(`/alunos/${id_aluno}`, "PUT", { funcao: "admin" });
  if (!ok) return avisar(dados.erro || "Não foi possível promover o aluno.", "erro");
  carregarAlunos();
}

// "Excluir": DELETE /alunos/<id>. Os pedidos do aluno continuam no histórico.
async function excluirAluno(id_aluno) {
  const aluno = alunos.find((a) => a.id_aluno === id_aluno);
  if (!confirm(`Excluir a conta de ${aluno.nome}?`)) return;
  const { ok, dados } = await api(`/alunos/${id_aluno}`, "DELETE");
  if (!ok) return avisar(dados.erro || "Não foi possível excluir o aluno.", "erro");
  carregarAlunos();
}
