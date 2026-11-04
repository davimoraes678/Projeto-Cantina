// =============================================================================
// comum.js: funções usadas por todas as páginas. Cada página carrega este
// arquivo primeiro e depois o seu próprio (ex.: index.html -> cardapio.js).
// =============================================================================

// Chama a API do back-end e devolve { ok, dados }.
//   ok    -> true se deu certo (código 2xx)
//   dados -> a resposta em JSON (em caso de erro, vem { erro: "mensagem" })
// Exemplo: const { ok, dados } = await api("/carrinho/itens", "POST", { id_produto: 1, quantidade: 2 });
async function api(caminho, metodo = "GET", corpo = null) {
  const opcoes = { method: metodo };
  if (corpo) {
    opcoes.headers = { "Content-Type": "application/json" };
    opcoes.body = JSON.stringify(corpo);
  }
  const res = await fetch("/api" + caminho, opcoes);
  const dados = await res.json().catch(() => ({}));
  return { ok: res.ok, dados };
}

// Mostra um aviso rápido no topo da tela (toast do Bootstrap, #aviso no HTML).
// tipo: "sucesso" (verde) ou "erro" (vermelho). No login e no cadastro vira um alert.
function avisar(mensagem, tipo = "sucesso") {
  const aviso = document.getElementById("aviso");
  if (!aviso) {
    alert(mensagem);
    return;
  }
  aviso.classList.toggle("text-bg-success", tipo === "sucesso");
  aviso.classList.toggle("text-bg-danger", tipo === "erro");
  document.getElementById("aviso-texto").textContent = mensagem;
  bootstrap.Toast.getOrCreateInstance(aviso).show();
}

// Busca o aluno logado (GET /alunos/atual) e:
//   - preenche os elementos com data-aluno="nome", "primeiro-nome", "iniciais", "email", "saldo" ou "funcao"
//   - mostra o que é só de admin (.so-admin) e só do mestre (.so-mestre)
// Devolve o aluno, para a página usar (ex.: o saldo no carrinho).
// Esconder na tela não protege nada: quem bloqueia de verdade é o back-end.
async function carregarAluno() {
  const { ok, dados: aluno } = await api("/alunos/atual");
  if (!ok) return null;

  const partes = aluno.nome.split(" ");
  const valores = {
    nome: aluno.nome,
    "primeiro-nome": partes[0],
    iniciais: (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase(), // "Davi Moraes" -> "DM"
    email: aluno.email,
    saldo: reais(aluno.saldo),
    funcao: aluno.funcao,
  };
  document.querySelectorAll("[data-aluno]").forEach((el) => {
    el.textContent = valores[el.dataset.aluno];
  });

  if (aluno.funcao === "admin" || aluno.funcao === "mestre") {
    document.querySelectorAll(".so-admin").forEach((el) => el.classList.remove("d-none"));
  }
  if (aluno.funcao === "mestre") {
    document.querySelectorAll(".so-mestre").forEach((el) => el.classList.remove("d-none"));
  }
  return aluno;
}

// Botões "Sair" (classe btn-logout): encerra o login e volta para a tela de login.
document.querySelectorAll(".btn-logout").forEach((botao) => {
  botao.addEventListener("click", async () => {
    await api("/alunos/logout", "POST");
    window.location.href = "/front-end/login.html";
  });
});

// 12.5 -> "R$ 12,50"
function reais(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// "2026-11-03T17:32:00" -> "03/11, 14:32"
// O back-end grava a hora em UTC; o "Z" no fim avisa o navegador, que converte
// para o horário de quem está vendo.
function formatarData(texto) {
  if (!texto) return "";
  return new Date(texto + "Z").toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

// Troca os caracteres especiais do HTML (< > & " '). Usado em tudo que vem do
// usuário (nomes, e-mails) antes de ir para o innerHTML: assim um nome como
// "<b>Ana</b>" aparece escrito, e não vira código na página.
function escapeHtml(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

// Código de retirada do pedido (ex.: "4aZ9"). Pedidos de antes do código
// existir não têm um: aí mostra o número ("#12").
function codigoPedido(pedido) {
  return pedido.codigo || `#${pedido.id_pedido}`;
}
