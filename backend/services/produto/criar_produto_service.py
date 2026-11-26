from backend.models.produto_model import Produto


class CriarProdutoService:
    @staticmethod
    def executar(dados):
        if not dados.get('nome') or dados.get('preco_atual') is None:
            return {"erro": "Nome e preço atual são obrigatórios"}, 400

        try:
            preco = float(dados.get('preco_atual'))
            estoque = int(dados.get('quantidade_estoque', 0))
        except (TypeError, ValueError):
            return {"erro": "Preço e estoque precisam ser números"}, 400
        if preco <= 0:
            return {"erro": "O preço precisa ser maior que zero"}, 400
        if estoque < 0:
            return {"erro": "O estoque não pode ser negativo"}, 400

        novo_produto = Produto(
            nome=dados.get('nome'),
            quantidade_estoque=estoque,
            tabela_nutricional=dados.get('tabela_nutricional'),
            preco_atual=preco,
            preco_promocional=dados.get('preco_promocional'),
            ingredientes=dados.get('ingredientes'),
            categoria=dados.get('categoria'),
            status=dados.get('status', True)
        )
        novo_produto.salvar()
        return novo_produto.to_dict(), 201
