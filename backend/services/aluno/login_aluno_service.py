from werkzeug.security import check_password_hash
from backend.models.aluno_model import Aluno
from backend.extensions import login_user


class LoginAlunoService:
    @staticmethod
    def executar(dados):
        email = dados.get("email")
        senha = dados.get("senha")
        if not email or not senha:
            return {"erro": "Email e senha são obrigatórios"}, 400
        aluno = Aluno.buscar_por_email(email)
        if not aluno or not check_password_hash(aluno.senha, senha):
            return {"erro": "Email ou senha inválidos"}, 401
        login_user(aluno)
        return aluno.to_dict(), 200
