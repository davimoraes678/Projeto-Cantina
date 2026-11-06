from flask_login import current_user

from backend.models.item_pedido import ItemPedido


class VerCarrinhoService:
    """Caso de uso: ver o carrinho do aluno logado (vazio se ele ainda não adicionou nada)."""

    @staticmethod
    def executar():
        return ItemPedido.carrinho_to_dict(current_user.id_aluno), 200
