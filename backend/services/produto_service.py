from backend.extensions import db
from backend.models.produto_model import Produto
from backend.repositories.produto_repository import ProdutoRepository

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
            categoria=data.get('categoria'),
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
        """Busca/filtra/ordena produtos.

        Controller e Service não sabem nada sobre `CALL sp_...` - só o
        ProdutoRepository conhece as procedures. O fluxo principal é:

            ProdutoController -> ProdutoService.buscar -> ProdutoRepository -> CALL sp_...(...) -> MySQL

        Cada procedure resolve um caso de uso específico, então aqui só decidimos
        qual delas chamar de acordo com o filtro escolhido no front-end.

        Se o banco configurado não for MySQL (ex.: SQLite, usado por padrão em
        desenvolvimento) ou a procedure ainda não existir nesse banco, cai num
        fallback via SQLAlchemy/ORM equivalente, pra busca nunca ficar quebrada
        pro usuário - só loga o motivo no console do servidor.
        """
        categoria = filtros.get('categoria')
        preco_min = filtros.get('preco_min')
        preco_max = filtros.get('preco_max')
        ordenar = filtros.get('ordenar')

        try:
            if categoria:
                linhas = ProdutoRepository.buscar_por_categoria(categoria)
            elif preco_min is not None or preco_max is not None:
                linhas = ProdutoRepository.buscar_por_faixa_de_preco(
                    preco_min if preco_min is not None else 0,
                    preco_max if preco_max is not None else 999999
                )
            elif ordenar == 'preco':
                linhas = ProdutoRepository.ordenar_por_preco()
            elif ordenar == 'nome':
                linhas = ProdutoRepository.ordenar_por_nome()
            else:
                # Sem filtro: lista tudo (não existe procedure pra "listar todos").
                return ProdutoService.listar_todos()

            return linhas, 200

        except Exception as e:
            print(f"[ProdutoService.buscar] Procedure indisponível, usando fallback ORM: {e}")
            return ProdutoService._buscar_fallback_orm(categoria, preco_min, preco_max, ordenar)

    @staticmethod
    def _buscar_fallback_orm(categoria, preco_min, preco_max, ordenar):
        """Mesmo resultado das procedures, mas via SQLAlchemy - usado quando o
        banco atual não é MySQL ou as procedures ainda não foram criadas nele."""
        query = Produto.query

        if categoria:
            query = query.filter(Produto.categoria == categoria)
        if preco_min is not None:
            query = query.filter(Produto.preco_atual >= preco_min)
        if preco_max is not None:
            query = query.filter(Produto.preco_atual <= preco_max)

        if ordenar == 'preco':
            query = query.order_by(Produto.preco_atual.asc())
        elif ordenar == 'nome':
            query = query.order_by(Produto.nome.asc())

        produtos = query.all()
        return [p.to_dict() for p in produtos], 200
