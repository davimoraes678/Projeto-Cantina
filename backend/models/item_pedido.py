from backend.extensions import db

class ItemPedido(db.Model):
    __tablename__ = "itens_pedido"
    
    id_item_pedido = db.Column(db.Integer, primary_key=True)
    quantidade = db.Column(db.Integer, nullable=False, default=1)
    preco_unitario_cobrado = db.Column(db.Float, nullable=False)

    id_pedido = db.Column(db.Integer, db.ForeignKey('pedido.id_pedido'), nullable=False)
    # nullable=True: permite apagar o produto sem apagar/travar o item do pedido já feito.
    id_produto = db.Column(db.Integer, db.ForeignKey('produto.id_produto'), nullable=True)
    # "Foto" do nome do produto no momento do pedido. Usada quando o produto é excluído depois.
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

    def to_dict(self):
        return {
            'id_item_pedido': self.id_item_pedido,
            'quantidade': self.quantidade,
            'preco_unitario_cobrado': self.preco_unitario_cobrado,
            'subtotal': round(self.quantidade * self.preco_unitario_cobrado, 2),
            'id_pedido': self.id_pedido,
            'id_produto': self.id_produto,
            # Se o produto ainda existir usa o nome atual; senão usa a "foto" salva na criação do pedido.
            'produto_nome': self.produto.nome if self.produto else (self.nome_produto or 'Produto removido')
        }
