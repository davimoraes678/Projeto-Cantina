from backend.extensions import db
from backend.models.pedido_model import Pedido


class CancelarPedidoService:
    @staticmethod
    def executar(id_pedido):
        pedido = Pedido.buscar_por_id(id_pedido)
        if not pedido:
            return {"erro": "Pedido não encontrado"}, 404
        if pedido.status in ("Concluído", "Cancelado"):
            return {"erro": f"Este pedido já está {pedido.status.lower()}"}, 400

        # Devolve o estoque
        for item in pedido.itens:
            if item.produto:
                item.produto.quantidade_estoque += item.quantidade
        # Devolve o dinheiro
        if pedido.aluno:
            pedido.aluno.saldo = round(pedido.aluno.saldo + pedido.valor_total, 2)
        pedido.status = "Cancelado"
        db.session.commit()
        return pedido.to_dict(), 200
