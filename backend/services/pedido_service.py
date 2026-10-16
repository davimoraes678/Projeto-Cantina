from datetime import datetime
from flask_login import current_user
from sqlalchemy.exc import IntegrityError
from backend.models.pedido_model import Pedido
from backend.models.avaliacao_model import Avaliacao
from backend.extensions import db


def _parse_datetime(valor):
    """Converte string ISO (ex.: vinda de <input type="datetime-local">, no
    formato 'YYYY-MM-DDTHH:MM') em datetime de verdade. O SQLite (e o
    SQLAlchemy) recusam strings cruas em colunas DateTime - precisa ser um
    objeto datetime. Retorna None se vier vazio/None."""
    if not valor:
        return None
    if isinstance(valor, datetime):
        return valor
    try:
        return datetime.fromisoformat(valor)
    except ValueError:
        return None


class PedidoService:
    @staticmethod
    def listar_todos():
        # O carrinho (status "Carrinho") ainda não é um pedido feito, então não aparece na lista
        pedidos = Pedido.query.filter(Pedido.status != "Carrinho").all()
        return [p.to_dict() for p in pedidos], 200

    @staticmethod
    def buscar_por_id(id_pedido):
        pedido = Pedido.buscar_por_id(id_pedido)
        if not pedido:
            return {"erro": "Pedido não encontrado"}, 404
        return pedido.to_dict(), 200

    @staticmethod
    def atualizar_status(id_pedido, data):
        pedido = Pedido.buscar_por_id(id_pedido)
        if not pedido:
            return {"erro": "Pedido não encontrado"}, 404

        pedido.atualizar(
            status=data.get('status'),
            data_hora_retirada=_parse_datetime(data.get('data_hora_retirada')),
            horario_agendado_retirada=_parse_datetime(data.get('horario_agendado_retirada'))
        )
        return pedido.to_dict(), 200


class AvaliacaoService:
    @staticmethod
    def criar(data, id_pedido):
        # Só o dono do pedido avalia; para os outros o pedido "não existe" (404, e não 403,
        # para não revelar quais números de pedido existem).
        pedido = Pedido.buscar_por_id(id_pedido)
        if not pedido or pedido.id_aluno != current_user.id_aluno:
            return {"erro": "Pedido não encontrado"}, 404
        if pedido.status != "Concluído":
            return {"erro": "Só é possível avaliar um pedido concluído"}, 400
        if pedido.avaliacao:
            return {"erro": "Este pedido já foi avaliado"}, 409

        nota = data.get('nota')
        if isinstance(nota, bool) or not isinstance(nota, int) or not 1 <= nota <= 5:
            return {"erro": "A nota deve ser um número inteiro de 1 a 5"}, 400

        comentario = data.get('comentario')
        if comentario is not None and (not isinstance(comentario, str) or len(comentario) > 500):
            return {"erro": "O comentário deve ter no máximo 500 caracteres"}, 400

        try:
            nova_avaliacao = Avaliacao(id_pedido=id_pedido, nota=nota, comentario=comentario or None)
            nova_avaliacao.salvar()
        except IntegrityError:
            # Duas avaliações enviadas ao mesmo tempo: a coluna id_pedido é única, só uma vale.
            db.session.rollback()
            return {"erro": "Este pedido já foi avaliado"}, 409
        return nova_avaliacao.to_dict(), 201
