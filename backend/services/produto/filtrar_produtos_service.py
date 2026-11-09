from backend.repositories.produto_repository import ProdutoRepository
from backend.services.produto.listar_produtos_service import ListarProdutosService


class FiltrarProdutosService:
    @staticmethod
    def executar(filtros):
        categoria = filtros.get('categoria')
        preco_min = filtros.get('preco_min')
        preco_max = filtros.get('preco_max')
        ordenar = filtros.get('ordenar')

        if categoria:
            produtos = ProdutoRepository.buscar_por_categoria(categoria)
        elif preco_min is not None or preco_max is not None:
            # Lado vazio fica aberto
            minimo = preco_min if preco_min is not None else 0
            maximo = preco_max if preco_max is not None else 999999
            produtos = ProdutoRepository.buscar_por_faixa_de_preco(minimo, maximo)
        elif ordenar == 'preco':
            produtos = ProdutoRepository.ordenar_por_preco()
        elif ordenar == 'nome':
            produtos = ProdutoRepository.ordenar_por_nome()
        else:
            # Sem filtro: lista tudo
            return ListarProdutosService.executar()

        return [produto.to_dict() for produto in produtos], 200
