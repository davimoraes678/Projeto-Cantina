from flask_login import current_user


class BuscarAlunoAtualService:
    """Caso de uso: ver os dados do aluno logado (nome, e-mail, saldo, função)."""

    @staticmethod
    def executar():
        return current_user.to_dict(), 200
