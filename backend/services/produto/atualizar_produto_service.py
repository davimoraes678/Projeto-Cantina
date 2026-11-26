from backend.models.produto_model import Produto
from backend.services.produto.imagem import renomear_imagem


# Muda só os campos enviados
class AtualizarProdutoService:
    @staticmethod
    def executar(id_produto, dados):
        produto = Produto.buscar_por_id(id_produto)
        if not produto:
            return {"erro": "Produto não encontrado"}, 404

        try:
            if dados.get('preco_atual') is not None and float(dados['preco_atual']) <= 0:
                return {"erro": "O preço precisa ser maior que zero"}, 400
            if dados.get('quantidade_estoque') is not None and int(dados['quantidade_estoque']) < 0:
                return {"erro": "O estoque não pode ser negativo"}, 400
        except (TypeError, ValueError):
            return {"erro": "Preço e estoque precisam ser números"}, 400

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
