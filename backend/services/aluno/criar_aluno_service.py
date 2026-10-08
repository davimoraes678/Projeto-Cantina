from werkzeug.security import generate_password_hash
from backend.models.aluno_model import Aluno
from backend.extensions import db, lm, login_user



class CriarAlunoService:
    @staticmethod
    def executar(dados):
        nome = dados.get("nome")
        senha = dados.get('senha')
        email = dados.get("email")
        if not nome or not email or not senha:
            return {"erro": "Nome, email e senha são obrigatórios"}, 400
        """if Aluno.query.filter_by(email=email).first():
            return {"erro": "Já existe um aluno cadastrado com esse email"}, 409"""
        senha_cript = generate_password_hash(senha)
        novo_aluno = Aluno(nome=nome, email=email, senha=senha_cript)
        db.session.add(novo_aluno)
        db.session.commit()
        login_user(novo_aluno)
        return novo_aluno.to_dict(), 200
    @lm.user_loader
    def load_user(id):
        return Aluno.query.get(int(id))


