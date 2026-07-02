from app.extensions import db


class Aluno(db.Model):
    __tablename__ = "alunos"
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha = db.Column(db.String(40), unique=True, nullable=False)
    pedido = db.Column(db.String(40), unique=True, nullable=False)


class Professor(db.Model):
    # atributos omitidos...
    def salvar(self):
        db.session.add(self)
        db.session.commit()

    def atualizar(self, nome=None, email=None, disciplina=None):
        if nome is not None:
            self.nome = nome
        if email is not None:
            self.email = email
        if disciplina is not None:
            self.disciplina = disciplina
        db.session.commit()

    def deletar(self):
        db.session.delete(self)
        db.session.commit()

    @staticmethod
    def listar_todos():
        return Professor.query.all()

    @staticmethod
    def buscar_por_id(id):
        return Professor.query.get(id)
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'email': self.email,
            'disciplina': self.disciplina
    }