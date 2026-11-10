# front-end/assets/imagens-produtos/

Fotos dos produtos, enviadas pela tela de administração.

- O nome vem do nome do produto: "Suco de Laranja" vira `suco-de-laranja-imagem.png`. Todas são salvas em PNG, com no máximo 600×600.
- Quem salva e renomeia é o [`backend/services/produto/imagem.py`](../backend/services/produto/imagem.py).
- O navegador pega a foto pela rota `GET /api/produtos/<id>/imagem`.

As fotos **não vão para o git** (o `.gitignore` desta pasta ignora tudo). Num computador novo, os produtos aparecem sem foto até alguém enviar de novo.
