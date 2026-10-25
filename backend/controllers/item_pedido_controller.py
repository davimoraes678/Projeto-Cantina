from flask import Blueprint, jsonify, request
from flask_login import login_required

from backend.services.carrinho.adicionar_item_carrinho_service import AdicionarItemCarrinhoService
from backend.services.carrinho.finalizar_pedido_service import FinalizarPedidoService
from backend.services.carrinho.remover_item_carrinho_service import RemoverItemCarrinhoService
from backend.services.carrinho.repetir_ultimo_pedido_service import RepetirUltimoPedidoService
from backend.services.carrinho.ver_carrinho_service import VerCarrinhoService


class ItemPedidoController:
    """Rotas do carrinho (itens de pedido do aluno logado).

    Todas usam o aluno logado (current_user), por isso nenhuma recebe id_aluno na URL.
    """

    @staticmethod
    @login_required
    def ver_carrinho():
        resposta, status = VerCarrinhoService.executar()
        return jsonify(resposta), status

    @staticmethod
    @login_required
    def adicionar_item():
        dados = request.get_json(silent=True) or {}
        resposta, status = AdicionarItemCarrinhoService.executar(dados)
        return jsonify(resposta), status

    @staticmethod
    @login_required
    def remover_item(id_item_pedido):
        resposta, status = RemoverItemCarrinhoService.executar(id_item_pedido)
        return jsonify(resposta), status

    @staticmethod
    @login_required
    def repetir_ultimo_pedido():
        resposta, status = RepetirUltimoPedidoService.executar()
        return jsonify(resposta), status

    @staticmethod
    @login_required
    def finalizar():
        resposta, status = FinalizarPedidoService.executar()
        return jsonify(resposta), status


# URLs do recurso: /api/carrinho/...
bp_item_pedido = Blueprint('carrinho', __name__, url_prefix='/api/carrinho')
bp_item_pedido.add_url_rule('', view_func=ItemPedidoController.ver_carrinho, methods=['GET'])
bp_item_pedido.add_url_rule('/itens', view_func=ItemPedidoController.adicionar_item, methods=['POST'])
bp_item_pedido.add_url_rule('/itens/<int:id_item_pedido>', view_func=ItemPedidoController.remover_item, methods=['DELETE'])
bp_item_pedido.add_url_rule('/repetir', view_func=ItemPedidoController.repetir_ultimo_pedido, methods=['POST'])
bp_item_pedido.add_url_rule('/finalizar', view_func=ItemPedidoController.finalizar, methods=['POST'])
