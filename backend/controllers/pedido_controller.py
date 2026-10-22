from flask import Blueprint, request, jsonify
from flask_login import login_required
from backend.services.pedido_service import AvaliacaoService, PedidoService
from backend.services.aluno.login_aluno_service import admin_required, master_required

bp_pedido = Blueprint('pedidos', __name__, url_prefix='/api/pedidos')

@bp_pedido.route('', methods=['POST'])
@login_required
def criar_pedido():
    data = request.json
    resposta, status = PedidoService.criar(data)
    return jsonify(resposta), status

@bp_pedido.route('', methods=['GET'])
@admin_required
def listar_pedidos():
    resposta, status = PedidoService.listar_todos()
    return jsonify(resposta), status

@bp_pedido.route('/combinacoes', methods=['GET'])
@login_required
def combinacoes_mais_pedidas():
    resposta, status = PedidoService.combinacoes_mais_pedidas()
    return jsonify(resposta), status

@bp_pedido.route('/<int:id_pedido>', methods=['GET'])
@login_required
def buscar_pedido(id_pedido):
    resposta, status = PedidoService.buscar_por_id(id_pedido)
    return jsonify(resposta), status

@bp_pedido.route('/<int:id_pedido>', methods=['PUT'])
@login_required
def atualizar_pedido(id_pedido):
    data = request.json
    resposta, status = PedidoService.atualizar_status(id_pedido, data)
    return jsonify(resposta), status

@bp_pedido.route('/<int:id_pedido>', methods=['POST'])
@login_required
def criar_avaliacao(id_pedido):
    data = request.json
    resposta, status = AvaliacaoService.criar(data, id_pedido)
    return jsonify(resposta), status