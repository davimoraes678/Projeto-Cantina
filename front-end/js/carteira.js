// =============================================================================
// carteira.js: saldo e recarga (carteira.html).
// =============================================================================

alunoInf(); // mostra o saldo (elementos com a classe saldo-aluno)

// Botões + R$ 5 / 10 / 20 / 50: somam ao valor que já está no campo (até R$ 500).
function somarRecarga(valor) {
  const campo = document.getElementById("recarga-valor");
  const atual = Number(campo.value) || 0; // campo vazio vira 0
  campo.value = Math.min(atual + valor, 500).toFixed(2);
}

// "Adicionar saldo": POST /alunos/atual/recarga com { valor }.
// O back-end soma ao saldo e recusa valores fora de R$ 0,01 a R$ 500,00.
const formRecarga = document.getElementById("form-recarga");
formRecarga.addEventListener("submit", async (e) => {
  e.preventDefault();
  const valor = Number(document.getElementById("recarga-valor").value);

  try {
    const res = await fetch(`${API_BASE_URL}/alunos/atual/recarga`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valor }),
    });
    if (!res.ok) {
      const erro = await res.json();
      alert(erro.erro || "Não foi possível adicionar o saldo.");
      return;
    }
    formRecarga.reset();
    alunoInf(); // mostra o saldo novo
    avisar(`${formatarPreco(valor)} adicionados à carteira`);
  } catch (erro) {
    console.error("Erro ao adicionar saldo:", erro);
  }
});
