from flask import Blueprint, jsonify, request
from flask_login import login_required

from backend.services.avaliacao.avaliar_pedido_service import AvaliarPedidoService
from backend.services.avaliacao.listar_avaliacao_service import ListarAvaliacaoService
from backend.services.avaliacao.filtrar_avaliacao_service import FiltrarPorCategoriaService


# /api/pedidos/<id>/avaliacao
bp_avaliacao = Blueprint('avaliacoes', __name__, url_prefix='/api/pedidos')

@bp_avaliacao.route('/avaliacao/todos', methods=['GET'])
@login_required
def listar_todas():
    resposta, status = ListarAvaliacaoService.executar()
    return jsonify(resposta), status

@bp_avaliacao.route('/<int:id_pedido>/avaliacao', methods=['POST'])
@login_required
def avaliar(id_pedido):
    dados = request.get_json(silent=True) or {}
    resposta, status = AvaliarPedidoService.executar(id_pedido, dados)
    return jsonify(resposta), status

# Todos os alunos veem as avaliações (cardápio e janela do produto)
@bp_avaliacao.route('/avaliacao', methods=['GET'])
@login_required
def listar():
    resposta, status = FiltrarPorCategoriaService.executar()
    return jsonify(resposta), status