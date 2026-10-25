from backend.models.produto_model import Produto
from backend.repositories.produto_repository import ProdutoRepository
from backend.services.produto.listar_produtos_service import ListarProdutosService


class FiltrarProdutosService:
    """Caso de uso: buscar produtos por categoria, faixa de preço ou ordenados
    (consulta não-CRUD: stored procedures do MySQL, via ProdutoRepository)."""

    @staticmethod
    def executar(filtros):
        """Busca/filtra/ordena produtos.

        Controller e Service não sabem nada sobre `CALL sp_...` - só o
        ProdutoRepository conhece as procedures. O fluxo principal é:

            ProdutoController -> FiltrarProdutosService -> ProdutoRepository -> CALL sp_...(...) -> MySQL

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
                return ListarProdutosService.executar()

            return linhas, 200

        except Exception as e:
            print(f"[FiltrarProdutosService] Procedure indisponível, usando fallback ORM: {e}")
            return FiltrarProdutosService._buscar_fallback_orm(categoria, preco_min, preco_max, ordenar)

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
