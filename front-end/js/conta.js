// =============================================================================
// conta.js: perfil do aluno (conta.html): editar dados e remover a conta.
// =============================================================================

preencherFormulario();

// Mostra os dados do aluno na página e deixa o formulário "Editar dados" preenchido.
async function preencherFormulario() {
  const aluno = await alunoInf();
  if (!aluno) return;
  document.getElementById("aluno-nome").value = aluno.nome;
  document.getElementById("aluno-email").value = aluno.email;
}

// "Salvar": PUT /alunos/atual. Senha em branco = continua a mesma.
document.getElementById("form-editar-aluno").addEventListener("submit", async (e) => {
  e.preventDefault();
  const corpo = {
    nome: document.getElementById("aluno-nome").value,
    email: document.getElementById("aluno-email").value,
  };
  const senha = document.getElementById("aluno-senha").value;
  if (senha) corpo.senha = senha;

  try {
    const res = await fetch(`${API_BASE_URL}/alunos/atual`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });
    if (!res.ok) {
      const erro = await res.json();
      alert(erro.erro || "Não foi possível salvar os dados.");
      return;
    }
    document.getElementById("aluno-senha").value = "";
    bootstrap.Collapse.getOrCreateInstance(document.getElementById("form-editar-dados")).hide(); // fecha o "Editar dados"
    alunoInf(); // mostra o nome novo
    avisar("Dados atualizados");
  } catch (erro) {
    console.error("Erro ao editar dados:", erro);
  }
});

// "Remover minha conta": DELETE /alunos/atual. Os pedidos continuam no histórico.
async function removerAluno() {
  if (!confirm("Remover sua conta? Seus pedidos continuam no histórico da cantina.")) return;
  try {
    const res = await fetch(`${API_BASE_URL}/alunos/atual`, { method: "DELETE" });
    if (!res.ok) {
      const erro = await res.json();
      alert(erro.erro || "Não foi possível remover a conta.");
      return;
    }
    window.location.href = "/front-end/login.html";
  } catch (erro) {
    console.error("Erro ao remover conta:", erro);
  }
}
