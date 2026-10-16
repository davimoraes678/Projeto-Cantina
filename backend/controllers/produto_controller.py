from flask import Blueprint, request, jsonify, send_from_directory, current_app
from backend.services.produto_service import ProdutoService
from backend.models.produto_model import Produto
from backend.services.imagem_service import salvar_imagem, nome_imagem

bp_produto = Blueprint('produtos', __name__, url_prefix='/api/produtos')

@bp_produto.route('', methods=['POST'])
def criar_produto():
    data = request.get_json(silent=True) or {}
    resposta, status = ProdutoService.criar(data)
    return jsonify(resposta), status

@bp_produto.route('', methods=['GET'])
def listar_produtos():
    resposta, status = ProdutoService.listar_todos()
    return jsonify(resposta), status

@bp_produto.route('/categorias', methods=['GET'])
def listar_categorias():
    """Categorias aceitas (constante CATEGORIAS do back-end); o front monta os filtros a partir daqui."""
    resposta, status = ProdutoService.categorias()
    return jsonify(resposta), status

@bp_produto.route('/buscar', methods=['GET'])
def buscar_produtos():
    """Busca/filtra/ordena produtos.

    O controller só repassa os query params pro service; quem sabe que isso
    vira `CALL sp_produtos_buscar` no MySQL é o backend/repositories/produto_repository.py
    (Controller -> Service -> Repository -> CALL sp_...(...) -> MySQL).

    Query params aceitos (todos opcionais e combináveis):
      categoria=Bebida        preco_min=2        preco_max=10
      ordenar=nome|preco      ativos=1 (só produtos disponíveis)
    """
    preco_min = request.args.get('preco_min', type=float)
    preco_max = request.args.get('preco_max', type=float)
    # type=float devolve None quando o texto não é número; avisa em vez de ignorar o filtro em silêncio.
    if (request.args.get('preco_min') and preco_min is None) or (request.args.get('preco_max') and preco_max is None):
        return jsonify(erro="Os preços do filtro devem ser números."), 400

    filtros = {
        'categoria': request.args.get('categoria') or None,
        'preco_min': preco_min,
        'preco_max': preco_max,
        'ordenar': request.args.get('ordenar') or None,
        'apenas_ativos': request.args.get('ativos') == '1',
    }
    resposta, status = ProdutoService.buscar(filtros)
    return jsonify(resposta), status

@bp_produto.route('/<int:id_produto>', methods=['GET'])
def buscar_produto(id_produto):
    resposta, status = ProdutoService.buscar_por_id(id_produto)
    return jsonify(resposta), status

@bp_produto.route('/<int:id_produto>', methods=['PUT'])
def atualizar_produto(id_produto):
    data = request.get_json(silent=True) or {}
    resposta, status = ProdutoService.atualizar(id_produto, data)
    return jsonify(resposta), status

@bp_produto.route('/<int:id_produto>', methods=['DELETE'])
def deletar_produto(id_produto):
    resposta, status = ProdutoService.deletar(id_produto)
    return jsonify(resposta), status


@bp_produto.route('/<int:id_produto>/imagem', methods=['POST'])
def enviar_imagem_produto(id_produto):
    produto = Produto.buscar_por_id(id_produto)
    if not produto:
        return jsonify(erro="Produto não encontrado"), 404
    arquivo = request.files.get("imagem")
    if arquivo is None or not arquivo.filename:
        return jsonify(erro="Selecione uma imagem."), 400
    try:
        nome = salvar_imagem(produto, arquivo)
    except ValueError as erro:
        return jsonify(erro=str(erro)), 400
    return jsonify(nome=nome, url=f"/api/produtos/{id_produto}/imagem"), 201


@bp_produto.route('/<int:id_produto>/imagem', methods=['GET'])
def visualizar_imagem_produto(id_produto):
    produto = Produto.buscar_por_id(id_produto)
    if not produto:
        return jsonify(erro="Produto não encontrado"), 404
    try:
        nome = nome_imagem(produto.nome)
    except ValueError:
        return jsonify(erro="Produto sem imagem"), 404
    resposta = send_from_directory(current_app.config["ARQUIVOS_DIR"], nome)
    resposta.headers["Cache-Control"] = "no-cache"
    return resposta
