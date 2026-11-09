let categoriaAtual = "";
let produtos = [];
let produtoAberto = null; // id do produto aberto na janela de detalhes
let pedidoAvaliando = null;

iniciar();

function iniciar() {
  alunoInf();
  carregarProdutos();
  carregarCombinacoes();
  carregarCarrinho();
  verificarPedidoAndamento();
  verificarAvaliacao();

  // Veio do "Pedir de novo" (/#carrinho)
  if (window.location.hash === "#carrinho") {
    bootstrap.Offcanvas.getOrCreateInstance(document.getElementById("carrinho")).show();
  }
}

// Produtos

// Cada filtro é uma stored procedure no back-end
async function carregarProdutos() {
  const precoMin = document.getElementById("busca-preco-min").value;
  const precoMax = document.getElementById("busca-preco-max").value;
  const ordenar = document.getElementById("busca-ordenar").value;

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

// O stopPropagation impede que o clique nos botões abra a janela de detalhes
function cardProduto(produto) {
  const id = produto.id_produto;

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
      <div class="card card-produto h-100 border-0 shadow-sm rounded-4" onclick="abrirProduto(${id})">
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

// Serve para os cards (id do produto) e para a janela de detalhes (id "modal")
function mudarQuantidade(id, mudanca) {
  const campo = document.getElementById(`qtd-${id}`);
  const nova = Number(campo.value) + mudanca;

  let produto = produtos.find((p) => p.id_produto === id);
  if (id === "modal") produto = produtos.find((p) => p.id_produto === produtoAberto);

  if (nova >= 1 && nova <= produto.quantidade_estoque) {
    campo.value = nova;
  }
}

function abrirProduto(id_produto) {
  const produto = produtos.find((p) => p.id_produto === id_produto);
  produtoAberto = id_produto;

  // Sem foto: o onerror esconde a área
  const foto = document.getElementById("detalhe-foto");
  foto.classList.remove("d-none");
  foto.innerHTML = `<img src="${API_BASE_URL}/produtos/${id_produto}/imagem" alt="" class="object-fit-contain p-3"
                       onerror="this.parentElement.classList.add('d-none')">`;

  document.getElementById("detalhe-categoria").textContent = produto.categoria || "";
  document.getElementById("detalhe-nome").textContent = produto.nome;
  document.getElementById("detalhe-preco").textContent = formatarPreco(produto.preco_atual);
  document.getElementById("detalhe-descricao").textContent = produto.ingredientes || "Sem descrição.";

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

document.getElementById("form-filtros").addEventListener("submit", (e) => {
  e.preventDefault();
  carregarProdutos();
});
document.getElementById("btn-limpar-filtros").addEventListener("click", () => {
  document.getElementById("form-filtros").reset();
  filtrar("");
});

// Combos mais pedidos

async function carregarCombinacoes() {
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos/combinacoes`);
    if (!res.ok) return;
    const combos = await res.json();
    if (combos.length === 0) return;

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

async function adicionarCombinacao(id_produto1, id_produto2) {
  const deuCerto = await enviarParaCarrinho(id_produto1, 1);
  if (!deuCerto) return;
  await enviarParaCarrinho(id_produto2, 1);
  avisar("Combo adicionado ao carrinho");
}

// Carrinho (toda rota do carrinho devolve o carrinho inteiro)

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

// Se o produto já está no carrinho, o back-end soma a quantidade
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

async function adicionarItemAoCarrinho(id_produto) {
  const campo = document.getElementById(`qtd-${id_produto}`);
  const deuCerto = await enviarParaCarrinho(id_produto, Number(campo.value));
  if (deuCerto) {
    campo.value = 1;
    avisar("Adicionado ao carrinho");
  }
}

async function adicionarDoModal() {
  const quantidade = Number(document.getElementById("qtd-modal").value);
  const deuCerto = await enviarParaCarrinho(produtoAberto, quantidade);
  if (deuCerto) {
    bootstrap.Modal.getInstance(document.getElementById("modal-detalhe")).hide();
    avisar("Adicionado ao carrinho");
  }
}

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

function renderizarCarrinho(carrinho) {
  const quantidade = carrinho.quantidade_itens;
  let html = "";
  carrinho.itens.forEach((item) => {
    html += `
      <li class="list-group-item px-0 d-flex align-items-center gap-2">
        <span class="badge rounded-pill text-bg-light border">${item.quantidade}x</span>
        <span class="flex-grow-1">${escaparTexto(item.produto_nome)}</span>
        <span class="fw-semibold">${formatarPreco(item.subtotal)}</span>
        <button class="btn-close" type="button" onclick="removerItemDoCarrinho(${item.id_item_pedido})"></button>
      </li>`;
  });
  document.getElementById("lista-carrinho").innerHTML = html;
  document.getElementById("carrinho-total").textContent = formatarPreco(carrinho.valor_total);

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
}

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

// O back-end confere estoque e saldo e gera o código de retirada
async function finalizarPedido() {
  try {
    const res = await fetch(`${API_BASE_URL}/carrinho/finalizar`, { method: "POST" });
    const pedido = await res.json();
    if (!res.ok) {
      alert(pedido.erro || "Não foi possível finalizar o pedido.");
      return;
    }

    localStorage.setItem("pedidoParaAvaliar", pedido.id_pedido); // pede a avaliação quando for concluído

    bootstrap.Offcanvas.getOrCreateInstance(document.getElementById("carrinho")).hide();
    document.getElementById("pedido-feito-codigo").textContent = pedido.codigo;
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modal-pedido-feito")).show();

    alunoInf();
    carregarProdutos();
    carregarCarrinho();
    verificarPedidoAndamento();
  } catch (erro) {
    console.error("Erro ao finalizar pedido:", erro);
  }
}

// Aviso de pedido em andamento

async function verificarPedidoAndamento() {
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos/meus`);
    if (!res.ok) return;
    const pedidos = await res.json();
    const aviso = document.getElementById("aviso-pedido");
    if (pedidos.andamento.length === 0) {
      aviso.classList.add("d-none");
      return;
    }
    const pedido = pedidos.andamento[0];
    document.getElementById("aviso-pedido-texto").textContent = `Pedido ${pedido.codigo}: ${pedido.status_texto}`;
    aviso.classList.remove("d-none");
  } catch (erro) {
    console.error("Erro ao verificar pedidos:", erro);
  }
}

// Avaliação

// Se o último pedido já foi concluído, abre a janela de avaliação
async function verificarAvaliacao() {
  const id = localStorage.getItem("pedidoParaAvaliar");
  if (!id) return;
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos/${id}`);
    if (!res.ok) return;
    const pedido = await res.json();
    if (pedido.avaliado) {
      localStorage.removeItem("pedidoParaAvaliar");
      return;
    }
    if (pedido.status === "Concluído") {
      pedidoAvaliando = pedido.id_pedido;
      document.getElementById("form-avaliacao").reset();
      bootstrap.Modal.getOrCreateInstance(document.getElementById("modal-avaliacao")).show();
    }
  } catch (erro) {
    console.error("Erro ao verificar avaliação:", erro);
  }
}

document.getElementById("form-avaliacao").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nota = Number(document.getElementById("avaliacao-nota").value);
  const comentario = document.getElementById("avaliacao-comentario").value;

  try {
    const res = await fetch(`${API_BASE_URL}/pedidos/${pedidoAvaliando}/avaliacao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nota, comentario }),
    });
    localStorage.removeItem("pedidoParaAvaliar");
    bootstrap.Modal.getInstance(document.getElementById("modal-avaliacao")).hide();
    if (!res.ok) {
      const erro = await res.json();
      alert(erro.erro || "Não foi possível enviar a avaliação.");
      return;
    }
    avisar("Obrigado pela avaliação!");
  } catch (erro) {
    console.error("Erro ao avaliar:", erro);
  }
});
