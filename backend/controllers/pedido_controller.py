from flask import Blueprint, request, jsonify
from backend.services.pedido_service import PedidoService

bp_pedido = Blueprint('pedidos', __name__, url_prefix='/api/pedidos')

@bp_pedido.route('', methods=['POST'])
def criar_pedido():
    data = request.json
    resposta, status = PedidoService.criar(data)
    return jsonify(resposta), status

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
    data = request.json
    resposta, status = PedidoService.atualizar_status(id_pedido, data)
    return jsonify(resposta), status
