from backend.models.produto_model import Produto
from backend.services.produto.imagem import renomear_imagem


# Muda só os campos enviados
class AtualizarProdutoService:
    @staticmethod
    def executar(id_produto, dados):
        produto = Produto.buscar_por_id(id_produto)
        if not produto:
            return {"erro": "Produto não encontrado"}, 404

        # Renomeou o produto: renomeia a imagem
        if dados.get('nome'):
            try:
                renomear_imagem(produto, dados['nome'])
            except ValueError as erro:
                return {"erro": str(erro)}, 400

        produto.atualizar(
            nome=dados.get('nome'),
            quantidade_estoque=dados.get('quantidade_estoque'),
            preco_atual=dados.get('preco_atual'),
            preco_promocional=dados.get('preco_promocional'),
            categoria=dados.get('categoria'),
            status=dados.get('status'),
            ingredientes=dados.get('ingredientes')
        )
        return produto.to_dict(), 200
