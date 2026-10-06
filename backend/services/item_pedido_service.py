from backend.extensions import db
from backend.models.aluno_model import Aluno
from backend.models.item_pedido import ItemPedido
from backend.models.pedido_model import Pedido
from backend.models.produto_model import Produto

# O carrinho de um aluno é um Pedido com este status. Os produtos adicionados
# são gravados como ItemPedido; ao finalizar, o status vira "Pendente".
STATUS_CARRINHO = "Carrinho"


class ItemPedidoService:
    @staticmethod
    def _buscar_carrinho(id_aluno):
        return Pedido.query.filter_by(id_aluno=id_aluno, status=STATUS_CARRINHO).first()

    @staticmethod
    def _carrinho_vazio(id_aluno):
        return {"id_pedido": None, "id_aluno": id_aluno, "status": STATUS_CARRINHO,
                "valor_total": 0.0, "itens": []}

    @staticmethod
    def ver_carrinho(id_aluno):
        if not Aluno.buscar_por_id(id_aluno):
            return {"erro": "Aluno não encontrado"}, 404
        carrinho = ItemPedidoService._buscar_carrinho(id_aluno)
        if not carrinho:
            return ItemPedidoService._carrinho_vazio(id_aluno), 200
        return carrinho.to_dict(), 200

    @staticmethod
    def adicionar_item(id_aluno, data):
        aluno = Aluno.buscar_por_id(id_aluno)
        if not aluno:
            return {"erro": "Aluno não encontrado"}, 404

        produto = Produto.buscar_por_id(data.get('id_produto'))
        if not produto:
            return {"erro": "Produto não encontrado"}, 404

        try:
            quantidade = int(data.get('quantidade', 1))
        except (TypeError, ValueError):
            quantidade = 0
        if quantidade < 1:
            return {"erro": "Quantidade inválida"}, 400

        # Cria o carrinho (pedido em aberto) na primeira vez que o aluno adiciona algo
        carrinho = ItemPedidoService._buscar_carrinho(id_aluno)
        if not carrinho:
            carrinho = Pedido(id_aluno=id_aluno, nome_aluno=aluno.nome, status=STATUS_CARRINHO)
            db.session.add(carrinho)

        # Se o produto já está no carrinho, só soma a quantidade
        item = next((i for i in carrinho.itens if i.id_produto == produto.id_produto), None)
        if item:
            item.quantidade += quantidade
        else:
            carrinho.itens.append(ItemPedido(
                id_produto=produto.id_produto,
                nome_produto=produto.nome,
                quantidade=quantidade,
                preco_unitario_cobrado=produto.preco_atual
            ))

        carrinho.calcular_total()
        db.session.commit()
        return carrinho.to_dict(), 201

    @staticmethod
    def remover_item(id_item_pedido):
        item = ItemPedido.buscar_por_id(id_item_pedido)
        if not item or item.pedido.status != STATUS_CARRINHO:
            return {"erro": "Item não encontrado no carrinho"}, 404

        carrinho = item.pedido
        carrinho.itens.remove(item)  # delete-orphan apaga o ItemPedido
        carrinho.calcular_total()
        db.session.commit()
        return carrinho.to_dict(), 200

    @staticmethod
    def finalizar(id_aluno):
        carrinho = ItemPedidoService._buscar_carrinho(id_aluno)
        if not carrinho or not carrinho.itens:
            return {"erro": "O carrinho está vazio"}, 400

        carrinho.status = "Pendente"
        carrinho.calcular_total()
        db.session.commit()
        return carrinho.to_dict(), 200
