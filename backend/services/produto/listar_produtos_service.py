from backend.models.produto_model import Produto


class ListarProdutosService:
    """Caso de uso: listar todos os produtos do cardápio."""

    @staticmethod
    def executar():
        return [produto.to_dict() for produto in Produto.listar_todos()], 200
