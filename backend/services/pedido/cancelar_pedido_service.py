from backend.extensions import db
from backend.models.pedido_model import Pedido


class CancelarPedidoService:
    """Caso de uso: cancelar um pedido (admin/mestre).

    Desfaz o que o FinalizarPedidoService fez: devolve o valor para a carteira
    do aluno e a quantidade de cada produto para o estoque.
    """

    @staticmethod
    def executar(id_pedido):
        pedido = Pedido.buscar_por_id(id_pedido)
        if not pedido or pedido.status == "Carrinho":
            return {"erro": "Pedido não encontrado"}, 404
        if pedido.status in ("Concluído", "Cancelado"):
            return {"erro": f"Este pedido já está {pedido.status.lower()}"}, 400

        # Devolve o estoque (produtos excluídos depois do pedido são pulados)
        for item in pedido.itens:
            if item.produto:
                item.produto.quantidade_estoque += item.quantidade
        # Devolve o dinheiro (se o aluno ainda existir)
        if pedido.aluno:
            pedido.aluno.saldo = round(pedido.aluno.saldo + pedido.valor_total, 2)
        pedido.status = "Cancelado"
        db.session.commit()
        return pedido.to_dict(), 200
