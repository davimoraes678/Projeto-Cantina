from flask_login import current_user

from backend.extensions import db
from backend.models.pedido_model import Pedido


class FinalizarPedidoService:
    """Caso de uso: fechar o carrinho como pedido, descontando estoque e saldo."""

    @staticmethod
    def executar():
        carrinho = Pedido.buscar_carrinho(current_user.id_aluno)
        if not carrinho or not carrinho.itens:
            return {"erro": "O carrinho está vazio"}, 400

        carrinho.calcular_total()

        # Confere estoque e saldo antes de mudar qualquer coisa
        for item in carrinho.itens:
            if not item.produto:
                return {"erro": f"{item.nome_produto} não está mais à venda. Remova-o do carrinho."}, 400
            if item.produto.quantidade_estoque < item.quantidade:
                return {"erro": f"Estoque insuficiente de {item.produto.nome} (restam {item.produto.quantidade_estoque})"}, 400
        if current_user.saldo < carrinho.valor_total:
            return {"erro": "Saldo insuficiente. Adicione saldo na sua carteira."}, 400

        # Tudo certo: baixa o estoque, desconta o saldo e o carrinho vira pedido
        for item in carrinho.itens:
            item.produto.quantidade_estoque -= item.quantidade
        current_user.saldo = round(current_user.saldo - carrinho.valor_total, 2)
        carrinho.status = "Pendente"
        db.session.commit()
        return carrinho.to_dict(), 200
