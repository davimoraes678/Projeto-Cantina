from backend.models.pedido_model import Pedido


# Pendente e Pronto: mais antigo primeiro; histórico: mais novo primeiro
class ListarPedidosService:
    @staticmethod
    def executar():
        pedidos = Pedido.query.order_by(Pedido.id_pedido).all()
        return {
            "preparo": [p.to_dict() for p in pedidos if p.status == "Pendente"],
            "prontos": [p.to_dict() for p in pedidos if p.status == "Pronto"],
            "historico": [p.to_dict() for p in reversed(pedidos) if p.status in ("Concluído", "Cancelado")],
        }, 200
