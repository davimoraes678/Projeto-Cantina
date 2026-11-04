from flask import Blueprint, jsonify
from flask_login import login_required

from backend.autenticacao import admin_required
from backend.services.pedido.buscar_pedido_service import BuscarPedidoService
from backend.services.pedido.cancelar_pedido_service import CancelarPedidoService
from backend.services.pedido.combinacoes_mais_pedidas_service import CombinacoesMaisPedidasService
from backend.services.pedido.concluir_pedido_service import ConcluirPedidoService
from backend.services.pedido.listar_meus_pedidos_service import ListarMeusPedidosService
from backend.services.pedido.listar_pedidos_service import ListarPedidosService
from backend.services.pedido.marcar_pronto_service import MarcarProntoService

# Rotas do recurso Pedido: lê a requisição, chama o service e devolve JSON.
# URLs do recurso: /api/pedidos/...
bp_pedido = Blueprint('pedidos', __name__, url_prefix='/api/pedidos')


@bp_pedido.route('', methods=['GET'])
@admin_required
def listar():
    resposta, status = ListarPedidosService.executar()
    return jsonify(resposta), status


@bp_pedido.route('/meus', methods=['GET'])
@login_required
def listar_meus():
    resposta, status = ListarMeusPedidosService.executar()
    return jsonify(resposta), status


@bp_pedido.route('/combinacoes', methods=['GET'])
@login_required
def combinacoes_mais_pedidas():
    resposta, status = CombinacoesMaisPedidasService.executar()
    return jsonify(resposta), status


@bp_pedido.route('/<int:id_pedido>', methods=['GET'])
@login_required
def buscar(id_pedido):
    resposta, status = BuscarPedidoService.executar(id_pedido)
    return jsonify(resposta), status


@bp_pedido.route('/<int:id_pedido>/pronto', methods=['POST'])
@admin_required
def marcar_pronto(id_pedido):
    resposta, status = MarcarProntoService.executar(id_pedido)
    return jsonify(resposta), status


@bp_pedido.route('/<int:id_pedido>/concluir', methods=['POST'])
@admin_required
def concluir(id_pedido):
    resposta, status = ConcluirPedidoService.executar(id_pedido)
    return jsonify(resposta), status


@bp_pedido.route('/<int:id_pedido>/cancelar', methods=['POST'])
@admin_required
def cancelar(id_pedido):
    resposta, status = CancelarPedidoService.executar(id_pedido)
    return jsonify(resposta), status
