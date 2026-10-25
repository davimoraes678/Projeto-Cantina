import os, click
from flask import Flask, jsonify, send_from_directory, redirect, request
from flask_cors import CORS
from dotenv import load_dotenv
from backend.routes import register_routes
from backend.extensions import db, lm, login_required, login_user, current_user

from backend.models import aluno_model, produto_model, pedido_model, item_pedido, avaliacao_model, rateio_model

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



    PAGINAS_PROTEGIDAS = {
        '/front-end/index.html',
        '/front-end/admin.html',
        '/front-end/conta.html',
        '/front-end/carteira.html',
        '/front-end/historico.html',
    }
    # Páginas só para admin e mestre: um aluno comum volta para a cantina
    PAGINAS_ADMIN = {
        '/front-end/admin.html',
        '/front-end/historico.html',
    }
    @app.before_request
    def proteger_paginas():
        if request.path in PAGINAS_PROTEGIDAS and not current_user.is_authenticated:
            return redirect('/front-end/cadastro.html')
        if request.path in PAGINAS_ADMIN and current_user.funcao not in ('admin', 'mestre'):
            return redirect('/')

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
            # Lista gerada a partir das rotas registradas (sempre atualizada)
            "rotas": sorted(
                f"{' '.join(sorted(regra.methods - {'HEAD', 'OPTIONS'}))} {regra.rule}"
                for regra in app.url_map.iter_rules() if regra.rule.startswith('/api/')
            )
        })
    with app.app_context():
        db.create_all()

    return app

app = create_app()

if __name__ == "__main__":
    debug = os.getenv("FLASK_DEBUG", "True") == "True"
    app.run(debug=debug, host="0.0.0.0", port=5000)