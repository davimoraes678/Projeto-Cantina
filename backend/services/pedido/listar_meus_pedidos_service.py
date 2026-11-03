from flask_login import current_user

from backend.models.pedido_model import Pedido, STATUS_CARRINHO


class ListarMeusPedidosService:
    """Caso de uso: o aluno logado vê os próprios pedidos (tela "Meus pedidos")."""

    @staticmethod
    def executar():
        # O carrinho ainda não é um pedido feito; o mais recente vem primeiro
        pedidos = (Pedido.query
                   .filter(Pedido.id_aluno == current_user.id_aluno, Pedido.status != STATUS_CARRINHO)
                   .order_by(Pedido.id_pedido.desc())
                   .all())
        return [pedido.to_dict() for pedido in pedidos], 200
