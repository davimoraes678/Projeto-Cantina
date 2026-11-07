from flask_login import current_user
import random
import string
from backend.extensions import db
from backend.models.item_pedido import ItemPedido
from backend.models.pedido_model import Pedido


class FinalizarPedidoService:
    @staticmethod
    def executar():
        itens = ItemPedido.buscar_carrinho(current_user.id_aluno)
        if not itens:
            return {"erro": "O carrinho está vazio"}, 400

        total = round(sum(item.preco_unitario_cobrado * item.quantidade for item in itens), 2)

        # Confere estoque e saldo antes de mudar algo
        for item in itens:
            if not item.produto:
                return {"erro": f"{item.nome_produto} não está mais à venda. Remova-o do carrinho."}, 400
            if item.produto.quantidade_estoque < item.quantidade:
                return {"erro": f"Estoque insuficiente de {item.produto.nome} (restam {item.produto.quantidade_estoque})"}, 400
        if current_user.saldo < total:
            return {"erro": "Saldo insuficiente. Adicione saldo na sua carteira."}, 400

        # Código de retirada, ex.: 49AZ
        numeros = random.choices(string.digits, k=2)
        letras = random.choices(string.ascii_uppercase, k=2)
        codigo_lista = numeros + letras
        random.shuffle(codigo_lista)
        codigo_final = "".join(codigo_lista)

        # Passa os itens do carrinho para o pedido
        pedido = Pedido(id_aluno=current_user.id_aluno, nome_aluno=current_user.nome,
                        status="Pendente", valor_total=total, codigo=codigo_final)
        db.session.add(pedido)
        for item in itens:
            item.produto.quantidade_estoque -= item.quantidade
            pedido.itens.append(item)
            item.id_aluno = None
        current_user.saldo = round(current_user.saldo - total, 2)
        db.session.commit()
        return pedido.to_dict(), 200
