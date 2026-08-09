from backend.extensions import db

class RateioPagamento(db.Model):
    __tablename__ = "rateio"

    id_rateio = db.Column(db.Integer, primary_key=True)
    valor_parte = db.Column(db.Float, nullable=False)
    status_pagamento = db.Column(db.String(50), default="Pendente")

    # nullable=True: permite apagar o aluno sem travar o rateio já gerado.
    id_aluno = db.Column(db.Integer, db.ForeignKey('aluno.id_aluno'), nullable=True)
    id_pedido = db.Column(db.Integer, db.ForeignKey('pedido.id_pedido'), nullable=False)

    def salvar(self):
        db.session.add(self)
        db.session.commit()

    def atualizar(self, valor_parte=None, status_pagamento=None):
        if valor_parte is not None:
            self.valor_parte = valor_parte
        if status_pagamento is not None:
            self.status_pagamento = status_pagamento
        db.session.commit()

    def deletar(self):
        db.session.delete(self)
        db.session.commit()

    @staticmethod
    def listar_todos():
        return RateioPagamento.query.all()

    @staticmethod
    def buscar_por_id(id_rateio):
        return RateioPagamento.query.get(id_rateio)

    def to_dict(self):
        return {
            'id_rateio': self.id_rateio,
            'valor_parte': self.valor_parte,
            'status_pagamento': self.status_pagamento,
            'id_aluno': self.id_aluno,
            'id_pedido': self.id_pedido
        }
