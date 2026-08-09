from werkzeug.security import generate_password_hash
from backend.models.aluno_model import Aluno

class CriarAlunoService:
    @staticmethod
    def executar(dados):
        if not dados.get('nome') or not dados.get('email') or not dados.get('senha'):
            return {"erro": "Nome, email e senha são obrigatórios"}, 400

        if Aluno.query.filter_by(email=dados.get('email')).first():
            return {"erro": "Já existe um aluno cadastrado com esse email"}, 409

        aluno = Aluno(
            nome=dados.get('nome'),
            email=dados.get('email'),
            senha=generate_password_hash(dados.get('senha'))
        )
        aluno.salvar()
        return aluno.to_dict(), 201
