from flask import Blueprint, request, jsonify
from backend.services.aluno.criar_aluno_service import CriarAlunoService
from backend.services.aluno.listar_aluno_service import ListarAlunoService
from backend.services.aluno.atualizar_aluno_service import AtualizarAlunoService
from backend.services.aluno.deletar_aluno_service import DeletarAlunoService

bp_aluno = Blueprint('alunos', __name__, url_prefix='/api/alunos')

@bp_aluno.route('', methods=['POST'])
def criar_aluno():
    dados = request.get_json()
    resposta, status = CriarAlunoService.executar(dados)
    return jsonify(resposta), status

@bp_aluno.route('', methods=['GET'])
def listar_alunos():
    resposta, status = ListarAlunoService.executar()
    return jsonify(resposta), status

@bp_aluno.route('/<int:id_aluno>', methods=['PUT'])
def atualizar_aluno(id_aluno):
    dados = request.get_json()
    resposta, status = AtualizarAlunoService.executar(id_aluno, dados)
    return jsonify(resposta), status

@bp_aluno.route('/<int:id_aluno>', methods=['DELETE'])
def deletar_aluno(id_aluno):
    resposta, status = DeletarAlunoService.executar(id_aluno)
    return jsonify(resposta), status
