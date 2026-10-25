from flask_login import current_user


class RecarregarSaldoService:
    """Caso de uso: adicionar saldo na carteira do aluno logado."""

    @staticmethod
    def executar(dados):
        try:
            valor = float(dados.get('valor'))
        except (TypeError, ValueError):
            valor = 0
        if not 0 < valor <= 500:
            return {"erro": "A recarga deve ser de R$ 0,01 a R$ 500,00"}, 400

        current_user.atualizar(saldo=round(current_user.saldo + valor, 2))
        return current_user.to_dict(), 200
