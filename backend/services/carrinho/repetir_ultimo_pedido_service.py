from flask_login import current_user

from backend.repositories.pedido_repository import PedidoRepository
from backend.models.item_pedido import ItemPedido
from backend.services.carrinho.adicionar_item_carrinho_service import AdicionarItemCarrinhoService


class RepetirUltimoPedidoService:
    @staticmethod
    def executar():
        itens = PedidoRepository.itens_do_ultimo_pedido(current_user.id_aluno)
        if not itens:
            return {"erro": "Você não tem um pedido anterior com produtos à venda"}, 404

        # Adiciona o que tiver estoque; o que faltar fica de fora
        adicionou = False
        for item in itens:
            resposta, status = AdicionarItemCarrinhoService.executar(
                {"id_produto": item["id_produto"], "quantidade": item["quantidade"]})
            if status == 201:
                adicionou = True
        if not adicionou:
            return {"erro": "Os produtos do último pedido estão sem estoque"}, 400
        return ItemPedido.carrinho_to_dict(current_user.id_aluno), 201
