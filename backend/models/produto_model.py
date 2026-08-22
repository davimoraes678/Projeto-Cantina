from backend.extensions import db

class Produto(db.Model):
    __tablename__ = "produto"

    id_produto = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    quantidade_estoque = db.Column(db.Integer, nullable=False, default=0)
    tabela_nutricional = db.Column(db.String(500), nullable=True)
    preco_atual = db.Column(db.Float, nullable=False)
    preco_promocional = db.Column(db.Float, nullable=True)
    ingredientes = db.Column(db.String(500), nullable=True)
    categoria = db.Column(db.String(100), nullable=True)
    status = db.Column(db.Boolean, default=True) # ou db.String, dependendo de como você controla status

    # Relacionamento 1:N com ItemPedido
    itens_pedido = db.relationship('ItemPedido', backref='produto', lazy=True)

    def salvar(self):
        db.session.add(self)
        db.session.commit()

    def atualizar(self, nome=None, quantidade_estoque=None, preco_atual=None, preco_promocional=None, categoria=None, status=None):
        if nome is not None:
            self.nome = nome
        if quantidade_estoque is not None:
            self.quantidade_estoque = quantidade_estoque
        if preco_atual is not None:
            self.preco_atual = preco_atual
        if preco_promocional is not None:
            self.preco_promocional = preco_promocional
        if categoria is not None:
            self.categoria = categoria
        if status is not None:
            self.status = status
        db.session.commit()

    def deletar(self):
        db.session.delete(self)
        db.session.commit()

    @staticmethod
    def listar_todos():
        return Produto.query.all()

    @staticmethod
    def buscar_por_id(id_produto):
        return Produto.query.get(id_produto)

    def to_dict(self):
        return {
            'id_produto': self.id_produto,
            'nome': self.nome,
            'quantidade_estoque': self.quantidade_estoque,
            'preco_atual': self.preco_atual,
            'preco_promocional': self.preco_promocional,
            'categoria': self.categoria,
            'status': self.status
        }
