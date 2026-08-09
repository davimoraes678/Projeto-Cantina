def register_routes(app):
    from backend.controllers.produto_controller import bp_produto
    from backend.controllers.pedido_controller import bp_pedido
    from backend.controllers.aluno_controller import bp_aluno

    app.register_blueprint(bp_produto)
    app.register_blueprint(bp_pedido)
    app.register_blueprint(bp_aluno)
