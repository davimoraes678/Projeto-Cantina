from backend.models.pedido_model import Pedido, STATUS_CARRINHO


class ListarPedidosService:
    """Caso de uso: listar os pedidos feitos (tela do admin e histórico)."""

    @staticmethod
    def executar():
        # O carrinho ainda não é um pedido feito, então não aparece na lista
        pedidos = Pedido.query.filter(Pedido.status != STATUS_CARRINHO).all()
        return [pedido.to_dict() for pedido in pedidos], 200
