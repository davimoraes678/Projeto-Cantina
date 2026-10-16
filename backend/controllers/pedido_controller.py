from flask import Blueprint, request, jsonify
from flask_login import login_required
from backend.services.pedido_service import AvaliacaoService, PedidoService

bp_pedido = Blueprint('pedidos', __name__, url_prefix='/api/pedidos')

@bp_pedido.route('', methods=['GET'])
def listar_pedidos():
    resposta, status = PedidoService.listar_todos()
    return jsonify(resposta), status

@bp_pedido.route('/<int:id_pedido>', methods=['GET'])
def buscar_pedido(id_pedido):
    resposta, status = PedidoService.buscar_por_id(id_pedido)
    return jsonify(resposta), status

@bp_pedido.route('/<int:id_pedido>', methods=['PUT'])
def atualizar_pedido(id_pedido):
    data = request.get_json(silent=True) or {}
    resposta, status = PedidoService.atualizar_status(id_pedido, data)
    return jsonify(resposta), status

@bp_pedido.route('/<int:id_pedido>/avaliacao', methods=['POST'])
@login_required
def criar_avaliacao(id_pedido):
    data = request.get_json(silent=True) or {}
    resposta, status = AvaliacaoService.criar(data, id_pedido)
    return jsonify(resposta), status
