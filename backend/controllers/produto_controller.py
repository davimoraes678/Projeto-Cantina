from flask import Blueprint, request, jsonify
from backend.services.produto_service import ProdutoService

bp_produto = Blueprint('produtos', __name__, url_prefix='/api/produtos')

@bp_produto.route('', methods=['POST'])
def criar_produto():
    data = request.json
    resposta, status = ProdutoService.criar(data)
    return jsonify(resposta), status

@bp_produto.route('', methods=['GET'])
def listar_produtos():
    resposta, status = ProdutoService.listar_todos()
    return jsonify(resposta), status

@bp_produto.route('/buscar', methods=['GET'])
def buscar_produtos():
    """Busca/filtra/ordena produtos.

    O controller só repassa os query params pro service; quem sabe que isso
    vira `CALL sp_...` no MySQL é o backend/repositories/produto_repository.py
    (Controller -> Service -> Repository -> CALL sp_...(...) -> MySQL).

    Query params aceitos:
      categoria=Bebida                  -> CALL sp_produtos_por_categoria
      preco_min=2&preco_max=10          -> CALL sp_produtos_por_faixa_de_preco
      ordenar=preco                     -> CALL sp_produtos_ordenar_por_preco
      ordenar=nome                      -> CALL sp_produtos_ordenar_por_nome
    """
    filtros = {
        'categoria': request.args.get('categoria') or None,
        'preco_min': request.args.get('preco_min', type=float),
        'preco_max': request.args.get('preco_max', type=float),
        'ordenar': request.args.get('ordenar') or None,
    }
    resposta, status = ProdutoService.buscar(filtros)
    return jsonify(resposta), status

@bp_produto.route('/<int:id_produto>', methods=['GET'])
def buscar_produto(id_produto):
    resposta, status = ProdutoService.buscar_por_id(id_produto)
    return jsonify(resposta), status

@bp_produto.route('/<int:id_produto>', methods=['PUT'])
def atualizar_produto(id_produto):
    data = request.json
    resposta, status = ProdutoService.atualizar(id_produto, data)
    return jsonify(resposta), status

@bp_produto.route('/<int:id_produto>', methods=['DELETE'])
def deletar_produto(id_produto):
    resposta, status = ProdutoService.deletar(id_produto)
    return jsonify(resposta), status
