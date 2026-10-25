from flask import Blueprint, jsonify
from flask_login import login_required

from backend.autenticacao import admin_required
from backend.services.pedido.buscar_pedido_service import BuscarPedidoService
from backend.services.pedido.cancelar_pedido_service import CancelarPedidoService
from backend.services.pedido.combinacoes_mais_pedidas_service import CombinacoesMaisPedidasService
from backend.services.pedido.concluir_pedido_service import ConcluirPedidoService
from backend.services.pedido.listar_pedidos_service import ListarPedidosService


class PedidoController:
    """Rotas do recurso Pedido: lê a requisição, chama o service e devolve JSON."""

    @staticmethod
    @admin_required
    def listar():
        resposta, status = ListarPedidosService.executar()
        return jsonify(resposta), status

    @staticmethod
    @login_required
    def buscar(id_pedido):
        resposta, status = BuscarPedidoService.executar(id_pedido)
        return jsonify(resposta), status

    @staticmethod
    @admin_required
    def concluir(id_pedido):
        resposta, status = ConcluirPedidoService.executar(id_pedido)
        return jsonify(resposta), status

    @staticmethod
    @admin_required
    def cancelar(id_pedido):
        resposta, status = CancelarPedidoService.executar(id_pedido)
        return jsonify(resposta), status

    @staticmethod
    @login_required
    def combinacoes_mais_pedidas():
        resposta, status = CombinacoesMaisPedidasService.executar()
        return jsonify(resposta), status


# URLs do recurso: /api/pedidos/...
bp_pedido = Blueprint('pedidos', __name__, url_prefix='/api/pedidos')
bp_pedido.add_url_rule('', view_func=PedidoController.listar, methods=['GET'])
bp_pedido.add_url_rule('/combinacoes', view_func=PedidoController.combinacoes_mais_pedidas, methods=['GET'])
bp_pedido.add_url_rule('/<int:id_pedido>', view_func=PedidoController.buscar, methods=['GET'])
bp_pedido.add_url_rule('/<int:id_pedido>/concluir', view_func=PedidoController.concluir, methods=['POST'])
bp_pedido.add_url_rule('/<int:id_pedido>/cancelar', view_func=PedidoController.cancelar, methods=['POST'])
