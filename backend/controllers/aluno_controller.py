from flask import request, jsonify
from app.services.professor.criar_professor_service import (
    CriarProfessorService
)


class ProfessorController:
    @staticmethod
    def criar():
        dados = request.get_json()
        professor = CriarProfessorService.executar(dados)
        return jsonify(professor.to_dict()), 201