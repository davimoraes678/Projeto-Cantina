from flask import Blueprint, request, jsonify
from flask_login import login_required
from backend.services.item_pedido_service import ItemPedidoService

# Todas as rotas usam o aluno logado (current_user), por isso não recebem id_aluno na URL
bp_item_pedido = Blueprint('carrinho', __name__, url_prefix='/api/carrinho')

@bp_item_pedido.route('', methods=['GET'])
@login_required
def ver_carrinho():
    resposta, status = ItemPedidoService.ver_carrinho()
    return jsonify(resposta), status

@bp_item_pedido.route('/itens', methods=['POST'])
@login_required
def adicionar_item():
    data = request.get_json(silent=True) or {}
    resposta, status = ItemPedidoService.adicionar_item(data)
    return jsonify(resposta), status

@bp_item_pedido.route('/itens/<int:id_item_pedido>', methods=['DELETE'])
@login_required
def remover_item(id_item_pedido):
    resposta, status = ItemPedidoService.remover_item(id_item_pedido)
    return jsonify(resposta), status

@bp_item_pedido.route('/finalizar', methods=['POST'])
@login_required
def finalizar():
    resposta, status = ItemPedidoService.finalizar()
    return jsonify(resposta), status
