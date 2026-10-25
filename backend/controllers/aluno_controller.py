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


class AlunoController:
    """Rotas do recurso Aluno: lê a requisição, chama o service e devolve JSON."""

    @staticmethod
    def registrar():
        dados = request.get_json(silent=True) or {}
        resposta, status = CriarAlunoService.executar(dados)
        return jsonify(resposta), status

    @staticmethod
    def login():
        dados = request.get_json(silent=True) or {}
        resposta, status = LoginAlunoService.executar(dados)
        return jsonify(resposta), status

    @staticmethod
    @login_required
    def logout():
        resposta, status = LogoutAlunoService.executar()
        return jsonify(resposta), status

    @staticmethod
    @login_required
    def ver_atual():
        resposta, status = BuscarAlunoAtualService.executar()
        return jsonify(resposta), status

    @staticmethod
    @login_required
    def atualizar_atual():
        dados = request.get_json(silent=True) or {}
        resposta, status = AtualizarAlunoService.executar(dados)
        return jsonify(resposta), status

    @staticmethod
    @login_required
    def excluir_atual():
        resposta, status = DeletarAlunoService.executar()
        return jsonify(resposta), status

    @staticmethod
    @login_required
    def recarregar_saldo():
        dados = request.get_json(silent=True) or {}
        resposta, status = RecarregarSaldoService.executar(dados)
        return jsonify(resposta), status

    @staticmethod
    @master_required
    def listar():
        resposta, status = ListarAlunoService.executar()
        return jsonify(resposta), status

    @staticmethod
    @master_required
    def promover(id_aluno):
        resposta, status = PromoverAlunoService.executar(id_aluno)
        return jsonify(resposta), status

    @staticmethod
    @master_required
    def excluir(id_aluno):
        resposta, status = DeletarAlunoService.executar(id_aluno)
        return jsonify(resposta), status


# URLs do recurso: /api/alunos/...
bp_aluno = Blueprint('alunos', __name__, url_prefix='/api/alunos')
bp_aluno.add_url_rule('/registro', view_func=AlunoController.registrar, methods=['POST'])
bp_aluno.add_url_rule('/login', view_func=AlunoController.login, methods=['POST'])
bp_aluno.add_url_rule('/logout', view_func=AlunoController.logout, methods=['POST'])
bp_aluno.add_url_rule('/atual', view_func=AlunoController.ver_atual, methods=['GET'])
bp_aluno.add_url_rule('/atual', view_func=AlunoController.atualizar_atual, methods=['PUT'])
bp_aluno.add_url_rule('/atual', view_func=AlunoController.excluir_atual, methods=['DELETE'])
bp_aluno.add_url_rule('/atual/recarga', view_func=AlunoController.recarregar_saldo, methods=['POST'])
bp_aluno.add_url_rule('', view_func=AlunoController.listar, methods=['GET'])
bp_aluno.add_url_rule('/<int:id_aluno>', view_func=AlunoController.promover, methods=['PUT'])
bp_aluno.add_url_rule('/<int:id_aluno>', view_func=AlunoController.excluir, methods=['DELETE'])
