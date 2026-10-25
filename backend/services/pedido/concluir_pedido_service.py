from backend.models.pedido_model import Pedido


class ConcluirPedidoService:
    """Caso de uso: marcar o pedido como entregue/concluído (admin/mestre).

    O pedido sai da tela de pedidos em andamento e vai para o histórico; o
    aluno recebe o pedido de avaliação quando abrir a cantina.
    """

    @staticmethod
    def executar(id_pedido):
        pedido = Pedido.buscar_por_id(id_pedido)
        if not pedido or pedido.status == "Carrinho":
            return {"erro": "Pedido não encontrado"}, 404
        if pedido.status in ("Concluído", "Cancelado"):
            return {"erro": f"Este pedido já está {pedido.status.lower()}"}, 400

        pedido.atualizar(status="Concluído")
        return pedido.to_dict(), 200
