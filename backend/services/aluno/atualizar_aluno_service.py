from flask_login import current_user
from werkzeug.security import generate_password_hash


class AtualizarAlunoService:
    """Caso de uso: editar os dados do aluno logado (senha vazia mantém a atual)."""

    @staticmethod
    def executar(dados):
        senha = dados.get('senha')
        current_user.atualizar(
            nome=dados.get('nome'),
            email=dados.get('email'),
            senha=generate_password_hash(senha) if senha else None,
        )
        return current_user.to_dict(), 200
