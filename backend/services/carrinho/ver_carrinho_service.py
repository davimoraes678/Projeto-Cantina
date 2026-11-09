from flask_login import current_user

from backend.models.item_pedido import ItemPedido


class VerCarrinhoService:
    @staticmethod
    def executar():
        return ItemPedido.carrinho_to_dict(current_user.id_aluno), 200
