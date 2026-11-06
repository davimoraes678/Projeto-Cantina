from flask_login import current_user

from backend.models.item_pedido import ItemPedido


class RemoverItemCarrinhoService:
    """Caso de uso: tirar um item do carrinho do aluno logado."""

    @staticmethod
    def executar(id_item_pedido):
        item = ItemPedido.buscar_por_id(id_item_pedido)
        # Só remove se o item estiver no carrinho (sem pedido) e for do próprio aluno
        if not item or item.id_pedido is not None or item.id_aluno != current_user.id_aluno:
            return {"erro": "Item não encontrado no carrinho"}, 404

        item.deletar()
        return ItemPedido.carrinho_to_dict(current_user.id_aluno), 200
