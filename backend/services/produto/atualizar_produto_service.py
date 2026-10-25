from backend.models.produto_model import Produto
from backend.services.produto.imagem import renomear_imagem


class AtualizarProdutoService:
    """Caso de uso: editar produto (só o mestre). Muda só os campos enviados."""

    @staticmethod
    def executar(id_produto, dados):
        produto = Produto.buscar_por_id(id_produto)
        if not produto:
            return {"erro": "Produto não encontrado"}, 404

        # A imagem tem o nome do produto: ao renomear o produto, renomeia o arquivo junto
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
            status=dados.get('status')
        )
        return produto.to_dict(), 200
