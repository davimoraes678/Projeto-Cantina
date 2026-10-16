import logging
from sqlalchemy.exc import SQLAlchemyError
from backend.constantes import CATEGORIAS
from backend.extensions import db
from backend.models.produto_model import Produto
from backend.repositories.produto_repository import ProdutoRepository
from backend.services.imagem_service import (
    remover_imagem, renomear_imagem, url_imagem, verificar_renomeacao,
)

logger = logging.getLogger(__name__)

ORDENACOES = ("nome", "preco")


def _para_dict(produto):
    """Produto em dicionário, já com o endereço da imagem (None se não tiver)."""
    dados = produto.to_dict()
    dados['imagem_url'] = url_imagem(produto.id_produto, produto.nome)
    return dados


def _validar_categoria(categoria):
    """Devolve a mensagem de erro se a categoria não estiver em CATEGORIAS, senão None."""
    if categoria is not None and categoria not in CATEGORIAS:
        return f"Categoria inválida. Use: {', '.join(CATEGORIAS)}"
    return None


class ProdutoService:
    @staticmethod
    def categorias():
        return list(CATEGORIAS), 200

    @staticmethod
    def criar(data):
        # Validação simples de dados obrigatórios
        if not data.get('nome') or data.get('preco_atual') is None:
            return {"erro": "Nome e preço atual são obrigatórios"}, 400

        categoria = data.get('categoria') or None
        erro_categoria = _validar_categoria(categoria)
        if erro_categoria:
            return {"erro": erro_categoria}, 400

        novo_produto = Produto(
            nome=data.get('nome'),
            quantidade_estoque=data.get('quantidade_estoque', 0),
            tabela_nutricional=data.get('tabela_nutricional'),
            preco_atual=data.get('preco_atual'),
            preco_promocional=data.get('preco_promocional'),
            ingredientes=data.get('ingredientes'),
            categoria=categoria,
            status=data.get('status', True)
        )
        novo_produto.salvar()
        return _para_dict(novo_produto), 201

    @staticmethod
    def listar_todos():
        produtos = Produto.listar_todos()
        return [_para_dict(p) for p in produtos], 200

    @staticmethod
    def buscar_por_id(id_produto):
        produto = Produto.buscar_por_id(id_produto)
        if not produto:
            return {"erro": "Produto não encontrado"}, 404
        return _para_dict(produto), 200

    @staticmethod
    def atualizar(id_produto, data):
        produto = Produto.buscar_por_id(id_produto)
        if not produto:
            return {"erro": "Produto não encontrado"}, 404

        erro_categoria = _validar_categoria(data.get('categoria') or None)
        if erro_categoria:
            return {"erro": erro_categoria}, 400

        nome_antigo = produto.nome
        novo_nome = data.get('nome')
        if novo_nome:
            # Confere a imagem ANTES de mexer no banco: se der erro, nada foi alterado.
            try:
                verificar_renomeacao(produto, novo_nome)
            except ValueError as erro:
                return {"erro": str(erro)}, 400

        produto.atualizar(
            nome=novo_nome,
            quantidade_estoque=data.get('quantidade_estoque'),
            preco_atual=data.get('preco_atual'),
            preco_promocional=data.get('preco_promocional'),
            categoria=data.get('categoria'),
            status=data.get('status'),
            ingredientes=data.get('ingredientes'),
            tabela_nutricional=data.get('tabela_nutricional'),
        )
        if novo_nome:
            renomear_imagem(nome_antigo, novo_nome)  # o banco já está certo; agora o arquivo acompanha
        return _para_dict(produto), 200

    @staticmethod
    def deletar(id_produto):
        produto = Produto.buscar_por_id(id_produto)
        if not produto:
            return {"erro": "Produto não encontrado"}, 404

        try:
            nome = produto.nome
            # Antes de apagar o produto, preserva o histórico dos itens de pedido que o usam:
            # guarda o nome (caso ainda não tenha sido salvo) e solta o vínculo com o produto,
            # para que o pedido continue existindo mesmo depois do produto ser excluído.
            for item in produto.itens_pedido:
                if not item.nome_produto:
                    item.nome_produto = produto.nome
                item.id_produto = None

            db.session.delete(produto)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return {"erro": f"Falha ao deletar produto: {str(e)}"}, 500

        remover_imagem(nome)
        return {"mensagem": "Produto deletado com sucesso"}, 200

    @staticmethod
    def buscar(filtros):
        """Busca/filtra/ordena produtos. Os filtros (categoria, faixa de preço, ordenação) se combinam.

        No MySQL a busca é a procedure `sp_produtos_buscar` (via ProdutoRepository); em outro banco
        (SQLite em desenvolvimento) é a mesma busca pelo ORM. Os dois devolvem o mesmo formato.
        """
        categoria = filtros.get('categoria')
        preco_min = filtros.get('preco_min')
        preco_max = filtros.get('preco_max')
        ordenar = filtros.get('ordenar')
        apenas_ativos = bool(filtros.get('apenas_ativos'))

        erro_categoria = _validar_categoria(categoria)
        if erro_categoria:
            return {"erro": erro_categoria}, 400
        if ordenar is not None and ordenar not in ORDENACOES:
            return {"erro": f"Ordenação inválida. Use: {', '.join(ORDENACOES)}"}, 400
        if preco_min is not None and preco_max is not None and preco_min > preco_max:
            return {"erro": "O preço mínimo não pode ser maior que o máximo"}, 400

        if ProdutoRepository.usa_procedures():
            try:
                linhas = ProdutoRepository.buscar(categoria, preco_min, preco_max, ordenar, apenas_ativos)
                return [ProdutoService._normalizar_linha(linha) for linha in linhas], 200
            except SQLAlchemyError as erro:
                # Procedure ausente (script SQL não rodado nesse banco): não deixa a busca quebrada.
                db.session.rollback()
                logger.warning("Procedure sp_produtos_buscar indisponível, usando o ORM: %s", erro)

        return ProdutoService._buscar_orm(categoria, preco_min, preco_max, ordenar, apenas_ativos), 200

    @staticmethod
    def _buscar_orm(categoria, preco_min, preco_max, ordenar, apenas_ativos):
        """Mesma busca da procedure, pelo SQLAlchemy."""
        query = Produto.query
        if categoria:
            query = query.filter(Produto.categoria == categoria)
        if preco_min is not None:
            query = query.filter(Produto.preco_atual >= preco_min)
        if preco_max is not None:
            query = query.filter(Produto.preco_atual <= preco_max)
        if apenas_ativos:
            query = query.filter(Produto.status.is_(True))

        if ordenar == 'preco':
            query = query.order_by(Produto.preco_atual.asc(), Produto.id_produto.asc())
        elif ordenar == 'nome':
            query = query.order_by(Produto.nome.asc(), Produto.id_produto.asc())
        else:
            query = query.order_by(Produto.id_produto.asc())
        return [_para_dict(p) for p in query.all()]

    @staticmethod
    def _normalizar_linha(linha):
        """Deixa a linha da procedure igual ao `to_dict()` do model: números como float e status como bool."""
        dados = dict(linha)
        for campo in ('preco_atual', 'preco_promocional'):
            if dados.get(campo) is not None:
                dados[campo] = float(dados[campo])
        dados['status'] = bool(dados.get('status'))
        dados['imagem_url'] = url_imagem(dados['id_produto'], dados['nome'])
        return dados
