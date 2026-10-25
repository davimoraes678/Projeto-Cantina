from flask_login import logout_user


class LogoutAlunoService:
    """Caso de uso: sair do sistema (apaga o login do cookie)."""

    @staticmethod
    def executar():
        logout_user()
        return {"mensagem": "Logout realizado com sucesso"}, 200
