// Cadastro
const formAluno = document.getElementById("form-aluno");
if (formAluno) {
  formAluno.addEventListener("submit", async (e) => {
    e.preventDefault();
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
      window.location.href = "/";
    } catch (erro) {
      console.error("Erro ao cadastrar:", erro);
      alert("Ocorreu um erro ao fazer o cadastro.");
    }
  });
}

// Login
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
      window.location.href = "/";
    } catch (erro) {
      console.error("Erro ao fazer login:", erro);
      alert("Ocorreu um erro ao fazer login.");
    }
  });
}
