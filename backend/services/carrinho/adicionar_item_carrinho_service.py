from flask_login import current_user

from backend.extensions import db
from backend.models.item_pedido import ItemPedido
from backend.models.pedido_model import Pedido, STATUS_CARRINHO
from backend.models.produto_model import Produto


class AdicionarItemCarrinhoService:
    """Caso de uso: colocar um produto no carrinho do aluno logado."""

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

        # Cria o carrinho (pedido em aberto) na primeira vez que o aluno adiciona algo
        carrinho = Pedido.buscar_carrinho(current_user.id_aluno)
        if not carrinho:
            carrinho = Pedido(id_aluno=current_user.id_aluno, nome_aluno=current_user.nome, status=STATUS_CARRINHO)
            db.session.add(carrinho)

        # Se o produto já está no carrinho, só soma a quantidade
        item = next((i for i in carrinho.itens if i.id_produto == produto.id_produto), None)
        if item:
            item.quantidade += quantidade
        else:
            # Guarda o nome e o preço do produto neste momento (o histórico não muda se o produto mudar)
            carrinho.itens.append(ItemPedido(
                id_produto=produto.id_produto,
                nome_produto=produto.nome,
                quantidade=quantidade,
                preco_unitario_cobrado=produto.preco_atual
            ))

        carrinho.calcular_total()
        db.session.commit()
        return carrinho.to_dict(), 201
