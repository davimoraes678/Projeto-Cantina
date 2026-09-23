// URL base da API
const API_BASE_URL = "http://127.0.0.1:5000/api";

// Carrinho do pedido atual: lista de itens que ainda não foram enviados ao backend.
// Cada item: { id_produto, nome, preco, quantidade }
let carrinho = [];

// Guarda o ID do aluno/produto em edição (null = formulário está em modo "cadastrar").
let editandoAlunoId = null;
let editandoProdutoId = null;

document.addEventListener("DOMContentLoaded", () => {

    // Carrega as tabelas e selects ao iniciar
    carregarAlunos();
    carregarProdutos();
    carregarPedidos();
    renderizarCarrinho();

    // --- EVENTO: SUBMIT DO FORMULÁRIO DE ALUNO (cria ou edita, dependendo do modo) ---
    const formAluno = document.getElementById("form-aluno");
    if (formAluno) {
        formAluno.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nome = document.getElementById("aluno-nome").value;
            const email = document.getElementById("aluno-email").value;
            const senha = document.getElementById("aluno-senha").value;

            try {
                let res;
                if (editandoAlunoId) {
                    // Edição: senha em branco = mantém a senha atual (o backend já trata isso)
                    const corpo = { nome, email };
                    if (senha) corpo.senha = senha;
                    res = await fetch(`${API_BASE_URL}/alunos/${editandoAlunoId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(corpo)
                    });
                } else {
                    if (!senha) {
                        alert("Informe uma senha para cadastrar o aluno.");
                        return;
                    }
                    res = await fetch(`${API_BASE_URL}/alunos`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ nome, email, senha })
                    });
                }

                if (!res.ok) {
                    const erro = await res.json().catch(() => ({}));
                    alert(erro.erro || "Não foi possível salvar o aluno.");
                    return;
                }

                sairModoEdicaoAluno();
                carregarAlunos();
            } catch (erro) {
                console.error("Erro ao salvar aluno:", erro);
                alert("Ocorreu um erro ao salvar o aluno.");
            }
        });
    }

    const btnCancelarEdicaoAluno = document.getElementById("btn-cancelar-edicao-aluno");
    if (btnCancelarEdicaoAluno) {
        btnCancelarEdicaoAluno.addEventListener("click", sairModoEdicaoAluno);
    }

    // --- EVENTO: SUBMIT DO FORMULÁRIO DE PRODUTO (cria ou edita, dependendo do modo) ---
    const formProduto = document.getElementById("form-produto");
    if (formProduto) {
        formProduto.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nome = document.getElementById("produto-nome").value;
            const preco_atual = parseFloat(document.getElementById("produto-preco").value);
            const quantidade_estoque = parseInt(document.getElementById("produto-estoque").value);
            const categoria = document.getElementById("produto-categoria").value;
            const corpo = { nome, preco_atual, quantidade_estoque, categoria };

            try {
                // Reaproveita as rotas que já existem no backend: POST pra criar, PUT pra editar.
                const res = editandoProdutoId
                    ? await fetch(`${API_BASE_URL}/produtos/${editandoProdutoId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(corpo)
                    })
                    : await fetch(`${API_BASE_URL}/produtos`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(corpo)
                    });

                if (!res.ok) {
                    const erro = await res.json().catch(() => ({}));
                    alert(erro.erro || "Não foi possível salvar o produto.");
                    return;
                }

                sairModoEdicaoProduto();
                carregarProdutos();
            } catch (erro) {
                console.error("Erro ao salvar produto:", erro);
                alert("Ocorreu um erro ao salvar o produto.");
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

    // --- EVENTO: ADICIONAR ITEM AO CARRINHO DO PEDIDO ---
    const formItemPedido = document.getElementById("form-item-pedido");
    if (formItemPedido) {
        formItemPedido.addEventListener("submit", (e) => {
            e.preventDefault();
            adicionarItemAoCarrinho();
        });
    }

    // --- EVENTO: FINALIZAR PEDIDO (envia o carrinho inteiro) ---
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
});

// --- LÓGICA DE ALUNOS ---
async function carregarAlunos() {
    try {
        const res = await fetch(`${API_BASE_URL}/alunos`);
        const alunos = await res.json();

        const tabela = document.getElementById("tabela-alunos");
        const select = document.getElementById("select-aluno");
        if (!tabela || !select) return;

        tabela.innerHTML = "";
        const alunoSelecionado = select.value;
        select.innerHTML = '<option value="">Selecione o Aluno...</option>';

        alunos.forEach(aluno => {
            tabela.innerHTML += `
                <tr>
                    <td>${aluno.id_aluno}</td>
                    <td>${aluno.nome}</td>
                    <td>${aluno.email}</td>
                    <td>R$ ${parseFloat(aluno.saldo || 0).toFixed(2)}</td>
                    <td>
                        <button class="editar" onclick="editarAluno(${aluno.id_aluno}, '${escapeAttr(aluno.nome)}', '${escapeAttr(aluno.email)}')">Editar</button>
                        <button class="excluir" onclick="removerAluno(${aluno.id_aluno})">Excluir</button>
                    </td>
                </tr>
            `;
            select.innerHTML += `<option value="${aluno.id_aluno}">${aluno.nome}</option>`;
        });

        // Mantém o aluno selecionado ao recarregar a lista (ex: depois de adicionar um item ao carrinho)
        if (alunoSelecionado) select.value = alunoSelecionado;
    } catch (erro) {
        console.error("Erro ao carregar alunos:", erro);
    }
}

function editarAluno(id, nome, email) {
    editandoAlunoId = id;
    document.getElementById("aluno-nome").value = nome;
    document.getElementById("aluno-email").value = email;
    document.getElementById("aluno-senha").value = "";
    document.getElementById("aluno-senha").placeholder = "Nova senha (opcional)";
    document.getElementById("btn-salvar-aluno").textContent = "Salvar Edição";
    document.getElementById("btn-cancelar-edicao-aluno").style.display = "inline-block";
    document.getElementById("aviso-edicao-aluno").style.display = "block";
    document.getElementById("aluno-nome").scrollIntoView({ behavior: "smooth", block: "center" });
}

function sairModoEdicaoAluno() {
    editandoAlunoId = null;
    document.getElementById("form-aluno").reset();
    document.getElementById("aluno-senha").placeholder = "Senha";
    document.getElementById("btn-salvar-aluno").textContent = "Cadastrar Aluno";
    document.getElementById("btn-cancelar-edicao-aluno").style.display = "none";
    document.getElementById("aviso-edicao-aluno").style.display = "none";
}

async function removerAluno(id) {
    if (confirm("Deseja realmente remover este aluno? Os pedidos que ele já fez serão mantidos no histórico.")) {
        const res = await fetch(`${API_BASE_URL}/alunos/${id}`, { method: "DELETE" });
        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            alert(erro.erro || "Não foi possível remover o aluno.");
            return;
        }
        if (editandoAlunoId === id) sairModoEdicaoAluno();
        carregarAlunos();
        carregarPedidos();
    }
}

// --- LÓGICA DE PRODUTOS ---
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
        ordenar: ordenarEl ? ordenarEl.value : ""
    };

    if (filtros.categoria) params.set("categoria", filtros.categoria);
    if (filtros.preco_min) params.set("preco_min", filtros.preco_min);
    if (filtros.preco_max) params.set("preco_max", filtros.preco_max);
    if (filtros.ordenar) params.set("ordenar", filtros.ordenar);

    try {
        const res = await fetch(`${API_BASE_URL}/produtos/buscar?${params.toString()}`);
        const dados = await res.json();

        if (!res.ok) {
            // O backend devolve {"erro": "..."} quando algo dá errado - mostra pro usuário
            // em vez de deixar a tela de produtos simplesmente parecer "não funcionando".
            alert(dados.erro || "Não foi possível buscar os produtos.");
            return;
        }

        const produtos = dados;
        const tabela = document.getElementById("tabela-produtos");
        const select = document.getElementById("select-produto");
        if (!tabela || !select) return;

        tabela.innerHTML = "";
        const produtoSelecionado = select.value;
        select.innerHTML = '<option value="">Selecione o Produto...</option>';

        if (produtos.length === 0) {
            tabela.innerHTML = `<tr><td colspan="6">Nenhum produto encontrado.</td></tr>`;
        }

        produtos.forEach(prod => {
            tabela.innerHTML += `
                <tr>
                    <td>${prod.id_produto}</td>
                    <td>${prod.nome}</td>
                    <td>R$ ${parseFloat(prod.preco_atual).toFixed(2)}</td>
                    <td>${prod.quantidade_estoque}</td>
                    <td>${prod.categoria || ""}</td>
                    <td>
                        <button class="editar" onclick="editarProduto(${prod.id_produto}, '${escapeAttr(prod.nome)}', ${prod.preco_atual}, ${prod.quantidade_estoque}, '${escapeAttr(prod.categoria || "")}')">Editar</button>
                        <button class="excluir" onclick="removerProduto(${prod.id_produto})">Excluir</button>
                    </td>
                </tr>
            `;
            select.innerHTML += `<option value="${prod.id_produto}" data-nome="${prod.nome}" data-preco="${prod.preco_atual}">${prod.nome} - R$ ${parseFloat(prod.preco_atual).toFixed(2)}</option>`;
        });

        if (produtoSelecionado) select.value = produtoSelecionado;
    } catch (erro) {
        console.error("Erro ao buscar produtos:", erro);
        alert("Ocorreu um erro ao buscar os produtos. Veja o console para detalhes.");
    }
}

function editarProduto(id, nome, preco, estoque, categoria) {
    editandoProdutoId = id;
    document.getElementById("produto-nome").value = nome;
    document.getElementById("produto-preco").value = preco;
    document.getElementById("produto-estoque").value = estoque;
    document.getElementById("produto-categoria").value = categoria;
    document.getElementById("btn-salvar-produto").textContent = "Salvar Edição";
    document.getElementById("btn-cancelar-edicao-produto").style.display = "inline-block";
    document.getElementById("produto-nome").scrollIntoView({ behavior: "smooth", block: "center" });
}

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
function adicionarItemAoCarrinho() {
    const selectProduto = document.getElementById("select-produto");
    const inputQuantidade = document.getElementById("pedido-quantidade");

    const opcao = selectProduto.options[selectProduto.selectedIndex];
    const id_produto = parseInt(selectProduto.value);
    const quantidade = parseInt(inputQuantidade.value);

    if (!id_produto || !quantidade || quantidade < 1) {
        alert("Selecione um produto e uma quantidade válida.");
        return;
    }

    const nome = opcao.dataset.nome;
    const preco = parseFloat(opcao.dataset.preco);

    // Se o produto já está no carrinho, apenas soma a quantidade
    const itemExistente = carrinho.find(i => i.id_produto === id_produto);
    if (itemExistente) {
        itemExistente.quantidade += quantidade;
    } else {
        carrinho.push({ id_produto, nome, preco, quantidade });
    }

    inputQuantidade.value = 1;
    selectProduto.value = "";
    renderizarCarrinho();
}

function removerItemDoCarrinho(id_produto) {
    carrinho = carrinho.filter(i => i.id_produto !== id_produto);
    renderizarCarrinho();
}

function renderizarCarrinho() {
    const tabela = document.getElementById("tabela-carrinho");
    const totalEl = document.getElementById("carrinho-total");
    if (!tabela || !totalEl) return;

    tabela.innerHTML = "";
    let total = 0;

    carrinho.forEach(item => {
        const subtotal = item.preco * item.quantidade;
        total += subtotal;
        tabela.innerHTML += `
            <tr>
                <td>${item.nome}</td>
                <td>${item.quantidade}</td>
                <td>R$ ${subtotal.toFixed(2)}</td>
                <td><button class="excluir" onclick="removerItemDoCarrinho(${item.id_produto})">Remover</button></td>
            </tr>
        `;
    });

    totalEl.textContent = `Total: R$ ${total.toFixed(2)}`;
}

async function finalizarPedido() {
    const id_aluno = parseInt(document.getElementById("select-aluno").value);

    if (!id_aluno) {
        alert("Selecione o aluno do pedido.");
        return;
    }
    if (carrinho.length === 0) {
        alert("Adicione pelo menos um produto ao pedido.");
        return;
    }

    const itens = carrinho.map(i => ({ id_produto: i.id_produto, quantidade: i.quantidade }));

    try {
        const res = await fetch(`${API_BASE_URL}/pedidos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_aluno, itens })
        });

        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            alert(erro.erro || "Não foi possível criar o pedido.");
            return;
        }

        carrinho = [];
        renderizarCarrinho();
        document.getElementById("select-aluno").value = "";
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

        pedidos.forEach(ped => {
            const listaProdutos = ped.itens
                .map(item => `${item.quantidade}x ${item.produto_nome}`)
                .join(", ");

            const botaoConcluir = ped.status !== "Concluído"
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
            await fetch(`${API_BASE_URL}/pedidos/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Concluído" })
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
