# Projeto-Cantina
Integrantes
Caio Antunes Guedes Alves da SIlva -12501719
Davi Pimentel de Moraes - 12502120
Ana Julia Gois do Nascimento - 22401369
João Vitor Marques de Sampaio - 22400540
Felipe Ferreira da Fonseca - 12502537
Maria Eduarda Fidelis Correa - 12401595
Stack front end
HTML, CSS, JavaScript 
Stack back end
Python, Flask
Banco de dados 
MySQL 


## Imagens de produtos

Instale as dependências com `pip install -r requirements.txt` e inicie com `python app.py`.
Abra `http://127.0.0.1:5000/admin.html`, escolha a imagem no cadastro/edição e salve o produto.
PNG, JPG e WEBP são convertidos para PNG (até 5 MB e 20 milhões de pixels).

O backend salva na pasta `arquivos` na raiz do projeto. Exemplo: “Pão de Queijo” vira
`arquivos/pao-de-queijo-imagem.png`. A imagem aparece na lista do administrador e na página inicial.
A rota `POST /api/produtos/<id>/imagem` recebe o campo `imagem` via FormData;
`GET /api/produtos/<id>/imagem` entrega o PNG com base no nome atual do produto.
Nenhuma coluna nova ou migração é necessária. Ao editar o nome, o arquivo é renomeado.
Nomes que gerariam o mesmo arquivo são rejeitados no envio para evitar sobrescrever outro produto.

Os uploads ficam no servidor e não são enviados ao GitHub. Em hospedagem, mantenha
`arquivos` em um volume persistente. Se o envio falhar após salvar o produto,
o formulário permanece em edição para repetir o envio sem criar outro produto.
