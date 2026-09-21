from datetime import datetime

from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import or_
from werkzeug.security import check_password_hash, generate_password_hash

from backend.auth import auth_required, gerar_token
from backend.extensions import db
from backend.models.aluno_model import Aluno
from backend.models.item_pedido import ItemPedido
from backend.models.pedido_model import Pedido
from backend.models.produto_model import Produto


bp_cantina = Blueprint("cantina_real", __name__, url_prefix="/api")

PROMOCOES = [
    {
        "id": "p_sexta",
        "dia": "sexta",
        "titulo": "Sexta Feira",
        "descricao": "1 pote de nuggets + 1 refrigerante de 200ml",
        "preco": 7.5,
        "emoji": "🍗",
    },
    {
        "id": "p_quarta",
        "dia": "quarta",
        "titulo": "Quarta feira",
        "descricao": "1 cachorro quente + 1 refri de 200ml",
        "preco": 7.5,
        "emoji": "🌭",
    },
]


def _aluno_publico(aluno):
    return {
        "id": aluno.id_aluno,
        "nome": aluno.nome,
        "matricula": aluno.matricula,
        "email": aluno.email,
    }


def _status_frontend(status):
    return {
        "Pendente": "preparando",
        "Preparando": "preparando",
        "Pronto": "pronto",
        "Concluído": "entregue",
        "Entregue": "entregue",
    }.get(status, "preparando")


def _status_banco(status):
    return {
        "preparando": "Preparando",
        "pronto": "Pronto",
        "entregue": "Concluído",
    }.get(status)


def _emoji(produto):
    categoria = (produto.categoria or "").lower()
    if "bebida" in categoria:
        return "🥤"
    if "doce" in categoria:
        return "🍫"
    return "🍽️"


def _produto_frontend(produto):
    preco = produto.preco_promocional if produto.preco_promocional is not None else produto.preco_atual
    return {
        "id": produto.id_produto,
        "nome": produto.nome,
        "categoria": produto.categoria or "Outros",
        "preco": float(preco),
        "emoji": _emoji(produto),
        "estoque": bool(produto.status and produto.quantidade_estoque > 0),
    }


def _pedido_frontend(pedido):
    status = _status_frontend(pedido.status)
    return {
        "id": pedido.id_pedido,
        "codigo": f"CR{pedido.id_pedido:04d}",
        "itens": [
            {
                "itemId": item.id_produto,
                "nome": item.nome_produto,
                "preco": float(item.preco_unitario_cobrado),
                "qtd": item.quantidade,
                "status": status,
            }
            for item in pedido.itens
        ],
        "total": float(pedido.valor_total),
        "horario": pedido.horario_agendado_retirada.strftime("%H:%M")
        if pedido.horario_agendado_retirada
        else "Não informado",
        "data": pedido.horario_agendado_retirada.date().isoformat()
        if pedido.horario_agendado_retirada
        else pedido.data_hora_criacao.date().isoformat(),
        "createdAt": pedido.data_hora_criacao.isoformat(),
        "statusGeral": status,
    }


def _pedido_por_codigo(codigo):
    if not codigo.upper().startswith("CR"):
        return None
    try:
        return db.session.get(Pedido, int(codigo[2:]))
    except ValueError:
        return None


@bp_cantina.post("/auth/register")
def registrar():
    dados = request.get_json(silent=True) or {}
    nome = str(dados.get("nome", "")).strip()
    matricula = str(dados.get("matricula", "")).strip()
    email = str(dados.get("email", "")).strip().lower()
    senha = str(dados.get("senha", ""))
    if not nome or not matricula or not email or not senha:
        return jsonify({"error": "Preencha nome, matrícula, email e senha."}), 400
    if len(senha) < 4:
        return jsonify({"error": "A senha deve ter pelo menos 4 caracteres."}), 400
    if Aluno.query.filter(or_(Aluno.matricula == matricula, Aluno.email == email)).first():
        return jsonify({"error": "Já existe um cadastro com essa matrícula ou email."}), 409

    aluno = Aluno(nome=nome, matricula=matricula, email=email, senha=generate_password_hash(senha))
    db.session.add(aluno)
    db.session.commit()
    return jsonify({"token": gerar_token(aluno), "aluno": _aluno_publico(aluno)}), 201


@bp_cantina.post("/auth/login")
def login():
    dados = request.get_json(silent=True) or {}
    identificador = str(dados.get("identificador", "")).strip()
    senha = str(dados.get("senha", ""))
    aluno = Aluno.query.filter(
        or_(Aluno.matricula == identificador, Aluno.email == identificador.lower())
    ).first()
    if not aluno or not check_password_hash(aluno.senha, senha):
        return jsonify({"error": "Matrícula/email ou senha inválidos."}), 401
    return jsonify({"token": gerar_token(aluno), "aluno": _aluno_publico(aluno)})


@bp_cantina.get("/auth/me")
@auth_required
def usuario_atual():
    aluno = db.session.get(Aluno, request.id_aluno_autenticado)
    if not aluno:
        return jsonify({"error": "Aluno não encontrado."}), 404
    return jsonify({"aluno": _aluno_publico(aluno)})


@bp_cantina.get("/menu")
def menu():
    query = Produto.query
    categoria = request.args.get("categoria")
    busca = request.args.get("busca")
    if categoria and categoria != "Todos":
        query = query.filter(Produto.categoria == categoria)
    if busca:
        query = query.filter(Produto.nome.ilike(f"%{busca}%"))
    return jsonify({"itens": [_produto_frontend(p) for p in query.all()]})


@bp_cantina.get("/menu/orcamento")
def menu_orcamento():
    try:
        maximo = float(request.args.get("max", 10))
    except ValueError:
        return jsonify({"error": "Orçamento inválido."}), 400
    produtos = [p for p in Produto.query.all() if _produto_frontend(p)["preco"] <= maximo]
    return jsonify({"max": maximo, "itens": [_produto_frontend(p) for p in produtos]})


@bp_cantina.get("/promotions")
def promocoes():
    return jsonify({"promocoes": PROMOCOES})


@bp_cantina.post("/orders")
@auth_required
def criar_pedido_frontend():
    dados = request.get_json(silent=True) or {}
    itens = dados.get("itens")
    horario = dados.get("horario")
    data = dados.get("data") or datetime.now().date().isoformat()
    if not isinstance(itens, list) or not itens:
        return jsonify({"error": "O carrinho está vazio."}), 400
    if not horario:
        return jsonify({"error": "Escolha um horário de retirada."}), 400
    try:
        retirada = datetime.fromisoformat(f"{data}T{horario}")
    except ValueError:
        return jsonify({"error": "Data ou horário de retirada inválido."}), 400

    aluno = db.session.get(Aluno, request.id_aluno_autenticado)
    if not aluno:
        return jsonify({"error": "Aluno não encontrado."}), 404

    try:
        pedido = Pedido(
            id_aluno=aluno.id_aluno,
            nome_aluno=aluno.nome,
            status="Preparando",
            horario_agendado_retirada=retirada,
        )
        db.session.add(pedido)
        db.session.flush()
        total = 0.0

        for recebido in itens:
            try:
                quantidade = int(recebido.get("qtd", 0))
            except (TypeError, ValueError):
                quantidade = 0
            if quantidade < 1:
                raise ValueError("A quantidade de cada produto deve ser positiva.")

            item_id = recebido.get("itemId")
            if isinstance(item_id, str) and item_id.startswith("p_"):
                promocao = next((p for p in PROMOCOES if p["id"] == item_id), None)
                if not promocao:
                    raise ValueError("Promoção não encontrada.")
                nome = promocao["titulo"]
                preco = promocao["preco"]
                produto_id = None
            else:
                produto = db.session.get(Produto, int(item_id)) if item_id is not None else None
                if not produto or not produto.status:
                    raise ValueError("Produto indisponível.")
                if produto.quantidade_estoque < quantidade:
                    raise ValueError(f"Estoque insuficiente para {produto.nome}.")
                produto.quantidade_estoque -= quantidade
                nome = produto.nome
                preco = (
                    produto.preco_promocional
                    if produto.preco_promocional is not None
                    else produto.preco_atual
                )
                produto_id = produto.id_produto

            db.session.add(
                ItemPedido(
                    id_pedido=pedido.id_pedido,
                    id_produto=produto_id,
                    nome_produto=nome,
                    quantidade=quantidade,
                    preco_unitario_cobrado=preco,
                )
            )
            total += float(preco) * quantidade

        pedido.valor_total = round(total, 2)
        db.session.commit()
        return jsonify({"pedido": _pedido_frontend(pedido)}), 201
    except (TypeError, ValueError) as erro:
        db.session.rollback()
        return jsonify({"error": str(erro)}), 400
    except Exception:
        db.session.rollback()
        current_app.logger.exception("Falha inesperada ao criar pedido")
        return jsonify({"error": "Não foi possível criar o pedido."}), 500


@bp_cantina.get("/orders/me")
@auth_required
def meus_pedidos():
    pedidos = (
        Pedido.query.filter_by(id_aluno=request.id_aluno_autenticado)
        .order_by(Pedido.data_hora_criacao.desc())
        .all()
    )
    return jsonify({"pedidos": [_pedido_frontend(p) for p in pedidos]})


@bp_cantina.get("/orders/<codigo>")
@auth_required
def pedido_por_codigo(codigo):
    pedido = _pedido_por_codigo(codigo)
    if not pedido or pedido.id_aluno != request.id_aluno_autenticado:
        return jsonify({"error": "Pedido não encontrado."}), 404
    return jsonify({"pedido": _pedido_frontend(pedido)})


@bp_cantina.get("/kitchen/orders")
@auth_required
def fila_cozinha():
    filtro = request.args.get("status")
    linhas = []
    for pedido in Pedido.query.order_by(Pedido.data_hora_criacao.desc()).all():
        status = _status_frontend(pedido.status)
        for indice, item in enumerate(pedido.itens):
            linhas.append(
                {
                    "orderId": pedido.id_pedido,
                    "itemIndex": indice,
                    "codigo": f"CR{pedido.id_pedido:04d}",
                    "nome": item.nome_produto,
                    "horario": pedido.horario_agendado_retirada.strftime("%H:%M")
                    if pedido.horario_agendado_retirada
                    else "Não informado",
                    "status": status,
                }
            )
    if filtro and filtro != "Todos":
        linhas = [linha for linha in linhas if linha["status"] == filtro]
    return jsonify({"linhas": linhas})


@bp_cantina.patch("/kitchen/orders/<int:id_pedido>/items/<int:item_index>")
@auth_required
def atualizar_fila(id_pedido, item_index):
    pedido = db.session.get(Pedido, id_pedido)
    if not pedido or item_index < 0 or item_index >= len(pedido.itens):
        return jsonify({"error": "Pedido ou item não encontrado."}), 404
    dados = request.get_json(silent=True) or {}
    status_atual = _status_frontend(pedido.status)
    proximo = {"preparando": "pronto", "pronto": "entregue", "entregue": "entregue"}
    novo_status = dados.get("status") or proximo[status_atual]
    status_banco = _status_banco(novo_status)
    if not status_banco:
        return jsonify({"error": "Status inválido."}), 400
    pedido.status = status_banco
    if novo_status == "entregue":
        pedido.data_hora_retirada = datetime.now()
    db.session.commit()
    return jsonify({"pedido": _pedido_frontend(pedido)})
