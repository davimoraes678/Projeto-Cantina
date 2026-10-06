from flask import Blueprint, request, jsonify
from backend.services.item_pedido_service import ItemPedidoService

bp_item_pedido = Blueprint('carrinho', __name__, url_prefix='/api/carrinho')

@bp_item_pedido.route('/<int:id_aluno>', methods=['GET'])
def ver_carrinho(id_aluno):
    resposta, status = ItemPedidoService.ver_carrinho(id_aluno)
    return jsonify(resposta), status

@bp_item_pedido.route('/<int:id_aluno>/itens', methods=['POST'])
def adicionar_item(id_aluno):
    data = request.get_json(silent=True) or {}
    resposta, status = ItemPedidoService.adicionar_item(id_aluno, data)
    return jsonify(resposta), status

@bp_item_pedido.route('/itens/<int:id_item_pedido>', methods=['DELETE'])
def remover_item(id_item_pedido):
    resposta, status = ItemPedidoService.remover_item(id_item_pedido)
    return jsonify(resposta), status

@bp_item_pedido.route('/<int:id_aluno>/finalizar', methods=['POST'])
def finalizar(id_aluno):
    resposta, status = ItemPedidoService.finalizar(id_aluno)
    return jsonify(resposta), status
