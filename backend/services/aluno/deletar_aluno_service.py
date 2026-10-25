from flask_login import current_user
from backend.extensions import db
from backend.models.aluno_model import Aluno

class DeletarAlunoService:
    """Caso de uso: excluir aluno (a própria conta, ou outro aluno pelo mestre)."""

    @staticmethod
    def executar(id_aluno=None):
        # Sem id: o aluno logado remove a própria conta. Com id: o mestre remove outro aluno.
        aluno = Aluno.buscar_por_id(id_aluno) if id_aluno else current_user
        if not aluno:
            return {"erro": "Aluno não encontrado"}, 404
        if id_aluno and aluno.id_aluno == current_user.id_aluno:
            return {"erro": "Para excluir a sua própria conta, use \"Remover minha conta\" em Minha Conta"}, 400

        try:
            # Antes de apagar o aluno, preserva o histórico dos pedidos já feitos por ele:
            # guarda o nome (caso ainda não tenha sido salvo) e solta o vínculo com o aluno,
            # para que o pedido continue existindo mesmo depois do aluno ser excluído.
            for pedido in aluno.pedido:
                if not pedido.nome_aluno:
                    pedido.nome_aluno = aluno.nome
                pedido.id_aluno = None

            for rateio in aluno.rateio:
                rateio.id_aluno = None

            db.session.delete(aluno)
            db.session.commit()
            return {"mensagem": "Usuário deletado com sucesso"}, 200
        except Exception as e:
            db.session.rollback()
            return {"erro": f"Falha ao deletar aluno: {str(e)}"}, 500

