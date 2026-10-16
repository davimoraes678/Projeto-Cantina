// URL base da API
const API_BASE_URL = "/api";  // mesmo endereço da página (funciona local e no Codespaces)

// Guarda o ID do produto em edição (null = formulário está em modo "cadastrar").
let editandoProdutoId = null;
// Aluno logado (preenchido por alunoInf) e listas já carregadas, para os botões acharem o item pelo id.
let alunoAtual = null;
let produtosCache = [];
let pedidosCache = [];

document.addEventListener("DOMContentLoaded", async () => {

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
                    body: JSON.stringify({ nome, email, senha })
                });

                if (!res.ok) {
                    const erro = await res.json().catch(() => ({}));
                    alert(erro.erro || "Não foi possível fazer o cadastro.");
                    return;
                }

                window.location.href = "/";   // cadastrou e já está logado: vai para a cantina
            } catch (erro) {
                console.error("Erro ao cadastrar:", erro);
                alert("Ocorreu um erro ao fazer o cadastro.");
            }
        });
    }

    // --- EVENTO: SUBMIT DO FORMULÁRIO DE LOGIN ---
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
                    body: JSON.stringify({ email, senha })
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

    // --- EVENTO: LOGOUT (limpa a sessão no back-end e volta para o login) ---
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
        btnLogout.addEventListener("click", realizarLogout);
    }

    // --- EVENTO: SUBMIT DO FORMULÁRIO DE PRODUTO (cria ou edita, dependendo do modo) ---
    const formProduto = document.getElementById("form-produto");
    if (formProduto) {
        formProduto.addEventListener("submit", async (e) => {
            e.preventDefault();
            const corpo = {
                nome: document.getElementById("produto-nome").value,
                preco_atual: parseFloat(document.getElementById("produto-preco").value),
                quantidade_estoque: parseInt(document.getElementById("produto-estoque").value),
                categoria: document.getElementById("produto-categoria").value,
                ingredientes: document.getElementById("produto-ingredientes").value,
                tabela_nutricional: document.getElementById("produto-tabela").value,
                status: document.getElementById("produto-ativo").checked
            };

            try {
                // Reaproveita as rotas que já existem no backend: POST pra criar, PUT pra editar.
                const url = editandoProdutoId
                    ? `${API_BASE_URL}/produtos/${editandoProdutoId}`
                    : `${API_BASE_URL}/produtos`;
                const res = await fetch(url, {
                    method: editandoProdutoId ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(corpo)
                });

                if (!res.ok) {
                    const erro = await res.json().catch(() => ({}));
                    alert(erro.erro || "Não foi possível salvar o produto.");
                    return;
                }

                const produtoSalvo = await res.json();
                // Se o upload falhar, continua em modo de edição deste produto para tentar de novo sem duplicá-lo.
                editandoProdutoId = produtoSalvo.id_produto;
                await enviarImagem(produtoSalvo.id_produto);
                sairModoEdicaoProduto();
                carregarProdutos();
            } catch (erro) {
                console.error("Erro ao salvar produto:", erro);
                alert(erro.message || "Ocorreu um erro ao salvar o produto.");
                carregarProdutos();
            }
        });
    }

    const btnCancelarEdicaoProduto = document.getElementById("btn-cancelar-edicao-produto");
    if (btnCancelarEdicaoProduto) {
        btnCancelarEdicaoProduto.addEventListener("click", sairModoEdicaoProduto);
    }

    // --- EVENTO: BUSCA/FILTRO DE PRODUTOS (usa GET /api/produtos/buscar) ---
    const formBusca = document.getElementById("form-busca-produto");
    if (formBusca) {
        formBusca.addEventListener("submit", (e) => {
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
    // Botões de categoria (index.html): o clique escolhe a categoria e refaz a busca.
    const filtroCategorias = document.getElementById("filtro-categorias");
    if (filtroCategorias) {
        filtroCategorias.addEventListener("click", (e) => {
            const botao = e.target.closest("button[data-categoria]");
            if (botao) filtrar(botao.dataset.categoria);
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
    const btnCancelarEdicaoPedido = document.getElementById("btn-cancelar-edicao-pedido");
    if (btnCancelarEdicaoPedido) {
        btnCancelarEdicaoPedido.addEventListener("click", fecharEdicaoPedido);
    }

    // --- EVENTO: ENVIAR AVALIAÇÃO DE UM PEDIDO CONCLUÍDO ---
    const formAvaliacao = document.getElementById("form-avaliacao");
    if (formAvaliacao) {
        formAvaliacao.addEventListener("submit", async (e) => {
            e.preventDefault();
            await enviarAvaliacao();
        });
    }

    // Só depois de ligar os formulários, carrega os dados. O aluno vem primeiro: a lista de pedidos precisa saber quem ele é.
    await alunoInf();
    carregarCategorias();
    carregarProdutos();
    carregarPedidos();
    carregarCarrinho();
});

// --- LÓGICA DE ALUNOS ---
// Encerra a sessão no back-end e leva para a tela de login.
async function realizarLogout() {
    try {
        const res = await fetch(`${API_BASE_URL}/alunos/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
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
}

// Apaga a conta do aluno logado (os pedidos dele continuam no histórico).
async function removerAluno() {
    if (confirm("Deseja realmente remover este aluno? Os pedidos que ele já fez serão mantidos no histórico.")) {
        const res = await fetch(`${API_BASE_URL}/alunos/atual`, { method: "DELETE" });
        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            alert(erro.erro || "Não foi possível remover o aluno.");
            return;
        }
        window.location.href = "/front-end/login.html";
    }
}

// Mostra, na página "Minha conta", o formulário para editar nome, e-mail e senha do aluno logado.
async function editarDados() {
    const areaEl = document.getElementById("form-editar-dados");
    const res = await fetch(`${API_BASE_URL}/alunos/atual`);
    if (!res.ok) {
        alert("Não foi possível carregar seus dados.");
        return;
    }
    const aluno = await res.json();

    areaEl.innerHTML = `
        <form id="form-dados-aluno">
            <input type="text" id="aluno-nome" value="${escapeHtml(aluno.nome)}" placeholder="Nome do Aluno" aria-label="Nome" required>
            <input type="email" id="aluno-email" value="${escapeHtml(aluno.email)}" placeholder="E-mail" aria-label="E-mail" required>
            <input type="password" id="aluno-senha" placeholder="Nova senha (opcional)" aria-label="Nova senha">
            <button type="submit">Salvar alterações</button>
            <button type="button" id="btn-cancelar-edicao-aluno">Cancelar</button>
            <p>Deixe a senha em branco para não alterá-la.</p>
        </form>
    `;

    document.getElementById("form-dados-aluno").addEventListener("submit", async (e) => {
        e.preventDefault();
        const corpo = {
            nome: document.getElementById("aluno-nome").value,
            email: document.getElementById("aluno-email").value
        };
        const senha = document.getElementById("aluno-senha").value;
        if (senha) corpo.senha = senha;

        try {
            const resPut = await fetch(`${API_BASE_URL}/alunos/atual`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(corpo)
            });
            if (!resPut.ok) {
                const erro = await resPut.json().catch(() => ({}));
                alert(erro.erro || "Não foi possível salvar seus dados.");
                return;
            }
            window.location.reload();
        } catch (erro) {
            console.error("Erro ao salvar dados do aluno:", erro);
            alert("Ocorreu um erro ao salvar seus dados.");
        }
    });
    document.getElementById("btn-cancelar-edicao-aluno").addEventListener("click", () => {
        areaEl.innerHTML = "";
    });
}

// Busca o aluno logado e mostra o nome (e o e-mail, na página "Minha conta"). Devolve null se não der.
async function alunoInf() {
    const nomeEl = document.getElementById('nome-aluno');
    const emailEl = document.getElementById('email-aluno');
    if (!nomeEl && !emailEl && !document.getElementById("tabela-pedidos")) return null;
    try {
        const res = await fetch(`${API_BASE_URL}/alunos/atual`);
        if (!res.ok) return null;
        alunoAtual = await res.json();
        if (nomeEl) nomeEl.textContent = alunoAtual.nome;
        if (emailEl) emailEl.textContent = alunoAtual.email;
        return alunoAtual;
    } catch (erro) {
        console.error("Erro ao carregar o aluno:", erro);
        return null;
    }
}

// --- LÓGICA DE PRODUTOS ---
// Envia a imagem escolhida no formulário do admin. Sem arquivo escolhido, não faz nada.
async function enviarImagem(idProduto) {
    const imagem = document.getElementById("imagem")?.files[0];
    if (!imagem) return;
    const dados = new FormData();
    dados.append("imagem", imagem);
    const res = await fetch(`${API_BASE_URL}/produtos/${idProduto}/imagem`, {
        method: "POST",
        body: dados
    });
    if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(`O produto foi salvo, mas a imagem não: ${erro.erro || "falha no envio"}. Tente salvar novamente.`);
    }
}

// Busca as categorias no back-end e monta os botões de filtro (index) e os selects (admin).
async function carregarCategorias() {
    const filtroEl = document.getElementById("filtro-categorias");
    const selects = [document.getElementById("produto-categoria"), document.getElementById("busca-categoria")]
        .filter(el => el && el.tagName === "SELECT");
    if (!filtroEl && selects.length === 0) return;

    try {
        const res = await fetch(`${API_BASE_URL}/produtos/categorias`);
        if (!res.ok) return;
        const categorias = await res.json();

        if (filtroEl) {
            filtroEl.innerHTML = [""].concat(categorias).map(categoria => `
                <button type="button" class="btn btn-outline-primary" data-categoria="${escapeHtml(categoria)}">
                    ${categoria ? escapeHtml(categoria) : "Todas"}
                </button>
            `).join("");
        }
        selects.forEach(select => {
            const primeira = select.options[0];   // "Selecione..." / "Todas as categorias"
            select.innerHTML = "";
            select.appendChild(primeira);
            categorias.forEach(categoria => select.appendChild(new Option(categoria, categoria)));
        });
    } catch (erro) {
        console.error("Erro ao carregar categorias:", erro);
    }
}

// Escolhe a categoria dos botões de filtro e refaz a busca.
function filtrar(categoria) {
    const buscaCategoria = document.getElementById("busca-categoria");
    if (!buscaCategoria) return;
    buscaCategoria.value = categoria;
    buscarProdutos();
}

async function carregarProdutos() {
    await buscarProdutos({}); // sem filtros = lista tudo, via a mesma rota de busca
}

// Busca/filtra/ordena produtos usando a rota GET /api/produtos/buscar.
async function buscarProdutos(filtrosForcados) {
    const listaEl = document.getElementById("lista-produtos");               // index.html: cards
    const tabelaAdminEl = document.getElementById("tabela-produtos-admin");  // admin.html: tabela
    if (!listaEl && !tabelaAdminEl) return;

    const campo = (id) => document.getElementById(id)?.value || "";
    const filtros = filtrosForcados || {
        categoria: campo("busca-categoria"),
        preco_min: campo("busca-preco-min"),
        preco_max: campo("busca-preco-max"),
        ordenar: campo("busca-ordenar")
    };

    const params = new URLSearchParams();
    if (filtros.categoria) params.set("categoria", filtros.categoria);
    if (filtros.preco_min) params.set("preco_min", filtros.preco_min);
    if (filtros.preco_max) params.set("preco_max", filtros.preco_max);
    if (filtros.ordenar) params.set("ordenar", filtros.ordenar);
    if (listaEl) params.set("ativos", "1");   // o aluno só vê produtos disponíveis

    try {
        const res = await fetch(`${API_BASE_URL}/produtos/buscar?${params.toString()}`);
        const dados = await res.json();

        if (!res.ok) {
            // O backend devolve {"erro": "..."} quando algo dá errado - mostra pro usuário
            // em vez de deixar a tela de produtos simplesmente parecer "não funcionando".
            alert(dados.erro || "Não foi possível buscar os produtos.");
            return;
        }

        produtosCache = dados;
        if (listaEl) renderizarCardsProdutos(listaEl, dados);
        if (tabelaAdminEl) renderizarTabelaProdutos(tabelaAdminEl, dados);
    } catch (erro) {
        console.error("Erro ao buscar produtos:", erro);
        alert("Ocorreu um erro ao buscar os produtos. Veja o console para detalhes.");
    }
}

// Desenha os produtos como cards (página da cantina).
function renderizarCardsProdutos(listaEl, produtos) {
    if (produtos.length === 0) {
        listaEl.innerHTML = `<p class="col-12">Nenhum produto encontrado.</p>`;
        return;
    }
    listaEl.innerHTML = produtos.map(prod => `
        <div class="col-12 col-sm-6 col-lg-4">
            <div class="card h-100">
                ${prod.imagem_url ? `<img src="${escapeHtml(prod.imagem_url)}" class="card-img-top" alt="Imagem de ${escapeHtml(prod.nome)}" loading="lazy">` : ""}
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${escapeHtml(prod.nome)}</h5>
                    <h4>${formatarMoeda(prod.preco_atual)}</h4>
                    <p class="card-text text-body-secondary">${escapeHtml(prod.ingredientes || "")}</p>
                    <p class="card-text"><small>${escapeHtml(prod.categoria || "")} · Estoque: ${prod.quantidade_estoque}</small></p>
                    <div class="input-group mt-auto">
                        <input type="number" id="qtd-produto-${prod.id_produto}" class="form-control" value="1" min="1" aria-label="Quantidade de ${escapeHtml(prod.nome)}">
                        <button type="button" class="btn btn-primary" onclick="adicionarItemAoCarrinho(${prod.id_produto})">Adicionar ao pedido</button>
                    </div>
                </div>
            </div>
        </div>
    `).join("");
}

// Desenha os produtos como linhas de tabela (página do administrador).
function renderizarTabelaProdutos(tabelaEl, produtos) {
    if (produtos.length === 0) {
        tabelaEl.innerHTML = `<tr><td colspan="6">Nenhum produto encontrado.</td></tr>`;
        return;
    }
    tabelaEl.innerHTML = produtos.map(prod => `
        <tr>
            <td>${prod.id_produto}</td>
            <td>
                ${prod.imagem_url ? `<img src="${escapeHtml(prod.imagem_url)}" alt="Imagem de ${escapeHtml(prod.nome)}" width="80" loading="lazy">` : ""}
                ${escapeHtml(prod.nome)}${prod.status ? "" : " (indisponível)"}
            </td>
            <td>${formatarMoeda(prod.preco_atual)}</td>
            <td>${prod.quantidade_estoque}</td>
            <td>${escapeHtml(prod.categoria || "")}</td>
            <td>
                <button class="editar" onclick="editarProduto(${prod.id_produto})">Editar</button>
                <button class="excluir" onclick="removerProduto(${prod.id_produto})">Excluir</button>
            </td>
        </tr>
    `).join("");
}

// Coloca o produto escolhido no formulário e passa para o modo "editar".
function editarProduto(id) {
    const produto = produtosCache.find(p => p.id_produto === id);
    if (!produto) return;

    editandoProdutoId = id;
    document.getElementById("produto-nome").value = produto.nome;
    document.getElementById("produto-preco").value = produto.preco_atual;
    document.getElementById("produto-estoque").value = produto.quantidade_estoque;
    document.getElementById("produto-categoria").value = produto.categoria || "";
    document.getElementById("produto-ingredientes").value = produto.ingredientes || "";
    document.getElementById("produto-tabela").value = produto.tabela_nutricional || "";
    document.getElementById("produto-ativo").checked = produto.status;
    document.getElementById("btn-salvar-produto").textContent = "Salvar Edição";
    document.getElementById("btn-cancelar-edicao-produto").style.display = "inline-block";
    document.getElementById("produto-nome").scrollIntoView({ behavior: "smooth", block: "center" });
}

// Volta o formulário de produto para o modo "cadastrar".
function sairModoEdicaoProduto() {
    editandoProdutoId = null;
    document.getElementById("form-produto").reset();
    document.getElementById("btn-salvar-produto").textContent = "Cadastrar Produto";
    document.getElementById("btn-cancelar-edicao-produto").style.display = "none";
}

async function removerProduto(id) {
    if (confirm("Deseja realmente remover este produto? Os pedidos que já o incluem serão mantidos no histórico.")) {
        const res = await fetch(`${API_BASE_URL}/produtos/${id}`, { method: "DELETE" });
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
            body: JSON.stringify({ id_produto, quantidade })
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

// Busca o carrinho do aluno logado no backend.
async function carregarCarrinho() {
    if (!document.getElementById("tabela-carrinho")) return;   // página sem carrinho
    try {
        const res = await fetch(`${API_BASE_URL}/carrinho`);
        renderizarCarrinho(res.ok ? await res.json() : null);
    } catch (erro) {
        console.error("Erro ao carregar carrinho:", erro);
    }
}

// Desenha os itens do carrinho e o total.
function renderizarCarrinho(carrinho) {
    const tabela = document.getElementById("tabela-carrinho");
    const totalEl = document.getElementById("carrinho-total");
    if (!tabela || !totalEl) return;

    const itens = carrinho ? carrinho.itens : [];
    tabela.innerHTML = itens.length === 0
        ? `<tr><td colspan="4">Seu carrinho está vazio.</td></tr>`
        : itens.map(item => `
            <tr>
                <td>${escapeHtml(item.produto_nome)}</td>
                <td>${item.quantidade}</td>
                <td>${formatarMoeda(item.subtotal)}</td>
                <td><button class="excluir" onclick="removerItemDoCarrinho(${item.id_item_pedido})">Remover</button></td>
            </tr>
        `).join("");

    const total = carrinho ? carrinho.valor_total : 0;
    totalEl.textContent = `Total: ${formatarMoeda(total)}`;
}

async function finalizarPedido() {
    try {
        const res = await fetch(`${API_BASE_URL}/carrinho/finalizar`, { method: "POST" });
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
async function carregarPedidos() {
    const tabela = document.getElementById("tabela-pedidos");
    if (!tabela) return;   // página sem lista de pedidos

    try {
        const res = await fetch(`${API_BASE_URL}/pedidos`);
        if (!res.ok) return;
        const pedidos = await res.json();
        pedidosCache = pedidos;

        tabela.innerHTML = pedidos.length === 0
            ? `<tr><td colspan="6">Nenhum pedido ainda.</td></tr>`
            : pedidos.map(ped => {
                const listaProdutos = ped.itens
                    .map(item => `${item.quantidade}x ${item.produto_nome}`)
                    .join(", ");

                const botaoConcluir = ped.status !== "Concluído"
                    ? `<button class="concluir" onclick="concluirPedido(${ped.id_pedido})">Concluir</button>`
                    : "";

                // Só o dono avalia, e só pedido concluído que ainda não foi avaliado.
                const ehDoAluno = alunoAtual && ped.id_aluno === alunoAtual.id_aluno;
                let botaoAvaliar = "";
                if (ped.status === "Concluído" && ehDoAluno) {
                    botaoAvaliar = ped.avaliado
                        ? "Avaliado"
                        : `<button class="avaliar" onclick="abrirAvaliacao(${ped.id_pedido})">Avaliar</button>`;
                }

                return `
                    <tr>
                        <td>${ped.id_pedido}</td>
                        <td>${escapeHtml(ped.aluno_nome)}</td>
                        <td>${escapeHtml(listaProdutos)}</td>
                        <td>${escapeHtml(ped.status)}</td>
                        <td>${formatarMoeda(ped.valor_total)}</td>
                        <td>
                            <button class="editar" onclick="editarPedido(${ped.id_pedido})">Editar</button>
                            ${botaoConcluir}
                            ${botaoAvaliar}
                        </td>
                    </tr>
                `;
            }).join("");
    } catch (erro) {
        console.error("Erro ao carregar pedidos:", erro);
    }
}

// Preenche o formulário de edição com o pedido escolhido.
function editarPedido(id) {
    const pedido = pedidosCache.find(p => p.id_pedido === id);
    if (!pedido) return;

    document.getElementById("editar-pedido-id").value = pedido.id_pedido;
    document.getElementById("editar-pedido-status").value = pedido.status;

    // datetime-local espera "YYYY-MM-DDTHH:MM", sem os segundos/timezone do ISO vindo do backend
    const horarioInput = document.getElementById("editar-pedido-horario");
    horarioInput.value = pedido.horario_agendado_retirada
        ? pedido.horario_agendado_retirada.slice(0, 16)
        : "";

    document.getElementById("form-editar-pedido").style.display = "flex";
    document.getElementById("form-editar-pedido").scrollIntoView({ behavior: "smooth", block: "center" });
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
                horario_agendado_retirada: horario || null
            })
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
        try {
            const res = await fetch(`${API_BASE_URL}/pedidos/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Concluído" })
            });
            if (!res.ok) {
                const erro = await res.json().catch(() => ({}));
                alert(erro.erro || "Não foi possível concluir o pedido.");
                return;
            }

            carregarPedidos();
        } catch (erro) {
            console.error("Erro ao concluir pedido:", erro);
            alert("Ocorreu um erro ao atualizar o status do pedido.");
        }
    }
}

// --- LÓGICA DE AVALIAÇÃO ---
// Abre a janela de avaliação do pedido escolhido.
function abrirAvaliacao(idPedido) {
    document.getElementById("form-avaliacao").reset();
    document.getElementById("avaliacao-pedido-id").value = idPedido;
    bootstrap.Modal.getOrCreateInstance(document.getElementById("modal-avaliacao")).show();
}

// Envia nota e comentário para POST /api/pedidos/<id>/avaliacao.
async function enviarAvaliacao() {
    const idPedido = document.getElementById("avaliacao-pedido-id").value;
    const corpo = {
        nota: parseInt(document.getElementById("avaliacao-nota").value),
        comentario: document.getElementById("avaliacao-comentario").value
    };

    try {
        const res = await fetch(`${API_BASE_URL}/pedidos/${idPedido}/avaliacao`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(corpo)
        });
        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            alert(erro.erro || "Não foi possível enviar a avaliação.");
            return;
        }

        bootstrap.Modal.getOrCreateInstance(document.getElementById("modal-avaliacao")).hide();
        carregarPedidos();
    } catch (erro) {
        console.error("Erro ao enviar avaliação:", erro);
        alert("Ocorreu um erro ao enviar a avaliação.");
    }
}

// --- UTIL ---
// Troca os caracteres especiais do HTML (< > & " ') para o texto da API aparecer como texto, e não como código.
function escapeHtml(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Formata um número como dinheiro brasileiro (R$ 1.234,50).
function formatarMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor) || 0);
}
