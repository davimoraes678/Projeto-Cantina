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

    # Relevância: avaliação com comentário aparece antes da que só tem nota
    def relevancia(self):
        return 1 if self.comentario else 0

    # Nome curto do aluno: "Marina Souza" -> "Marina S."
    def nome_aluno(self):
        if self.pedido.aluno:
            nome = self.pedido.aluno.nome
        else:
            nome = self.pedido.nome_aluno or "Aluno"
        partes = nome.split()
        if len(partes) > 1:
            return partes[0] + " " + partes[-1][0] + "."
        return partes[0]

    def to_dict(self):
        return {
            'id_avaliacao': self.id_avaliacao,
            'nota': self.nota,
            'comentario': self.comentario,
            'data_avaliacao': self.data_avaliacao.isoformat() if self.data_avaliacao else None,
            'id_pedido': self.id_pedido,
            'itens': [item.to_dict() for item in self.pedido.itens],
            'relevancia': self.relevancia(),
            'aluno_nome': self.nome_aluno(),
            'icon': self.nome_aluno()[0].upper()
        }
