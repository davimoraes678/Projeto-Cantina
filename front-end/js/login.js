// =============================================================================
// login.js: telas de cadastro (cadastro.html) e login (login.html).
// Nos dois casos o back-end já deixa o aluno logado, e aí vamos para o cardápio.
// =============================================================================

// --- CADASTRO: POST /alunos/registro com nome, e-mail e senha ---
const formAluno = document.getElementById("form-aluno");
if (formAluno) {
  formAluno.addEventListener("submit", async (e) => {
    e.preventDefault(); // não deixa o navegador recarregar a página
    const nome = document.getElementById("aluno-nome").value;
    const email = document.getElementById("aluno-email").value;
    const senha = document.getElementById("aluno-senha").value;

    try {
      const res = await fetch(`${API_BASE_URL}/alunos/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });
      if (!res.ok) {
        const erro = await res.json();
        alert(erro.erro || "Não foi possível fazer o cadastro.");
        return;
      }
      window.location.href = "/"; // cadastrou e já está logado
    } catch (erro) {
      console.error("Erro ao cadastrar:", erro);
      alert("Ocorreu um erro ao fazer o cadastro.");
    }
  });
}

// --- LOGIN: POST /alunos/login com e-mail e senha ---
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
        const erro = await res.json();
        alert(erro.erro || "E-mail ou senha incorretos.");
        return;
      }
      window.location.href = "/"; // logado: vai para o cardápio
    } catch (erro) {
      console.error("Erro ao fazer login:", erro);
      alert("Ocorreu um erro ao fazer login.");
    }
  });
}
