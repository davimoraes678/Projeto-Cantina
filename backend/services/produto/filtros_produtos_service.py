import unicodedata

from backend.models.produto_model import Produto
from backend.repositories.produto_repository import ProdutoRepository


# "Água" -> "agua": ordena sem diferenciar maiúsculas e acentos
def chave_nome(produto):
    nome = unicodedata.normalize("NFD", produto.nome.lower())
    return "".join(letra for letra in nome if not unicodedata.combining(letra))


class FiltrarPorCategoriaService:
    @staticmethod
    def executar(categoria):
        produtos = ProdutoRepository.buscar_por_categoria(categoria)
        return [produto.to_dict() for produto in produtos], 200

class FiltrarPorPrecoService:
    @staticmethod
    def executar(preco_min, preco_max):
        try:
            minimo, maximo = float(preco_min), float(preco_max)
        except ValueError:
            return {'erro': 'Preços inválidos.'}, 400

        produtos = ProdutoRepository.buscar_por_faixa_de_preco(minimo, maximo)
        return [produto.to_dict() for produto in produtos], 200

class OrdenarProdutosService:
    @staticmethod
    def executar(campo):
        if campo == 'preco':
            produtos = ProdutoRepository.ordenar_por_preco()
        elif campo == 'nome':
            produtos = ProdutoRepository.ordenar_por_nome()
        else:
            return {'erro': 'Campo inválido. Use preco ou nome.'}, 400

        return [produto.to_dict() for produto in produtos], 200
