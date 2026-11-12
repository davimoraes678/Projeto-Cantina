from flask_login import current_user

from backend.models.pedido_model import Pedido
from backend.models.item_pedido import ItemPedido
from backend.services.carrinho.adicionar_item_carrinho_service import AdicionarItemCarrinhoService


class RepetirPedidoService:
    @staticmethod
    def executar(id_pedido):
        pedido = Pedido.buscar_por_id(id_pedido)
        if not pedido or pedido.id_aluno != current_user.id_aluno:
            return {"erro": "Pedido não encontrado"}, 404

        # Pula produtos excluídos
        itens = [item for item in pedido.itens if item.id_produto]
        if not itens:
            return {"erro": "Nenhum produto deste pedido está mais à venda"}, 404

        # Adiciona o que tiver estoque; o que faltar fica de fora
        adicionou = False
        for item in itens:
            resposta, status = AdicionarItemCarrinhoService.executar(
                {"id_produto": item.id_produto, "quantidade": item.quantidade})
            if status == 201:
                adicionou = True
        if not adicionou:
            return {"erro": "Os produtos deste pedido estão sem estoque"}, 400
        return ItemPedido.carrinho_to_dict(current_user.id_aluno), 201
