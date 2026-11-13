from backend.extentions import bd


class Fechamento_Diario:
    __tablename__ = "fechamento"

    id_dia = db.Column(db.Integer, primary_key=True)
    pedido_realizados = db.Column(db.Integer)