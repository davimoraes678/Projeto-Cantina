from flask_login import current_user
from werkzeug.security import generate_password_hash

from backend.models.aluno_model import Aluno


# Senha vazia mantém a atual
class AtualizarAlunoService:
    @staticmethod
    def executar(dados):
        senha = dados.get('senha')
        email = dados.get('email')

        if email:
            email = email.strip().lower()
            outro = Aluno.buscar_por_email(email)
            if outro and outro.id_aluno != current_user.id_aluno:
                return {"erro": "Já existe um aluno cadastrado com esse email"}, 409

        current_user.atualizar(
            nome=dados.get('nome'),
            email=email,
            senha=generate_password_hash(senha) if senha else None,
        )
        return current_user.to_dict(), 200
