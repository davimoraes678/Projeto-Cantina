from backend.extensions import db
from datetime import datetime

class Pedido(db.Model):
    __tablename__ = "pedido"

    id_pedido = db.Column(db.Integer, primary_key=True)
    data_hora_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), default="Pendente")
    valor_total = db.Column(db.Float, nullable=False, default=0.0)
    horario_agendado_retirada = db.Column(db.DateTime, nullable=True)
    data_hora_retirada = db.Column(db.DateTime, nullable=True)

    # nullable=True: permite apagar o aluno sem apagar/travar o pedido (o histórico é preservado).
    id_aluno = db.Column(db.Integer, db.ForeignKey('aluno.id_aluno'), nullable=True)
    # "Foto" do nome do aluno no momento do pedido. Usada quando o aluno é excluído depois.
    nome_aluno = db.Column(db.String(100), nullable=True)

    # Relacionamentos
    itens = db.relationship('ItemPedido', backref='pedido', lazy=True, cascade='all, delete-orphan')
    avaliacao = db.relationship('Avaliacao', backref='pedido', uselist=False, lazy=True)
    rateio = db.relationship('RateioPagamento', backref='pedido', lazy=True)

    def calcular_total(self):
        total = sum([i.preco_unitario_cobrado * i.quantidade for i in self.itens])
        self.valor_total = total
        return total

    def salvar(self):
        db.session.add(self)
        db.session.commit()

    def atualizar(self, status=None, data_hora_retirada=None):
        if status is not None:
            self.status = status
        if data_hora_retirada is not None:
            self.data_hora_retirada = data_hora_retirada
        db.session.commit()

    def deletar(self):
        db.session.delete(self)
        db.session.commit()

    @staticmethod
    def listar_todos():
        return Pedido.query.all()

    @staticmethod
    def buscar_por_id(id_pedido):
        return Pedido.query.get(id_pedido)

    def to_dict(self):
        return {
            'id_pedido': self.id_pedido,
            'data_hora_criacao': self.data_hora_criacao.isoformat() if self.data_hora_criacao else None,
            'status': self.status,
            'valor_total': self.valor_total,
            'horario_agendado_retirada': self.horario_agendado_retirada.isoformat() if self.horario_agendado_retirada else None,
            'data_hora_retirada': self.data_hora_retirada.isoformat() if self.data_hora_retirada else None,
            'id_aluno': self.id_aluno,
            # Se o aluno ainda existir usa o nome atual; senão usa a "foto" salva na criação do pedido.
            'aluno_nome': self.aluno.nome if self.aluno else (self.nome_aluno or 'Aluno removido'),
            'itens': [item.to_dict() for item in self.itens]
        }
