from backend.extensions import db

# Item do carrinho (id_pedido vazio) ou de um pedido
class ItemPedido(db.Model):
    __tablename__ = "itens_pedido"

    id_item_pedido = db.Column(db.Integer, primary_key=True)
    quantidade = db.Column(db.Integer, nullable=False, default=1)
    preco_unitario_cobrado = db.Column(db.Float, nullable=False)
    id_pedido = db.Column(db.Integer, db.ForeignKey('pedido.id_pedido'), nullable=True)
    id_aluno = db.Column(db.Integer, db.ForeignKey('aluno.id_aluno', ondelete='CASCADE'), nullable=True)
    # Vazio se o produto for excluído
    id_produto = db.Column(db.Integer, db.ForeignKey('produto.id_produto'), nullable=True)
    # Nome salvo no pedido, usado se o produto for excluído
    nome_produto = db.Column(db.String(100), nullable=True)

    def salvar(self):
        db.session.add(self)
        db.session.commit()

    def atualizar(self, quantidade=None, preco_unitario_cobrado=None):
        if quantidade is not None:
            self.quantidade = quantidade
        if preco_unitario_cobrado is not None:
            self.preco_unitario_cobrado = preco_unitario_cobrado
        db.session.commit()

    def deletar(self):
        db.session.delete(self)
        db.session.commit()

    @staticmethod
    def listar_todos():
        return ItemPedido.query.all()

    @staticmethod
    def buscar_por_id(id_item_pedido):
        return ItemPedido.query.get(id_item_pedido)

    @staticmethod
    def buscar_carrinho(id_aluno):
        return ItemPedido.query.filter_by(id_aluno=id_aluno, id_pedido=None).all()

    @staticmethod
    def carrinho_to_dict(id_aluno):
        itens = ItemPedido.buscar_carrinho(id_aluno)
        return {
            'id_aluno': id_aluno,
            'itens': [item.to_dict() for item in itens],
            'valor_total': round(sum((i.preco_unitario_cobrado * i.quantidade for i in itens), 0.0), 2),
            'quantidade_itens': sum(i.quantidade for i in itens),
        }

    def to_dict(self):
        return {
            'id_item_pedido': self.id_item_pedido,
            'quantidade': self.quantidade,
            'preco_unitario_cobrado': self.preco_unitario_cobrado,
            'subtotal': round(self.quantidade * self.preco_unitario_cobrado, 2),
            'id_pedido': self.id_pedido,
            'id_produto': self.id_produto,
            'produto_nome': self.produto.nome if self.produto else (self.nome_produto or 'Produto removido')
        }
