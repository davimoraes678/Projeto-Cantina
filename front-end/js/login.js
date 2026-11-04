// =============================================================================
// login.js: telas de login (login.html) e cadastro (cadastro.html).
// Nos dois casos o back-end já deixa o aluno logado, e aí vamos para o cardápio.
// =============================================================================

// Cadastro: POST /alunos/registro com nome, e-mail e senha
const formCadastro = document.getElementById("form-aluno");
if (formCadastro) {
  formCadastro.addEventListener("submit", async (e) => {
    e.preventDefault(); // não deixa o navegador recarregar a página
    const { ok, dados } = await api("/alunos/registro", "POST", {
      nome: document.getElementById("aluno-nome").value,
      email: document.getElementById("aluno-email").value,
      senha: document.getElementById("aluno-senha").value,
    });
    if (!ok) return avisar(dados.erro || "Não foi possível fazer o cadastro.", "erro");
    window.location.href = "/";
  });
}

// Login: POST /alunos/login com e-mail e senha
const formLogin = document.getElementById("form-aluno-login");
if (formLogin) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { ok, dados } = await api("/alunos/login", "POST", {
      email: document.getElementById("aluno-email").value,
      senha: document.getElementById("aluno-senha").value,
    });
    if (!ok) return avisar(dados.erro || "E-mail ou senha incorretos.", "erro");
    window.location.href = "/";
  });
}
