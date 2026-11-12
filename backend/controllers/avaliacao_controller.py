from flask import Blueprint, jsonify, request
from flask_login import login_required
from backend.autenticacao import master_required

from backend.services.avaliacao.avaliar_pedido_service import AvaliarPedidoService
from backend.services.avaliacao.listar_avaliacao_service import ListarAvaliacaoService


# /api/pedidos/<id>/avaliacao
bp_avaliacao = Blueprint('avaliacoes', __name__, url_prefix='/api/pedidos')


@bp_avaliacao.route('/<int:id_pedido>/avaliacao', methods=['POST'])
@login_required
def avaliar(id_pedido):
    dados = request.get_json(silent=True) or {}
    resposta, status = AvaliarPedidoService.executar(id_pedido, dados)
    return jsonify(resposta), status

@bp_avaliacao.route('/avaliacao', methods=['GET'])
@master_required
def listar():
    resposta, status = ListarAvaliacaoService.executar()
    return jsonify(resposta), status