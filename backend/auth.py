import os
from functools import wraps

from flask import current_app, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer


TOKEN_MAX_AGE = 60 * 60 * 24 * 30


def _serializer():
    secret = os.getenv("AUTH_SECRET_KEY") or current_app.config["SECRET_KEY"]
    return URLSafeTimedSerializer(secret, salt="cantina-real-auth")


def gerar_token(aluno):
    return _serializer().dumps({"id_aluno": aluno.id_aluno})


def ler_token(token):
    return _serializer().loads(token, max_age=TOKEN_MAX_AGE)


def auth_required(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        token = header[7:] if header.startswith("Bearer ") else None
        if not token:
            return jsonify({"error": "Não autenticado. Faça login novamente."}), 401
        try:
            payload = ler_token(token)
        except (BadSignature, SignatureExpired):
            return jsonify({"error": "Sessão expirada. Faça login novamente."}), 401
        request.id_aluno_autenticado = payload["id_aluno"]
        return view(*args, **kwargs)

    return wrapper
