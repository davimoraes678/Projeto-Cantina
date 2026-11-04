// =============================================================================
// cardapio.js: a página principal (index.html).
//   1. Produtos: cards, janela de detalhes, categorias e filtros
//   2. Combos mais pedidos
//   3. Carrinho: adicionar, remover, repetir último pedido e finalizar
//   4. Aviso de pedido em andamento
// =============================================================================

let saldo = 0;            // saldo do aluno (para avisar quando não dá para pagar)
let categoriaAtual = "";  // categoria escolhida nos botões ("" = todas)
let produtos = [];        // produtos que estão na tela (a janela de detalhes usa)
let produtoAberto = null; // id do produto mostrado na janela de detalhes

iniciar();

// Ao abrir a página: carrega tudo
async function iniciar() {
  carregarProdutos();
  carregarCombinacoes();
  verificarPedidoAndamento();

  // O carrinho precisa do saldo, então espera os dados do aluno chegarem
  const aluno = await alunoInf();
  if (aluno) saldo = aluno.saldo;
  carregarCarrinho();

  // Veio do botão "Pedir de novo" (endereço /#carrinho): já abre o carrinho
  if (window.location.hash === "#carrinho") {
    bootstrap.Offcanvas.getOrCreateInstance(document.getElementById("carrinho")).show();
  }
}

// =============================================================================
// 1. PRODUTOS
// =============================================================================

// Busca os produtos em GET /produtos/buscar com os filtros escolhidos e monta os cards.
// No back-end, cada filtro é uma stored procedure (categoria, faixa de preço, ordenação).
async function carregarProdutos() {
  const precoMin = document.getElementById("busca-preco-min").value;
  const precoMax = document.getElementById("busca-preco-max").value;
  const ordenar = document.getElementById("busca-ordenar").value;

  // Monta a parte "?categoria=...&preco_max=..." do endereço, só com os filtros preenchidos
  const params = new URLSearchParams();
  if (categoriaAtual) params.set("categoria", categoriaAtual);
  if (precoMin) params.set("preco_min", precoMin);
  if (precoMax) params.set("preco_max", precoMax);
  if (ordenar) params.set("ordenar", ordenar);

  try {
    const res = await fetch(`${API_BASE_URL}/produtos/buscar?${params.toString()}`);
    const dados = await res.json();
    if (!res.ok) {
      alert(dados.erro || "Não foi possível carregar o cardápio.");
      return;
    }
    produtos = dados;

    const lista = document.getElementById("lista-produtos");
    let html = "";
    produtos.forEach((produto) => {
      html += cardProduto(produto);
    });
    if (produtos.length === 0) {
      html = `<p class="text-center text-body-secondary py-5">Nenhum produto encontrado.</p>`;
    }
    lista.innerHTML = html;
  } catch (erro) {
    console.error("Erro ao carregar produtos:", erro);
  }
}

// HTML do card de um produto.
// Tocar no card abre a janela de detalhes (abrirProduto). Na área dos botões,
// o event.stopPropagation() faz o toque no botão não abrir a janela também.
function cardProduto(produto) {
  const id = produto.id_produto;

  // Esgotado: só o aviso. Senão: os botões - 1 + e "Adicionar".
  let comprar = `<span class="badge text-bg-secondary mt-auto">Esgotado</span>`;
  if (produto.quantidade_estoque > 0) {
    comprar = `
      <div class="mt-auto d-grid gap-1" onclick="event.stopPropagation()">
        <div class="input-group input-group-sm">
          <button class="btn btn-outline-secondary" type="button" onclick="mudarQuantidade(${id}, -1)">−</button>
          <input class="form-control text-center" id="qtd-${id}" value="1" readonly>
          <button class="btn btn-outline-secondary" type="button" onclick="mudarQuantidade(${id}, 1)">+</button>
        </div>
        <button class="btn btn-primary btn-sm rounded-pill" type="button" onclick="adicionarItemAoCarrinho(${id})">Adicionar</button>
      </div>`;
  }

  return `
    <div class="col">
      <div class="card card-produto h-100 border-0 shadow-sm rounded-4" role="button" onclick="abrirProduto(${id})">
        <div class="ratio ratio-4x3 rounded-top-4">
          <img src="${API_BASE_URL}/produtos/${id}/imagem" alt="" class="object-fit-contain p-2" loading="lazy" onerror="this.remove()">
        </div>
        <div class="card-body p-2 p-md-3 d-flex flex-column">
          <small class="text-body-secondary">${escaparTexto(produto.categoria || "")}</small>
          <h3 class="h6 fw-semibold mb-1">${escaparTexto(produto.nome)}</h3>
          <p class="fw-bold text-primary mb-2">${formatarPreco(produto.preco_atual)}</p>
          ${comprar}
        </div>
      </div>
    </div>`;
}

// Botões - e + : muda a quantidade, sem passar de 1 nem do estoque.
// Só muda o número na tela; o carrinho só muda no botão "Adicionar".
// Serve para os cards (id do produto) e para a janela de detalhes (id "modal").
function mudarQuantidade(id, mudanca) {
  const campo = document.getElementById(`qtd-${id}`);
  const nova = Number(campo.value) + mudanca;

  // Qual é o estoque? Do produto aberto na janela ou do produto do card.
  let produto = produtos.find((p) => p.id_produto === id);
  if (id === "modal") produto = produtos.find((p) => p.id_produto === produtoAberto);

  if (nova >= 1 && nova <= produto.quantidade_estoque) {
    campo.value = nova;
  }
}

// Janela de detalhes: foto, categoria, nome, preço, descrição (coluna ingredientes) e estoque.
function abrirProduto(id_produto) {
  const produto = produtos.find((p) => p.id_produto === id_produto);
  produtoAberto = id_produto;

  // Foto: se o produto não tiver, o onerror esconde a área da foto
  const foto = document.getElementById("detalhe-foto");
  foto.classList.remove("d-none");
  foto.innerHTML = `<img src="${API_BASE_URL}/produtos/${id_produto}/imagem" alt="" class="object-fit-contain p-3"
                       onerror="this.parentElement.classList.add('d-none')">`;

  document.getElementById("detalhe-categoria").textContent = produto.categoria || "";
  document.getElementById("detalhe-nome").textContent = produto.nome;
  document.getElementById("detalhe-preco").textContent = formatarPreco(produto.preco_atual);
  document.getElementById("detalhe-descricao").textContent = produto.ingredientes || "Sem descrição.";

  // Estoque e botões de comprar (esgotado: sem botões)
  if (produto.quantidade_estoque > 0) {
    document.getElementById("detalhe-estoque").textContent = `${produto.quantidade_estoque} disponíveis`;
    document.getElementById("detalhe-comprar").classList.remove("d-none");
  } else {
    document.getElementById("detalhe-estoque").textContent = "Esgotado";
    document.getElementById("detalhe-comprar").classList.add("d-none");
  }
  document.getElementById("qtd-modal").value = 1;

  bootstrap.Modal.getOrCreateInstance(document.getElementById("modal-detalhe")).show();
}

// Botões de categoria (Tudo, Salgados, Bebidas, Doces): marca o escolhido e busca de novo.
function filtrar(categoria) {
  categoriaAtual = categoria;
  document.querySelectorAll("[data-categoria]").forEach((botao) => {
    if (botao.dataset.categoria === categoria) {
      botao.classList.add("btn-primary");
      botao.classList.remove("btn-light");
    } else {
      botao.classList.add("btn-light");
      botao.classList.remove("btn-primary");
    }
  });
  carregarProdutos();
}

// Filtros de preço e ordenação: "Aplicar" busca de novo; "Limpar" apaga os filtros.
document.getElementById("form-filtros").addEventListener("submit", (e) => {
  e.preventDefault();
  carregarProdutos();
});
document.getElementById("btn-limpar-filtros").addEventListener("click", () => {
  document.getElementById("form-filtros").reset();
  filtrar("");
});

// =============================================================================
// 2. COMBOS MAIS PEDIDOS (GET /pedidos/combinacoes, procedure no back-end)
// =============================================================================

// Um botão por combo ("+ Coxinha + Refrigerante"). Cada combo é uma dupla de produtos.
async function carregarCombinacoes() {
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos/combinacoes`);
    if (!res.ok) return;
    const combos = await res.json();
    if (combos.length === 0) return; // sem combos, a seção continua escondida

    let html = "";
    combos.forEach((combo) => {
      const primeiro = combo.produtos[0];
      const segundo = combo.produtos[1];
      html += `
        <button class="btn btn-outline-primary rounded-pill text-nowrap" type="button"
                onclick="adicionarCombinacao(${primeiro.id_produto}, ${segundo.id_produto})">
          + ${escaparTexto(primeiro.nome)} + ${escaparTexto(segundo.nome)}
        </button>`;
    });
    document.getElementById("lista-combos").innerHTML = html;
    document.getElementById("secao-combos").classList.remove("d-none");
  } catch (erro) {
    console.error("Erro ao carregar combinações:", erro);
  }
}

// Clique num combo: adiciona 1 de cada produto ao carrinho.
async function adicionarCombinacao(id_produto1, id_produto2) {
  const deuCerto = await enviarParaCarrinho(id_produto1, 1);
  if (!deuCerto) return;
  await enviarParaCarrinho(id_produto2, 1);
  avisar("Combo adicionado ao carrinho");
}

// =============================================================================
// 3. CARRINHO
// O carrinho fica no back-end (um pedido com status "Carrinho"). Toda rota do
// carrinho devolve o carrinho inteiro, e o renderizarCarrinho mostra na tela.
// =============================================================================

// Busca o carrinho do aluno (GET /carrinho)
async function carregarCarrinho() {
  try {
    const res = await fetch(`${API_BASE_URL}/carrinho`);
    if (!res.ok) return;
    const carrinho = await res.json();
    renderizarCarrinho(carrinho);
  } catch (erro) {
    console.error("Erro ao carregar carrinho:", erro);
  }
}

// POST /carrinho/itens. Se o produto já está no carrinho, o back-end soma a quantidade.
// Devolve true se deu certo e false se deu erro.
async function enviarParaCarrinho(id_produto, quantidade) {
  try {
    const res = await fetch(`${API_BASE_URL}/carrinho/itens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_produto, quantidade }),
    });
    const dados = await res.json();
    if (!res.ok) {
      alert(dados.erro || "Não foi possível adicionar o produto.");
      return false;
    }
    renderizarCarrinho(dados);
    return true;
  } catch (erro) {
    console.error("Erro ao adicionar item:", erro);
    return false;
  }
}

// Botão "Adicionar" do card: usa a quantidade escolhida e volta o campo para 1.
async function adicionarItemAoCarrinho(id_produto) {
  const campo = document.getElementById(`qtd-${id_produto}`);
  const deuCerto = await enviarParaCarrinho(id_produto, Number(campo.value));
  if (deuCerto) {
    campo.value = 1;
    avisar("Adicionado ao carrinho");
  }
}

// Botão "Adicionar" da janela de detalhes: adiciona e fecha a janela.
async function adicionarDoModal() {
  const quantidade = Number(document.getElementById("qtd-modal").value);
  const deuCerto = await enviarParaCarrinho(produtoAberto, quantidade);
  if (deuCerto) {
    bootstrap.Modal.getInstance(document.getElementById("modal-detalhe")).hide();
    avisar("Adicionado ao carrinho");
  }
}

// Botão X de um item do carrinho: DELETE /carrinho/itens/<id>
async function removerItemDoCarrinho(id_item_pedido) {
  try {
    const res = await fetch(`${API_BASE_URL}/carrinho/itens/${id_item_pedido}`, { method: "DELETE" });
    const dados = await res.json();
    if (!res.ok) {
      alert(dados.erro || "Não foi possível remover o item.");
      return;
    }
    renderizarCarrinho(dados);
  } catch (erro) {
    console.error("Erro ao remover item:", erro);
  }
}

// Mostra o carrinho: itens, total, aviso de saldo, número no botão do topo e a
// barra "Ver carrinho" do celular.
function renderizarCarrinho(carrinho) {
  let html = "";
  let quantidade = 0;
  carrinho.itens.forEach((item) => {
    quantidade += item.quantidade;
    html += `
      <li class="list-group-item px-0 d-flex align-items-center gap-2">
        <span class="badge rounded-pill text-bg-light border">${item.quantidade}x</span>
        <span class="flex-grow-1">${escaparTexto(item.produto_nome)}</span>
        <span class="fw-semibold">${formatarPreco(item.subtotal)}</span>
        <button class="btn-close" type="button" onclick="removerItemDoCarrinho(${item.id_item_pedido})" aria-label="Remover"></button>
      </li>`;
  });
  document.getElementById("lista-carrinho").innerHTML = html;
  document.getElementById("carrinho-total").textContent = formatarPreco(carrinho.valor_total);

  // Carrinho vazio: mostra a mensagem e esconde o total; com itens, o contrário
  const contador = document.getElementById("contador-carrinho");
  const barra = document.getElementById("barra-carrinho");
  if (quantidade === 0) {
    document.getElementById("carrinho-vazio").classList.remove("d-none");
    document.getElementById("carrinho-rodape").classList.add("d-none");
    contador.classList.add("d-none");
    barra.classList.add("d-none");
  } else {
    document.getElementById("carrinho-vazio").classList.add("d-none");
    document.getElementById("carrinho-rodape").classList.remove("d-none");
    contador.classList.remove("d-none");
    barra.classList.remove("d-none");
  }
  contador.textContent = quantidade;
  document.getElementById("barra-carrinho-texto").textContent =
    `Ver carrinho (${quantidade}) · ${formatarPreco(carrinho.valor_total)}`;

  // Aviso de saldo insuficiente
  if (carrinho.valor_total > saldo) {
    document.getElementById("aviso-saldo").classList.remove("d-none");
  } else {
    document.getElementById("aviso-saldo").classList.add("d-none");
  }
}

// Botão "Repetir último pedido": POST /carrinho/repetir (procedure no back-end)
async function repetirUltimoPedido() {
  try {
    const res = await fetch(`${API_BASE_URL}/carrinho/repetir`, { method: "POST" });
    const dados = await res.json();
    if (!res.ok) {
      alert(dados.erro || "Você ainda não tem um pedido anterior.");
      return;
    }
    renderizarCarrinho(dados);
    avisar("Itens do último pedido adicionados");
  } catch (erro) {
    console.error("Erro ao repetir pedido:", erro);
  }
}

// Botão "Finalizar pedido": POST /carrinho/finalizar. O back-end confere estoque
// e saldo, desconta os dois e gera o código de retirada.
async function finalizarPedido() {
  try {
    const res = await fetch(`${API_BASE_URL}/carrinho/finalizar`, { method: "POST" });
    const pedido = await res.json();
    if (!res.ok) {
      alert(pedido.erro || "Não foi possível finalizar o pedido.");
      return;
    }

    // Fecha o carrinho e mostra a janela com o código de retirada
    bootstrap.Offcanvas.getOrCreateInstance(document.getElementById("carrinho")).hide();
    document.getElementById("pedido-feito-codigo").textContent = pedido.codigo || `#${pedido.id_pedido}`;
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modal-pedido-feito")).show();

    // Atualiza o resto da tela: saldo, estoque, carrinho vazio e o aviso do pedido
    const aluno = await alunoInf();
    if (aluno) saldo = aluno.saldo;
    carregarProdutos();
    carregarCarrinho();
    verificarPedidoAndamento();
  } catch (erro) {
    console.error("Erro ao finalizar pedido:", erro);
  }
}

// =============================================================================
// 4. AVISO DE PEDIDO EM ANDAMENTO (faixa amarela no topo)
// =============================================================================

// Busca os pedidos do aluno (GET /pedidos/meus) e mostra o aviso se algum
// estiver em preparo ou pronto para retirar.
async function verificarPedidoAndamento() {
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos/meus`);
    if (!res.ok) return;
    const pedidos = await res.json();
    const pedido = pedidos.find((p) => p.status === "Pendente" || p.status === "Pronto");

    const aviso = document.getElementById("aviso-pedido");
    if (!pedido) {
      aviso.classList.add("d-none");
      return;
    }
    const codigo = pedido.codigo || `#${pedido.id_pedido}`;
    if (pedido.status === "Pronto") {
      document.getElementById("aviso-pedido-texto").textContent = `Pedido ${codigo} pronto! Retire no balcão`;
    } else {
      document.getElementById("aviso-pedido-texto").textContent = `Pedido ${codigo} em preparo`;
    }
    aviso.classList.remove("d-none");
  } catch (erro) {
    console.error("Erro ao verificar pedidos:", erro);
  }
}
