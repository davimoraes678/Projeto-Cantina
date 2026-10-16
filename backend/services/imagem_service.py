"""Imagens de produtos: o nome do arquivo é derivado do nome do produto."""
import re
import unicodedata
from io import BytesIO
from pathlib import Path
from tempfile import NamedTemporaryFile

from flask import current_app
from PIL import Image, ImageOps, UnidentifiedImageError


def nome_imagem(nome):
    nome = unicodedata.normalize("NFD", nome)
    nome = "".join(letra for letra in nome if not unicodedata.combining(letra))
    nome = re.sub(r"[^a-z0-9]+", "-", nome.lower()).strip("-")
    if not nome:
        raise ValueError("O nome do produto precisa conter letras ou números.")
    return f"{nome}-imagem.png"


def caminho_imagem(nome):
    return Path(current_app.config["ARQUIVOS_DIR"]) / nome_imagem(nome)


def verificar_nome_disponivel(produto, nome):
    from backend.models.produto_model import Produto
    destino = nome_imagem(nome)
    for outro in Produto.listar_todos():
        if outro.id_produto != produto.id_produto:
            try:
                nome_outro = nome_imagem(outro.nome)
            except ValueError:
                continue
            if nome_outro == destino:
                raise ValueError("Outro produto usa o mesmo nome de imagem. Use um nome diferente.")


def salvar_imagem(produto, arquivo):
    verificar_nome_disponivel(produto, produto.nome)
    dados = arquivo.stream.read(5 * 1024 * 1024 + 1)
    if len(dados) > 5 * 1024 * 1024:
        raise ValueError("A imagem deve ter no máximo 5 MB.")
    try:
        with Image.open(BytesIO(dados)) as imagem:
            if imagem.format not in {"PNG", "JPEG", "WEBP"}:
                raise ValueError("Envie uma imagem PNG, JPG ou WEBP.")
            if imagem.width * imagem.height > 20_000_000:
                raise ValueError("A imagem deve ter no máximo 20 milhões de pixels.")
            imagem = ImageOps.exif_transpose(imagem).convert("RGBA")
            destino = caminho_imagem(produto.nome)
            destino.parent.mkdir(parents=True, exist_ok=True)
            temporario = None
            try:
                with NamedTemporaryFile(dir=destino.parent, suffix=".png", delete=False) as temp:
                    temporario = Path(temp.name)
                    imagem.save(temp, format="PNG")
                temporario.replace(destino)
            finally:
                if temporario is not None:
                    temporario.unlink(missing_ok=True)
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as erro:
        raise ValueError("Arquivo de imagem inválido.") from erro
    return destino.name


def url_imagem(id_produto, nome):
    """Endereço da imagem do produto, ou None se ele ainda não tem imagem (o front não precisa tentar e levar 404)."""
    try:
        existe = caminho_imagem(nome).is_file()
    except ValueError:
        return None
    return f"/api/produtos/{id_produto}/imagem" if existe else None


def verificar_renomeacao(produto, novo_nome):
    """Confere se a imagem pode ser renomeada, sem mexer em nada. Chame ANTES de gravar o novo nome
    no banco, para um erro aqui não deixar o banco e a pasta de imagens em desacordo."""
    origem = caminho_imagem(produto.nome)
    destino = caminho_imagem(novo_nome)
    if origem == destino or not origem.is_file():
        return
    verificar_nome_disponivel(produto, novo_nome)
    if destino.exists():
        raise ValueError("Já existe uma imagem com esse nome. Use um nome diferente.")


def renomear_imagem(nome_antigo, novo_nome):
    """Renomeia o arquivo da imagem. Chame DEPOIS de gravar o novo nome no banco."""
    origem = caminho_imagem(nome_antigo)
    destino = caminho_imagem(novo_nome)
    if origem != destino and origem.is_file() and not destino.exists():
        origem.rename(destino)


def remover_imagem(nome):
    """Apaga o arquivo da imagem (se existir), para um produto novo com o mesmo nome não herdar a foto antiga."""
    try:
        caminho_imagem(nome).unlink(missing_ok=True)
    except ValueError:
        pass
