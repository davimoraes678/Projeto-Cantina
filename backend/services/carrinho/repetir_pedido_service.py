from flask_login import current_user

from backend.models.pedido_model import Pedido
from backend.services.carrinho.adicionar_item_carrinho_service import AdicionarItemCarrinhoService


class RepetirPedidoService:
    """Caso de uso: colocar no carrinho os mesmos itens de um pedido já feito pelo aluno
    (botão "Pedir de novo" da tela "Meus pedidos")."""

    @staticmethod
    def executar(id_pedido):
        pedido = Pedido.buscar_por_id(id_pedido)
        # Só o dono repete o pedido
        if not pedido or pedido.id_aluno != current_user.id_aluno:
            return {"erro": "Pedido não encontrado"}, 404

        # Produtos excluídos depois do pedido ficam com id_produto vazio e são pulados
        itens = [item for item in pedido.itens if item.id_produto]
        if not itens:
            return {"erro": "Nenhum produto deste pedido está mais à venda"}, 404

        # Reaproveita o caso de uso "adicionar item": mesmas regras de quantidade e preço
        for item in itens:
            resposta, status = AdicionarItemCarrinhoService.executar(
                {"id_produto": item.id_produto, "quantidade": item.quantidade})
        return resposta, status
