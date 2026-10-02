import os
import unittest
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory

os.environ['DATABASE_URL'] = 'sqlite://'
from app import app
from backend.extensions import db
from PIL import Image


class ImagensTest(unittest.TestCase):
    def setUp(self):
        self.pasta = TemporaryDirectory()
        app.config.update(TESTING=True, ARQUIVOS_DIR=self.pasta.name)
        self.client = app.test_client()
        with app.app_context():
            db.drop_all()
            db.create_all()

    def tearDown(self):
        self.pasta.cleanup()

    def produto(self, nome='Pão de Queijo'):
        res = self.client.post('/api/produtos', json={
            'nome': nome, 'preco_atual': 5, 'quantidade_estoque': 10, 'categoria': 'Lanche'
        })
        self.assertEqual(res.status_code, 201)
        return res.json['id_produto']

    def enviar(self, id_produto, formato='JPEG'):
        imagem = BytesIO()
        Image.new('RGB', (10, 10), 'red').save(imagem, formato)
        imagem.seek(0)
        return self.client.post(f'/api/produtos/{id_produto}/imagem', data={
            'imagem': (imagem, '../../nome-enviado.jpg')
        })

    def test_converte_salva_exibe_e_substitui(self):
        id_produto = self.produto()
        self.assertEqual(self.enviar(id_produto).status_code, 201)
        caminho = Path(self.pasta.name) / 'pao-de-queijo-imagem.png'
        self.assertTrue(caminho.is_file())
        with Image.open(caminho) as imagem:
            self.assertEqual(imagem.format, 'PNG')
        res = self.client.get(f'/api/produtos/{id_produto}/imagem')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.mimetype, 'image/png')
        res.close()
        self.assertEqual(self.enviar(id_produto, 'WEBP').status_code, 201)

    def test_renomeia_ao_editar_produto(self):
        id_produto = self.produto()
        self.enviar(id_produto)
        res = self.client.put(f'/api/produtos/{id_produto}', json={'nome': 'Suco de Uva'})
        self.assertEqual(res.status_code, 200)
        self.assertFalse((Path(self.pasta.name) / 'pao-de-queijo-imagem.png').exists())
        self.assertTrue((Path(self.pasta.name) / 'suco-de-uva-imagem.png').exists())
        with self.client.get(f'/api/produtos/{id_produto}/imagem') as res:
            self.assertEqual(res.status_code, 200)

    def test_rejeita_nome_igual_e_renomeacao_com_colisao(self):
        primeiro = self.produto()
        self.enviar(primeiro)
        segundo = self.produto('Suco')
        self.enviar(segundo)
        res = self.client.put(f'/api/produtos/{segundo}', json={'nome': 'Pao de Queijo'})
        self.assertEqual(res.status_code, 400)
        terceiro = self.produto('Pao de Queijo')
        self.assertEqual(self.enviar(terceiro).status_code, 400)

    def test_rejeita_arquivo_invalido_ausente_grande_e_produto_inexistente(self):
        id_produto = self.produto()
        rota = f'/api/produtos/{id_produto}/imagem'
        self.assertEqual(self.client.get(rota).status_code, 404)
        self.assertEqual(self.client.post(rota).status_code, 400)
        self.assertEqual(self.enviar(999).status_code, 404)
        res = self.client.post(rota, data={'imagem': (BytesIO(b'nao e uma imagem'), 'foto.png')})
        self.assertEqual(res.status_code, 400)
        res = self.client.post(rota, data={'imagem': (BytesIO(b'x' * (5 * 1024 * 1024 + 1)), 'foto.png')})
        self.assertEqual(res.status_code, 400)
        self.assertEqual(list(Path(self.pasta.name).iterdir()), [])


if __name__ == '__main__':
    unittest.main()
