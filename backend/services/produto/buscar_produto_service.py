from backend.models.produto_model import Produto


class BuscarProdutoService:
    """Caso de uso: ver um produto pelo id."""

    @staticmethod
    def executar(id_produto):
        produto = Produto.buscar_por_id(id_produto)
        if not produto:
            return {"erro": "Produto não encontrado"}, 404
        return produto.to_dict(), 200
