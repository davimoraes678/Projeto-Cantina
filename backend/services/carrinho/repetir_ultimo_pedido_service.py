from flask_login import current_user

from backend.repositories.pedido_repository import PedidoRepository
from backend.services.carrinho.adicionar_item_carrinho_service import AdicionarItemCarrinhoService


class RepetirUltimoPedidoService:
    """Caso de uso: colocar no carrinho os mesmos itens do último pedido do aluno.

    Os itens vêm do PedidoRepository (procedure sp_repetir_ultimo_pedido no
    MySQL, ORM nos outros bancos).
    """

    @staticmethod
    def executar():
        itens = PedidoRepository.itens_do_ultimo_pedido(current_user.id_aluno)
        if not itens:
            return {"erro": "Você não tem um pedido anterior com produtos à venda"}, 404

        # Reaproveita o caso de uso "adicionar item": mesmas regras de quantidade e preço
        for item in itens:
            resposta, status = AdicionarItemCarrinhoService.executar(
                {"id_produto": item["id_produto"], "quantidade": item["quantidade"]})
        return resposta, status
