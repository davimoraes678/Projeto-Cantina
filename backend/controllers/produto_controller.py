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


class ProdutoController:
    """Rotas do recurso Produto: lê a requisição, chama o service e devolve JSON."""

    @staticmethod
    def listar():
        resposta, status = ListarProdutosService.executar()
        return jsonify(resposta), status

    @staticmethod
    def filtrar():
        # Query params: ?categoria=Bebida  ?preco_min=2&preco_max=10  ?ordenar=preco|nome
        filtros = {
            'categoria': request.args.get('categoria') or None,
            'preco_min': request.args.get('preco_min', type=float),
            'preco_max': request.args.get('preco_max', type=float),
            'ordenar': request.args.get('ordenar') or None,
        }
        resposta, status = FiltrarProdutosService.executar(filtros)
        return jsonify(resposta), status

    @staticmethod
    def buscar(id_produto):
        resposta, status = BuscarProdutoService.executar(id_produto)
        return jsonify(resposta), status

    @staticmethod
    @master_required
    def criar():
        dados = request.get_json(silent=True) or {}
        resposta, status = CriarProdutoService.executar(dados)
        return jsonify(resposta), status

    @staticmethod
    @master_required
    def atualizar(id_produto):
        dados = request.get_json(silent=True) or {}
        resposta, status = AtualizarProdutoService.executar(id_produto, dados)
        return jsonify(resposta), status

    @staticmethod
    @master_required
    def excluir(id_produto):
        resposta, status = DeletarProdutoService.executar(id_produto)
        return jsonify(resposta), status

    @staticmethod
    @master_required
    def enviar_imagem(id_produto):
        resposta, status = EnviarImagemProdutoService.executar(id_produto, request.files.get("imagem"))
        return jsonify(resposta), status

    @staticmethod
    def ver_imagem(id_produto):
        resposta, status = BuscarImagemProdutoService.executar(id_produto)
        if status != 200:
            return jsonify(resposta), status
        # A resposta aqui é o próprio arquivo da imagem
        arquivo = send_from_directory(current_app.config["ARQUIVOS_DIR"], resposta["arquivo"])
        arquivo.headers["Cache-Control"] = "no-cache"
        return arquivo


# URLs do recurso: /api/produtos/...
bp_produto = Blueprint('produtos', __name__, url_prefix='/api/produtos')
bp_produto.add_url_rule('', view_func=ProdutoController.listar, methods=['GET'])
bp_produto.add_url_rule('', view_func=ProdutoController.criar, methods=['POST'])
bp_produto.add_url_rule('/buscar', view_func=ProdutoController.filtrar, methods=['GET'])
bp_produto.add_url_rule('/<int:id_produto>', view_func=ProdutoController.buscar, methods=['GET'])
bp_produto.add_url_rule('/<int:id_produto>', view_func=ProdutoController.atualizar, methods=['PUT'])
bp_produto.add_url_rule('/<int:id_produto>', view_func=ProdutoController.excluir, methods=['DELETE'])
bp_produto.add_url_rule('/<int:id_produto>/imagem', view_func=ProdutoController.enviar_imagem, methods=['POST'])
bp_produto.add_url_rule('/<int:id_produto>/imagem', view_func=ProdutoController.ver_imagem, methods=['GET'])
