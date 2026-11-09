from flask_login import current_user

from backend.models.pedido_model import Pedido
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

        for item in itens:
            resposta, status = AdicionarItemCarrinhoService.executar(
                {"id_produto": item.id_produto, "quantidade": item.quantidade})
        return resposta, status
