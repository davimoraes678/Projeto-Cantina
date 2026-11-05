from backend.models.pedido_model import Pedido


class ListarPedidosService:
    """Caso de uso: listar os pedidos feitos, já separados para a tela do admin.

    Devolve três listas:
      - preparo: pedidos "Pendente" (o mais antigo primeiro)
      - prontos: pedidos "Pronto" (o mais antigo primeiro)
      - historico: "Concluído" e "Cancelado" (o mais novo primeiro)
    """

    @staticmethod
    def executar():
        pedidos = Pedido.query.order_by(Pedido.id_pedido).all()
        return {
            "preparo": [p.to_dict() for p in pedidos if p.status == "Pendente"],
            "prontos": [p.to_dict() for p in pedidos if p.status == "Pronto"],
            "historico": [p.to_dict() for p in reversed(pedidos) if p.status in ("Concluído", "Cancelado")],
        }, 200
