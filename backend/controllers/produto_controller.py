from flask import Blueprint, current_app, jsonify, request, send_from_directory

from backend.autenticacao import master_required
from backend.services.produto.atualizar_produto_service import AtualizarProdutoService
from backend.services.produto.buscar_imagem_produto_service import BuscarImagemProdutoService
from backend.services.produto.buscar_produto_service import BuscarProdutoService
from backend.services.produto.criar_produto_service import CriarProdutoService
from backend.services.produto.deletar_produto_service import DeletarProdutoService
from backend.services.produto.enviar_imagem_produto_service import EnviarImagemProdutoService
from backend.services.produto.filtrar_produtos_service import FiltrarProdutosService
from backend.services.produto.listar_produtos_service import ListarProdutosService

# /api/produtos
bp_produto = Blueprint('produtos', __name__, url_prefix='/api/produtos')


@bp_produto.route('', methods=['GET'])
def listar():
    resposta, status = ListarProdutosService.executar()
    return jsonify(resposta), status


@bp_produto.route('', methods=['POST'])
@master_required
def criar():
    dados = request.get_json(silent=True) or {}
    resposta, status = CriarProdutoService.executar(dados)
    return jsonify(resposta), status


@bp_produto.route('/buscar', methods=['GET'])
def filtrar():
    # ?categoria=Bebida  ?preco_min=2&preco_max=10  ?ordenar=preco|nome
    filtros = {
        'categoria': request.args.get('categoria') or None,
        'preco_min': request.args.get('preco_min', type=float),
        'preco_max': request.args.get('preco_max', type=float),
        'ordenar': request.args.get('ordenar') or None,
    }
    resposta, status = FiltrarProdutosService.executar(filtros)
    return jsonify(resposta), status


@bp_produto.route('/<int:id_produto>', methods=['GET'])
def buscar(id_produto):
    resposta, status = BuscarProdutoService.executar(id_produto)
    return jsonify(resposta), status


@bp_produto.route('/<int:id_produto>', methods=['PUT'])
@master_required
def atualizar(id_produto):
    dados = request.get_json(silent=True) or {}
    resposta, status = AtualizarProdutoService.executar(id_produto, dados)
    return jsonify(resposta), status


@bp_produto.route('/<int:id_produto>', methods=['DELETE'])
@master_required
def excluir(id_produto):
    resposta, status = DeletarProdutoService.executar(id_produto)
    return jsonify(resposta), status


@bp_produto.route('/<int:id_produto>/imagem', methods=['POST'])
@master_required
def enviar_imagem(id_produto):
    resposta, status = EnviarImagemProdutoService.executar(id_produto, request.files.get("imagem"))
    return jsonify(resposta), status


@bp_produto.route('/<int:id_produto>/imagem', methods=['GET'])
def ver_imagem(id_produto):
    resposta, status = BuscarImagemProdutoService.executar(id_produto)
    if status != 200:
        return jsonify(resposta), status
    # Devolve o arquivo da imagem
    arquivo = send_from_directory(current_app.config["IMAGENS_PRODUTOS_DIR"], resposta["arquivo"])
    # Com "?v=", o endereço muda quando a foto muda: o navegador pode guardar a foto
    if request.args.get("v"):
        arquivo.headers["Cache-Control"] = "public, max-age=31536000"
    else:
        arquivo.headers["Cache-Control"] = "no-cache"
    return arquivo
