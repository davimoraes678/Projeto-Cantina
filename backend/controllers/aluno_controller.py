from flask import Blueprint, request, jsonify
from flask_login import login_required

from backend.autenticacao import master_required
from backend.services.aluno.atualizar_aluno_service import AtualizarAlunoService
from backend.services.aluno.buscar_aluno_atual_service import BuscarAlunoAtualService
from backend.services.aluno.criar_aluno_service import CriarAlunoService
from backend.services.aluno.deletar_aluno_service import DeletarAlunoService
from backend.services.aluno.listar_aluno_service import ListarAlunoService
from backend.services.aluno.login_aluno_service import LoginAlunoService
from backend.services.aluno.logout_aluno_service import LogoutAlunoService
from backend.services.aluno.promover_aluno_service import PromoverAlunoService
from backend.services.aluno.recarregar_saldo_service import RecarregarSaldoService

# /api/alunos
bp_aluno = Blueprint('alunos', __name__, url_prefix='/api/alunos')


@bp_aluno.route('/registro', methods=['POST'])
def registrar():
    dados = request.get_json(silent=True) or {}
    resposta, status = CriarAlunoService.executar(dados)
    return jsonify(resposta), status


@bp_aluno.route('/login', methods=['POST'])
def login():
    dados = request.get_json(silent=True) or {}
    resposta, status = LoginAlunoService.executar(dados)
    return jsonify(resposta), status


@bp_aluno.route('/logout', methods=['POST'])
@login_required
def logout():
    resposta, status = LogoutAlunoService.executar()
    return jsonify(resposta), status


@bp_aluno.route('/atual', methods=['GET'])
@login_required
def ver_atual():
    resposta, status = BuscarAlunoAtualService.executar()
    return jsonify(resposta), status


@bp_aluno.route('/atual', methods=['PUT'])
@login_required
def atualizar_atual():
    dados = request.get_json(silent=True) or {}
    resposta, status = AtualizarAlunoService.executar(dados)
    return jsonify(resposta), status


@bp_aluno.route('/atual', methods=['DELETE'])
@login_required
def excluir_atual():
    resposta, status = DeletarAlunoService.executar()
    return jsonify(resposta), status


@bp_aluno.route('/atual/recarga', methods=['POST'])
@login_required
def recarregar_saldo():
    dados = request.get_json(silent=True) or {}
    resposta, status = RecarregarSaldoService.executar(dados)
    return jsonify(resposta), status


@bp_aluno.route('', methods=['GET'])
@master_required
def listar():
    resposta, status = ListarAlunoService.executar()
    return jsonify(resposta), status


@bp_aluno.route('/<int:id_aluno>', methods=['PUT'])
@master_required
def promover(id_aluno):
    resposta, status = PromoverAlunoService.executar(id_aluno)
    return jsonify(resposta), status


@bp_aluno.route('/<int:id_aluno>', methods=['DELETE'])
@master_required
def excluir(id_aluno):
    resposta, status = DeletarAlunoService.executar(id_aluno)
    return jsonify(resposta), status
