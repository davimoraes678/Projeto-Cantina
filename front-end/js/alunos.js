// URL base da API
const API_BASE_URL = "/api"; // mesmo endereço da página (funciona local e no Codespaces)

// Guarda o ID do aluno/produto em edição (null = formulário está em modo "cadastrar").
let editandoProdutoId = null;

function filtrar(categoria) {
  const buscaCategoria = document.getElementById("busca-categoria");
  if (!buscaCategoria) return;
  buscaCategoria.value = categoria;
  buscarProdutos();
}

document.addEventListener("DOMContentLoaded", () => {
  // Carrega as tabelas e selects ao iniciar

  carregarProdutos();
  carregarCarrinho();
  alunoInf();

  // --- EVENTO: SUBMIT DO FORMULÁRIO DE ALUNO (cria ou edita, dependendo do modo) ---
  // --- EVENTO: SUBMIT DO FORMULÁRIO DE CADASTRO ---
  const formAluno = document.getElementById("form-aluno");
  if (formAluno) {
    formAluno.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nome = document.getElementById("aluno-nome").value;
      const email = document.getElementById("aluno-email").value;
      const senha = document.getElementById("aluno-senha").value;

      if (!senha) {
        alert("Informe uma senha para se cadastrar.");
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/alunos/registro`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, email, senha }),
        });

        if (!res.ok) {
          const erro = await res.json().catch(() => ({}));
          alert(erro.erro || "Não foi possível fazer o cadastro.");
          return;
        }

        window.location.href = "/"; // cadastrou e já está logado: vai para a cantina
      } catch (erro) {
        console.error("Erro ao cadastrar:", erro);
        alert("Ocorreu um erro ao fazer o cadastro.");
      }
    });
  }

  const formLogin = document.getElementById("form-aluno-login");
  if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("aluno-email").value;
      const senha = document.getElementById("aluno-senha").value;

      try {
        const res = await fetch(`${API_BASE_URL}/alunos/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha }),
        });

        if (!res.ok) {
          const erro = await res.json().catch(() => ({}));
          alert(erro.erro || "Não foi possível fazer login.");
          return;
        }

        window.location.href = "/";
      } catch (erro) {
        console.error("Erro ao fazer login:", erro);
        alert("Ocorreu um erro ao fazer login.");
      }
    });
  }

  // --- EVENTO: SUBMIT DO FORMULÁRIO DE PRODUTO (cria ou edita, dependendo do modo) ---
  const formProduto = document.getElementById("form-produto");
  if (formProduto) {
    formProduto.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nome = document.getElementById("produto-nome").value;
      const preco_atual = parseFloat(
        document.getElementById("produto-preco").value,
      );
      const quantidade_estoque = parseInt(
        document.getElementById("produto-estoque").value,
      );
      const categoria = document.getElementById("produto-categoria").value;
      const corpo = { nome, preco_atual, quantidade_estoque, categoria };

      try {
        // Reaproveita as rotas que já existem no backend: POST pra criar, PUT pra editar.
        const res = editandoProdutoId
          ? await fetch(`${API_BASE_URL}/produtos/${editandoProdutoId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(corpo),
            })
          : await fetch(`${API_BASE_URL}/produtos`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(corpo),
            });

        if (!res.ok) {
          const erro = await res.json().catch(() => ({}));
          alert(erro.erro || "Não foi possível salvar o produto.");
          return;
        }

        const produtoSalvo = await res.json();
        // Se o upload falhar, mantém o ID para tentar novamente sem duplicar o produto.
        editarProduto(
          produtoSalvo.id_produto,
          produtoSalvo.nome,
          produtoSalvo.preco_atual,
          produtoSalvo.quantidade_estoque,
          produtoSalvo.categoria || "",
        );
        await enviarImagem(produtoSalvo.id_produto);
        sairModoEdicaoProduto();
        carregarProdutos();
      } catch (erro) {
        console.error("Erro ao salvar produto:", erro);
        alert(erro.message || "Ocorreu um erro ao salvar o produto.");
      }
    });
  }

  // Seleciona o elemento de texto pelo ID
  const elementoContador = document.getElementById("contador");

  // Variável que guarda o valor atual
  let valorAtual = 0;

  // Função que soma ou subtrai e atualiza a tela
  function alterar(quantidade) {
    valorAtual += quantidade;
    elementoContador.innerText = valorAtual;
  }

  async function enviarImagem(idProduto) {
    const imagem = document.getElementById("imagem").files[0];

    // Permite salvar o produto sem enviar uma imagem.
    if (!imagem) return;

    const extensao = imagem.name.split(".").pop().toLowerCase();
    const nome = `produto_${idProduto}.${extensao}`;

    const dados = new FormData();
    dados.append("imagem", imagem, nome);

    // Esta rota precisa ser criada no backend.
    const resposta = await fetch(
      `${API_BASE_URL}/produtos/${idProduto}/imagem`,
      {
        method: "POST",
        body: dados,
      },
    );

    if (!resposta.ok) {
      throw new Error("O produto foi salvo, mas a imagem não foi enviada.");
    }
  }

  const btnCancelarEdicaoProduto = document.getElementById(
    "btn-cancelar-edicao-produto",
  );
  if (btnCancelarEdicaoProduto) {
    btnCancelarEdicaoProduto.addEventListener("click", sairModoEdicaoProduto);
  }

  // --- EVENTO: BUSCA/FILTRO DE PRODUTOS (usa GET /api/produtos/buscar) ---
  const formBusca = document.getElementById("form-busca-produto");
  if (formBusca) {
    formBusca.addEventListener("submit", async (e) => {
      e.preventDefault();
      buscarProdutos();
    });
  }
  const btnLimparBusca = document.getElementById("btn-limpar-busca");
  if (btnLimparBusca) {
    btnLimparBusca.addEventListener("click", () => {
      document.getElementById("busca-categoria").value = "";
      document.getElementById("busca-preco-min").value = "";
      document.getElementById("busca-preco-max").value = "";
      document.getElementById("busca-ordenar").value = "";
      carregarProdutos();
    });
  }

  // --- EVENTO: FINALIZAR PEDIDO (transforma o carrinho em pedido) ---
  const btnFinalizar = document.getElementById("btn-finalizar-pedido");
  if (btnFinalizar) {
    btnFinalizar.addEventListener("click", finalizarPedido);
  }

  // --- EVENTO: SALVAR EDIÇÃO DE PEDIDO (status / horário de retirada) ---
  const formEditarPedido = document.getElementById("form-editar-pedido");
  if (formEditarPedido) {
    formEditarPedido.addEventListener("submit", async (e) => {
      e.preventDefault();
      await salvarEdicaoPedido();
    });
  }
  const btnCancelarEdicaoPedido = document.getElementById(
    "btn-cancelar-edicao-pedido",
  );
  if (btnCancelarEdicaoPedido) {
    btnCancelarEdicaoPedido.addEventListener("click", fecharEdicaoPedido);
  }
});

// --- LÓGICA DE ALUNOS ---
// Carrega a lista de alunos para o administrador.
async function carregarAlunos() {
  try {
    const res = await fetch(`${API_BASE_URL}/alunos`);
    const alunos = await res.json();

    const tabela = document.getElementById("tabela-alunos");
    if (!tabela) return;

    if (tabela) tabela.innerHTML = "";

    alunos.forEach((aluno) => {
      if (tabela)
        tabela.innerHTML += `
                <tr>
                    <th scope="row">${aluno.id_aluno}</th>
                    <td>${aluno.nome}</td>
                    <td>${aluno.email}</td>
                    <td>R$ ${parseFloat(aluno.saldo || 0).toFixed(2)}</td>
                    <td>${aluno.funcao}</td>
                    <td>
                        <button onclick="promoverAluno(${aluno.id_aluno})">Promover</button>
                    </td>
                </tr>
            `;
    });

    // Mantém o aluno selecionado ao recarregar a lista (ex: depois de adicionar um item ao carrinho)
  } catch (erro) {
    console.error("Erro ao carregar alunos:", erro);
  }
}

async function promoverAluno(id_aluno) {
  try {
    const res = await fetch(`${API_BASE_URL}/alunos/${id_aluno}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funcao: "admin" }),
    });
    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      alert(erro.erro || "Não foi possível promover o aluno.");
      return;
    }
    carregarAlunos();
  } catch (erro) {
    console.error("Erro ao promover aluno:", erro);
  }
}

function funcaoPorAluno(funcao) {
  const admin = funcao === "admin" || funcao === "mestre";
  const mestre = funcao === "mestre";

  if (admin) {
    carregarPedidos();
  }
  if (mestre) {
    carregarAlunos();
  }

}


// Realiza o logout do aluno logado, limpando a sessão no backend e redirecionando para a tela de login.
const btnLogout = document.getElementById("btn-logout");
if (btnLogout) {
  btnLogout.addEventListener("click", async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/alunos/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        alert(erro.erro || "Não foi possível realizar o logout.");
        return;
      }

      window.location.href = "/front-end/login.html";
    } catch (erro) {
      console.error("Erro ao realizar logout:", erro);
      alert("Ocorreu um erro ao realizar o logout.");
    }
  });
}

async function removerAluno() {
  if (
    confirm(
      "Deseja realmente remover este aluno? Os pedidos que ele já fez serão mantidos no histórico.",
    )
  ) {
    const res = await fetch(`${API_BASE_URL}/alunos/atual`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      alert(erro.erro || "Não foi possível remover o aluno.");
      return;
    }
    window.location.href = "/front-end/login.html";
  }
}

// Edita os dados do aluno logado (nome, email, senha) no formulário de edição.
async function editarDados() {
  res = await fetch(`${API_BASE_URL}/alunos/atual`);
  if (!res.ok) return;
  const aluno_inf = await res.json();

  document.getElementById("form-editar-dados").innerHTML = `
        <div>
            <form>
                <input type="text" id="aluno-nome" value="${aluno_inf.nome}" placeholder="Nome do Aluno" required>
                <input type="email" id="aluno-email" value="${aluno_inf.email}" placeholder="E-mail" required>
                <input type="password" id="aluno-senha" placeholder="Senha">
                <button type="submit" id="btn-salvar-aluno">Cadastrar Aluno</button>
                <button type="button" id="btn-cancelar-edicao-aluno">Cancelar edição</button>
            </form>
            <p id="aviso-edicao-aluno">Editando aluno - deixe a senha em branco pra não alterá-la.</p>
        </div>
    `;
  document
    .getElementById("form-editar-dados")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const corpo = {
        nome: document.getElementById("aluno-nome").value,
        email: document.getElementById("aluno-email").value,
      };
      const senha = document.getElementById("aluno-senha").value;
      if (senha) corpo.senha = senha;
      resPut = await fetch(`${API_BASE_URL}/alunos/atual`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });

      window.location.reload();
    });
  document
    .getElementById("btn-cancelar-edicao-aluno")
    .addEventListener("click", () => {
      document.getElementById("form-editar-dados").innerHTML = "";
    });
}

// Mostra as informações do aluno logado
async function alunoInf() {
  const nomeEl = document.getElementById("nome-aluno");
  const emailEl = document.getElementById("email-aluno");
  const res = await fetch(`${API_BASE_URL}/alunos/atual`);
  if (!res.ok) return;
  const aluno_inf = await res.json();
  if (nomeEl) nomeEl.textContent = aluno_inf.nome;
  if (emailEl) emailEl.textContent = aluno_inf.email;

  funcaoPorAluno(aluno_inf.funcao)
}

// --- LÓGICA DE PRODUTOS ---
async function enviarImagem(idProduto) {
  const imagem = document.getElementById("imagem")?.files[0];
  if (!imagem) return;
  const dados = new FormData();
  dados.append("imagem", imagem);
  const res = await fetch(`${API_BASE_URL}/produtos/${idProduto}/imagem`, {
    method: "POST",
    body: dados,
  });
  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error(
      `O produto foi salvo, mas a imagem não: ${erro.erro || "falha no envio"}. Tente salvar novamente.`,
    );
  }
}

async function carregarProdutos() {
  await buscarProdutos({}); // sem filtros = lista tudo, via a mesma rota de busca
}

// Busca/filtra/ordena produtos usando a rota GET /api/produtos/buscar.
async function buscarProdutos(filtrosForcados) {
  const categoriaEl = document.getElementById("busca-categoria");
  const precoMinEl = document.getElementById("busca-preco-min");
  const precoMaxEl = document.getElementById("busca-preco-max");
  const ordenarEl = document.getElementById("busca-ordenar");

  const params = new URLSearchParams();
  const filtros = filtrosForcados || {
    categoria: categoriaEl ? categoriaEl.value : "",
    preco_min: precoMinEl ? precoMinEl.value : "",
    preco_max: precoMaxEl ? precoMaxEl.value : "",
    ordenar: ordenarEl ? ordenarEl.value : "",
  };

  if (filtros.categoria) params.set("categoria", filtros.categoria);
  if (filtros.preco_min) params.set("preco_min", filtros.preco_min);
  if (filtros.preco_max) params.set("preco_max", filtros.preco_max);
  if (filtros.ordenar) params.set("ordenar", filtros.ordenar);

  try {
    const res = await fetch(
      `${API_BASE_URL}/produtos/buscar?${params.toString()}`,
    );
    const dados = await res.json();

    if (!res.ok) {
      // O backend devolve {"erro": "..."} quando algo dá errado - mostra pro usuário
      // em vez de deixar a tela de produtos simplesmente parecer "não funcionando".
      alert(dados.erro || "Não foi possível buscar os produtos.");
      return;
    }

    const produtos = dados;
    const tabela = document.getElementById("tabela-produtos");
    const tabela_admin = document.getElementById("tabela-produtos-admin");
    if (!tabela && !tabela_admin) return;

    if (tabela) tabela.innerHTML = "";
    if (tabela_admin) tabela_admin.innerHTML = "";

    if (produtos.length === 0) {
      if (tabela) {
        tabela.innerHTML = `
                <tr><td colspan="5">Nenhum produto encontrado.</td></tr>
            `;
      }
      if (tabela_admin) {
        tabela_admin.innerHTML = `
                <tr><td colspan="6">Nenhum produto encontrado.</td></tr>
            `;
      }
    }
    if (tabela) {
      produtos.forEach((prod) => {
        tabela.innerHTML += `
                <div class="card" style="width: 18rem;">
  <div class="card-body">
    <img src="${API_BASE_URL}/produtos/${prod.id_produto}/imagem"
            alt="Imagem do produto" width="80" loading="lazy"
            onerror="this.hidden = true">
    <h5 class="mt-2 mb-0">${prod.nome}</h5>
    <h4 class="mt-0 mb-2">R$ ${parseFloat(prod.preco_atual).toFixed(2)}</h4>
    <p class="card-text fg-2">${prod.descricao}</p>
    <button type="button" class="btn btn-primary" onclick="adicionarItemAoCarrinho(${prod.id_produto})">Adicionar ao pedido</button>
            <input type="number" id="qtd-produto-${prod.id_produto}" value="1" min="1" style="width: 70px; min-width: 70px;">

    </div>
</div>
            `;
      });
    }
    if (tabela_admin) {
      produtos.forEach((prod) => {
        tabela_admin.innerHTML += `
                <tr>
                    <td>${prod.id_produto}</td>
                    <td>
                        <img src="${API_BASE_URL}/produtos/${prod.id_produto}/imagem"
                             alt="Imagem do produto" width="80" loading="lazy"
                             onerror="this.hidden = true">
                        ${prod.nome}
                    </td>
                    <td>R$ ${parseFloat(prod.preco_atual).toFixed(2)}</td>
                    <td>${prod.quantidade_estoque}</td>
                    <td>${prod.categoria || ""}</td>
                    <td>
                        <button class="editar" onclick="editarProduto(${prod.id_produto}, '${escapeAttr(prod.nome)}', ${prod.preco_atual}, ${prod.quantidade_estoque}, '${escapeAttr(prod.categoria || "")}')">Editar</button>
                        <button class="excluir" onclick="removerProduto(${prod.id_produto})">Excluir</button>
                    </td>
                </tr>
            `;
      });
    }
  } catch (erro) {
    console.error("Erro ao buscar produtos:", erro);
    alert(
      "Ocorreu um erro ao buscar os produtos. Veja o console para detalhes.",
    );
  }
}

function editarProduto(id, nome, preco, estoque, categoria) {
  editandoProdutoId = id;
  document.getElementById("produto-nome").value = nome;
  document.getElementById("produto-preco").value = preco;
  document.getElementById("produto-estoque").value = estoque;
  document.getElementById("produto-categoria").value = categoria;
  document.getElementById("btn-salvar-produto").textContent = "Salvar Edição";
  document.getElementById("btn-cancelar-edicao-produto").style.display =
    "inline-block";
  document
    .getElementById("produto-nome")
    .scrollIntoView({ behavior: "smooth", block: "center" });
}

function sairModoEdicaoProduto() {
  editandoProdutoId = null;
  document.getElementById("form-produto").reset();
  document.getElementById("btn-salvar-produto").textContent =
    "Cadastrar Produto";
  document.getElementById("btn-cancelar-edicao-produto").style.display = "none";
}

async function removerProduto(id) {
  if (
    confirm(
      "Deseja realmente remover este produto? Os pedidos que já o incluem serão mantidos no histórico.",
    )
  ) {
    const res = await fetch(`${API_BASE_URL}/produtos/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      alert(erro.erro || "Não foi possível remover o produto.");
      return;
    }
    if (editandoProdutoId === id) sairModoEdicaoProduto();
    carregarProdutos();
    carregarPedidos();
  }
}

// LOGICA DO LOGIN DO USUARIO

// --- LÓGICA DO CARRINHO (permite adicionar vários produtos a um mesmo pedido) ---
// Grava o produto como ItemPedido no carrinho (pedido "Carrinho") do aluno.
async function adicionarItemAoCarrinho(id_produto) {
  const inputQuantidade = document.getElementById(`qtd-produto-${id_produto}`);
  const quantidade = parseInt(inputQuantidade.value);
  if (!quantidade || quantidade < 1) {
    alert("Informe uma quantidade válida.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/carrinho/itens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_produto, quantidade }),
    });
    const dados = await res.json();
    if (!res.ok) {
      alert(dados.erro || "Não foi possível adicionar o produto.");
      return;
    }
    inputQuantidade.value = 1;
    renderizarCarrinho(dados);
  } catch (erro) {
    console.error("Erro ao adicionar item:", erro);
    alert("Ocorreu um erro ao adicionar o produto.");
  }
}

async function removerItemDoCarrinho(id_item_pedido) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/carrinho/itens/${id_item_pedido}`,
      { method: "DELETE" },
    );
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

// Busca o carrinho do aluno logado no backend.
async function carregarCarrinho() {
  if (!document.getElementById("tabela-carrinho")) return; // página sem carrinho
  try {
    const res = await fetch(`${API_BASE_URL}/carrinho`);
    renderizarCarrinho(res.ok ? await res.json() : null);
  } catch (erro) {
    console.error("Erro ao carregar carrinho:", erro);
  }
}

function renderizarCarrinho(carrinho) {
  const tabela = document.getElementById("tabela-carrinho");
  const totalEl = document.getElementById("carrinho-total");
  if (!tabela || !totalEl) return;

  const itens = carrinho ? carrinho.itens : [];
  tabela.innerHTML = "";
  itens.forEach((item) => {
    tabela.innerHTML += `
            <tr>
                <td>${item.produto_nome}</td>
                <td>${item.quantidade}</td>
                <td>R$ ${item.subtotal.toFixed(2)}</td>
                <td><button class="excluir" onclick="removerItemDoCarrinho(${item.id_item_pedido})">Remover</button></td>
            </tr>
        `;
  });

  const total = carrinho ? carrinho.valor_total : 0;
  totalEl.textContent = `Total: R$ ${total.toFixed(2)}`;
}

async function finalizarPedido() {
  try {
    const res = await fetch(`${API_BASE_URL}/carrinho/finalizar`, {
      method: "POST",
    });
    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      alert(erro.erro || "Não foi possível finalizar o pedido.");
      return;
    }
    carregarCarrinho();
    carregarPedidos();
  } catch (erro) {
    console.error("Erro ao finalizar pedido:", erro);
    alert("Ocorreu um erro ao finalizar o pedido.");
  }
}

// --- LÓGICA DE PEDIDOS ---
let pedidosCache = [];

async function carregarPedidos() {
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos`);
    const pedidos = await res.json();
    pedidosCache = pedidos;
    const tabela = document.getElementById("tabela-pedidos");
    if (!tabela) return;

    tabela.innerHTML = "";

    pedidos.forEach((ped) => {
      const listaProdutos = ped.itens
        .map((item) => `${item.quantidade}x ${item.produto_nome}`)
        .join(", ");

      const botaoConcluir =
        ped.status !== "Concluído"
          ? `<button class="concluir" onclick="concluirPedido(${ped.id_pedido})">Concluir</button>`
          : "";

      tabela.innerHTML += `
                <tr>
                    <td>${ped.id_pedido}</td>
                    <td>${ped.aluno_nome}</td>
                    <td>${listaProdutos}</td>
                    <td>${ped.status}</td>
                    <td>R$ ${parseFloat(ped.valor_total).toFixed(2)}</td>
                    <td>
                        <button class="editar" onclick="editarPedido(${ped.id_pedido})">Editar</button>
                        ${botaoConcluir}
                    </td>
                </tr>
            `;
    });
  } catch (erro) {
    console.error("Erro ao carregar pedidos:", erro);
  }
}

function editarPedido(id) {
  const pedido = pedidosCache.find((p) => p.id_pedido === id);
  if (!pedido) return;

  document.getElementById("editar-pedido-id").value = pedido.id_pedido;
  document.getElementById("editar-pedido-status").value = pedido.status;

  // datetime-local espera "YYYY-MM-DDTHH:MM", sem os segundos/timezone do ISO vindo do backend
  const horarioInput = document.getElementById("editar-pedido-horario");
  horarioInput.value = pedido.horario_agendado_retirada
    ? pedido.horario_agendado_retirada.slice(0, 16)
    : "";

  document.getElementById("form-editar-pedido").style.display = "flex";
  document
    .getElementById("form-editar-pedido")
    .scrollIntoView({ behavior: "smooth", block: "center" });
}

function fecharEdicaoPedido() {
  document.getElementById("form-editar-pedido").style.display = "none";
  document.getElementById("form-editar-pedido").reset();
}

async function salvarEdicaoPedido() {
  const id = document.getElementById("editar-pedido-id").value;
  const status = document.getElementById("editar-pedido-status").value;
  const horario = document.getElementById("editar-pedido-horario").value;

  try {
    const res = await fetch(`${API_BASE_URL}/pedidos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        horario_agendado_retirada: horario || null,
      }),
    });

    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      alert(erro.erro || "Não foi possível salvar o pedido.");
      return;
    }

    fecharEdicaoPedido();
    carregarPedidos();
  } catch (erro) {
    console.error("Erro ao salvar pedido:", erro);
    alert("Ocorreu um erro ao salvar o pedido.");
  }
}

async function concluirPedido(id) {
  if (confirm("Deseja realmente marcar este pedido como concluído?")) {
    const dialogAvaliacao = document.getElementById("pedido-avaliacao")
    dialogAvaliacao.innerHTML = `
      
    `;
    
    const formAvaliacao = document.getElementById("form-avaliacao");
    if (formAvaliacao) {
      formAvaliacao.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nota = document.getElementById("avaliacao-nota").value;
        const comentario = document.getElementById(
          "avaliacao-comentario",
        ).value;

        try {
          const res = await fetch(`${API_BASE_URL}/pedidos/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nota, comentario }),
          });

          if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            alert(erro.erro || "Não foi possível fazer o cadastro.");
            return;
          }

          window.location.href = "/"; // cadastrou e já está logado: vai para a cantina
        } catch (erro) {
          console.error("Erro ao avaliar:", erro);
          alert("Ocorreu um erro ao fazer a avaliação.");
        }
      });
    }

    try {
      await fetch(`${API_BASE_URL}/pedidos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Concluído" }),
      });

      carregarPedidos();
    } catch (erro) {
      console.error("Erro ao concluir pedido:", erro);
      alert("Ocorreu um erro ao atualizar o status do pedido.");
    }
  }
}

// --- UTIL ---
// Escapa aspas simples pra não quebrar o HTML gerado nos onclick com nome/email do aluno.
function escapeAttr(texto) {
  return String(texto).replace(/'/g, "\\'");
}
