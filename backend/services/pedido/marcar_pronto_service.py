from backend.models.pedido_model import Pedido


class MarcarProntoService:
    @staticmethod
    def executar(id_pedido):
        pedido = Pedido.buscar_por_id(id_pedido)
        if not pedido:
            return {"erro": "Pedido não encontrado"}, 404
        if pedido.status != "Pendente":
            return {"erro": "Só um pedido em preparo pode ficar pronto"}, 400

        pedido.atualizar(status="Pronto")
        return pedido.to_dict(), 200
