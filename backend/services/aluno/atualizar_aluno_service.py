from flask_login import current_user
from werkzeug.security import generate_password_hash
from backend.models.aluno_model import Aluno


class AtualizarAlunoService:
    @staticmethod
    def executar(dados):
        aluno = current_user
        if not aluno:
            return {"erro": "Aluno não encontrado"}, 404

        senha = dados.get('senha')
        aluno.atualizar(
            nome=dados.get('nome'),
            email=dados.get('email'),
            senha=generate_password_hash(senha) if senha else None,
        )
        return aluno.to_dict(), 200
