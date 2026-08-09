from backend.extensions import db

class Aluno(db.Model):
    __tablename__ = "aluno"

    id_aluno = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha = db.Column(db.String(40), nullable=False)
    saldo = db.Column(db.Float, nullable=False, default=0.0)

    # Relacionamentos
    pedido = db.relationship('Pedido', backref='aluno', lazy=True)
    rateio = db.relationship('RateioPagamento', backref='aluno', lazy=True)

    def salvar(self):
        db.session.add(self)
        db.session.commit()

    def atualizar(self, nome=None, email=None, senha=None):
        if nome is not None:
            self.nome = nome
        if email is not None:
            self.email = email
        if senha is not None:
            self.senha = senha
        db.session.commit()

    def deletar(self):
        db.session.delete(self)
        db.session.commit()

    @staticmethod
    def listar_todos():
        return Aluno.query.all()

    @staticmethod
    def buscar_por_id(id_aluno):
        return Aluno.query.get(id_aluno)

    def to_dict(self):
        return {
            'id_aluno': self.id_aluno,
            'nome': self.nome,
            'email': self.email,
            'saldo': self.saldo
        }
