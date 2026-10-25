from pathlib import Path

from flask import current_app

from backend.models.produto_model import Produto
from backend.services.produto.imagem import nome_imagem


class BuscarImagemProdutoService:
    """Caso de uso: achar o arquivo da foto de um produto.

    Devolve o nome do arquivo dentro da pasta arquivos/; o controller é quem
    envia o arquivo na resposta HTTP.
    """

    @staticmethod
    def executar(id_produto):
        produto = Produto.buscar_por_id(id_produto)
        if not produto:
            return {"erro": "Produto não encontrado"}, 404
        try:
            nome = nome_imagem(produto.nome)
        except ValueError:
            return {"erro": "Produto sem imagem"}, 404
        if not (Path(current_app.config["ARQUIVOS_DIR"]) / nome).is_file():
            return {"erro": "Produto sem imagem"}, 404
        return {"arquivo": nome}, 200
