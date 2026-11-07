from flask_login import current_user


class BuscarAlunoAtualService:
    @staticmethod
    def executar():
        return current_user.to_dict(), 200
