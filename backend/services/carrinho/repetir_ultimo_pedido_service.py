from flask_login import current_user

from backend.repositories.pedido_repository import PedidoRepository
from backend.services.carrinho.adicionar_item_carrinho_service import AdicionarItemCarrinhoService


class RepetirUltimoPedidoService:
    @staticmethod
    def executar():
        itens = PedidoRepository.itens_do_ultimo_pedido(current_user.id_aluno)
        if not itens:
            return {"erro": "Você não tem um pedido anterior com produtos à venda"}, 404

        for item in itens:
            resposta, status = AdicionarItemCarrinhoService.executar(
                {"id_produto": item["id_produto"], "quantidade": item["quantidade"]})
        return resposta, status
