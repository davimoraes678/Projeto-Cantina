from flask_login import current_user

from backend.extensions import db
from backend.models.item_pedido import ItemPedido
from backend.models.pedido_model import STATUS_CARRINHO


class RemoverItemCarrinhoService:
    """Caso de uso: tirar um item do carrinho do aluno logado."""

    @staticmethod
    def executar(id_item_pedido):
        item = ItemPedido.buscar_por_id(id_item_pedido)
        # Só remove se o item for de um carrinho (não de um pedido feito) e do próprio aluno
        if (not item or item.pedido.status != STATUS_CARRINHO
                or item.pedido.id_aluno != current_user.id_aluno):
            return {"erro": "Item não encontrado no carrinho"}, 404

        carrinho = item.pedido
        carrinho.itens.remove(item)  # delete-orphan apaga o ItemPedido
        carrinho.calcular_total()
        db.session.commit()
        return carrinho.to_dict(), 200
