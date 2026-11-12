import unicodedata

from backend.models.produto_model import Produto
from backend.repositories.produto_repository import ProdutoRepository


# "Água" -> "agua": ordena sem diferenciar maiúsculas e acentos
def chave_nome(produto):
    nome = unicodedata.normalize("NFD", produto.nome.lower())
    return "".join(letra for letra in nome if not unicodedata.combining(letra))


class FiltrarProdutosService:
    @staticmethod
    def executar(filtros):
        categoria = filtros.get('categoria')
        preco_min = filtros.get('preco_min')
        preco_max = filtros.get('preco_max')
        ordenar = filtros.get('ordenar')

        # A procedure faz o primeiro filtro escolhido
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
            produtos = Produto.listar_todos()

        # Os outros filtros são aplicados em cima do resultado
        if preco_min is not None:
            produtos = [p for p in produtos if p.preco_atual >= preco_min]
        if preco_max is not None:
            produtos = [p for p in produtos if p.preco_atual <= preco_max]
        if ordenar == 'preco':
            produtos = sorted(produtos, key=lambda p: p.preco_atual)
        if ordenar == 'nome':
            produtos = sorted(produtos, key=chave_nome)

        return [produto.to_dict() for produto in produtos], 200
