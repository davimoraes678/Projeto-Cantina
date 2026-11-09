// Funções usadas por todas as páginas

const API_BASE_URL = "/api";

// Preenche .nome-aluno, .email-aluno, .saldo-aluno e .funcao-aluno. Devolve o aluno ou null
async function alunoInf() {
  try {
    const res = await fetch(`${API_BASE_URL}/alunos/atual`);
    if (!res.ok) return null;
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

// Mostra .so-admin para admin/mestre e .so-mestre para mestre (o back-end é quem bloqueia)
function funcaoPorAluno(funcao) {
  if (funcao === "admin" || funcao === "mestre") {
    document.querySelectorAll(".so-admin").forEach((el) => el.classList.remove("d-none"));
  }
  if (funcao === "mestre") {
    document.querySelectorAll(".so-mestre").forEach((el) => el.classList.remove("d-none"));
  }
}

document.querySelectorAll(".btn-logout").forEach((botao) => {
  botao.addEventListener("click", async () => {
    try {
      await fetch(`${API_BASE_URL}/alunos/logout`, { method: "POST" });
      localStorage.removeItem("pedidoParaAvaliar"); // outro aluno pode entrar neste navegador
      window.location.href = "/front-end/login.html";
    } catch (erro) {
      console.error("Erro ao sair:", erro);
    }
  });
});

// Aviso verde de sucesso (toast #aviso)
function avisar(mensagem) {
  document.getElementById("aviso-texto").textContent = mensagem;
  bootstrap.Toast.getOrCreateInstance(document.getElementById("aviso")).show();
}

// 12.5 -> "R$ 12,50"
function formatarPreco(valor) {
  return "R$ " + Number(valor).toFixed(2).replace(".", ",");
}

// Evita que um texto vire HTML no innerHTML
function escaparTexto(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}
