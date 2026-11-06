from backend.repositories.produto_repository import ProdutoRepository
from backend.services.produto.listar_produtos_service import ListarProdutosService


class FiltrarProdutosService:
    """Caso de uso: buscar produtos por categoria, faixa de preço ou ordenados.

    Cada filtro é uma consulta do ProdutoRepository (stored procedure no MySQL,
    ORM nos outros bancos). Só o primeiro filtro preenchido é usado, nesta ordem:
    categoria, faixa de preço, ordenação.
    """

    @staticmethod
    def executar(filtros):
        categoria = filtros.get('categoria')
        preco_min = filtros.get('preco_min')
        preco_max = filtros.get('preco_max')
        ordenar = filtros.get('ordenar')

        if categoria:
            produtos = ProdutoRepository.buscar_por_categoria(categoria)
        elif preco_min is not None or preco_max is not None:
            # Se só um dos lados for informado, o outro fica "aberto"
            minimo = preco_min if preco_min is not None else 0
            maximo = preco_max if preco_max is not None else 999999
            produtos = ProdutoRepository.buscar_por_faixa_de_preco(minimo, maximo)
        elif ordenar == 'preco':
            produtos = ProdutoRepository.ordenar_por_preco()
        elif ordenar == 'nome':
            produtos = ProdutoRepository.ordenar_por_nome()
        else:
            # Sem filtro: lista tudo (não existe procedure para "listar todos")
            return ListarProdutosService.executar()

        return [produto.to_dict() for produto in produtos], 200
