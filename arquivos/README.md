# arquivos/

Pasta onde ficam as **imagens dos produtos**, enviadas pela tela de administração.

- O caminho é configurado no `app.py` (`app.config["ARQUIVOS_DIR"]`).
- O nome do arquivo vem do nome do produto: "Suco de Laranja" → `suco-de-laranja-imagem.png`. Todas são convertidas para PNG.
- Quem salva, renomeia e valida as imagens é o [`backend/services/imagem_service.py`](../backend/services/README.md#imagem_servicepy--imagens).
- O navegador acessa a imagem pela rota `GET /api/produtos/<id>/imagem`, não diretamente por esta pasta.

As imagens **não vão para o git**: o `.gitignore` desta pasta ignora tudo, exceto ele mesmo e este README. Cada pessoa tem as próprias imagens locais, então um produto cadastrado em outra máquina aparece sem foto até alguém enviar a imagem de novo.
