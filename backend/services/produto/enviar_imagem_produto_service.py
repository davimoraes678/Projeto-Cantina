from backend.models.produto_model import Produto
from backend.services.produto.imagem import salvar_imagem


class EnviarImagemProdutoService:
    """Caso de uso: enviar a foto de um produto (só o mestre)."""

    @staticmethod
    def executar(id_produto, arquivo):
        produto = Produto.buscar_por_id(id_produto)
        if not produto:
            return {"erro": "Produto não encontrado"}, 404
        if arquivo is None or not arquivo.filename:
            return {"erro": "Selecione uma imagem."}, 400
        try:
            nome = salvar_imagem(produto, arquivo)
        except ValueError as erro:
            return {"erro": str(erro)}, 400
        return {"nome": nome, "url": f"/api/produtos/{id_produto}/imagem"}, 201
