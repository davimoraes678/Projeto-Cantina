from datetime import datetime

from backend.models.pedido_model import Pedido

class ConcluirPedidoService:
    @staticmethod
    def executar(id_pedido):
        pedido = Pedido.buscar_por_id(id_pedido)
        if not pedido:
            return {"erro": "Pedido não encontrado"}, 404
        if pedido.status in ("Concluído", "Cancelado"):
            return {"erro": f"Este pedido já está {pedido.status.lower()}"}, 400

        # Hora da entrega (usada em "Entregues hoje")
        pedido.atualizar(status="Concluído", data_hora_retirada=datetime.utcnow())
        return pedido.to_dict(), 200
