"""Smoke test isolado: python -m unittest discover -s tests."""
import os
import unittest

os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
from app import app


class FrontendIntegrationTest(unittest.TestCase):
    def test_assets_and_order_contract(self):
        client = app.test_client()
        for path in ['/', '/cart.html', '/orders.html', '/order-status.html',
                     '/gestao.html', '/css/style.css', '/css/gestao.css',
                     '/js/cantina.js', '/img/produtos/coxinha.jpg']:
            with self.subTest(path=path):
                self.assertEqual(client.get(path).status_code, 200)
        aluno = client.post('/api/alunos', json={
            'nome': 'Aluno teste', 'email': 'teste@example.com', 'senha': 'teste'
        })
        self.assertEqual(aluno.status_code, 201)
        produto = client.post('/api/produtos', json={
            'nome': 'Coxinha', 'preco_atual': 7.5,
            'quantidade_estoque': 10, 'categoria': 'Lanche'
        })
        self.assertEqual(produto.status_code, 201)
        response = client.post('/api/pedidos', json={
            'id_aluno': aluno.json['id_aluno'],
            'itens': [{'id_produto': produto.json['id_produto'], 'quantidade': 2}],
            'horario_agendado_retirada': '2027-01-10T12:00'
        })
        self.assertEqual(response.status_code, 201)
        pedido = client.get('/api/pedidos/' + str(response.json['id_pedido'])).json
        self.assertEqual(pedido['valor_total'], 15)
        self.assertEqual(pedido['itens'][0]['quantidade'], 2)
        self.assertEqual(pedido['horario_agendado_retirada'], '2027-01-10T12:00:00')
