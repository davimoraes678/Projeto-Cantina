from flask_login import current_user

from backend.models.pedido_model import Pedido


class ListarMeusPedidosService:
    """Caso de uso: o aluno logado vê os próprios pedidos (tela "Meus pedidos").

    Devolve duas listas, o mais recente primeiro:
      - andamento: "Pendente" e "Pronto"
      - historico: "Concluído" e "Cancelado"
    """

    @staticmethod
    def executar():
        pedidos = (Pedido.query
                   .filter(Pedido.id_aluno == current_user.id_aluno)
                   .order_by(Pedido.id_pedido.desc())
                   .all())
        return {
            "andamento": [p.to_dict() for p in pedidos if p.status in ("Pendente", "Pronto")],
            "historico": [p.to_dict() for p in pedidos if p.status in ("Concluído", "Cancelado")],
        }, 200
