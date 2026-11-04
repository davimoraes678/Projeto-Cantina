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
//
// O <script> é carregado com "defer": roda depois que o HTML terminou de ser lido
// e depois do JavaScript do Bootstrap (que também é "defer" e vem antes).
// =============================================================================

// URL base da API
const API_BASE_URL = "/api"; // mesmo endereço da página (funciona local e no Codespaces)

// Guarda o ID do produto em edição (null = formulário está em modo "cadastrar").
let editandoProdutoId = null;

// Saldo do aluno logado (o carrinho usa para avisar quando não dá para pagar).
let saldoAtual = 0;

// Última lista de produtos recebida da API: a busca pelo nome filtra em cima dela,
// sem precisar chamar a API a cada letra digitada.
let produtosCarregados = [];

// Pedido que a janela de avaliação está avaliando.
let pedidoAvaliando = null;

// Botões de categoria do cardápio (Tudo, Salgados, Bebidas, Doces): guarda a
// categoria no campo escondido #busca-categoria, marca o botão escolhido e
// refaz a busca de produtos.
function filtrar(categoria) {
  const buscaCategoria = document.getElementById("busca-categoria");
  if (!buscaCategoria) return;
  buscaCategoria.value = categoria;

  document.querySelectorAll("[data-categoria]").forEach((botao) => {
    const escolhido = botao.dataset.categoria === categoria;
    botao.classList.toggle("active", escolhido);
    botao.classList.toggle("btn-primary", escolhido);
    botao.classList.toggle("btn-light", !escolhido);
    botao.classList.toggle("border", !escolhido);
  });
  buscarProdutos();
}

// =============================================================================
// AO ABRIR A PÁGINA
// O DOMContentLoaded roda quando o HTML terminou de carregar: aqui buscamos os
// dados na API e ligamos os formulários e botões aos seus eventos.
// =============================================================================
document.addEventListener("DOMContentLoaded", () => {
  // Carrega os dados da página. Cada função sai sozinha se a página não tiver a parte dela.

  carregarProdutos(); // cards (cardápio) ou lista de produtos (admin)
  carregarCarrinho(); // painel do carrinho (cardápio)
  alunoInf(); // nome/e-mail/saldo e o que aparece para admin e mestre
  carregarCombinacoes(); // "Combos mais pedidos" (cardápio)
  carregarMeusPedidos(); // aviso de pedido em preparo (cardápio) e a página "Meus pedidos"
  verificarAvaliacao(); // abre a janela de avaliação se o último pedido foi concluído
  mostrarSaudacao(); // "Bom dia" / "Boa tarde" / "Boa noite" no cardápio

  // "Meus pedidos": atualiza sozinho a cada 30 segundos (só com a aba do navegador aberta),
  // para o aluno ver quando o pedido fica pronto sem precisar recarregar.
  if (document.getElementById("lista-andamento")) {
    setInterval(() => {
      if (!document.hidden) carregarMeusPedidos();
    }, 30000);
  }

  // Link "/#carrinho" (ex.: botão "Ver carrinho" de outra página): abre o carrinho
  const painelCarrinho = document.getElementById("carrinho");
  if (painelCarrinho && window.location.hash === "#carrinho") {
    bootstrap.Offcanvas.getOrCreateInstance(painelCarrinho).show();
    history.replaceState(null, "", "/"); // tira o #carrinho da barra de endereço
  }

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
        avisar("Informe uma senha para se cadastrar.", "erro");
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
          avisar(erro.erro || "Não foi possível fazer o cadastro.", "erro");
          return;
        }

        window.location.href = "/"; // cadastrou e já está logado: vai para a cantina
      } catch (erro) {
        console.error("Erro ao cadastrar:", erro);
        avisar("Ocorreu um erro ao fazer o cadastro.", "erro");
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
          avisar(erro.erro || "Não foi possível fazer login.", "erro");
          return;
        }

        window.location.href = "/"; // logado: vai para a cantina
      } catch (erro) {
        console.error("Erro ao fazer login:", erro);
        avisar("Ocorreu um erro ao fazer login.", "erro");
      }
    });
  }

  // --- EVENTO: SUBMIT DO FORMULÁRIO DE PRODUTO (janela #modal-produto do admin.html, só mestre) ---
  // Se editandoProdutoId for null, cria (POST); se tiver um id, edita (PUT).
  // Depois de salvar os dados, envia a imagem (se foi escolhida uma) e fecha a janela.
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
          avisar(erro.erro || "Não foi possível salvar o produto.", "erro");
          return;
        }

        const produtoSalvo = await res.json();
        // Se o upload falhar, a janela continua aberta e já em modo "editar":
        // salvar de novo tenta só a imagem, sem cadastrar o produto duas vezes.
        editandoProdutoId = produtoSalvo.id_produto;
        await enviarImagem(produtoSalvo.id_produto);
        bootstrap.Modal.getInstance(document.getElementById("modal-produto")).hide();
        carregarProdutos(); // atualiza a lista
        avisar(`${produtoSalvo.nome} salvo.`);
      } catch (erro) {
        console.error("Erro ao salvar produto:", erro);
        avisar(erro.message || "Ocorreu um erro ao salvar o produto.", "erro");
      }
    });
  }

  // Janela de produto: mostra a prévia da foto escolhida antes de salvar
  const campoImagem = document.getElementById("imagem");
  if (campoImagem) {
    campoImagem.addEventListener("change", () => {
      const arquivo = campoImagem.files[0];
      if (arquivo) mostrarPreviaProduto(URL.createObjectURL(arquivo));
    });
  }

  // --- ADMINISTRAÇÃO (admin.html) ---
  // Buscas que filtram na hora o que já foi carregado (não chamam a API)
  document.getElementById("busca-produto-admin")?.addEventListener("input", desenharListaProdutosAdmin);
  document.getElementById("busca-aluno-admin")?.addEventListener("input", desenharListaAlunos);
  document.getElementById("busca-historico")?.addEventListener("input", desenharHistoricoAdmin);
  document.querySelectorAll('input[name="filtro-historico"]').forEach((radio) => {
    radio.addEventListener("change", desenharHistoricoAdmin);
  });
  // Categoria dos produtos do admin: chama a rota de busca (procedure por categoria)
  const categoriaAdmin = document.getElementById("lista-produtos-admin") && document.getElementById("busca-categoria");
  if (categoriaAdmin) categoriaAdmin.addEventListener("change", () => buscarProdutos());

  // Abas do admin: "admin.html#historico" já abre na aba Histórico, e trocar de aba
  // atualiza o endereço (recarregar a página volta para a mesma aba)
  if (document.getElementById("aba-pedidos")) {
    const aba = window.location.hash.slice(1);
    if (aba) abrirAba(aba);
    document.querySelectorAll('[data-bs-toggle="pill"]').forEach((botao) => {
      botao.addEventListener("shown.bs.tab", () => {
        history.replaceState(null, "", "#" + botao.dataset.bsTarget.replace("#aba-", ""));
      });
    });
    // Pedidos novos aparecem sozinhos a cada 20 segundos (só com a aba do navegador aberta)
    setInterval(() => {
      if (!document.hidden) carregarPedidos();
    }, 20000);
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
      document.getElementById("busca-preco-min").value = "";
      document.getElementById("busca-preco-max").value = "";
      document.getElementById("busca-ordenar").value = "";
      const buscaNome = document.getElementById("busca-nome");
      if (buscaNome) buscaNome.value = "";
      filtrar(""); // volta para "Tudo" e busca de novo
    });
  }

  // --- EVENTO: BUSCA PELO NOME (cardápio) ---
  // Filtra na hora, a cada letra, os produtos que já estão na tela (não chama a API).
  const buscaNome = document.getElementById("busca-nome");
  if (buscaNome) {
    buscaNome.addEventListener("input", desenharCardsProdutos);
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
          avisar(erro.erro || "Não foi possível adicionar o saldo.", "erro");
          return;
        }
        formRecarga.reset();
        alunoInf(); // mostra o saldo novo
        avisar(`${reais(valor)} adicionados à carteira.`);
      } catch (erro) {
        console.error("Erro ao adicionar saldo:", erro);
        avisar("Ocorreu um erro ao adicionar o saldo.", "erro");
      }
    });
  }

  // --- EVENTO: EDITAR DADOS (conta.html) ---
  // O formulário já vem preenchido pelo alunoInf. Envia PUT /alunos/atual
  // (senha em branco = não troca).
  const formEditarAluno = document.getElementById("form-editar-aluno");
  if (formEditarAluno) {
    formEditarAluno.addEventListener("submit", async (e) => {
      e.preventDefault();
      const corpo = {
        nome: document.getElementById("aluno-nome").value,
        email: document.getElementById("aluno-email").value,
      };
      const senha = document.getElementById("aluno-senha").value;
      if (senha) corpo.senha = senha;
      try {
        const res = await fetch(`${API_BASE_URL}/alunos/atual`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
        });
        if (!res.ok) {
          const erro = await res.json().catch(() => ({}));
          avisar(erro.erro || "Não foi possível salvar os dados.", "erro");
          return;
        }
        document.getElementById("aluno-senha").value = "";
        bootstrap.Collapse.getOrCreateInstance(document.getElementById("form-editar-dados")).hide();
        alunoInf();
        avisar("Dados atualizados.");
      } catch (erro) {
        console.error("Erro ao editar dados:", erro);
        avisar("Ocorreu um erro ao salvar os dados.", "erro");
      }
    });
  }

  // --- EVENTO: ENVIAR AVALIAÇÃO (janela do cardápio e da página "Meus pedidos") ---
  // POST /pedidos/<id>/avaliacao com {nota, comentario}; o back-end só aceita o dono do
  // pedido e uma avaliação por pedido.
  const formAvaliacao = document.getElementById("form-avaliacao");
  if (formAvaliacao) {
    formAvaliacao.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = pedidoAvaliando;
      const nota = parseInt(formAvaliacao.querySelector('input[name="nota"]:checked').value);
      const comentario = document.getElementById("avaliacao-comentario").value;
      try {
        const res = await fetch(`${API_BASE_URL}/pedidos/${id}/avaliacao`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nota, comentario }),
        });
        // Avaliado (ou não dá mais para avaliar): não pergunta de novo
        if (localStorage.getItem("pedidoParaAvaliar") === String(id)) {
          localStorage.removeItem("pedidoParaAvaliar");
        }
        bootstrap.Modal.getInstance(document.getElementById("modal-avaliacao")).hide(); // fecha a janela
        if (!res.ok) {
          const erro = await res.json().catch(() => ({}));
          avisar(erro.erro || "Não foi possível enviar a avaliação.", "erro");
          return;
        }
        avisar("Obrigado pela avaliação!");
        carregarMeusPedidos(); // tira o botão "Avaliar" do pedido
      } catch (erro) {
        console.error("Erro ao avaliar:", erro);
        avisar("Ocorreu um erro ao enviar a avaliação.", "erro");
      }
    });
  }

  // --- EVENTO: SAIR (botões com a classe btn-logout) ---
  document.querySelectorAll(".btn-logout").forEach((botao) => {
    botao.addEventListener("click", sair);
  });
});

// =============================================================================
// ALUNOS
// =============================================================================

// Lista de alunos já carregada (a busca do admin filtra em cima dela).
let alunosCarregados = [];

// Busca os alunos (GET /alunos) para a aba Alunos do admin.html. Só é chamada para o
// mestre (ver funcaoPorAluno); a rota GET /alunos também só responde ao mestre.
async function carregarAlunos() {
  if (!document.getElementById("lista-alunos")) return;
  try {
    const res = await fetch(`${API_BASE_URL}/alunos`);
    if (!res.ok) return;
    alunosCarregados = await res.json();
    desenharListaAlunos();
  } catch (erro) {
    console.error("Erro ao carregar alunos:", erro);
  }
}

// Desenha os alunos (só os que combinam com a busca): iniciais, nome, função,
// e-mail, saldo e os botões Promover (só para aluno comum) e Excluir (menos o mestre).
function desenharListaAlunos() {
  const lista = document.getElementById("lista-alunos");
  const texto = (document.getElementById("busca-aluno-admin")?.value || "").trim().toLowerCase();
  const alunos = alunosCarregados.filter((a) =>
    `${a.nome} ${a.email}`.toLowerCase().includes(texto));

  if (alunos.length === 0) {
    lista.innerHTML = `<div class="list-group-item text-center text-body-secondary py-4">Nenhum aluno encontrado.</div>`;
    return;
  }

  const cores = { mestre: "text-bg-danger", admin: "text-bg-warning", aluno: "text-bg-light border" };
  lista.innerHTML = alunos.map((aluno) => {
    const nomes = aluno.nome.trim().split(/\s+/);
    const iniciais = (nomes[0][0] + (nomes.length > 1 ? nomes[nomes.length - 1][0] : "")).toUpperCase();
    const promover = aluno.funcao === "aluno"
      ? `<button class="btn btn-sm btn-outline-secondary rounded-pill text-nowrap" onclick="promoverAluno(${aluno.id_aluno}, '${escapeAttr(aluno.nome)}')" title="Tornar admin">${icone("add")} Admin</button>` : "";
    const excluir = aluno.funcao !== "mestre"
      ? `<button class="btn btn-sm btn-outline-danger rounded-pill" onclick="excluirAluno(${aluno.id_aluno}, '${escapeAttr(aluno.nome)}')" aria-label="Excluir ${escapeHtml(aluno.nome)}">${icone("delete")}</button>` : "";
    return `
            <div class="list-group-item d-flex align-items-center gap-3 py-2">
                <div class="rounded-circle bg-warning-subtle text-warning-emphasis fw-bold d-flex align-items-center justify-content-center flex-shrink-0" style="width: 40px; height: 40px;">${iniciais}</div>
                <div class="flex-grow-1 overflow-hidden">
                    <div class="fw-semibold text-truncate">${escapeHtml(aluno.nome)}
                        <span class="badge rounded-pill ${cores[aluno.funcao] || cores.aluno} text-capitalize ms-1">${aluno.funcao}</span></div>
                    <small class="text-body-secondary d-block text-truncate">${escapeHtml(aluno.email)} · ${reais(aluno.saldo)}</small>
                </div>
                <div class="d-flex gap-1 flex-shrink-0">${promover}${excluir}</div>
            </div>`;
  }).join("");
}

// Botão "Tornar admin" da lista de alunos: PUT /alunos/<id> torna o aluno admin
// (só o mestre pode). Depois recarrega a lista para mostrar a nova função.
async function promoverAluno(id_aluno, nome) {
  if (!confirm(`Tornar ${nome} admin? Ele poderá concluir e cancelar pedidos.`)) return;
  try {
    const res = await fetch(`${API_BASE_URL}/alunos/${id_aluno}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funcao: "admin" }),
    });
    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      avisar(erro.erro || "Não foi possível promover o aluno.", "erro");
      return;
    }
    carregarAlunos();
    avisar(`${nome} agora é admin.`);
  } catch (erro) {
    console.error("Erro ao promover aluno:", erro);
  }
}

// Botão de lixeira da lista de alunos (só o mestre): DELETE /alunos/<id>, depois
// de confirmar. Os pedidos do aluno continuam no histórico com o nome guardado.
async function excluirAluno(id_aluno, nome) {
  if (!confirm(`Excluir a conta de ${nome}? Os pedidos dele continuam no histórico.`)) return;
  try {
    const res = await fetch(`${API_BASE_URL}/alunos/${id_aluno}`, { method: "DELETE" });
    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      avisar(erro.erro || "Não foi possível excluir o aluno.", "erro");
      return;
    }
    carregarAlunos();
  } catch (erro) {
    console.error("Erro ao excluir aluno:", erro);
  }
}

// Mostra na tela o que cada função pode ver e carrega os dados dela:
//   aluno  -> nada extra
//   admin  -> elementos .so-admin (ex.: link "Administração") + pedidos e histórico
//   mestre -> tudo do admin + elementos .so-mestre (abas Produtos e Alunos do admin.html)
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

// Botões "Sair": limpa a sessão no backend e volta para a tela de login.
async function sair() {
  try {
    const res = await fetch(`${API_BASE_URL}/alunos/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      avisar(erro.erro || "Não foi possível sair.", "erro");
      return;
    }

    localStorage.removeItem("pedidoParaAvaliar"); // outro aluno pode entrar neste navegador
    window.location.href = "/front-end/login.html";
  } catch (erro) {
    console.error("Erro ao sair:", erro);
    avisar("Ocorreu um erro ao sair.", "erro");
  }
}

// Botão "Remover minha conta" (conta.html): DELETE /alunos/atual apaga o aluno
// logado. Os pedidos dele continuam no histórico com o nome guardado.
async function removerAluno() {
  if (
    confirm(
      "Deseja realmente remover sua conta? Os pedidos que você já fez serão mantidos no histórico da cantina.",
    )
  ) {
    const res = await fetch(`${API_BASE_URL}/alunos/atual`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      avisar(erro.erro || "Não foi possível remover a conta.", "erro");
      return;
    }
    window.location.href = "/front-end/login.html";
  }
}

// Mostra as informações do aluno logado (GET /alunos/atual) em todos os elementos
// com data-aluno="..." da página (nome, primeiro-nome, email, saldo, iniciais,
// funcao) e preenche o formulário "Editar dados" (conta.html). Depois chama o
// funcaoPorAluno para mostrar o que é de admin/mestre.
async function alunoInf() {
  const res = await fetch(`${API_BASE_URL}/alunos/atual`);
  if (!res.ok) return;
  const aluno_inf = await res.json();
  saldoAtual = parseFloat(aluno_inf.saldo || 0);

  const nomes = aluno_inf.nome.trim().split(/\s+/);
  const valores = {
    nome: aluno_inf.nome,
    "primeiro-nome": nomes[0],
    email: aluno_inf.email,
    saldo: saldoAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    // "Davi Moraes" -> "DM"
    iniciais: (nomes[0][0] + (nomes.length > 1 ? nomes[nomes.length - 1][0] : "")).toUpperCase(),
    funcao: aluno_inf.funcao,
  };
  document.querySelectorAll("[data-aluno]").forEach((el) => {
    el.textContent = valores[el.dataset.aluno];
  });

  // Formulário "Editar dados" (conta.html)
  if (document.getElementById("form-editar-aluno")) {
    document.getElementById("aluno-nome").value = aluno_inf.nome;
    document.getElementById("aluno-email").value = aluno_inf.email;
  }

  atualizarAvisoSaldo(); // o carrinho compara o total com o saldo
  funcaoPorAluno(aluno_inf.funcao)
}

// Botões + R$ 5 / 10 / 20 / 50 da carteira: soma ao valor que já está no campo (até R$ 500).
function somarRecarga(valor) {
  const campo = document.getElementById("recarga-valor");
  const atual = parseFloat(campo.value) || 0; // campo vazio vira 0
  campo.value = Math.min(atual + valor, 500).toFixed(2);
}

// Cardápio: "Bom dia" / "Boa tarde" / "Boa noite" no cartão de boas-vindas.
function mostrarSaudacao() {
  const el = document.getElementById("saudacao-periodo");
  if (!el) return;
  const hora = new Date().getHours();
  el.textContent = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
}

// =============================================================================
// PRODUTOS
// =============================================================================

// Envia a imagem escolhida em #imagem (admin.html) para POST /produtos/<id>/imagem.
// FormData = formulário com arquivo (multipart), que é como uma imagem vai para a API.
async function enviarImagem(idProduto) {
  const imagem = document.getElementById("imagem")?.files[0];
  if (!imagem) return; // permite salvar o produto sem enviar uma imagem
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
//   - cards em #tabela-produtos (cardápio), com quantidade e botão de adicionar
//   - a lista #lista-produtos-admin (admin.html), com Editar/Excluir
async function buscarProdutos(filtrosForcados) {
  const tabela = document.getElementById("tabela-produtos");
  const tabela_admin = document.getElementById("lista-produtos-admin");
  if (!tabela && !tabela_admin) return; // página sem produtos

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
      avisar(dados.erro || "Não foi possível buscar os produtos.", "erro");
      return;
    }

    produtosCarregados = dados;
    if (tabela) desenharCardsProdutos();
    if (tabela_admin) desenharListaProdutosAdmin();
  } catch (erro) {
    console.error("Erro ao buscar produtos:", erro);
    avisar("Ocorreu um erro ao buscar os produtos.", "erro");
  }
}

// Cardápio: um card por produto (só os que combinam com o texto da busca pelo nome).
function desenharCardsProdutos() {
  const tabela = document.getElementById("tabela-produtos");
  if (!tabela) return;
  const texto = (document.getElementById("busca-nome")?.value || "").trim().toLowerCase();
  const produtos = produtosCarregados.filter((p) => p.nome.toLowerCase().includes(texto));

  const contador = document.getElementById("contador-produtos");
  if (contador) contador.textContent = `${produtos.length} ${produtos.length === 1 ? "item" : "itens"}`;

  // Nenhum resultado: mostra o aviso
  if (produtos.length === 0) {
    tabela.innerHTML = `
            <div class="col-12 text-center text-body-secondary py-5">
                <p class="display-6 mb-2"><span class="material-symbols-rounded icone" aria-hidden="true">search_off</span></p>
                <p class="mb-0">Nenhum produto encontrado.</p>
            </div>
        `;
    return;
  }

  tabela.innerHTML = produtos.map(cardProduto).join("");
}

// Monta o HTML do card de um produto.
//   - foto: ícone da categoria por trás; a imagem cobre o ícone e some (onerror) se não houver foto
//   - selo: "Esgotado" (estoque 0) ou "Últimas N" (estoque até 5)
function cardProduto(prod) {
  const id = prod.id_produto;
  const estoque = parseInt(prod.quantidade_estoque) || 0;
  const esgotado = estoque <= 0;
  const icones = { Salgado: "bakery_dining", Bebida: "local_cafe", Doce: "cake" };

  let selo = "";
  if (esgotado) selo = `<span class="badge text-bg-secondary position-absolute top-0 start-0 m-2">Esgotado</span>`;
  else if (estoque <= 5) selo = `<span class="badge text-bg-warning position-absolute top-0 start-0 m-2">Últimas ${estoque}</span>`;

  return `
        <div class="col">
            <div class="card h-100 border-0 shadow-sm rounded-4">
                <div class="position-relative">
                    <div class="ratio ratio-4x3 rounded-top-4">
                        <div class="d-flex align-items-center justify-content-center display-5 text-warning-emphasis opacity-50" aria-hidden="true"><span class="material-symbols-rounded icone">${icones[prod.categoria] || "restaurant"}</span></div>
                        <img src="${API_BASE_URL}/produtos/${id}/imagem" alt="${escapeHtml(prod.nome)}"
                             class="object-fit-contain p-2 ${esgotado ? "opacity-50" : ""}" loading="lazy" onerror="this.remove()">
                    </div>
                    ${selo}
                </div>
                <div class="card-body p-2 p-md-3 d-flex flex-column">
                    <small class="text-body-secondary">${escapeHtml(prod.categoria || "")}</small>
                    <h3 class="h6 fw-semibold mb-1">${escapeHtml(prod.nome)}</h3>
                    <p class="fw-bold text-primary mb-2">${reais(prod.preco_atual)}</p>
                    <div class="mt-auto d-flex align-items-center justify-content-between gap-1">
                        <div class="input-group input-group-sm seletor-qtd w-auto flex-nowrap">
                            <button class="btn btn-outline-secondary" type="button" onclick="mudarQuantidade(${id}, -1)" aria-label="Diminuir" ${esgotado ? "disabled" : ""}><span class="material-symbols-rounded icone" aria-hidden="true">remove</span></button>
                            <input class="form-control text-center px-0" type="number" id="qtd-produto-${id}" value="1" min="1" max="${estoque}" inputmode="numeric" aria-label="Quantidade de ${escapeHtml(prod.nome)}" ${esgotado ? "disabled" : ""}>
                            <button class="btn btn-outline-secondary" type="button" onclick="mudarQuantidade(${id}, 1)" aria-label="Aumentar" ${esgotado ? "disabled" : ""}><span class="material-symbols-rounded icone" aria-hidden="true">add</span></button>
                        </div>
                        <button type="button" class="btn btn-primary btn-sm rounded-pill px-2" onclick="adicionarItemAoCarrinho(${id})" aria-label="Adicionar ${escapeHtml(prod.nome)} ao carrinho" ${esgotado ? "disabled" : ""}>
                            <span class="material-symbols-rounded icone fs-6" aria-hidden="true">shopping_cart</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Botões − e + do card: muda a quantidade entre 1 e o estoque.
function mudarQuantidade(id_produto, delta) {
  const campo = document.getElementById(`qtd-produto-${id_produto}`);
  const maximo = parseInt(campo.max) || 99;
  const novo = (parseInt(campo.value) || 1) + delta;
  campo.value = Math.min(Math.max(novo, 1), maximo);
}

// admin.html: um item por produto (só os que combinam com a busca), com foto,
// categoria, preço, estoque e os botões Editar e Excluir. Também atualiza o
// número de "Estoque baixo" do resumo.
function desenharListaProdutosAdmin() {
  const lista = document.getElementById("lista-produtos-admin");
  const texto = (document.getElementById("busca-produto-admin")?.value || "").trim().toLowerCase();
  const produtos = produtosCarregados.filter((p) => p.nome.toLowerCase().includes(texto));

  const resumoEstoque = document.getElementById("resumo-estoque");
  if (resumoEstoque) resumoEstoque.textContent = produtosCarregados.filter((p) => p.quantidade_estoque <= 5).length;

  if (produtos.length === 0) {
    lista.innerHTML = `<div class="list-group-item text-center text-body-secondary py-4">Nenhum produto encontrado.</div>`;
    return;
  }

  const icones = { Salgado: "bakery_dining", Bebida: "local_cafe", Doce: "cake" };
  lista.innerHTML = produtos.map((prod) => {
    const estoque = prod.quantidade_estoque;
    const corEstoque = estoque <= 0 ? "text-bg-secondary" : estoque <= 5 ? "text-bg-warning" : "text-bg-light border";
    return `
            <div class="list-group-item d-flex align-items-center gap-3 py-2">
                <div class="position-relative flex-shrink-0 rounded bg-warning-subtle d-flex align-items-center justify-content-center text-warning-emphasis" style="width: 48px; height: 48px;">
                    ${icone(icones[prod.categoria] || "restaurant")}
                    <img src="${API_BASE_URL}/produtos/${prod.id_produto}/imagem" alt="" loading="lazy"
                         class="position-absolute top-0 start-0 w-100 h-100 object-fit-contain bg-white rounded" onerror="this.remove()">
                </div>
                <div class="flex-grow-1 overflow-hidden">
                    <div class="fw-semibold text-truncate">${escapeHtml(prod.nome)}</div>
                    <small class="text-body-secondary">${escapeHtml(prod.categoria || "Sem categoria")} · ${reais(prod.preco_atual)}</small>
                    <span class="badge rounded-pill ${corEstoque} ms-1">${estoque <= 0 ? "Esgotado" : `${estoque} un.`}</span>
                </div>
                <div class="d-flex gap-1 flex-shrink-0">
                    <button class="btn btn-sm btn-outline-secondary rounded-pill" onclick="editarProduto(${prod.id_produto}, '${escapeAttr(prod.nome)}', ${prod.preco_atual}, ${estoque}, '${escapeAttr(prod.categoria || "")}')" aria-label="Editar ${escapeHtml(prod.nome)}">${icone("edit")}</button>
                    <button class="btn btn-sm btn-outline-danger rounded-pill" onclick="removerProduto(${prod.id_produto}, '${escapeAttr(prod.nome)}')" aria-label="Excluir ${escapeHtml(prod.nome)}">${icone("delete")}</button>
                </div>
            </div>`;
  }).join("");
}

// Botão "Novo produto": abre a janela de produto vazia, em modo "cadastrar".
function novoProduto() {
  editandoProdutoId = null;
  document.getElementById("form-produto").reset();
  document.getElementById("modal-produto-titulo").textContent = "Novo produto";
  document.getElementById("btn-salvar-produto").textContent = "Cadastrar";
  mostrarPreviaProduto("");
  bootstrap.Modal.getOrCreateInstance(document.getElementById("modal-produto")).show();
}

// Botão "Editar" de um produto: abre a janela já preenchida com os dados dele, em
// "modo edição" (o próximo envio do formulário faz PUT em vez de POST).
function editarProduto(id, nome, preco, estoque, categoria) {
  editandoProdutoId = id;
  document.getElementById("form-produto").reset();
  document.getElementById("produto-nome").value = nome;
  document.getElementById("produto-preco").value = preco;
  document.getElementById("produto-estoque").value = estoque;
  document.getElementById("produto-categoria").value = categoria;
  document.getElementById("modal-produto-titulo").textContent = "Editar produto";
  document.getElementById("btn-salvar-produto").textContent = "Salvar";
  mostrarPreviaProduto(`${API_BASE_URL}/produtos/${id}/imagem?v=${Date.now()}`); // ?v= evita a foto antiga do cache
  bootstrap.Modal.getOrCreateInstance(document.getElementById("modal-produto")).show();
}

// Mostra a foto do produto na janela (endereço vazio, ou produto sem foto, esconde).
function mostrarPreviaProduto(endereco) {
  const previa = document.getElementById("produto-imagem-previa");
  previa.classList.add("d-none");
  if (!endereco) return;
  previa.onload = () => previa.classList.remove("d-none");
  previa.onerror = () => previa.classList.add("d-none");
  previa.src = endereco;
}

// Botão de lixeira de um produto: DELETE /produtos/<id>, depois de confirmar.
// Os pedidos antigos continuam mostrando o nome do produto.
async function removerProduto(id, nome) {
  if (
    confirm(
      `Excluir ${nome} do cardápio? Os pedidos que já o incluem continuam no histórico.`,
    )
  ) {
    const res = await fetch(`${API_BASE_URL}/produtos/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      avisar(erro.erro || "Não foi possível remover o produto.", "erro");
      return;
    }
    carregarProdutos();
    carregarPedidos();
    avisar(`${nome} excluído.`);
  }
}

// =============================================================================
// CARRINHO
// O carrinho fica no back-end: é um pedido com status "Carrinho" do aluno logado.
// Toda rota do carrinho devolve o carrinho inteiro, que o renderizarCarrinho desenha.
// =============================================================================

// Botão de adicionar de um card: lê a quantidade do campo do card e grava o
// produto no carrinho (POST /carrinho/itens). Se já estiver lá, soma.
async function adicionarItemAoCarrinho(id_produto) {
  const inputQuantidade = document.getElementById(`qtd-produto-${id_produto}`);
  const quantidade = parseInt(inputQuantidade.value);
  if (!quantidade || quantidade < 1) {
    avisar("Informe uma quantidade válida.", "erro");
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
      avisar(dados.erro || "Não foi possível adicionar o produto.", "erro");
      return;
    }
    inputQuantidade.value = 1; // volta o campo de quantidade para 1
    renderizarCarrinho(dados);
    // Acha o produto no carrinho só para pegar o nome e mostrar no aviso
    const item = dados.itens.find((i) => i.id_produto === id_produto);
    avisar(`${quantidade}x ${item.produto_nome} no carrinho`, "sucesso", true);
  } catch (erro) {
    console.error("Erro ao adicionar item:", erro);
    avisar("Ocorreu um erro ao adicionar o produto.", "erro");
  }
}

// Botão de lixeira de uma linha do carrinho: DELETE /carrinho/itens/<id>.
async function removerItemDoCarrinho(id_item_pedido) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/carrinho/itens/${id_item_pedido}`,
      { method: "DELETE" },
    );
    const dados = await res.json();
    if (!res.ok) {
      avisar(dados.erro || "Não foi possível remover o item.", "erro");
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

// Desenha o carrinho: os itens no painel, o total, o número no botão do topo e
// a barra "Ver carrinho" do celular. carrinho = null (ex.: erro ao carregar)
// mostra o carrinho vazio.
function renderizarCarrinho(carrinho) {
  const lista = document.getElementById("tabela-carrinho");
  const totalEl = document.getElementById("carrinho-total");
  if (!lista || !totalEl) return;

  const itens = carrinho ? carrinho.itens : [];
  const total = carrinho ? carrinho.valor_total : 0;
  const quantidade = itens.reduce((soma, item) => soma + item.quantidade, 0);

  lista.innerHTML = itens.map((item) => `
            <li class="list-group-item px-0 d-flex align-items-center gap-2">
                <span class="badge rounded-pill text-bg-light border">${item.quantidade}x</span>
                <div class="flex-grow-1 lh-sm">
                    <div class="fw-semibold">${escapeHtml(item.produto_nome)}</div>
                    <small class="text-body-secondary">${reais(item.preco_unitario_cobrado)} cada</small>
                </div>
                <span class="fw-semibold text-nowrap">${reais(item.subtotal)}</span>
                <button class="btn btn-sm btn-link text-danger p-1" onclick="removerItemDoCarrinho(${item.id_item_pedido})" aria-label="Remover ${escapeHtml(item.produto_nome)}">
                    <span class="material-symbols-rounded icone" aria-hidden="true">delete</span>
                </button>
            </li>
        `).join("");

  totalEl.textContent = reais(total);
  totalEl.dataset.total = total; // o atualizarAvisoSaldo compara com o saldo
  document.getElementById("carrinho-vazio").classList.toggle("d-none", itens.length > 0);
  document.getElementById("carrinho-rodape").classList.toggle("d-none", itens.length === 0);

  // Número no botão do carrinho (topo)
  const badge = document.getElementById("badge-contador");
  if (badge) {
    badge.textContent = quantidade;
    badge.classList.toggle("d-none", quantidade === 0);
  }

  // Celular: barra "Ver carrinho" em cima da barra de baixo
  const barra = document.getElementById("barra-carrinho");
  if (barra) {
    barra.classList.toggle("d-none", quantidade === 0);
    document.getElementById("barra-carrinho-qtd").textContent = quantidade;
    document.getElementById("barra-carrinho-total").textContent = reais(total);
  }

  atualizarAvisoSaldo();
}

// Mostra "Saldo insuficiente" no carrinho quando o total passa do saldo da carteira.
function atualizarAvisoSaldo() {
  const aviso = document.getElementById("aviso-saldo");
  const totalEl = document.getElementById("carrinho-total");
  if (!aviso || !totalEl) return;
  const total = parseFloat(totalEl.dataset.total || 0);
  aviso.classList.toggle("d-none", total <= saldoAtual);
}

// Botão "Finalizar pedido": POST /carrinho/finalizar. O back-end confere estoque
// e saldo, desconta os dois e transforma o carrinho em pedido "Pendente".
async function finalizarPedido() {
  try {
    const res = await fetch(`${API_BASE_URL}/carrinho/finalizar`, {
      method: "POST",
    });
    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      avisar(erro.erro || "Não foi possível finalizar o pedido.", "erro");
      return;
    }
    const pedido = await res.json();
    localStorage.setItem("pedidoParaAvaliar", pedido.id_pedido); // pede a avaliação quando for concluído

    // Fecha o carrinho e mostra a janela "Pedido enviado!"
    bootstrap.Offcanvas.getOrCreateInstance(document.getElementById("carrinho")).hide();
    document.getElementById("pedido-feito-numero").textContent = codigoPedido(pedido);
    document.getElementById("pedido-feito-total").textContent = reais(pedido.valor_total);
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modal-pedido-feito")).show();

    carregarCarrinho();
    alunoInf(); // o saldo diminuiu
    carregarMeusPedidos(); // aparece o aviso "pedido em preparo"
    carregarProdutos(); // o estoque diminuiu
  } catch (erro) {
    console.error("Erro ao finalizar pedido:", erro);
    avisar("Ocorreu um erro ao finalizar o pedido.", "erro");
  }
}

// Botão "Repetir último pedido" (painel do carrinho): POST /carrinho/repetir
// coloca no carrinho os mesmos produtos e quantidades do último pedido.
async function repetirUltimoPedido() {
  try {
    const res = await fetch(`${API_BASE_URL}/carrinho/repetir`, { method: "POST" });
    const dados = await res.json();
    if (!res.ok) {
      avisar(dados.erro || "Não foi possível repetir o último pedido.", "erro");
      return;
    }
    renderizarCarrinho(dados);
    avisar("Itens do último pedido adicionados ao carrinho");
  } catch (erro) {
    console.error("Erro ao repetir pedido:", erro);
  }
}

// =============================================================================
// COMBINAÇÕES MAIS PEDIDAS (cardápio)
// =============================================================================

// Busca as 3 duplas de produtos mais pedidas juntas (GET /pedidos/combinacoes)
// e monta um card para cada uma: "Coxinha + Refri", pedidos 2x juntos.
async function carregarCombinacoes() {
  const lista = document.getElementById("lista-combinacoes");
  if (!lista) return; // página sem combinações
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos/combinacoes`);
    if (!res.ok) return;
    const combinacoes = await res.json();
    lista.innerHTML = combinacoes.map((combo) => {
      const nomes = combo.produtos.map((p) => escapeHtml(p.nome)).join(" + "); // "Coxinha + Refri"
      const ids = combo.produtos.map((p) => p.id_produto).join(", "); // "1, 2" -> vai no onclick
      return `
                <button class="card border-0 shadow-sm rounded-4 text-start flex-shrink-0 p-3" style="width: 220px;" type="button" onclick="adicionarCombinacao([${ids}])">
                    <small class="text-body-secondary">Pedidos juntos ${combo.vezes}x</small>
                    <span class="fw-semibold">${nomes}</span>
                    <span class="btn btn-sm btn-outline-primary rounded-pill mt-2">+ Adicionar combo</span>
                </button>
            `;
    }).join("");
    // A seção começa escondida no HTML; só aparece se houver alguma combinação
    if (combinacoes.length) document.getElementById("secao-combinacoes").style.display = "";
  } catch (erro) {
    console.error("Erro ao carregar combinações:", erro);
  }
}

// Clique numa combinação: adiciona 1 de cada produto ao carrinho, usando a
// mesma rota do botão de adicionar (POST /carrinho/itens), um por vez.
async function adicionarCombinacao(ids) {
  for (const id_produto of ids) {
    const res = await fetch(`${API_BASE_URL}/carrinho/itens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_produto, quantidade: 1 }),
    });
    const dados = await res.json();
    if (!res.ok) {
      avisar(dados.erro || "Não foi possível adicionar a combinação.", "erro");
      return;
    }
    renderizarCarrinho(dados);
  }
  avisar("Combo adicionado ao carrinho", "sucesso", true);
}

// =============================================================================
// MEUS PEDIDOS (lado do aluno: pedidos.html e o aviso no cardápio)
// =============================================================================

// Busca os pedidos do aluno logado (GET /pedidos/meus, mais recente primeiro) e:
//   - cardápio: mostra o aviso "Pedido #N em preparo" se houver pedido "Pendente"
//   - pedidos.html: monta as abas "Em andamento" e "Histórico"
async function carregarMeusPedidos() {
  const aviso = document.getElementById("aviso-pedido-andamento");
  const listaAndamento = document.getElementById("lista-andamento");
  const listaHistorico = document.getElementById("lista-historico");
  if (!aviso && !listaAndamento) return; // página sem pedidos do aluno

  try {
    const res = await fetch(`${API_BASE_URL}/pedidos/meus`);
    if (!res.ok) return;
    const pedidos = await res.json();
    const andamento = pedidos.filter((p) => p.status === "Pendente");
    const historico = pedidos.filter((p) => p.status !== "Pendente");

    // Cardápio: aviso de pedido em preparo
    if (aviso) {
      aviso.classList.toggle("d-none", andamento.length === 0);
      aviso.classList.toggle("d-flex", andamento.length > 0);
      if (andamento.length) {
        document.getElementById("aviso-pedido-titulo").textContent = andamento.length === 1
          ? `Pedido ${codigoPedido(andamento[0])} em preparo`
          : `${andamento.length} pedidos em preparo`;
      }
    }

    // pedidos.html: as duas abas
    if (listaAndamento) {
      const contador = document.getElementById("contador-andamento");
      contador.textContent = andamento.length;
      contador.classList.toggle("d-none", andamento.length === 0);

      listaAndamento.innerHTML = andamento.length
        ? andamento.map(cardPedidoAndamento).join("")
        : estadoVazio("restaurant", "Nenhum pedido em andamento", "Que tal um lanche?");
      listaHistorico.innerHTML = historico.length
        ? historico.map(cardPedidoHistorico).join("")
        : estadoVazio("receipt_long", "Nenhum pedido finalizado ainda", "Seus pedidos concluídos aparecem aqui.");
    }
  } catch (erro) {
    console.error("Erro ao carregar meus pedidos:", erro);
  }
}

// Lista "2x Coxinha", "1x Refri" de um pedido.
function listaItensPedido(pedido) {
  return pedido.itens.map((item) => `
        <li class="d-flex justify-content-between">
            <span><span class="text-body-secondary">${item.quantidade}x</span> ${escapeHtml(item.produto_nome)}</span>
            <span class="text-body-secondary">${reais(item.subtotal)}</span>
        </li>`).join("");
}

// Card de um pedido "Pendente": barra de progresso do Bootstrap (listrada e animada)
// mostrando que o pedido está sendo preparado.
function cardPedidoAndamento(pedido) {
  return `
        <div class="card border-0 border-start border-4 border-warning shadow-sm rounded-4 mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h2 class="h6 fw-bold mb-0">Pedido ${escapeHtml(codigoPedido(pedido))}</h2>
                        <small class="text-body-secondary">${formatarData(pedido.data_hora_criacao)}</small>
                    </div>
                    <span class="badge rounded-pill text-bg-warning d-flex align-items-center gap-1">
                        <span class="material-symbols-rounded icone" aria-hidden="true">hourglass_top</span> Em preparo
                    </span>
                </div>
                <div class="progress mb-1" role="progressbar" aria-label="Andamento do pedido" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="height: 8px;">
                    <div class="progress-bar progress-bar-striped progress-bar-animated bg-warning" style="width: 60%"></div>
                </div>
                <div class="d-flex justify-content-between small text-body-secondary mb-3">
                    <span>Recebido</span><span class="fw-semibold text-body">Em preparo</span><span>Retirado</span>
                </div>
                <ul class="list-unstyled small mb-2">${listaItensPedido(pedido)}</ul>
                <div class="d-flex justify-content-between border-top pt-2">
                    <span class="text-body-secondary">Total pago</span>
                    <span class="fw-bold">${reais(pedido.valor_total)}</span>
                </div>
            </div>
        </div>
    `;
}

// Card de um pedido concluído ou cancelado, com "Pedir de novo" e "Avaliar".
function cardPedidoHistorico(pedido) {
  const concluido = pedido.status === "Concluído";
  let avaliar = "";
  if (concluido && !pedido.avaliado) {
    avaliar = `<button class="btn btn-warning btn-sm rounded-pill" type="button" onclick="abrirAvaliacao(${pedido.id_pedido})">
                       <span class="material-symbols-rounded icone icone-cheio" aria-hidden="true">star</span> Avaliar</button>`;
  } else if (pedido.avaliado) {
    avaliar = `<small class="text-body-secondary align-self-center"><span class="material-symbols-rounded icone icone-cheio text-warning" aria-hidden="true">star</span> Avaliado</small>`;
  }

  return `
        <div class="card border-0 border-start border-4 ${concluido ? "border-success" : "border-secondary"} shadow-sm rounded-4 mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h2 class="h6 fw-bold mb-0">Pedido ${escapeHtml(codigoPedido(pedido))}</h2>
                        <small class="text-body-secondary">${formatarData(pedido.data_hora_criacao)}</small>
                    </div>
                    <span class="badge rounded-pill ${concluido ? "text-bg-success" : "text-bg-secondary"}">${pedido.status}</span>
                </div>
                <ul class="list-unstyled small mb-2">${listaItensPedido(pedido)}</ul>
                ${concluido ? "" : `<p class="small text-body-secondary mb-2">O valor foi devolvido para a sua carteira.</p>`}
                <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 border-top pt-2">
                    <span class="fw-bold">${reais(pedido.valor_total)}</span>
                    <div class="d-flex gap-2">
                        ${avaliar}
                        <button class="btn btn-outline-primary btn-sm rounded-pill" type="button" onclick="pedirDeNovo(${pedido.id_pedido})">
                            <span class="material-symbols-rounded icone" aria-hidden="true">replay</span> Pedir de novo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Mensagem de lista vazia (com um ícone) e, se comBotao, um botão para o cardápio.
function estadoVazio(nomeIcone, titulo, texto, comBotao = true) {
  return `
        <div class="text-center text-body-secondary py-5">
            <p class="display-5 mb-2 text-body-tertiary">${icone(nomeIcone)}</p>
            <p class="fw-semibold mb-1 text-body">${titulo}</p>
            <p class="small">${texto}</p>
            ${comBotao ? `<a class="btn btn-primary rounded-pill" href="/">Ver cardápio</a>` : ""}
        </div>
    `;
}

// Botão "Pedir de novo": POST /carrinho/repetir/<id> coloca no carrinho os mesmos
// produtos e quantidades daquele pedido (com o preço de hoje).
async function pedirDeNovo(id_pedido) {
  try {
    const res = await fetch(`${API_BASE_URL}/carrinho/repetir/${id_pedido}`, { method: "POST" });
    const dados = await res.json();
    if (!res.ok) {
      avisar(dados.erro || "Não foi possível repetir o pedido.", "erro");
      return;
    }
    avisar(`Itens do pedido #${id_pedido} no carrinho`, "sucesso", true);
  } catch (erro) {
    console.error("Erro ao repetir pedido:", erro);
  }
}

// =============================================================================
// PEDIDOS (admin.html; só admin e mestre)
// =============================================================================

// Todos os pedidos já carregados (o histórico filtra em cima deles).
let pedidosAdmin = [];

// Busca todos os pedidos (GET /pedidos) e monta, no admin.html:
//   - aba Pedidos: um card por pedido "Pendente", do mais antigo para o mais novo
//   - aba Histórico: os entregues e cancelados (ver desenharHistoricoAdmin)
//   - o resumo do dia (em preparo, entregues hoje, vendido hoje)
async function carregarPedidos() {
  const lista = document.getElementById("lista-pedidos-admin");
  if (!lista) return; // página sem pedidos do admin
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos`);
    if (!res.ok) return;
    pedidosAdmin = await res.json();
    const andamento = pedidosAdmin.filter((ped) => ped.status === "Pendente");

    // Resumo do dia. "Hoje" é comparado no horário local (toDateString).
    const hoje = new Date().toDateString();
    const entreguesHoje = pedidosAdmin.filter((ped) => ped.status === "Concluído"
      && dataLocal(ped.data_hora_retirada || ped.data_hora_criacao).toDateString() === hoje);
    document.getElementById("resumo-andamento").textContent = andamento.length;
    document.getElementById("resumo-concluidos").textContent = entreguesHoje.length;
    document.getElementById("resumo-vendido").textContent =
      reais(entreguesHoje.reduce((soma, ped) => soma + ped.valor_total, 0));

    const contador = document.getElementById("contador-pedidos-admin");
    contador.textContent = andamento.length;
    contador.classList.toggle("d-none", andamento.length === 0);

    lista.innerHTML = andamento.length
      ? andamento.map(cardPedidoAdmin).join("")
      : `<div class="col-12">${estadoVazio("check_circle", "Nenhum pedido esperando", "Os pedidos novos aparecem aqui sozinhos.", false)}</div>`;

    desenharHistoricoAdmin();
  } catch (erro) {
    console.error("Erro ao carregar pedidos:", erro);
  }
}

// Card de um pedido em preparo: código de retirada grande (o aluno mostra no
// balcão), nome do aluno, há quanto tempo foi feito, itens e os botões.
function cardPedidoAdmin(ped) {
  const codigo = codigoPedido(ped);
  return `
        <div class="col">
            <div class="card h-100 border-0 border-start border-4 border-warning shadow-sm rounded-4">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <small class="text-body-secondary">Código de retirada</small>
                            <div class="fs-2 fw-bold font-monospace lh-1">${escapeHtml(codigo)}</div>
                        </div>
                        <span class="badge rounded-pill text-bg-light border">${tempoDesde(ped.data_hora_criacao)}</span>
                    </div>
                    <p class="fw-semibold mb-1">${icone("person", "text-body-secondary")} ${escapeHtml(ped.aluno_nome)}</p>
                    <ul class="list-unstyled small mb-3">
                        ${ped.itens.map((item) => `<li><span class="fw-semibold">${item.quantidade}x</span> ${escapeHtml(item.produto_nome)}</li>`).join("")}
                    </ul>
                    <div class="mt-auto d-flex align-items-center gap-2">
                        <span class="fw-bold me-auto">${reais(ped.valor_total)}</span>
                        <button class="btn btn-sm btn-outline-danger rounded-pill" onclick="cancelarPedido(${ped.id_pedido}, '${escapeAttr(codigo)}')">Cancelar</button>
                        <button class="btn btn-success rounded-pill px-3" onclick="concluirPedido(${ped.id_pedido}, '${escapeAttr(codigo)}', '${escapeAttr(ped.aluno_nome)}')">
                            ${icone("check")} Entregar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Aba Histórico: pedidos entregues e cancelados, do mais recente para o mais antigo,
// filtrados pelos botões Todos/Entregues/Cancelados e pela busca (aluno ou código).
function desenharHistoricoAdmin() {
  const lista = document.getElementById("lista-historico-admin");
  if (!lista) return;
  const status = document.querySelector('input[name="filtro-historico"]:checked').value;
  const texto = (document.getElementById("busca-historico").value || "").trim().toLowerCase();

  const historico = pedidosAdmin
    .filter((ped) => ["Concluído", "Cancelado"].includes(ped.status))
    .filter((ped) => !status || ped.status === status)
    .filter((ped) => `${ped.aluno_nome} ${ped.codigo || ""} #${ped.id_pedido}`.toLowerCase().includes(texto))
    .reverse();

  if (historico.length === 0) {
    lista.innerHTML = `<div class="list-group-item text-center text-body-secondary py-4">Nenhum pedido encontrado.</div>`;
    return;
  }

  lista.innerHTML = historico.map((ped) => {
    const entregue = ped.status === "Concluído";
    const itens = ped.itens.map((item) => `${item.quantidade}x ${escapeHtml(item.produto_nome)}`).join(", ");
    return `
            <div class="list-group-item py-3">
                <div class="d-flex justify-content-between align-items-start gap-3">
                    <div class="overflow-hidden">
                        <div class="fw-semibold text-truncate">${escapeHtml(ped.aluno_nome)}
                            <small class="text-body-secondary fw-normal">${escapeHtml(codigoPedido(ped))}</small></div>
                        <small class="text-body-secondary">${itens}</small>
                    </div>
                    <div class="text-end flex-shrink-0">
                        <span class="badge rounded-pill ${entregue ? "text-bg-success" : "text-bg-secondary"}">${entregue ? "Entregue" : "Cancelado"}</span>
                        <div class="fw-semibold">${reais(ped.valor_total)}</div>
                        <small class="text-body-secondary">${formatarData(ped.data_hora_retirada || ped.data_hora_criacao)}</small>
                    </div>
                </div>
            </div>`;
  }).join("");
}

// Troca a aba do admin pelo nome: "pedidos", "historico", "produtos" ou "alunos"
// (usado pelos cards do resumo e pelo endereço admin.html#historico).
function abrirAba(nome) {
  const botao = document.getElementById(`aba-${nome}-btn`);
  if (botao) bootstrap.Tab.getOrCreateInstance(botao).show();
}

// Botão "Entregar": POST /pedidos/<id>/concluir marca o pedido como "Concluído".
// O pedido sai da aba Pedidos e vai para o Histórico; a avaliação é pedida
// ao aluno quando ele abrir a cantina (ver verificarAvaliacao).
async function concluirPedido(id, codigo, aluno) {
  if (!confirm(`Entregar o pedido ${codigo} para ${aluno}?`)) return;
  await mudarPedido(id, "concluir", codigo);
}

// Botão "Cancelar": POST /pedidos/<id>/cancelar. O back-end devolve o valor para
// a carteira do aluno e os produtos para o estoque.
async function cancelarPedido(id, codigo) {
  if (!confirm(`Cancelar o pedido ${codigo}? O valor volta para a carteira do aluno.`)) return;
  await mudarPedido(id, "cancelar", codigo);
}

// Chama a rota de concluir ou cancelar e recarrega a tela.
async function mudarPedido(id, acao, codigo) {
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos/${id}/${acao}`, { method: "POST" });
    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      avisar(erro.erro || "Não foi possível atualizar o pedido.", "erro");
      return;
    }
    // O alunoInf recarrega os pedidos e, para o mestre, a lista de alunos
    // (o cancelamento devolve saldo, então o saldo do aluno muda)
    alunoInf();
    if (acao === "cancelar") carregarProdutos(); // o estoque voltou
    avisar(acao === "concluir" ? `Pedido ${codigo} entregue.` : `Pedido ${codigo} cancelado.`);
  } catch (erro) {
    console.error("Erro ao atualizar pedido:", erro);
    avisar("Ocorreu um erro ao atualizar o pedido.", "erro");
  }
}

// =============================================================================
// AVALIAÇÃO (lado do aluno)
// =============================================================================

// Abre a janela de avaliação para um pedido (botão "Avaliar" de "Meus pedidos").
function abrirAvaliacao(id_pedido) {
  const modal = document.getElementById("modal-avaliacao");
  if (!modal) return;
  pedidoAvaliando = id_pedido;
  document.getElementById("form-avaliacao").reset();
  bootstrap.Modal.getOrCreateInstance(modal).show();
}

// Se o último pedido do aluno já foi concluído, abre a janela de avaliação.
// O número do pedido foi guardado no localStorage (memória do navegador) pelo
// finalizarPedido; ele é apagado depois de avaliar ou no logout.
async function verificarAvaliacao() {
  const id = localStorage.getItem("pedidoParaAvaliar");
  if (!id || !document.getElementById("modal-avaliacao")) return;
  try {
    const res = await fetch(`${API_BASE_URL}/pedidos/${id}`);
    if (!res.ok) return;
    const pedido = await res.json();
    if (pedido.avaliado) {
      localStorage.removeItem("pedidoParaAvaliar"); // já avaliado pela página "Meus pedidos"
      return;
    }
    if (pedido.status === "Concluído") abrirAvaliacao(pedido.id_pedido);
  } catch (erro) {
    console.error("Erro ao verificar avaliação:", erro);
  }
}

// =============================================================================
// UTIL
// =============================================================================

// Mostra um aviso (toast do Bootstrap) no topo da tela, que some sozinho.
//   tipo: "sucesso" (verde), "erro" (vermelho) ou "info" (escuro)
//   comBotaoCarrinho: true mostra o botão "Ver carrinho" no aviso
// No login e no cadastro o JavaScript do Bootstrap não é carregado: lá vira um alert.
function avisar(mensagem, tipo = "sucesso", comBotaoCarrinho = false) {
  if (typeof bootstrap === "undefined") {
    alert(mensagem);
    return;
  }

  // O lugar dos avisos é criado na primeira vez
  let container = document.getElementById("avisos");
  if (!container) {
    container = document.createElement("div");
    container.id = "avisos";
    container.className = "toast-container position-fixed top-0 start-50 translate-middle-x p-3";
    document.body.appendChild(container);
  }

  const cores = { sucesso: "text-bg-success", erro: "text-bg-danger", info: "text-bg-dark" };
  // No cardápio o botão abre o painel do carrinho; nas outras páginas leva para "/#carrinho"
  const botao = !comBotaoCarrinho ? "" : document.getElementById("carrinho")
    ? `<button type="button" class="btn btn-light btn-sm rounded-pill ms-auto text-nowrap" data-bs-toggle="offcanvas" data-bs-target="#carrinho">Ver carrinho</button>`
    : `<a class="btn btn-light btn-sm rounded-pill ms-auto text-nowrap" href="/#carrinho">Ver carrinho</a>`;

  const toast = document.createElement("div");
  toast.className = `toast border-0 shadow ${cores[tipo] || cores.info}`;
  toast.setAttribute("role", tipo === "erro" ? "alert" : "status");
  toast.setAttribute("aria-live", tipo === "erro" ? "assertive" : "polite");
  toast.setAttribute("aria-atomic", "true");
  toast.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="toast-body"></div>
            ${botao}
            <button type="button" class="btn-close btn-close-white mx-2 ${botao ? "" : "ms-auto"}" data-bs-dismiss="toast" aria-label="Fechar"></button>
        </div>`;
  toast.querySelector(".toast-body").textContent = mensagem; // textContent: o texto nunca vira HTML
  container.appendChild(toast);
  toast.addEventListener("hidden.bs.toast", () => toast.remove());
  bootstrap.Toast.getOrCreateInstance(toast, { delay: tipo === "erro" ? 5000 : 3000 }).show();
}

// 12.5 -> "R$ 12,50"
function reais(valor) {
  return (parseFloat(valor) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Código de retirada do pedido (ex.: "4aZ9"). Pedidos feitos antes do código
// existir não têm um: aí mostra o número ("#12").
function codigoPedido(pedido) {
  return pedido.codigo || `#${pedido.id_pedido}`;
}

// Data do back-end -> objeto Date no horário local. O back-end grava em UTC sem
// dizer o fuso (ex.: "2026-11-03T17:32:00"); o "Z" no fim avisa o navegador que é
// UTC, e ele converte para o horário de quem está vendo.
function dataLocal(iso) {
  const comFuso = /Z|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`;
  return new Date(comFuso);
}

// Data do back-end -> "03/11, 14:32"
function formatarData(iso) {
  if (!iso) return "";
  return dataLocal(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

// Data do back-end -> "agora", "há 5 min", "há 2 h" (cards de pedido do admin)
function tempoDesde(iso) {
  const minutos = Math.floor((Date.now() - dataLocal(iso)) / 60000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  return `há ${Math.floor(minutos / 60)} h`;
}

// Ícone do Material Symbols (Google Fonts) como texto HTML, para usar dentro das
// listas e cards montados aqui: icone("delete") -> <span ...>delete</span>.
// O nome do ícone precisa estar na lista icon_names do <link> do Google Fonts nas páginas.
function icone(nome, classes = "") {
  return `<span class="material-symbols-rounded icone ${classes}" aria-hidden="true">${nome}</span>`;
}

// Troca os caracteres especiais do HTML, para um nome com "<" não virar código na página.
function escapeHtml(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

// Escapa aspas simples pra não quebrar o HTML gerado nos onclick com nome/email do aluno.
function escapeAttr(texto) {
  return escapeHtml(String(texto).replace(/'/g, "\\'"));
}
