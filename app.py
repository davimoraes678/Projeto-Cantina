import os
from flask import Flask, jsonify, send_from_directory, redirect, request
from flask_cors import CORS
from dotenv import load_dotenv
from backend.routes import register_routes
from flask_login import login_required, current_user
from backend.extensions import db, lm
from backend import models  # noqa: F401  (registra TODOS os models; sem isso as consultas dão erro 500)

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

    @lm.unauthorized_handler
    def nao_autorizado():
        # Rota protegida sem login: o front espera JSON (e não a página HTML padrão de erro 401).
        return jsonify(erro="Faça login para continuar."), 401

    PAGINAS_PROTEGIDAS = {
        '/front-end/index.html',
        '/front-end/admin.html',
        '/front-end/conta.html',
    }
    @app.before_request
    def proteger_paginas():
        if request.path in PAGINAS_PROTEGIDAS and not current_user.is_authenticated:
            return redirect('/front-end/cadastro.html')

    register_routes(app)


    @app.get('/')
    def home():
        if not current_user.is_authenticated:
            return redirect('/front-end/cadastro.html')
        return send_from_directory(FRONTEND_DIR, "index.html")

    
    @app.get('/api')
    @login_required
    def api_info():
        return jsonify({
            "message": "API Flask + SQLAlchemy funcionando!",
            "rotas": {
                "registro_aluno": "POST /api/alunos/registro",
                "login_aluno": "POST /api/alunos/login",
                "aluno_atual": "GET /api/alunos/atual",
                "logout_aluno": "POST /api/alunos/logout",
                "atualizar_aluno": "PUT /api/alunos/atual",
                "deletar_aluno": "DELETE /api/alunos/atual",
                "listar_produtos": "GET /api/produtos",
                "buscar_produtos": "GET /api/produtos/buscar",
                "listar_categorias": "GET /api/produtos/categorias",
                "buscar_produto": "GET /api/produtos/<id>",
                "criar_produto": "POST /api/produtos",
                "atualizar_produto": "PUT /api/produtos/<id>",
                "deletar_produto": "DELETE /api/produtos/<id>",
                "enviar_imagem_produto": "POST /api/produtos/<id>/imagem",
                "ver_imagem_produto": "GET /api/produtos/<id>/imagem",
                "listar_pedidos": "GET /api/pedidos",
                "buscar_pedido": "GET /api/pedidos/<id>",
                "atualizar_pedido": "PUT /api/pedidos/<id>",
                "avaliar_pedido": "POST /api/pedidos/<id>/avaliacao",
                "ver_carrinho": "GET /api/carrinho",
                "adicionar_item_carrinho": "POST /api/carrinho/itens",
                "remover_item_carrinho": "DELETE /api/carrinho/itens/<id_item_pedido>",
                "finalizar_carrinho": "POST /api/carrinho/finalizar"
            }
        })
    with app.app_context():
        db.create_all()

    return app

app = create_app()

if __name__ == "__main__":
    debug = os.getenv("FLASK_DEBUG", "True") == "True"
    app.run(debug=debug, host="0.0.0.0", port=5000)