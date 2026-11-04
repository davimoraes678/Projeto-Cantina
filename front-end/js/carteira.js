// =============================================================================
// carteira.js: saldo e recarga (carteira.html).
// =============================================================================

carregarAluno(); // mostra o saldo (data-aluno="saldo")

// Botões + R$ 5 / 10 / 20 / 50: somam ao valor que já está no campo (até R$ 500).
function somarRecarga(valor) {
  const campo = document.getElementById("recarga-valor");
  const atual = Number(campo.value) || 0;
  campo.value = Math.min(atual + valor, 500).toFixed(2);
}

// "Adicionar saldo": POST /alunos/atual/recarga com { valor }.
// O back-end soma ao saldo e recusa valores fora de R$ 0,01 a R$ 500,00.
document.getElementById("form-recarga").addEventListener("submit", async (e) => {
  e.preventDefault();
  const valor = Number(document.getElementById("recarga-valor").value);
  const { ok, dados } = await api("/alunos/atual/recarga", "POST", { valor });
  if (!ok) return avisar(dados.erro || "Não foi possível adicionar o saldo.", "erro");

  e.target.reset();
  carregarAluno(); // mostra o saldo novo
  avisar(`${reais(valor)} adicionados à carteira`);
});
