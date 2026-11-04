from backend.models.pedido_model import Pedido


class MarcarProntoService:
    """Caso de uso: avisar que o pedido está pronto para ser retirado (admin/mestre).

    O aluno vê "Pronto para retirar" em Meus pedidos. Quando ele pegar o pedido
    no balcão, o admin fecha o pedido com o ConcluirPedidoService.
    """

    @staticmethod
    def executar(id_pedido):
        pedido = Pedido.buscar_por_id(id_pedido)
        if not pedido or pedido.status == "Carrinho":
            return {"erro": "Pedido não encontrado"}, 404
        if pedido.status != "Pendente":
            return {"erro": "Só um pedido em preparo pode ficar pronto"}, 400

        pedido.atualizar(status="Pronto")
        return pedido.to_dict(), 200
