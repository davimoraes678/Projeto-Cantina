from backend.extensions import db
from backend.models.produto_model import Produto

class ProdutoService:
    @staticmethod
    def criar(data):
        # Validação simples de dados obrigatórios
        if not data.get('nome') or data.get('preco_atual') is None:
            return {"erro": "Nome e preço atual são obrigatórios"}, 400
            
        novo_produto = Produto(
            nome=data.get('nome'),
            quantidade_estoque=data.get('quantidade_estoque', 0),
            tabela_nutricional=data.get('tabela_nutricional'),
            preco_atual=data.get('preco_atual'),
            preco_promocional=data.get('preco_promocional'),
            ingredientes=data.get('ingredientes'),
            categoria=data.get('categoria'),
            status=data.get('status', True)
        )
        novo_produto.salvar()
        return novo_produto.to_dict(), 201

    @staticmethod
    def listar_todos():
        produtos = Produto.listar_todos()
        return [p.to_dict() for p in produtos], 200

    @staticmethod
    def buscar_por_id(id_produto):
        produto = Produto.buscar_por_id(id_produto)
        if not produto:
            return {"erro": "Produto não encontrado"}, 404
        return produto.to_dict(), 200

    @staticmethod
    def atualizar(id_produto, data):
        produto = Produto.buscar_por_id(id_produto)
        if not produto:
            return {"erro": "Produto não encontrado"}, 404
            
        produto.atualizar(
            nome=data.get('nome'),
            quantidade_estoque=data.get('quantidade_estoque'),
            preco_atual=data.get('preco_atual'),
            preco_promocional=data.get('preco_promocional'),
            status=data.get('status')
        )
        return produto.to_dict(), 200

    @staticmethod
    def deletar(id_produto):
        produto = Produto.buscar_por_id(id_produto)
        if not produto:
            return {"erro": "Produto não encontrado"}, 404

        try:
            # Antes de apagar o produto, preserva o histórico dos itens de pedido que o usam:
            # guarda o nome (caso ainda não tenha sido salvo) e solta o vínculo com o produto,
            # para que o pedido continue existindo mesmo depois do produto ser excluído.
            for item in produto.itens_pedido:
                if not item.nome_produto:
                    item.nome_produto = produto.nome
                item.id_produto = None

            db.session.delete(produto)
            db.session.commit()
            return {"mensagem": "Produto deletado com sucesso"}, 200
        except Exception as e:
            db.session.rollback()
            return {"erro": f"Falha ao deletar produto: {str(e)}"}, 500

    @staticmethod
    def buscar(filtros):
        """Equivalente às procedures SQL do banco (buscar_por_categoria,
        ordenar_por_preco, ordenar_por_nome, buscar_por_faixa_de_preco),
        reimplementadas via SQLAlchemy pois a aplicação roda sobre SQLite,
        e não sobre o MySQL onde as procedures foram escritas."""
        query = Produto.query

        categoria = filtros.get('categoria')
        if categoria:
            query = query.filter(Produto.categoria == categoria)

        preco_min = filtros.get('preco_min')
        preco_max = filtros.get('preco_max')
        if preco_min is not None:
            query = query.filter(Produto.preco_atual >= preco_min)
        if preco_max is not None:
            query = query.filter(Produto.preco_atual <= preco_max)

        ordenar = filtros.get('ordenar')
        if ordenar == 'preco':
            query = query.order_by(Produto.preco_atual.asc())
        elif ordenar == 'nome':
            query = query.order_by(Produto.nome.asc())

        produtos = query.all()
        return [p.to_dict() for p in produtos], 200
