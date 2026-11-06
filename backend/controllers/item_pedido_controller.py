from flask import Blueprint, jsonify, request
from flask_login import login_required

from backend.services.carrinho.adicionar_item_carrinho_service import AdicionarItemCarrinhoService
from backend.services.carrinho.finalizar_pedido_service import FinalizarPedidoService
from backend.services.carrinho.remover_item_carrinho_service import RemoverItemCarrinhoService
from backend.services.carrinho.repetir_pedido_service import RepetirPedidoService
from backend.services.carrinho.repetir_ultimo_pedido_service import RepetirUltimoPedidoService
from backend.services.carrinho.ver_carrinho_service import VerCarrinhoService

# Rotas do carrinho (itens de pedido do aluno logado).
# 
# Todas usam o aluno logado (current_user), por isso nenhuma recebe id_aluno na URL.
# URLs do recurso: /api/carrinho/...
bp_item_pedido = Blueprint('carrinho', __name__, url_prefix='/api/carrinho')


@bp_item_pedido.route('', methods=['GET'])
@login_required
def ver_carrinho():
    resposta, status = VerCarrinhoService.executar()
    return jsonify(resposta), status


@bp_item_pedido.route('/itens', methods=['POST'])
@login_required
def adicionar_item():
    dados = request.get_json(silent=True) or {}
    resposta, status = AdicionarItemCarrinhoService.executar(dados)
    return jsonify(resposta), status


@bp_item_pedido.route('/itens/<int:id_item_pedido>', methods=['DELETE'])
@login_required
def remover_item(id_item_pedido):
    resposta, status = RemoverItemCarrinhoService.executar(id_item_pedido)
    return jsonify(resposta), status


@bp_item_pedido.route('/repetir', methods=['POST'])
@login_required
def repetir_ultimo_pedido():
    resposta, status = RepetirUltimoPedidoService.executar()
    return jsonify(resposta), status


@bp_item_pedido.route('/repetir/<int:id_pedido>', methods=['POST'])
@login_required
def repetir_pedido(id_pedido):
    resposta, status = RepetirPedidoService.executar(id_pedido)
    return jsonify(resposta), status


@bp_item_pedido.route('/finalizar', methods=['POST'])
@login_required
def finalizar():
    resposta, status = FinalizarPedidoService.executar()
    return jsonify(resposta), status
