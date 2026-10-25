from flask import Blueprint, jsonify, request
from flask_login import login_required

from backend.services.avaliacao.avaliar_pedido_service import AvaliarPedidoService


class AvaliacaoController:
    """Rotas do recurso Avaliação: lê a requisição, chama o service e devolve JSON."""

    @staticmethod
    @login_required
    def avaliar(id_pedido):
        dados = request.get_json(silent=True) or {}
        resposta, status = AvaliarPedidoService.executar(id_pedido, dados)
        return jsonify(resposta), status


# URL: /api/pedidos/<id>/avaliacao (a avaliação é sempre de um pedido)
bp_avaliacao = Blueprint('avaliacoes', __name__, url_prefix='/api/pedidos')
bp_avaliacao.add_url_rule('/<int:id_pedido>/avaliacao', view_func=AvaliacaoController.avaliar, methods=['POST'])
