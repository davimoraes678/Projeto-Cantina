# backend/services/

As **regras de negócio**. Os [controllers](../controllers/README.md) chamam os services, e os services usam os [models](../models/README.md) para ler e gravar no banco.

Todo método de service devolve uma tupla **`(dicionário, código_http)`**, por exemplo `({"erro": "Produto não encontrado"}, 404)` ou `(carrinho.to_dict(), 201)`. Os services não usam `request` nem `jsonify`; isso é papel do controller.

| Arquivo | O que faz |
|---|---|
| [`aluno/`](aluno/README.md) | Cadastro, login, logout e CRUD de alunos |
| `item_pedido_service.py` | Carrinho do aluno logado |
| `pedido_service.py` | Pedidos: criar direto, listar, consultar e mudar status |
| `produto_service.py` | CRUD e busca de produtos |
| `imagem_service.py` | Imagens dos produtos em `arquivos/` |

## `item_pedido_service.py` — carrinho

O carrinho é um `Pedido` com `status = "Carrinho"` (constante `STATUS_CARRINHO`), e cada produto é um `ItemPedido`. Todos os métodos usam o **aluno logado** (`current_user`).

| Método | Regra |
|---|---|
| `ver_carrinho()` | Devolve o carrinho do aluno; se ainda não existir, um carrinho vazio (sem gravar nada) |
| `adicionar_item(data)` | Valida o produto e a quantidade (≥ 1). Cria o carrinho na primeira vez. Se o produto já está no carrinho, **soma** a quantidade. Guarda o nome e o preço do produto naquele momento. Recalcula o total |
| `remover_item(id_item_pedido)` | Só remove se o item for de um carrinho **do aluno logado**; senão responde `404` |
| `finalizar()` | Confere estoque de cada item e saldo do aluno; se tudo der, desconta os dois e troca o status de `"Carrinho"` para `"Pendente"`. `400` se estiver vazio ou faltar estoque/saldo |
| `repetir_ultimo_pedido()` | Pega o último pedido do aluno e chama `adicionar_item` para cada produto (os excluídos são pulados) |

## `pedido_service.py` — pedidos

| Método | Regra |
|---|---|
| `criar(data)` | Cria um pedido direto, sem carrinho, para o aluno logado (o front não usa) |
| `listar_todos()` | Todos os pedidos, **exceto** os que ainda são carrinho |
| `buscar_por_id(id)` | Um pedido |
| `atualizar_status(id, data)` | Muda status e horários. Datas chegam como texto (`"2026-10-13T12:30"`) e são convertidas por `_parse_datetime` |
| `combinacoes_mais_pedidas()` | Conta quantas vezes cada dupla de produtos aparece no mesmo pedido (sem carrinhos e cancelados) e devolve as 3 mais comuns |
| `AvaliacaoService.criar(data, id)` | Só o dono do pedido avalia, e uma vez só |

## `produto_service.py` — produtos

| Método | Regra |
|---|---|
| `criar(data)` | Exige `nome` e `preco_atual` |
| `atualizar(id, data)` | Muda só os campos enviados; ao trocar o nome, renomeia a imagem junto |
| `deletar(id)` | Antes de apagar, copia o nome do produto para os itens de pedidos antigos e solta o vínculo, para o histórico continuar mostrando o nome |
| `buscar(filtros)` | Usa as stored procedures do MySQL (via [`repositories/`](../repositories/README.md)). Se não estiver no MySQL, ou se a procedure falhar, faz a mesma busca pelo ORM (`_buscar_fallback_orm`). No MySQL, só o primeiro critério é aplicado: categoria, depois faixa de preço, depois ordenação |

## `imagem_service.py` — imagens

O nome do arquivo vem do nome do produto: "Suco de Laranja" → `arquivos/suco-de-laranja-imagem.png` (sem acentos, minúsculo, com hífens).

| Função | O que faz |
|---|---|
| `salvar_imagem(produto, arquivo)` | Aceita PNG, JPG ou WEBP até 5 MB, corrige a rotação da foto, reduz para no máximo 600×600 (mantendo a proporção) e salva como PNG |
| `renomear_imagem(produto, novo_nome)` | Renomeia o arquivo quando o produto muda de nome |
| `verificar_nome_disponivel(...)` | Impede dois produtos que gerariam o mesmo nome de arquivo (ex.: "Suco" e "suco!") |
| `nome_imagem(nome)` | Gera o nome do arquivo a partir do nome do produto |
