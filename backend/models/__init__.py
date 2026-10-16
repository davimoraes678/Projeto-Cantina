"""Importa todos os models. O SQLAlchemy precisa conhecer TODAS as classes para resolver os
relacionamentos ('Avaliacao', 'RateioPagamento'...); sem isso, toda consulta dá erro 500.
Model novo: acrescente o import aqui."""
from backend.models import aluno_model, avaliacao_model, item_pedido, pedido_model, produto_model, rateio_model

__all__ = ["aluno_model", "avaliacao_model", "item_pedido", "pedido_model", "produto_model", "rateio_model"]
