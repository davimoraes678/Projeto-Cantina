// =============================================================================
// conta.js: perfil do aluno (conta.html): editar dados e remover a conta.
// =============================================================================

preencherFormulario();

// Mostra os dados do aluno na página e já deixa o formulário "Editar dados" preenchido.
async function preencherFormulario() {
  const aluno = await carregarAluno();
  document.getElementById("aluno-nome").value = aluno.nome;
  document.getElementById("aluno-email").value = aluno.email;
}

// "Salvar": PUT /alunos/atual. Senha em branco = continua a mesma.
document.getElementById("form-editar-aluno").addEventListener("submit", async (e) => {
  e.preventDefault();
  const dados = {
    nome: document.getElementById("aluno-nome").value,
    email: document.getElementById("aluno-email").value,
  };
  const senha = document.getElementById("aluno-senha").value;
  if (senha) dados.senha = senha;

  const resposta = await api("/alunos/atual", "PUT", dados);
  if (!resposta.ok) return avisar(resposta.dados.erro || "Não foi possível salvar.", "erro");

  document.getElementById("aluno-senha").value = "";
  carregarAluno(); // mostra o nome novo na página
  avisar("Dados atualizados");
});

// "Remover minha conta": DELETE /alunos/atual. Os pedidos continuam no histórico.
async function removerConta() {
  if (!confirm("Remover sua conta? Seus pedidos continuam no histórico da cantina.")) return;
  const { ok } = await api("/alunos/atual", "DELETE");
  if (ok) window.location.href = "/front-end/login.html";
}
