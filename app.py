import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from backend.routes import register_routes
from backend.extensions import db, lm, login_required

from backend.models import Aluno, Produto, Pedido, ItemPedido, Avaliacao, RateioPagamento


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "front-end")


def create_app():

    load_dotenv()
    app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="/front-end")

    # Permite que o front-end (servido de outra origem/porta) consuma a API
    CORS(app)

    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///cantina.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    app.config["ARQUIVOS_DIR"] = os.path.join(app.root_path, "arquivos")
    app.config["MAX_CONTENT_LENGTH"] = 6 * 1024 * 1024
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "chave-desenvolvimento")

    @app.errorhandler(413)
    def upload_grande(erro):
        return jsonify(erro="A imagem deve ter no máximo 5 MB."), 413

    db.init_app(app)
    lm.init_app(app)

    register_routes(app)

    @app.get('/')
    @login_required
    def home():
        return send_from_directory(BASE_DIR, "index.html")

    @app.get('/api')
    def api_info():
        return jsonify({
            "message": "API Flask + SQLAlchemy funcionando!",
            "rotas": {
                "listar_alunos": "GET /api/alunos",
                "registro_aluno": "POST /api/alunos/registro",
                "atualizar_aluno": "PUT /api/alunos/<id>",
                "deletar_aluno": "DELETE /api/alunos/<id>",
                "listar_produtos": "GET /api/produtos",
                "criar_produto": "POST /api/produtos",
                "atualizar_produto": "PUT /api/produtos/<id>",
                "deletar_produto": "DELETE /api/produtos/<id>",
                "listar_pedidos": "GET /api/pedidos",
                "criar_pedido": "POST /api/pedidos",
                "buscar_pedido": "GET /api/pedidos/<id>",
                "atualizar_pedido": "PUT /api/pedidos/<id>",
                "ver_carrinho": "GET /api/carrinho/<id_aluno>",
                "adicionar_item_carrinho": "POST /api/carrinho/<id_aluno>/itens",
                "remover_item_carrinho": "DELETE /api/carrinho/itens/<id_item_pedido>",
                "finalizar_carrinho": "POST /api/carrinho/<id_aluno>/finalizar"
            }
        })
    with app.app_context():
        db.create_all()

    return app

app = create_app()

if __name__ == "__main__":
    debug = os.getenv("FLASK_DEBUG", "True") == "True"
    app.run(debug=debug, host="0.0.0.0", port=5000)