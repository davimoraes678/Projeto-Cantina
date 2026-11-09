from backend.models.produto_model import Produto


class ListarProdutosService:
    @staticmethod
    def executar():
        return [produto.to_dict() for produto in Produto.listar_todos()], 200
