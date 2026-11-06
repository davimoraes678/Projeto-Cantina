from datetime import datetime

from backend.models.pedido_model import Pedido

class ConcluirPedidoService:
    """Caso de uso: fechar o pedido quando o aluno o retira no balcão (admin/mestre).

    O pedido vai para o histórico como "Concluído" (aparece como "Entregue") e
    o aluno pode avaliá-lo em Meus pedidos.
    """

    @staticmethod
    def executar(id_pedido):
        pedido = Pedido.buscar_por_id(id_pedido)
        if not pedido:
            return {"erro": "Pedido não encontrado"}, 404
        if pedido.status in ("Concluído", "Cancelado"):
            return {"erro": f"Este pedido já está {pedido.status.lower()}"}, 400

        # Guarda a hora da entrega (o resumo "Entregues hoje" do admin usa)
        pedido.atualizar(status="Concluído", data_hora_retirada=datetime.utcnow())
        return pedido.to_dict(), 200
