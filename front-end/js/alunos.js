// =============================================================================
// alunos.js: TODO o JavaScript do site. É carregado por todas as páginas.
//
// Como um arquivo só atende todas as páginas: cada função primeiro procura os
// elementos dela (getElementById). Se não achar, a página não tem aquela parte
// e a função não faz nada (ex.: o login não tem carrinho).
//
// Padrão das chamadas à API:
//   fetch(url, { method, headers, body })  -> envia a requisição
//   res.ok                                 -> true se o back-end respondeu 2xx
//   await res.json()                       -> lê a resposta (JSON) como objeto
//   erro.erro                              -> mensagem de erro que o back-end manda
// =============================================================================

// URL base da API
const API_BASE_URL = "/api"; // mesmo endereço da página (funciona local e no Codespaces)

// Guarda o ID do aluno/produto em edição (null = formulário está em modo "cadastrar").
let editandoProdutoId = null;

// Botões de categoria do index (Todos, Salgados, Bebidas, Doces): guarda a
// categoria no campo escondido #busca-categoria e refaz a busca de produtos.
function filtrar(categoria) {
  const buscaCategoria = document.getElementById("busca-categoria");
  if (!buscaCategoria) return;
  buscaCategoria.value = categoria;
  buscarProdutos();
}

// =============================================================================
// AO ABRIR A PÁGINA
// O DOMContentLoaded roda quando o HTML terminou de carregar: aqui buscamos os
// dados na API e ligamos os formulários e botões aos seus eventos.
// =============================================================================
document.addEventListener("DOMContentLoaded", () => {
  // Carrega os dados da página. Cada função sai sozinha se a página não tiver a parte dela.

  carregarProdutos(); // cards (index) ou tabela de produtos (admin)
  carregarCarrinho(); // painel do carrinho (index)
  alunoInf(); // nome/e-mail/saldo e o que aparece para admin e mestre
  carregarCombinacoes(); // "Combinações mais pedidas" (index)
  verificarAvaliacao(); // abre a janela de avaliação se o último pedido foi concluído

  // --- EVENTO: SUBMIT DO FORMULÁRIO DE CADASTRO (cadastro.html) ---
  // Envia nome, e-mail e senha para POST /alunos/registro. O back-end já faz o
  // login, então em caso de sucesso vai direto para a cantina.
  const formAluno = document.getElementById("form-aluno");
  if (formAluno) {
    formAluno.addEventListener("submit", async (e) => {
      e.preventDefault(); // impede o navegador de recarregar a página ao enviar o form
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

  // --- EVENTO: SUBMIT DO FORMULÁRIO DE LOGIN (login.html) ---
  // POST /alunos/login. O back-end grava o login num cookie; depois vai para a cantina.
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

        window.location.href = "/"; // logado: vai para a cantina
      } catch (erro) {
        console.error("Erro ao fazer login:", erro);
        alert("Ocorreu um erro ao fazer login.");
      }
    });
  }

  // --- EVENTO: SUBMIT DO FORMULÁRIO DE PRODUTO (admin.html, só mestre) ---
  // Se editandoProdutoId for null, cria (POST); se tiver um id, edita (PUT).
  // Depois de salvar os dados, envia a imagem (se foi escolhida uma).
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
      const corpo = { nome, preco_atual, quantidade_estoque, categoria }; // o que vai para a API

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
        sairModoEdicaoProduto(); // limpa o formulário e volta ao modo "cadastrar"
        carregarProdutos(); // atualiza a tabela
      } catch (erro) {
        console.error("Erro ao salvar produto:", erro);
        alert(erro.message || "Ocorreu um erro ao salvar o produto.");
      }
    });
  }

  // ATENÇÃO: o contador abaixo (#contador / alterar) não é usado por nenhuma página.
  // Seleciona o elemento de texto pelo ID
  const elementoContador = document.getElementById("contador");

  // Variável que guarda o valor atual
  let valorAtual = 0;

  // Função que soma ou subtrai e atualiza a tela
  function alterar(quantidade) {
    valorAtual += quantidade;
    elementoContador.innerText = valorAtual;
  }

  // Envia a imagem escolhida em #imagem para POST /produtos/<id>/imagem.
  // Como está dentro do DOMContentLoaded, é ESTA versão que o formulário de produto
  // usa (existe outra igual, fora daqui, na parte de produtos).
  async function enviarImagem(idProduto) {
    const imagem = document.getElementById("imagem").files[0];

    // Permite salvar o produto sem enviar uma imagem.
    if (!imagem) return;

    const extensao = imagem.name.split(".").pop().toLowerCase();
    const nome = `produto_${idProduto}.${extensao}`;

    // FormData = formulário com arquivo (multipart), que é como uma imagem vai para a API
    const dados = new FormData();
    dados.append("imagem", imagem, nome);

    // (O back-end troca o nome do arquivo pelo nome do produto ao salvar.)
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

  // Botão "Cancelar edição" do formulário de produto
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
  // Botão "Limpar": apaga os filtros e mostra todos os produtos de novo
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

  // --- EVENTO: RECARGA DA CARTEIRA (carteira.html) ---
  // Envia o valor para POST /alunos/atual/recarga com {valor}; o back-end soma ao
  // saldo e recusa valores fora de R$ 0,01 a R$ 500,00.
  const formRecarga = document.getElementById("form-recarga");
  if (formRecarga) {
    formRecarga.addEventListener("submit", async (e) => {
      e.preventDefault();
      const valor = parseFloat(document.getElementById("recarga-valor").value);
      try {
        const res = await fetch(`${API_BASE_URL}/alunos/atual/recarga`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ valor }),
        });
        if (!res.ok) {
          const erro = await res.json().catch(() => ({}));
          alert(erro.erro || "Não foi possível adicionar o saldo.");
          return;
        }
        formRecarga.reset();
        alunoInf(); // mostra o saldo novo
      } catch (erro) {
        console.error("Erro ao adicionar saldo:", erro);
        alert("Ocorreu um erro ao adicionar o saldo.");
      }
    });
  }

  // --- EVENTO: ENVIAR AVALIAÇÃO DO ÚLTIMO PEDIDO (janela do index) ---
  // O número do pedido vem do localStorage (guardado pelo finalizarPedido).
  // POST /pedidos/<id>/avaliacao com {nota, comentario}; o back-end só aceita o dono do
  // pedido e uma avaliação por pedido.
  const formAvaliacao = document.getElementById("form-avaliacao");
  if (formAvaliacao) {
    formAvaliacao.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = localStorage.getItem("pedidoParaAvaliar");
      const nota = parseInt(document.getElementById("avaliacao-nota").value);
      const comentario = document.getElementById("avaliacao-comentario").value;
      try {
        const res = await fetch(`${API_BASE_URL}/pedidos/${id}/avaliacao`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nota, comentario }),
        });
        // Avaliado (ou não dá mais para avaliar): não pergunta de novo
        localStorage.removeItem("pedidoParaAvaliar");
        bootstrap.Modal.getInstance(document.getElementById("modal-avaliacao")).hide(); // fecha a janela
        if (!res.ok) {
          const erro = await res.json().catch(() => ({}));
          alert(erro.erro || "Não foi possível enviar a avaliação.");
          return;
        }
        alert("Obrigado pela avaliação!");
      } catch (erro) {
        console.error("Erro ao avaliar:", erro);
        alert("Ocorreu um erro ao enviar a avaliação.");
      }
    });
  }
});

// =============================================================================
// ALUNOS
// =============================================================================

// Monta a tabela de alunos do admin.html (#tabela-alunos). Só é chamada para o
// mestre (ver funcaoPorAluno); a rota GET /alunos também só responde ao mestre.
async function carregarAlunos() {
  try {
    const res = await fetch(`${API_BASE_URL}/alunos`);
    const alunos = await res.json();

    const tabela = document.getElementById("tabela-alunos");
    if (!tabela) return;

    if (tabela) tabela.innerHTML = "";

    alunos.forEach((aluno) => {
      // O mestre não pode ser promovido nem excluído: a coluna de ações fica vazia
      const acoes = aluno.funcao === "mestre" ? "" : `
                        <button onclick="promoverAluno(${aluno.id_aluno})">Promover</button>
                        <button class="excluir" onclick="excluirAluno(${aluno.id_aluno})">Excluir</button>`;

      if (tabela)
        tabela.innerHTML += `
                <tr>
                    <th scope="row">${aluno.id_aluno}</th>
                    <td>${aluno.nome}</td>
                    <td>${aluno.email}</td>
                    <td>R$ ${parseFloat(aluno.saldo || 0).toFixed(2)}</td>
                    <td>${aluno.funcao}</td>
                    <td>${acoes}
                    </td>
                </tr>
            `;
    });

  } catch (erro) {
    console.error("Erro ao carregar alunos:", erro);
  }
}

// Botão "Promover" da tabela de alunos: PUT /alunos/<id> torna o aluno admin
// (só o mestre pode). Depois recarrega a tabela para mostrar a nova função.
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

// Botão "Excluir" da tabela de alunos (só o mestre): DELETE /alunos/<id>, depois
// de confirmar. Os pedidos do aluno continuam no histórico com o nome guardado.
async function excluirAluno(id_aluno) {
  if (!confirm("Deseja realmente excluir este aluno?")) return;
  try {
    const res = await fetch(`${API_BASE_URL}/alunos/${id_aluno}`, { method: "DELETE" });
    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      alert(erro.erro || "Não foi possível excluir o aluno.");
      return;
    }
    carregarAlunos();
  } catch (erro) {
    console.error("Erro ao excluir aluno:", erro);
  }
}

// Mostra na tela o que cada função pode ver e carrega os dados dela:
//   aluno  -> nada extra
//   admin  -> elementos .so-admin (ex.: link "Administrador") + tabela de pedidos
//   mestre -> tudo do admin + elementos .so-mestre (alunos e produtos no admin.html)
// Isso só esconde da tela: quem bloqueia de verdade é o back-end (@admin_required etc.).
function funcaoPorAluno(funcao) {
  const admin = funcao === "admin" || funcao === "mestre";
  const mestre = funcao === "mestre";

  // Elementos com a classe so-admin / so-mestre começam escondidos no HTML
  if (admin) {
    document.querySelectorAll(".so-admin").forEach((el) => (el.style.display = ""));
    carregarPedidos();
  }
  if (mestre) {
    document.querySelectorAll(".so-mestre").forEach((el) => (el.style.display = ""));
    carregarAlunos();
  }

}


// Realiza o logout do aluno logado, limpando a sessão no backend e redirecionando para a tela de login.
// Fica fora do DOMContentLoaded porque o <script> está no fim do <body>: o botão já existe aqui.
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

      localStorage.removeItem("pedidoParaAvaliar"); // outro aluno pode entrar neste navegador
      window.location.href = "/front-end/login.html";
    } catch (erro) {
      console.error("Erro ao realizar logout:", erro);
      alert("Ocorreu um erro ao realizar o logout.");
    }
  });
}

// Botão "Remover minha conta" (conta.html): DELETE /alunos/atual apaga o aluno
// logado. Os pedidos dele continuam no histórico com o nome guardado.
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

// Botão "Editar Dados" (conta.html): monta um formulário dentro de
// #form-editar-dados já preenchido com os dados atuais. Ao enviar, manda
// PUT /alunos/atual (senha em branco = não troca) e recarrega a página.
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

// Mostra as informações do aluno logado (GET /alunos/atual) nos elementos que
// a página tiver: #nome-aluno, #email-aluno e #saldo-aluno. Depois chama o
// funcaoPorAluno para mostrar o que é de admin/mestre.
async function alunoInf() {
  const nomeEl = document.getElementById("nome-aluno");
  const emailEl = document.getElementById("email-aluno");
  const saldoEl = document.getElementById("saldo-aluno");
  const res = await fetch(`${API_BASE_URL}/alunos/atual`);
  if (!res.ok) return;
  const aluno_inf = await res.json();
  if (nomeEl) nomeEl.textContent = aluno_inf.nome;
  if (emailEl) emailEl.textContent = aluno_inf.email;
  if (saldoEl) saldoEl.textContent = parseFloat(aluno_inf.saldo || 0).toFixed(2);

  funcaoPorAluno(aluno_inf.funcao)
}

// Botões + R$ 5 / 10 / 20 da carteira: soma ao valor que já está no campo (até R$ 500).
function somarRecarga(valor) {
  const campo = document.getElementById("recarga-valor");
  const atual = parseFloat(campo.value) || 0; // campo vazio vira 0
  campo.value = Math.min(atual + valor, 500).toFixed(2);
}

// =============================================================================
// PRODUTOS
// =============================================================================

// Versão "global" do envio de imagem. O formulário de produto usa a versão de
// dentro do DOMContentLoaded (as duas fazem a mesma coisa).
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

// Lista todos os produtos (sem filtro).
async function carregarProdutos() {
  await buscarProdutos({}); // sem filtros = lista tudo, via a mesma rota de busca
}

// Busca/filtra/ordena produtos usando a rota GET /api/produtos/buscar.
// Lê os filtros da tela (ou usa os de filtrosForcados) e monta:
//   - cards em #tabela-produtos (index.html), com botão "Adicionar ao pedido"
//   - linhas em #tabela-produtos-admin (admin.html), com Editar/Excluir
async function buscarProdutos(filtrosForcados) {
  const categoriaEl = document.getElementById("busca-categoria");
  const precoMinEl = document.getElementById("busca-preco-min");
  const precoMaxEl = document.getElementById("busca-preco-max");
  const ordenarEl = document.getElementById("busca-ordenar");

  // URLSearchParams monta a parte "?categoria=...&preco_max=..." da URL
  const params = new URLSearchParams();
  const filtros = filtrosForcados || {
    categoria: categoriaEl ? categoriaEl.value : "",
    preco_min: precoMinEl ? precoMinEl.value : "",
    preco_max: precoMaxEl ? precoMaxEl.value : "",
    ordenar: ordenarEl ? ordenarEl.value : "",
  };

  // Só envia os filtros preenchidos
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

    // Nenhum resultado: mostra o aviso
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
    // index.html: um card por produto. A imagem some (onerror) se o produto não tiver foto.
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
    <p class="card-text text-body-secondary">${prod.categoria || ""}</p>
    <button type="button" class="btn btn-primary" onclick="adicionarItemAoCarrinho(${prod.id_produto})">Adicionar ao pedido</button>
            <input type="number" id="qtd-produto-${prod.id_produto}" value="1" min="1" style="width: 70px; min-width: 70px;">

    </div>
</div>
            `;
      });
    }
    // admin.html: uma linha por produto. O escapeAttr evita que uma aspa no nome quebre o onclick.
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

// Botão "Editar" de um produto: preenche o formulário com os dados dele e
// entra no "modo edição" (o próximo envio do formulário faz PUT em vez de POST).
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

// Volta o formulário de produto para o modo "cadastrar" e limpa os campos.
function sairModoEdicaoProduto() {
  editandoProdutoId = null;
  document.getElementById("form-produto").reset();
  document.getElementById("btn-salvar-produto").textContent =
    "Cadastrar Produto";
  document.getElementById("btn-cancelar-edicao-produto").style.display = "none";
}

// Botão "Excluir" de um produto: DELETE /produtos/<id>, depois de confirmar.
// Os pedidos antigos continuam mostrando o nome do produto.
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

// =============================================================================
// CARRINHO
// O carrinho fica no back-end: é um pedido com status "Carrinho" do aluno logado.
// Toda rota do carrinho devolve o carrinho inteiro, que o renderizarCarrinho desenha.
// =============================================================================

// Botão "Adicionar ao pedido" de um card: lê a quantidade do campo ao lado e
// grava o produto no carrinho (POST /carrinho/itens). Se já estiver lá, soma.
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
    inputQuantidade.value = 1; // volta o campo de quantidade para 1
    renderizarCarrinho(dados);
    // Acha o produto no carrinho só para pegar o nome e mostrar no aviso
    const item = dados.itens.find((i) => i.id_produto === id_produto);
    avisarCarrinho(`${quantidade}x ${item.produto_nome} adicionado ao carrinho`);
  } catch (erro) {
    console.error("Erro ao adicionar item:", erro);
    alert("Ocorreu um erro ao adicionar o produto.");
  }
}

// Botão "Remover" de uma linha do carrinho: DELETE /carrinho/itens/<id>.
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

// Desenha o carrinho no painel: uma linha por item e o total.
// carrinho = null (ex.: erro ao carregar) mostra o carrinho vazio.
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

// Botão "Finalizar Pedido": POST /carrinho/finalizar. O back-end confere estoque
// e saldo, desconta os dois e transforma o carrinho em pedido "Pendente".
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
    const pedido = await res.json();
    localStorage.setItem("pedidoParaAvaliar", pedido.id_pedido); // pede a avaliação quando for concluído
    carregarCarrinho();
    alunoInf(); // o saldo diminuiu
  } catch (erro) {
    console.error("Erro ao finalizar pedido:", erro);
    alert("Ocorreu um erro ao finalizar o pedido.");
  }
}

// Botão "Repetir último pedido" (painel do carrinho): POST /carrinho/repetir
// coloca no carrinho os mesmos produtos e quantidades do último pedido.
async function repetirUltimoPedido() {
  try {
    const res = await fetch(`${API_BASE_URL}/carrinho/repetir`, { method: "POST" });
    const dados = await res.json();
    if (!res.ok) {
      alert(dados.erro || "Não foi possível repetir o último pedido.");
      return;
    }
    renderizarCarrinho(dados);
    avisarCarrinho("Itens do último pedido adicionados ao carrinho");
  } catch (erro) {
    console.error("Erro ao repetir pedido:", erro);
  }
}

// =============================================================================
// COMBINAÇÕES MAIS PEDIDAS (index.html)
// =============================================================================

// Busca as 3 duplas de produtos mais pedidas juntas (GET /pedidos/combinacoes)
// e monta um botão para cada uma: "Coxinha + Refri 2x".
async function carregarCombinacoes() {
  const lista = document.getElementById("lista-combinacoes");
  if (!lista) return; // página sem combinações
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos/combinacoes`);
    if (!res.ok) return;
    const combinacoes = await res.json();
    lista.innerHTML = "";
    combinacoes.forEach((combo) => {
      const nomes = combo.produtos.map((p) => p.nome).join(" + "); // "Coxinha + Refri"
      const ids = combo.produtos.map((p) => p.id_produto).join(", "); // "1, 2" -> vai no onclick
      lista.innerHTML += `
                <button class="btn btn-outline-primary" onclick="adicionarCombinacao([${ids}])">
                    ${nomes} <span class="badge text-bg-secondary">${combo.vezes}x</span>
                </button>
            `;
    });
    // A seção começa escondida no HTML; só aparece se houver alguma combinação
    if (combinacoes.length) document.getElementById("secao-combinacoes").style.display = "";
  } catch (erro) {
    console.error("Erro ao carregar combinações:", erro);
  }
}

// Clique numa combinação: adiciona 1 de cada produto ao carrinho, usando a
// mesma rota do "Adicionar ao pedido" (POST /carrinho/itens), um por vez.
async function adicionarCombinacao(ids) {
  for (const id_produto of ids) {
    const res = await fetch(`${API_BASE_URL}/carrinho/itens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_produto, quantidade: 1 }),
    });
    const dados = await res.json();
    if (!res.ok) {
      alert(dados.erro || "Não foi possível adicionar a combinação.");
      return;
    }
    renderizarCarrinho(dados);
  }
  avisarCarrinho("Combinação adicionada ao carrinho");
}

// Mostra o aviso (toast do Bootstrap) de que algo entrou no carrinho.
// O toast fica no index.html (#toast-carrinho) e some sozinho depois de 5 segundos.
function avisarCarrinho(mensagem) {
  document.getElementById("toast-carrinho-texto").textContent = mensagem;
  bootstrap.Toast.getOrCreateInstance(document.getElementById("toast-carrinho")).show();
}

// =============================================================================
// PEDIDOS (admin.html e historico.html; só admin e mestre)
// =============================================================================

// Busca todos os pedidos (GET /pedidos) e monta #tabela-pedidos:
//   admin.html     -> só os em andamento, com Concluir/Cancelar (ordem de chegada)
//   historico.html -> só os concluídos e cancelados, com a data (mais recente primeiro)
async function carregarPedidos() {
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos`);
    const pedidos = await res.json();
    const tabela = document.getElementById("tabela-pedidos");
    if (!tabela) return;

    tabela.innerHTML = "";

    // historico.html mostra os finalizados (mais recente primeiro); admin.html, os em andamento
    const historico = tabela.dataset.historico === "sim"; // lê o data-historico="sim" do HTML
    const lista = pedidos.filter(
      (ped) => ["Concluído", "Cancelado"].includes(ped.status) === historico,
    );
    if (historico) lista.reverse();

    lista.forEach((ped) => {
      // "2x Coxinha, 1x Refri"
      const listaProdutos = ped.itens
        .map((item) => `${item.quantidade}x ${item.produto_nome}`)
        .join(", ");

      // Última coluna: a data no histórico, os botões no admin

      const ultimaColuna = historico
        ? new Date(ped.data_hora_criacao).toLocaleString("pt-BR")
        : `<button class="concluir" onclick="concluirPedido(${ped.id_pedido})">Concluir</button>
           <button class="excluir" onclick="cancelarPedido(${ped.id_pedido})">Cancelar</button>`;

      tabela.innerHTML += `
                <tr>
                    <td>${ped.id_pedido}</td>
                    <td>${ped.aluno_nome}</td>
                    <td>${listaProdutos}</td>
                    <td>${ped.status}</td>
                    <td>R$ ${parseFloat(ped.valor_total).toFixed(2)}</td>
                    <td>${ultimaColuna}</td>
                </tr>
            `;
    });
  } catch (erro) {
    console.error("Erro ao carregar pedidos:", erro);
  }
}

// Botão "Concluir": POST /pedidos/<id>/concluir marca o pedido como "Concluído".
// O pedido sai da tabela do admin e vai para o histórico; a avaliação é pedida
// ao aluno quando ele abrir a cantina (ver verificarAvaliacao).
async function concluirPedido(id) {
  if (!confirm("Deseja realmente marcar este pedido como concluído?")) return;
  await mudarPedido(id, "concluir");
}

// Botão "Cancelar": POST /pedidos/<id>/cancelar. O back-end devolve o valor para
// a carteira do aluno e os produtos para o estoque.
async function cancelarPedido(id) {
  if (!confirm("Cancelar este pedido? O valor volta para a carteira do aluno.")) return;
  await mudarPedido(id, "cancelar");
}

// Chama a rota de concluir ou cancelar e recarrega as tabelas.
async function mudarPedido(id, acao) {
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos/${id}/${acao}`, { method: "POST" });
    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      alert(erro.erro || "Não foi possível atualizar o pedido.");
      return;
    }
    // O alunoInf recarrega os pedidos e, para o mestre, a tabela de alunos
    // (o cancelamento devolve saldo, então o saldo do aluno muda)
    alunoInf();
  } catch (erro) {
    console.error("Erro ao atualizar pedido:", erro);
    alert("Ocorreu um erro ao atualizar o pedido.");
  }
}

// =============================================================================
// AVALIAÇÃO (lado do aluno, index.html)
// =============================================================================

// Se o último pedido do aluno já foi concluído, abre a janela de avaliação.
// O número do pedido foi guardado no localStorage (memória do navegador) pelo
// finalizarPedido; ele é apagado depois de avaliar ou no logout.
async function verificarAvaliacao() {
  const id = localStorage.getItem("pedidoParaAvaliar");
  const modal = document.getElementById("modal-avaliacao");
  if (!id || !modal) return;
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos/${id}`);
    if (!res.ok) return;
    const pedido = await res.json();
    if (pedido.status === "Concluído") bootstrap.Modal.getOrCreateInstance(modal).show();
  } catch (erro) {
    console.error("Erro ao verificar avaliação:", erro);
  }
}

// =============================================================================
// UTIL
// =============================================================================
// Escapa aspas simples pra não quebrar o HTML gerado nos onclick com nome/email do aluno.
function escapeAttr(texto) {
  return String(texto).replace(/'/g, "\\'");
}
