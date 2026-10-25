from flask_login import current_user

from backend.models.avaliacao_model import Avaliacao
from backend.models.pedido_model import Pedido


class AvaliarPedidoService:
    """Caso de uso: o aluno dá nota (1 a 5) e um comentário opcional para o pedido."""

    @staticmethod
    def executar(id_pedido, dados):
        pedido = Pedido.buscar_por_id(id_pedido)
        # Só o dono do pedido avalia, e uma vez só (a tabela aceita uma avaliação por pedido)
        if not pedido or pedido.id_aluno != current_user.id_aluno:
            return {"erro": "Pedido não encontrado"}, 404
        if pedido.status != "Concluído":
            return {"erro": "Só é possível avaliar pedidos concluídos"}, 400
        if pedido.avaliacao:
            return {"erro": "Este pedido já foi avaliado"}, 400
        try:
            nota = int(dados.get('nota'))
        except (TypeError, ValueError):
            nota = 0
        if not 1 <= nota <= 5:
            return {"erro": "A nota deve ser de 1 a 5"}, 400

        avaliacao = Avaliacao(id_pedido=id_pedido, nota=nota, comentario=dados.get('comentario'))
        avaliacao.salvar()
        return avaliacao.to_dict(), 201
