from flask_login import current_user
from werkzeug.security import generate_password_hash
from backend.models.aluno_model import Aluno


class AtualizarAlunoService:
    @staticmethod
    def executar(dados):
        aluno = current_user
        if not aluno:
            return {"erro": "Aluno não encontrado"}, 404

        # Recarga da carteira: soma o valor ao saldo atual
        recarga = dados.get('recarga')
        if recarga is not None:
            try:
                recarga = float(recarga)
            except (TypeError, ValueError):
                recarga = 0
            if not 0 < recarga <= 500:
                return {"erro": "A recarga deve ser de R$ 0,01 a R$ 500,00"}, 400

        senha = dados.get('senha')
        aluno.atualizar(
            nome=dados.get('nome'),
            email=dados.get('email'),
            senha=generate_password_hash(senha) if senha else None,
            saldo=round(aluno.saldo + recarga, 2) if recarga else None,
        )
        return aluno.to_dict(), 200
    