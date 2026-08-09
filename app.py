import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from backend.controllers import aluno_controller, pedido_controller, produto_controller
from backend.extensions import db

from backend.models.aluno_model import Aluno
from backend.models.produto_model import Produto
from backend.models.pedido_model import Pedido
from backend.models.item_pedido import ItemPedido
from backend.models.avaliacao_model import Avaliacao
from backend.models.rateio_model import RateioPagamento
    
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "front-end")


def create_app():
    load_dotenv()
    app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")

    # Permite que o front-end (servido de outra origem/porta) consuma a API
    CORS(app)

    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///cantina.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    app.register_blueprint(aluno_controller.bp_aluno)
    app.register_blueprint(produto_controller.bp_produto)
    app.register_blueprint(pedido_controller.bp_pedido)

    @app.get('/')
    def home():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.get('/api')
    def api_info():
        return jsonify({
            "message": "API Flask + SQLAlchemy funcionando!",
            "rotas": {
                "listar_alunos": "GET /api/alunos",
                "criar_aluno": "POST /api/alunos",
                "atualizar_aluno": "PUT /api/alunos/<id>",
                "deletar_aluno": "DELETE /api/alunos/<id>",
                "listar_produtos": "GET /api/produtos",
                "criar_produto": "POST /api/produtos",
                "atualizar_produto": "PUT /api/produtos/<id>",
                "deletar_produto": "DELETE /api/produtos/<id>",
                "listar_pedidos": "GET /api/pedidos",
                "criar_pedido": "POST /api/pedidos",
                "buscar_pedido": "GET /api/pedidos/<id>",
                "atualizar_pedido": "PUT /api/pedidos/<id>"
            }
        })
    with app.app_context():
        db.create_all()

    return app

app = create_app()


if __name__ == "__main__":
    debug = os.getenv("FLASK_DEBUG", "True") == "True"
    app.run(debug=debug, host="0.0.0.0", port=5000)