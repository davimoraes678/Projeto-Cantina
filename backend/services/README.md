# backend/services/

As **regras de negócio**. Os [controllers](../controllers/README.md) chamam os services, e os services usam os [models](../models/README.md) para ler e gravar no banco.

Todo método de service devolve uma tupla **`(dicionário, código_http)`**, por exemplo `({"erro": "Produto não encontrado"}, 404)` ou `(carrinho.to_dict(), 201)`. Os services não usam `request` nem `jsonify`; isso é papel do controller.

| Arquivo | O que faz |
|---|---|
| [`aluno/`](aluno/README.md) | Cadastro, login, logout e conta do aluno |
| `item_pedido_service.py` | Carrinho do aluno logado |
| `pedido_service.py` | Pedidos (listar, consultar e mudar status) e avaliação de pedidos |
| `produto_service.py` | CRUD e busca de produtos |
| `imagem_service.py` | Imagens dos produtos em `arquivos/` |

## `item_pedido_service.py` — carrinho

O carrinho é um `Pedido` com `status = "Carrinho"` (constante `STATUS_CARRINHO`), e cada produto é um `ItemPedido`. Todos os métodos usam o **aluno logado** (`current_user`).

| Método | Regra |
|---|---|
| `ver_carrinho()` | Devolve o carrinho do aluno; se ainda não existir, um carrinho vazio (sem gravar nada) |
| `adicionar_item(data)` | Valida o produto e a quantidade (≥ 1). Cria o carrinho na primeira vez. Se o produto já está no carrinho, **soma** a quantidade. Guarda o nome e o preço do produto naquele momento. Recalcula o total |
| `remover_item(id_item_pedido)` | Só remove se o item for de um carrinho **do aluno logado**; senão responde `404` |
| `finalizar()` | Troca o status de `"Carrinho"` para `"Pendente"`; `400` se estiver vazio |

## `pedido_service.py` — pedidos

| Método | Regra |
|---|---|
| `listar_todos()` | Todos os pedidos, **exceto** os que ainda são carrinho |
| `buscar_por_id(id)` | Um pedido |
| `atualizar_status(id, data)` | Muda status e horários. Datas chegam como texto (`"2026-10-13T12:30"`) e são convertidas por `_parse_datetime` |

`AvaliacaoService.criar(data, id_pedido)` (no mesmo arquivo): só o dono avalia (para os outros o pedido "não existe": `404`), só pedido `Concluído` (`400`), nota inteira de 1 a 5 (`400`), comentário de até 500 caracteres (`400`) e uma única vez (`409`).

## `produto_service.py` — produtos

| Método | Regra |
|---|---|
| `categorias()` | Lista `CATEGORIAS` (`backend/constantes.py`) |
| `criar(data)` | Exige `nome` e `preco_atual`; a categoria, se vier, precisa estar em `CATEGORIAS` (`400`) |
| `atualizar(id, data)` | Muda só os campos enviados. Ao trocar o nome, confere a imagem **antes** de gravar e só renomeia o arquivo **depois** (banco e pasta não ficam em desacordo) |
| `deletar(id)` | Antes de apagar, copia o nome do produto para os itens de pedidos antigos e solta o vínculo, para o histórico continuar mostrando o nome; depois apaga a imagem |
| `buscar(filtros)` | Categoria, faixa de preço, ordenação e `apenas_ativos` **se combinam**. No MySQL chama a procedure `sp_produtos_buscar` (via [`repositories/`](../repositories/README.md)); nos outros bancos faz a mesma busca pelo ORM (`_buscar_orm`). Se a procedure não existir no MySQL, registra um aviso no log e usa o ORM. Os dois caminhos devolvem o mesmo formato |

Todo produto devolvido pelo service traz `imagem_url` (o endereço da imagem, ou `null`).

## `imagem_service.py` — imagens

O nome do arquivo vem do nome do produto: "Suco de Laranja" → `arquivos/suco-de-laranja-imagem.png` (sem acentos, minúsculo, com hífens).

| Função | O que faz |
|---|---|
| `salvar_imagem(produto, arquivo)` | Aceita PNG, JPG ou WEBP até 5 MB, corrige a rotação da foto e salva como PNG |
| `url_imagem(id, nome)` | Endereço da imagem, ou `None` se o arquivo não existe |
| `verificar_renomeacao(produto, novo_nome)` | Confere se a imagem pode ser renomeada, sem mexer em nada (chamada antes de gravar o nome no banco) |
| `renomear_imagem(nome_antigo, novo_nome)` | Renomeia o arquivo (chamada depois de gravar o nome no banco) |
| `remover_imagem(nome)` | Apaga o arquivo; usada ao excluir o produto |
| `verificar_nome_disponivel(...)` | Impede dois produtos que gerariam o mesmo nome de arquivo (ex.: "Suco" e "suco!") |
| `nome_imagem(nome)` | Gera o nome do arquivo a partir do nome do produto |
