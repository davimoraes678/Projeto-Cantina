from backend.extensions import db
from datetime import datetime

class Avaliacao(db.Model):
    __tablename__ = "avaliacao"
    
    id_avaliacao = db.Column(db.Integer, primary_key=True)
    nota = db.Column(db.Integer, nullable=False)
    comentario = db.Column(db.String(500), nullable=True)
    data_avaliacao = db.Column(db.DateTime, default=datetime.utcnow)

    id_pedido = db.Column(db.Integer, db.ForeignKey('pedido.id_pedido'), unique=True, nullable=False)

    def salvar(self):
        db.session.add(self)
        db.session.commit()

    def atualizar(self, nota=None, comentario=None):
        if nota is not None:
            self.nota = nota
        if comentario is not None:
            self.comentario = comentario
        db.session.commit()

    def deletar(self):
        db.session.delete(self)
        db.session.commit()

    @staticmethod
    def listar_todos():
        return Avaliacao.query.all()

    @staticmethod
    def buscar_por_id(id_avaliacao):
        return Avaliacao.query.get(id_avaliacao)

    def to_dict(self):
        return {
            'id_avaliacao': self.id_avaliacao,
            'nota': self.nota,
            'comentario': self.comentario,
            'data_avaliacao': self.data_avaliacao.isoformat() if self.data_avaliacao else None,
            'id_pedido': self.id_pedido
        }
