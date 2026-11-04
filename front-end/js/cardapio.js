// =============================================================================
// cardapio.js: a página principal (index.html).
//   1. Produtos: cards, janela de detalhes, categorias e filtros (rota de busca com procedures)
//   2. Combos mais pedidos
//   3. Carrinho: adicionar, remover, repetir último pedido e finalizar
//   4. Aviso de pedido em andamento
// =============================================================================

let saldo = 0;            // saldo do aluno (o carrinho avisa quando não dá para pagar)
let categoriaAtual = "";  // categoria escolhida nos botões (vazio = todas)
let produtos = [];        // produtos na tela (a janela de detalhes pega os dados daqui)
let produtoAberto = null; // id do produto mostrado na janela de detalhes

iniciar();

async function iniciar() {
  const aluno = await carregarAluno();
  saldo = aluno ? aluno.saldo : 0;
  carregarProdutos();
  carregarCarrinho();
  carregarCombos();
  carregarAvisoPedido();

  // Link "/#carrinho" (botão "Pedir de novo" de Meus pedidos): já abre o carrinho
  if (window.location.hash === "#carrinho") {
    bootstrap.Offcanvas.getOrCreateInstance("#carrinho").show();
  }
}

// -----------------------------------------------------------------------------
// 1. PRODUTOS
// -----------------------------------------------------------------------------

// Busca os produtos em GET /produtos/buscar com os filtros escolhidos e monta os cards.
// No back-end, cada filtro é uma stored procedure (categoria, faixa de preço, ordenação).
async function carregarProdutos() {
  const filtros = new URLSearchParams();
  const precoMin = document.getElementById("busca-preco-min").value;
  const precoMax = document.getElementById("busca-preco-max").value;
  const ordenar = document.getElementById("busca-ordenar").value;
  if (categoriaAtual) filtros.set("categoria", categoriaAtual);
  if (precoMin) filtros.set("preco_min", precoMin);
  if (precoMax) filtros.set("preco_max", precoMax);
  if (ordenar) filtros.set("ordenar", ordenar);

  const { ok, dados } = await api("/produtos/buscar?" + filtros);
  if (!ok) return avisar(dados.erro || "Não foi possível carregar o cardápio.", "erro");
  produtos = dados;

  // Para cada produto, acrescenta o card dele na lista
  const lista = document.getElementById("lista-produtos");
  lista.innerHTML = "";
  produtos.forEach((produto) => {
    lista.innerHTML += cardProduto(produto);
  });
  if (produtos.length === 0) lista.innerHTML = `<p class="text-center text-body-secondary py-5">Nenhum produto encontrado.</p>`;
}

// HTML do card de um produto. Se o produto não tiver foto, a imagem some (onerror).
// Tocar no card abre a janela de detalhes (abrirProduto). Na área dos botões, o
// event.stopPropagation() impede que o toque "suba" até o card e abra a janela.
function cardProduto(produto) {
  const id = produto.id_produto;
  const esgotado = produto.quantidade_estoque <= 0;

  // Esgotado: só o aviso. Senão: o seletor de quantidade (- 1 +) e o botão de adicionar.
  const comprar = esgotado
    ? `<span class="badge text-bg-secondary mt-auto">Esgotado</span>`
    : `<div class="mt-auto d-grid gap-1" onclick="event.stopPropagation()">
         <div class="input-group input-group-sm">
           <button class="btn btn-outline-secondary" type="button" onclick="mudarQuantidade(${id}, -1)" aria-label="Diminuir">−</button>
           <input class="form-control text-center" id="qtd-${id}" value="1" data-max="${produto.quantidade_estoque}" readonly aria-label="Quantidade">
           <button class="btn btn-outline-secondary" type="button" onclick="mudarQuantidade(${id}, 1)" aria-label="Aumentar">+</button>
         </div>
         <button class="btn btn-primary btn-sm rounded-pill" type="button" onclick="adicionarDoCard(${id})">Adicionar</button>
       </div>`;

  return `
    <div class="col">
      <div class="card card-produto h-100 border-0 shadow-sm rounded-4" role="button" onclick="abrirProduto(${id})">
        <div class="ratio ratio-4x3 rounded-top-4">
          <img src="/api/produtos/${id}/imagem" alt="" class="object-fit-contain p-2" loading="lazy" onerror="this.remove()">
        </div>
        <div class="card-body p-2 p-md-3 d-flex flex-column">
          <small class="text-body-secondary">${escapeHtml(produto.categoria || "")}</small>
          <h3 class="h6 fw-semibold mb-1">${escapeHtml(produto.nome)}</h3>
          <p class="fw-bold text-primary mb-2">${reais(produto.preco_atual)}</p>
          ${comprar}
        </div>
      </div>
    </div>`;
}

// Janela de detalhes do produto: foto, categoria, nome, preço, descrição (coluna
// ingredientes), estoque e o mesmo seletor de quantidade do card.
function abrirProduto(id_produto) {
  const produto = produtos.find((p) => p.id_produto === id_produto);
  const esgotado = produto.quantidade_estoque <= 0;
  produtoAberto = id_produto;

  // A foto: se o produto não tiver, o onerror esconde a área da foto
  const foto = document.getElementById("detalhe-foto");
  foto.classList.remove("d-none");
  foto.innerHTML = `<img src="/api/produtos/${id_produto}/imagem" alt="" class="object-fit-contain p-3"
                      onerror="this.parentElement.classList.add('d-none')">`;

  document.getElementById("detalhe-categoria").textContent = produto.categoria || "";
  document.getElementById("detalhe-nome").textContent = produto.nome;
  document.getElementById("detalhe-preco").textContent = reais(produto.preco_atual);
  document.getElementById("detalhe-descricao").textContent = produto.ingredientes || "Sem descrição.";
  document.getElementById("detalhe-estoque").textContent = esgotado ? "Esgotado" : `${produto.quantidade_estoque} disponíveis`;

  // Seletor de quantidade da janela: o campo se chama "qtd-modal", então os
  // botões - e + usam a mesma mudarQuantidade do card: mudarQuantidade("modal", 1)
  const campo = document.getElementById("qtd-modal");
  campo.value = 1;
  campo.dataset.max = produto.quantidade_estoque;
  document.getElementById("detalhe-comprar").classList.toggle("d-none", esgotado);

  bootstrap.Modal.getOrCreateInstance("#modal-detalhe").show();
}

// Botão "Adicionar" da janela: adiciona a quantidade escolhida e fecha a janela.
async function adicionarDoModal() {
  const quantidade = Number(document.getElementById("qtd-modal").value);
  const deuCerto = await adicionarAoCarrinho(produtoAberto, quantidade);
  if (deuCerto) {
    bootstrap.Modal.getInstance("#modal-detalhe").hide();
    avisar("Adicionado ao carrinho");
  }
}

// Botões - e + (do card e da janela): muda a quantidade, sem passar de 1 nem do estoque.
// Só muda o número na tela; o carrinho só é alterado no botão "Adicionar".
function mudarQuantidade(id_produto, mudanca) {
  const campo = document.getElementById(`qtd-${id_produto}`);
  const nova = Number(campo.value) + mudanca;
  if (nova >= 1 && nova <= Number(campo.dataset.max)) {
    campo.value = nova;
  }
}

// Botões de categoria (Tudo, Salgados, Bebidas, Doces): marca o escolhido e busca de novo.
function filtrar(categoria) {
  categoriaAtual = categoria;
  document.querySelectorAll("[data-categoria]").forEach((botao) => {
    const escolhido = botao.dataset.categoria === categoria;
    botao.classList.toggle("btn-primary", escolhido);
    botao.classList.toggle("btn-light", !escolhido);
  });
  carregarProdutos();
}

// Filtros de preço e ordenação: "Aplicar" busca de novo; "Limpar" apaga tudo.
document.getElementById("form-filtros").addEventListener("submit", (e) => {
  e.preventDefault();
  carregarProdutos();
});
document.getElementById("btn-limpar-filtros").addEventListener("click", () => {
  document.getElementById("form-filtros").reset();
  filtrar("");
});

// -----------------------------------------------------------------------------
// 2. COMBOS MAIS PEDIDOS (procedure sp_combinacoes_mais_pedidas no back-end)
// -----------------------------------------------------------------------------

// Um botão por combo ("Coxinha + Refrigerante"). Sem combos, a seção fica escondida.
// Cada combo é sempre uma dupla: produtos[0] e produtos[1].
async function carregarCombos() {
  const { ok, dados: combos } = await api("/pedidos/combinacoes");
  if (!ok || combos.length === 0) return;

  const lista = document.getElementById("lista-combos");
  lista.innerHTML = "";
  combos.forEach((combo) => {
    const primeiro = combo.produtos[0];
    const segundo = combo.produtos[1];
    lista.innerHTML += `<button class="btn btn-outline-primary rounded-pill text-nowrap" type="button"
        onclick="adicionarCombo([${primeiro.id_produto}, ${segundo.id_produto}])">
        + ${escapeHtml(primeiro.nome)} + ${escapeHtml(segundo.nome)}</button>`;
  });
  document.getElementById("secao-combos").classList.remove("d-none");
}

// Clique num combo: adiciona 1 de cada produto ao carrinho.
async function adicionarCombo(ids) {
  for (const id of ids) {
    const deuCerto = await adicionarAoCarrinho(id, 1);
    if (!deuCerto) return;
  }
  avisar("Combo adicionado ao carrinho");
}

// -----------------------------------------------------------------------------
// 3. CARRINHO
// O carrinho fica no back-end (um pedido com status "Carrinho"). Toda rota do
// carrinho devolve o carrinho inteiro, e o desenharCarrinho mostra na tela.
// -----------------------------------------------------------------------------

async function carregarCarrinho() {
  const { ok, dados } = await api("/carrinho");
  if (ok) desenharCarrinho(dados);
}

// POST /carrinho/itens. Se o produto já está no carrinho, o back-end soma a quantidade.
// Devolve true se deu certo.
async function adicionarAoCarrinho(id_produto, quantidade) {
  const { ok, dados } = await api("/carrinho/itens", "POST", { id_produto, quantidade });
  if (!ok) {
    avisar(dados.erro || "Não foi possível adicionar o produto.", "erro");
    return false;
  }
  desenharCarrinho(dados);
  return true;
}

// Botão "Adicionar" do card: usa a quantidade escolhida e depois volta o campo para 1.
async function adicionarDoCard(id_produto) {
  const campo = document.getElementById(`qtd-${id_produto}`);
  const deuCerto = await adicionarAoCarrinho(id_produto, Number(campo.value));
  if (deuCerto) {
    campo.value = 1;
    avisar("Adicionado ao carrinho");
  }
}

// Botão X de um item: DELETE /carrinho/itens/<id>
async function removerDoCarrinho(id_item_pedido) {
  const { ok, dados } = await api(`/carrinho/itens/${id_item_pedido}`, "DELETE");
  if (ok) desenharCarrinho(dados);
}

// Mostra o carrinho: itens, total, aviso de saldo, número no botão do topo e a
// barra "Ver carrinho" do celular.
function desenharCarrinho(carrinho) {
  const itens = carrinho.itens;
  const vazio = itens.length === 0;

  // Para cada item: acrescenta a linha na lista e soma a quantidade
  let quantidade = 0;
  const lista = document.getElementById("lista-carrinho");
  lista.innerHTML = "";
  itens.forEach((item) => {
    quantidade += item.quantidade;
    lista.innerHTML += `
    <li class="list-group-item px-0 d-flex align-items-center gap-2">
      <span class="badge rounded-pill text-bg-light border">${item.quantidade}x</span>
      <span class="flex-grow-1">${escapeHtml(item.produto_nome)}</span>
      <span class="fw-semibold">${reais(item.subtotal)}</span>
      <button class="btn-close" type="button" onclick="removerDoCarrinho(${item.id_item_pedido})" aria-label="Remover"></button>
    </li>`;
  });

  document.getElementById("carrinho-total").textContent = reais(carrinho.valor_total);
  document.getElementById("carrinho-vazio").classList.toggle("d-none", !vazio);
  document.getElementById("carrinho-rodape").classList.toggle("d-none", vazio);
  document.getElementById("aviso-saldo").classList.toggle("d-none", carrinho.valor_total <= saldo);

  const contador = document.getElementById("contador-carrinho");
  contador.textContent = quantidade;
  contador.classList.toggle("d-none", vazio);
  document.getElementById("barra-carrinho").classList.toggle("d-none", vazio);
  document.getElementById("barra-carrinho-texto").textContent = `Ver carrinho (${quantidade}) · ${reais(carrinho.valor_total)}`;
}

// Botão "Repetir último pedido": POST /carrinho/repetir (procedure sp_repetir_ultimo_pedido)
async function repetirUltimoPedido() {
  const { ok, dados } = await api("/carrinho/repetir", "POST");
  if (!ok) return avisar(dados.erro || "Você ainda não tem um pedido anterior.", "erro");
  desenharCarrinho(dados);
  avisar("Itens do último pedido adicionados");
}

// Botão "Finalizar pedido": POST /carrinho/finalizar. O back-end confere estoque e
// saldo, desconta os dois e gera o código de retirada.
async function finalizarPedido() {
  const { ok, dados: pedido } = await api("/carrinho/finalizar", "POST");
  if (!ok) return avisar(pedido.erro || "Não foi possível finalizar o pedido.", "erro");

  // Fecha o carrinho e mostra a janela com o código de retirada
  bootstrap.Offcanvas.getOrCreateInstance("#carrinho").hide();
  document.getElementById("pedido-feito-codigo").textContent = codigoPedido(pedido);
  bootstrap.Modal.getOrCreateInstance("#modal-pedido-feito").show();

  // Atualiza o resto da tela: saldo, estoque, carrinho vazio e o aviso do pedido
  const aluno = await carregarAluno();
  saldo = aluno.saldo;
  carregarProdutos();
  carregarCarrinho();
  carregarAvisoPedido();
}

// -----------------------------------------------------------------------------
// 4. AVISO DE PEDIDO EM ANDAMENTO (faixa amarela no topo: em preparo ou pronto)
// -----------------------------------------------------------------------------

async function carregarAvisoPedido() {
  const { ok, dados: pedidos } = await api("/pedidos/meus");
  if (!ok) return;
  const pedido = pedidos.find((p) => p.status === "Pendente" || p.status === "Pronto");

  document.getElementById("aviso-pedido").classList.toggle("d-none", !pedido);
  if (pedido) {
    document.getElementById("aviso-pedido-texto").textContent = pedido.status === "Pronto"
      ? `Pedido ${codigoPedido(pedido)} pronto! Retire no balcão`
      : `Pedido ${codigoPedido(pedido)} em preparo`;
  }
}
