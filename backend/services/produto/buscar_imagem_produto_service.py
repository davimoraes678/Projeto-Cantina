from pathlib import Path

from flask import current_app

from backend.models.produto_model import Produto
from backend.services.produto.imagem import nome_imagem


class BuscarImagemProdutoService:
    @staticmethod
    def executar(id_produto):
        produto = Produto.buscar_por_id(id_produto)
        if not produto:
            return {"erro": "Produto não encontrado"}, 404
        try:
            nome = nome_imagem(produto.nome)
        except ValueError:
            return {"erro": "Produto sem imagem"}, 404
        if not (Path(current_app.config["IMAGENS_PRODUTOS_DIR"]) / nome).is_file():
            return {"erro": "Produto sem imagem"}, 404
        return {"arquivo": nome}, 200
