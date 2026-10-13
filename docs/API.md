# API

Todas as rotas começam com `/api`, recebem e devolvem **JSON** (exceto o upload e a visualização de imagem). Em caso de erro, a resposta tem o formato:

```json
{ "erro": "Mensagem para mostrar ao usuário" }
```

**🔒 = exige login.** Sem login, essas rotas respondem `401` com `{"erro": "Faça login para continuar."}`. O login é guardado num cookie de sessão que o navegador envia sozinho (veja [LOGIN.md](LOGIN.md)).

A rota `GET /api` devolve a lista de rotas, útil para conferir rapidamente o que está registrado.

---

## Alunos e login — `/api/alunos`

| Método | Rota | Login | O que faz |
|---|---|---|---|
| `POST` | `/api/alunos/registro` | | Cadastra o aluno **e já faz login** |
| `POST` | `/api/alunos/login` | | Faz login |
| `POST` | `/api/alunos/logout` | 🔒 | Faz logout |
| `GET` | `/api/alunos/atual` | 🔒 | Dados do aluno logado |
| `GET` | `/api/alunos` | | Lista todos os alunos (tela de admin) |
| `PUT` | `/api/alunos/<id>` | | Edita um aluno |
| `DELETE` | `/api/alunos/<id>` | | Exclui um aluno (os pedidos dele são mantidos) |

### `POST /api/alunos/registro`
```json
{ "nome": "Ana", "email": "ana@email.com", "senha": "123456" }
```
| Resposta | Quando |
|---|---|
| `201` + dados do aluno | Cadastrado e logado |
| `400` | Faltou nome, e-mail ou senha |
| `409` | E-mail já cadastrado |

### `POST /api/alunos/login`
```json
{ "email": "ana@email.com", "senha": "123456" }
```
| Resposta | Quando |
|---|---|
| `200` + dados do aluno | Login feito (o cookie de sessão é criado) |
| `400` | Faltou e-mail ou senha |
| `401` | E-mail ou senha errados (a mensagem é a mesma nos dois casos, de propósito) |

### `GET /api/alunos/atual` 🔒
```json
{ "id_aluno": 1, "nome": "Ana", "email": "ana@email.com", "saldo": 0.0 }
```
Formato de um aluno em todas as rotas. **A senha nunca é devolvida.**

### `PUT /api/alunos/<id>`
Envie só os campos que quer mudar. Senha em branco ou ausente mantém a atual.
```json
{ "nome": "Ana Souza", "email": "ana.souza@email.com", "senha": "nova" }
```
`200` com o aluno atualizado, ou `404` se não existir.

---

## Produtos — `/api/produtos`

| Método | Rota | O que faz |
|---|---|---|
| `GET` | `/api/produtos` | Lista todos |
| `GET` | `/api/produtos/buscar` | Busca com filtros (veja abaixo) |
| `GET` | `/api/produtos/<id>` | Um produto |
| `POST` | `/api/produtos` | Cria |
| `PUT` | `/api/produtos/<id>` | Edita (só os campos enviados) |
| `DELETE` | `/api/produtos/<id>` | Exclui (os itens de pedidos antigos mantêm o nome) |
| `POST` | `/api/produtos/<id>/imagem` | Envia a imagem (`multipart/form-data`, campo `imagem`) |
| `GET` | `/api/produtos/<id>/imagem` | Devolve a imagem (PNG) |

### Formato de um produto
```json
{
  "id_produto": 1,
  "nome": "Suco de Laranja",
  "quantidade_estoque": 30,
  "preco_atual": 5.0,
  "preco_promocional": null,
  "categoria": "Bebida",
  "status": true,
  "imagem": null
}
```
Categorias usadas no front: `Bebida`, `Lanche` (aparece como "Salgado") e `Doce`.

### `POST /api/produtos`
`nome` e `preco_atual` são obrigatórios (`400` se faltarem). Opcionais: `quantidade_estoque` (padrão 0), `categoria`, `preco_promocional`, `ingredientes`, `tabela_nutricional`, `status` (padrão `true`). Responde `201`.

### `GET /api/produtos/buscar`
Parâmetros na URL (todos opcionais):

| Parâmetro | Exemplo | Efeito |
|---|---|---|
| `categoria` | `?categoria=Bebida` | Só essa categoria |
| `preco_min` / `preco_max` | `?preco_min=2&preco_max=10` | Faixa de preço |
| `ordenar` | `?ordenar=nome` ou `?ordenar=preco` | Ordenação |

Sem parâmetros, devolve todos. No MySQL usa as stored procedures `sp_produtos_*`; no SQLite (ou se a procedure falhar) faz a mesma busca pelo ORM. **Atenção:** no MySQL, só o primeiro critério é aplicado (categoria, depois faixa de preço, depois ordenação).

### Imagem do produto
- O arquivo é salvo em `arquivos/<nome-do-produto>-imagem.png`, convertido para PNG.
- Aceita PNG, JPG e WEBP de até 5 MB.
- Respostas de erro: `400` sem arquivo ou formato inválido; `404` produto inexistente ou sem imagem.

---

## Carrinho — `/api/carrinho` 🔒

Todas as rotas usam o **aluno logado**, por isso nenhuma recebe `id_aluno`. Cada aluno só vê e altera o próprio carrinho.

| Método | Rota | O que faz |
|---|---|---|
| `GET` | `/api/carrinho` | Carrinho do aluno logado (vazio se ainda não existir) |
| `POST` | `/api/carrinho/itens` | Adiciona um produto |
| `DELETE` | `/api/carrinho/itens/<id_item_pedido>` | Remove um item |
| `POST` | `/api/carrinho/finalizar` | Transforma o carrinho em pedido `"Pendente"` |

### Formato do carrinho (e de um pedido)
```json
{
  "id_pedido": 3,
  "status": "Carrinho",
  "valor_total": 17.5,
  "id_aluno": 1,
  "aluno_nome": "Ana",
  "data_hora_criacao": "2026-10-13T10:00:00",
  "horario_agendado_retirada": null,
  "data_hora_retirada": null,
  "itens": [
    {
      "id_item_pedido": 5,
      "id_produto": 1,
      "produto_nome": "Suco de Laranja",
      "quantidade": 2,
      "preco_unitario_cobrado": 5.0,
      "subtotal": 10.0,
      "id_pedido": 3
    }
  ]
}
```

### `POST /api/carrinho/itens`
```json
{ "id_produto": 1, "quantidade": 2 }
```
Se o produto já está no carrinho, a quantidade é somada. `201` com o carrinho atualizado; `404` produto inexistente; `400` quantidade inválida.

### `DELETE /api/carrinho/itens/<id_item_pedido>`
`200` com o carrinho atualizado; `404` se o item não existe ou não é do carrinho do aluno logado.

### `POST /api/carrinho/finalizar`
`200` com o pedido (agora `"Pendente"`); `400` se o carrinho estiver vazio.

---

## Pedidos — `/api/pedidos`

| Método | Rota | Login | O que faz |
|---|---|---|---|
| `GET` | `/api/pedidos` | | Lista os pedidos (**sem** os carrinhos em aberto) |
| `GET` | `/api/pedidos/<id>` | | Um pedido |
| `PUT` | `/api/pedidos/<id>` | | Muda status e/ou horários |
| `POST` | `/api/pedidos` | 🔒 | Cria um pedido direto, sem passar pelo carrinho (o front não usa) |

### `PUT /api/pedidos/<id>`
```json
{ "status": "Pronto", "horario_agendado_retirada": "2026-10-13T12:30" }
```
Status usados no front: `Pendente`, `Em Preparo`, `Pronto`, `Concluído`, `Cancelado`. Datas no formato `AAAA-MM-DDTHH:MM`.

### `POST /api/pedidos` 🔒
```json
{ "itens": [ { "id_produto": 1, "quantidade": 2 } ], "horario_agendado_retirada": "2026-10-13T12:30" }
```
`201` com o pedido criado.

---

## Limitações conhecidas

- **Não existe papel de administrador.** As rotas de alunos, produtos e de alterar pedidos não exigem login; qualquer pessoa pode chamá-las.
- **O estoque não é conferido nem baixado** quando um pedido é feito.
- **O preço promocional não é aplicado**: o item sempre usa `preco_atual`.
