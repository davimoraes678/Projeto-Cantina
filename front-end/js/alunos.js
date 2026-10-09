// URL base da API
const API_BASE_URL = "http://127.0.0.1:5000/api";

// Guarda o ID do aluno/produto em edição (null = formulário está em modo "cadastrar").
let editandoAlunoId = null;
let editandoProdutoId = null;



document.addEventListener("DOMContentLoaded", () => {

    // Carrega as tabelas e selects ao iniciar
    carregarAlunos();
    carregarProdutos();
    carregarPedidos();
    carregarCarrinho();
    AlunoInf();

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
                    res = await fetch(`${API_BASE_URL}/alunos/registro`, {
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
                if (!editandoAlunoId) {
                    window.location.href = "/";   // cadastrou e já está logado: vai para a cantina
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

                const produtoSalvo = await res.json();
                // Se o upload falhar, mantém o ID para tentar novamente sem duplicar o produto.
                editarProduto(produtoSalvo.id_produto, produtoSalvo.nome,
                    produtoSalvo.preco_atual, produtoSalvo.quantidade_estoque, produtoSalvo.categoria || "");
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
        const elementoContador = document.getElementById('contador');
        
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
    const resposta = await fetch(`${API_BASE_URL}/produtos/${idProduto}/imagem`, {
        method: "POST",
        body: dados
    });

    if (!resposta.ok) {
        throw new Error("O produto foi salvo, mas a imagem não foi enviada.");
    }
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

    // --- EVENTO: TROCAR O ALUNO MOSTRA O CARRINHO DELE ---
    const selectAluno = document.getElementById("select-aluno");
    if (selectAluno) {
        selectAluno.addEventListener("change", carregarCarrinho);
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
});

// --- LÓGICA DE ALUNOS ---
async function carregarAlunos() {
    try {
        const res = await fetch(`${API_BASE_URL}/alunos`);
        const alunos = await res.json();

        const tabela = document.getElementById("tabela-alunos");
        const select = document.getElementById("select-aluno");
        if (!tabela && !select) return;

        if (tabela) tabela.innerHTML = "";
        const alunoSelecionado = select ? select.value : "";
        if (select) select.innerHTML = '<option value="">Selecione o Aluno...</option>';

        alunos.forEach(aluno => {
            if (tabela) tabela.innerHTML += `
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
            if (select) select.innerHTML += `<option value="${aluno.id_aluno}">${aluno.nome}</option>`;
        });

        // Mantém o aluno selecionado ao recarregar a lista (ex: depois de adicionar um item ao carrinho)
        if (select && alunoSelecionado) select.value = alunoSelecionado;
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
        const tabela = document.getElementById("tabela-produtos")
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
            produtos.forEach(prod => {
            tabela.innerHTML += `
                <tr>
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
                        <input type="number" id="qtd-produto-${prod.id_produto}" value="1" min="1" style="width: 70px; min-width: 70px;">
                        <button type="button" onclick="adicionarItemAoCarrinho(${prod.id_produto})">Adicionar ao pedido</button>
                    </td>
                </tr>
            `
        })
        }
        if (tabela_admin) {
            produtos.forEach(prod => {
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

// LOGICA DO LOGIN DO USUARIO

async function alunoLogado() {
    const res = await fetch(`${API_BASE_URL}/alunos/atual`);
    const aluno_inf = await res.json();
    return aluno_inf.id_aluno;
}


async function alunoInf() {
    const res = await fetch(`${API_BASE_URL}/alunos/atual`);
    const aluno_inf = await res.json();
    document.getElementById('nome-aluno').innerHTML = aluno_inf.nome;
    document.getElementById('email-aluno').innerHTML = aluno_inf.email;
}

// --- LÓGICA DO CARRINHO (permite adicionar vários produtos a um mesmo pedido) ---
// Grava o produto como ItemPedido no carrinho (pedido "Carrinho") do aluno.
async function adicionarItemAoCarrinho(id_produto) {
    const id_aluno = await alunoLogado();

    const inputQuantidade = document.getElementById(`qtd-produto-${id_produto}`);
    const quantidade = parseInt(inputQuantidade.value);
    if (!quantidade || quantidade < 1) {
        alert("Informe uma quantidade válida.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/carrinho/${id_aluno}/itens`, {
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

// Busca o carrinho do aluno selecionado no backend.
async function carregarCarrinho() {
    const id_aluno = await alunoLogado();
    if (!id_aluno) {
        renderizarCarrinho(null);
        return;
    }
    try {
        const res = await fetch(`${API_BASE_URL}/carrinho/${id_aluno}`);
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
    itens.forEach(item => {
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
    const id_aluno = await alunoLogado();
    try {
        const res = await fetch(`${API_BASE_URL}/carrinho/${id_aluno}/finalizar`, { method: "POST" });
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
