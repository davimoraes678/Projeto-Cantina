# arquivos/

Pasta onde ficam as **imagens dos produtos**, enviadas pela tela de administração.

- O caminho é configurado no `app.py` (`app.config["ARQUIVOS_DIR"]`).
- O nome do arquivo vem do nome do produto: "Suco de Laranja" → `suco-de-laranja-imagem.png`. Todas são convertidas para PNG. Não existe coluna de imagem no banco: o arquivo é achado pelo nome.
- Quem salva, renomeia, apaga e valida as imagens é o [`backend/services/imagem_service.py`](../backend/services/README.md#imagem_servicepy--imagens). Trocar o nome do produto renomeia o arquivo; excluir o produto apaga o arquivo.
- O navegador acessa a imagem pela rota `GET /api/produtos/<id>/imagem`, não diretamente por esta pasta. Os produtos já trazem o campo `imagem_url` (ou `null` quando não há imagem).

As imagens **não vão para o git**: o `.gitignore` desta pasta ignora tudo, exceto ele mesmo e este README. Cada pessoa tem as próprias imagens locais, então um produto cadastrado em outra máquina aparece sem foto até alguém enviar a imagem de novo.
