from werkzeug.security import generate_password_hash
from backend.models.aluno_model import Aluno
from backend.extensions import lm, login_user

@lm.user_loader
def load_user(id):
    return Aluno.query.get(int(id))

class CriarAlunoService:
    @staticmethod
    def executar(dados):
        nome = dados.get("nome")
        email = dados.get("email")
        senha = dados.get('senha')
        senha_cript = generate_password_hash(senha)
        novo_aluno = Aluno(nome=nome, email=email, senha=senha_cript)
        login_user(novo_aluno)
        return novo_aluno



