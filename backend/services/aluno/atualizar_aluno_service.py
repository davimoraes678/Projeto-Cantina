from flask_login import current_user
from werkzeug.security import generate_password_hash
from backend.models.aluno_model import Aluno


class AtualizarAlunoService:
    @staticmethod
    def executar(dados):
        aluno = current_user
        email = dados.get('email')

        # O e-mail é único: sem esta conferência o banco recusa e a rota responderia 500.
        if email:
            outro = Aluno.query.filter(Aluno.email == email, Aluno.id_aluno != aluno.id_aluno).first()
            if outro:
                return {"erro": "Já existe um aluno cadastrado com esse email"}, 409

        senha = dados.get('senha')
        aluno.atualizar(
            nome=dados.get('nome'),
            email=email,
            senha=generate_password_hash(senha) if senha else None,
        )
        return aluno.to_dict(), 200
