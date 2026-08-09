// URL base da API
const API_BASE_URL = "http://127.0.0.1:5000/api";

// Carrinho do pedido atual: lista de itens que ainda não foram enviados ao backend.
// Cada item: { id_produto, nome, preco, quantidade }
let carrinho = [];

document.addEventListener("DOMContentLoaded", () => {

    // Carrega as tabelas e selects ao iniciar
    carregarAlunos();
    carregarProdutos();
    carregarPedidos();
    renderizarCarrinho();

    // --- EVENTO: SUBMIT DO FORMULÁRIO DE ALUNO ---
    const formAluno = document.getElementById("form-aluno");
    if (formAluno) {
        formAluno.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nome = document.getElementById("aluno-nome").value;
            const email = document.getElementById("aluno-email").value;
            const senha = document.getElementById("aluno-senha").value;

            await fetch(`${API_BASE_URL}/alunos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nome, email, senha })
            });

            formAluno.reset();
            carregarAlunos();
        });
    }

    // --- EVENTO: SUBMIT DO FORMULÁRIO DE PRODUTO ---
    const formProduto = document.getElementById("form-produto");
    if (formProduto) {
        formProduto.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nome = document.getElementById("produto-nome").value;
            const preco_atual = parseFloat(document.getElementById("produto-preco").value);
            const quantidade_estoque = parseInt(document.getElementById("produto-estoque").value);
            const categoria = document.getElementById("produto-categoria").value;

            await fetch(`${API_BASE_URL}/produtos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nome, preco_atual, quantidade_estoque, categoria })
            });

            formProduto.reset();
            carregarProdutos();
        });
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
                    <td><button class="excluir" onclick="removerAluno(${aluno.id_aluno})">Excluir</button></td>
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

async function removerAluno(id) {
    if (confirm("Deseja realmente remover este aluno? Os pedidos que ele já fez serão mantidos no histórico.")) {
        const res = await fetch(`${API_BASE_URL}/alunos/${id}`, { method: "DELETE" });
        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            alert(erro.erro || "Não foi possível remover o aluno.");
            return;
        }
        carregarAlunos();
        carregarPedidos();
    }
}

// --- LÓGICA DE PRODUTOS ---
async function carregarProdutos() {
    await buscarProdutos({}); // sem filtros = lista tudo, via a mesma rota de busca
}

// Busca/filtra/ordena produtos usando a rota GET /api/produtos/buscar,
// que reaproveita, do lado da aplicação, a lógica das procedures do SQL
// (buscar_por_categoria, ordenar_por_preco, ordenar_por_nome, buscar_por_faixa_de_preco).
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
        const produtos = await res.json();

        const tabela = document.getElementById("tabela-produtos");
        const select = document.getElementById("select-produto");
        if (!tabela || !select) return;

        tabela.innerHTML = "";
        const produtoSelecionado = select.value;
        select.innerHTML = '<option value="">Selecione o Produto...</option>';

        produtos.forEach(prod => {
            tabela.innerHTML += `
                <tr>
                    <td>${prod.id_produto}</td>
                    <td>${prod.nome}</td>
                    <td>R$ ${parseFloat(prod.preco_atual).toFixed(2)}</td>
                    <td>${prod.quantidade_estoque}</td>
                    <td>${prod.categoria || ""}</td>
                    <td><button class="excluir" onclick="removerProduto(${prod.id_produto})">Excluir</button></td>
                </tr>
            `;
            select.innerHTML += `<option value="${prod.id_produto}" data-nome="${prod.nome}" data-preco="${prod.preco_atual}">${prod.nome} - R$ ${parseFloat(prod.preco_atual).toFixed(2)}</option>`;
        });

        if (produtoSelecionado) select.value = produtoSelecionado;
    } catch (erro) {
        console.error("Erro ao buscar produtos:", erro);
    }
}

async function removerProduto(id) {
    if (confirm("Deseja realmente remover este produto? Os pedidos que já o incluem serão mantidos no histórico.")) {
        const res = await fetch(`${API_BASE_URL}/produtos/${id}`, { method: "DELETE" });
        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            alert(erro.erro || "Não foi possível remover o produto.");
            return;
        }
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
async function carregarPedidos() {
    try {
        const res = await fetch(`${API_BASE_URL}/pedidos`);
        const pedidos = await res.json();
        const tabela = document.getElementById("tabela-pedidos");
        if (!tabela) return;

        tabela.innerHTML = "";

        pedidos.forEach(ped => {
            const listaProdutos = ped.itens
                .map(item => `${item.quantidade}x ${item.produto_nome}`)
                .join(", ");

            tabela.innerHTML += `
                <tr>
                    <td>${ped.id_pedido}</td>
                    <td>${ped.aluno_nome}</td>
                    <td>${listaProdutos}</td>
                    <td>${ped.status}</td>
                    <td>R$ ${parseFloat(ped.valor_total).toFixed(2)}</td>
                    <td>${ped.status !== "Concluído" ? `<button class="concluir" onclick="concluirPedido(${ped.id_pedido})">Concluir</button>` : ""}</td>
                </tr>
            `;
        });
    } catch (erro) {
        console.error("Erro ao carregar pedidos:", erro);
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
