from flask_login import current_user
from backend.extensions import db
from backend.models.aluno_model import Aluno
from backend.models.item_pedido import ItemPedido

class DeletarAlunoService:
    @staticmethod
    def executar(id_aluno=None):
        # Sem id: apaga a própria conta. Com id: o mestre apaga outro aluno
        aluno = Aluno.buscar_por_id(id_aluno) if id_aluno else current_user
        if not aluno:
            return {"erro": "Aluno não encontrado"}, 404
        if id_aluno and aluno.id_aluno == current_user.id_aluno:
            return {"erro": "Para excluir a sua própria conta, use \"Remover minha conta\" em Minha Conta"}, 400

        try:
            # Mantém os pedidos com o nome do aluno
            for pedido in aluno.pedido:
                if not pedido.nome_aluno:
                    pedido.nome_aluno = aluno.nome
                pedido.id_aluno = None

            # Apaga o carrinho
            for item in ItemPedido.buscar_carrinho(aluno.id_aluno):
                db.session.delete(item)

            for rateio in aluno.rateio:
                rateio.id_aluno = None

            db.session.delete(aluno)
            db.session.commit()
            return {"mensagem": "Usuário deletado com sucesso"}, 200
        except Exception as e:
            db.session.rollback()
            return {"erro": f"Falha ao deletar aluno: {str(e)}"}, 500

