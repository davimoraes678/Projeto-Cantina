from flask_login import current_user

from backend.models.pedido_model import Pedido, STATUS_CARRINHO


class VerCarrinhoService:
    """Caso de uso: ver o carrinho do aluno logado (vazio se ele ainda não adicionou nada)."""

    @staticmethod
    def executar():
        carrinho = Pedido.buscar_carrinho(current_user.id_aluno)
        if not carrinho:
            # Ainda não existe carrinho no banco: devolve um vazio, sem gravar nada
            return {"id_pedido": None, "id_aluno": current_user.id_aluno, "status": STATUS_CARRINHO,
                    "valor_total": 0.0, "itens": []}, 200
        return carrinho.to_dict(), 200
