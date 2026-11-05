// =============================================================================
// comum.js: funções usadas por todas as páginas.
// Cada página carrega este arquivo primeiro e depois o seu próprio
// (ex.: index.html -> comum.js + cardapio.js).
// =============================================================================

// URL base da API (mesmo endereço da página)
const API_BASE_URL = "/api";

// Mostra os dados do aluno logado (GET /alunos/atual) nos elementos da página
// que tiverem as classes: nome-aluno, email-aluno, saldo-aluno e funcao-aluno.
// Devolve o aluno (ou null).
async function alunoInf() {
  try {
    const res = await fetch(`${API_BASE_URL}/alunos/atual`);
    if (!res.ok) return null; // não está logado
    const aluno = await res.json();

    document.querySelectorAll(".nome-aluno").forEach((el) => (el.textContent = aluno.nome));
    document.querySelectorAll(".email-aluno").forEach((el) => (el.textContent = aluno.email));
    document.querySelectorAll(".saldo-aluno").forEach((el) => (el.textContent = formatarPreco(aluno.saldo)));
    document.querySelectorAll(".funcao-aluno").forEach((el) => (el.textContent = aluno.funcao));

    funcaoPorAluno(aluno.funcao);
    return aluno;
  } catch (erro) {
    console.error("Erro ao buscar o aluno:", erro);
    return null;
  }
}

// Mostra o que cada função pode ver. Os elementos .so-admin e .so-mestre começam
// escondidos (classe d-none). Isso só esconde da tela: quem bloqueia de verdade é o back-end.
//   admin  -> .so-admin (ex.: link "Administração")
//   mestre -> .so-admin e .so-mestre (abas Produtos e Alunos)
function funcaoPorAluno(funcao) {
  if (funcao === "admin" || funcao === "mestre") {
    document.querySelectorAll(".so-admin").forEach((el) => el.classList.remove("d-none"));
  }
  if (funcao === "mestre") {
    document.querySelectorAll(".so-mestre").forEach((el) => el.classList.remove("d-none"));
  }
}

// Botões "Sair" (classe btn-logout): POST /alunos/logout e volta para o login.
document.querySelectorAll(".btn-logout").forEach((botao) => {
  botao.addEventListener("click", async () => {
    try {
      await fetch(`${API_BASE_URL}/alunos/logout`, { method: "POST" });
      window.location.href = "/front-end/login.html";
    } catch (erro) {
      console.error("Erro ao sair:", erro);
    }
  });
});

// Aviso verde no topo da tela (toast do Bootstrap #aviso, que fica no HTML).
// Usado quando algo dá certo; os erros aparecem com alert().
function avisar(mensagem) {
  document.getElementById("aviso-texto").textContent = mensagem;
  bootstrap.Toast.getOrCreateInstance(document.getElementById("aviso")).show();
}

// 12.5 -> "R$ 12,50"
function formatarPreco(valor) {
  return "R$ " + Number(valor).toFixed(2).replace(".", ",");
}

// Deixa um texto seguro para colocar no innerHTML: um nome como "<b>Ana</b>"
// aparece escrito, em vez de virar código na página.
function escaparTexto(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}
