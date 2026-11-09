from flask_login import logout_user


class LogoutAlunoService:
    @staticmethod
    def executar():
        logout_user()
        return {"mensagem": "Logout realizado com sucesso"}, 200
