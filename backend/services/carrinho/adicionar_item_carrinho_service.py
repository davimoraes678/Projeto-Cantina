from flask_login import current_user

from backend.extensions import db
from backend.models.item_pedido import ItemPedido
from backend.models.produto_model import Produto


class AdicionarItemCarrinhoService:
    @staticmethod
    def executar(dados):
        produto = Produto.buscar_por_id(dados.get('id_produto'))
        if not produto:
            return {"erro": "Produto não encontrado"}, 404

        try:
            quantidade = int(dados.get('quantidade', 1))
        except (TypeError, ValueError):
            quantidade = 0
        if quantidade < 1:
            return {"erro": "Quantidade inválida"}, 400
        
        # Já está no carrinho: soma a quantidade
        carrinho = ItemPedido.buscar_carrinho(current_user.id_aluno)
        item = next((i for i in carrinho if i.id_produto == produto.id_produto), None)

        # Não deixa o carrinho passar do estoque
        no_carrinho = item.quantidade if item else 0
        if no_carrinho + quantidade > produto.quantidade_estoque:
            if produto.quantidade_estoque == 0:
                return {"erro": f"{produto.nome} está esgotado"}, 400
            return {"erro": f"Só há {produto.quantidade_estoque} unidade(s) de {produto.nome} em estoque"}, 400

        if item:
            item.quantidade += quantidade
        else:
            # Guarda nome e preço de agora
            db.session.add(ItemPedido(
                id_aluno=current_user.id_aluno,
                id_produto=produto.id_produto,
                nome_produto=produto.nome,
                quantidade=quantidade,
                preco_unitario_cobrado=produto.preco_atual
            ))

        db.session.commit()
        return ItemPedido.carrinho_to_dict(current_user.id_aluno), 201
