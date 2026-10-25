from backend.models.produto_model import Produto


class CriarProdutoService:
    """Caso de uso: cadastrar produto (só o mestre)."""

    @staticmethod
    def executar(dados):
        if not dados.get('nome') or dados.get('preco_atual') is None:
            return {"erro": "Nome e preço atual são obrigatórios"}, 400

        novo_produto = Produto(
            nome=dados.get('nome'),
            quantidade_estoque=dados.get('quantidade_estoque', 0),
            tabela_nutricional=dados.get('tabela_nutricional'),
            preco_atual=dados.get('preco_atual'),
            preco_promocional=dados.get('preco_promocional'),
            ingredientes=dados.get('ingredientes'),
            categoria=dados.get('categoria'),
            status=dados.get('status', True)
        )
        novo_produto.salvar()
        return novo_produto.to_dict(), 201
