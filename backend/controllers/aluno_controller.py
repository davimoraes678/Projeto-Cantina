from flask import Blueprint, request, jsonify
from backend.services.aluno.criar_aluno_service import CriarAlunoService
from backend.services.aluno.login_aluno_service import LoginAlunoService, admin_required, master_required
from backend.services.aluno.listar_aluno_service import ListarAlunoService
from backend.services.aluno.atualizar_aluno_service import AtualizarAlunoService
from backend.services.aluno.deletar_aluno_service import DeletarAlunoService
from backend.models.aluno_model import Aluno
from backend.extensions import db

from flask_login import login_required, current_user


bp_aluno = Blueprint('alunos', __name__, url_prefix='/api/alunos')

@bp_aluno.route('/registro', methods=['POST'])
def registro_aluno():
    dados = request.get_json()
    resposta, status = CriarAlunoService.executar(dados)
    return jsonify(resposta), status

@bp_aluno.route('/atual', methods=['GET', 'PUT', 'DELETE'])
@login_required
def aluno_atual():
    if request.method == 'PUT':
        dados = request.get_json()
        resposta, status = AtualizarAlunoService.executar(dados)
        return jsonify(resposta), status
    elif request.method == 'DELETE':
        resposta, status = DeletarAlunoService.executar()
        return jsonify(resposta), status
    return jsonify(current_user.to_dict()), 200

@bp_aluno.route("/promove", methods=["PUT"])
@master_required
def promove_aluno():
    data = request.get_json()
    resposta, status = AtualizarAlunoService.atualizar_status(id_aluno, data)
    return jsonify(resposta), status

@bp_aluno.route('/login', methods=['POST'])
def login_aluno():
    dados = request.get_json()
    resposta, status = LoginAlunoService.executar(dados)
    return jsonify(resposta), status

@bp_aluno.route('/logout', methods=['POST'])
@login_required
def logout_aluno():
    LoginAlunoService.logout()
    return jsonify({"mensagem": "Logout realizado com sucesso"}), 200

@bp_aluno.route('', methods=['GET', 'PUT'])
@master_required
def listar_alunos():
    resposta, status = ListarAlunoService.executar()
    return jsonify(resposta), status


@bp_aluno.route('/<int:id_aluno>', methods=['DELETE'])
def deletar_aluno(id_aluno):
    resposta, status = DeletarAlunoService.executar(id_aluno)
    return jsonify(resposta), status

@bp_aluno.route('/<int:id_aluno>', methods=["PUT"])
@master_required
def promover_aluno(id_aluno):

    aluno = Aluno.query.get(id_aluno)
    if not aluno:
        return {"erro": "Aluno não encontrado"}, 404

    aluno.funcao = 'admin'
    db.session.commit()
    return aluno.to_dict(), 200