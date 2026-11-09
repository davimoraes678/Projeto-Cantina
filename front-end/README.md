# front-end/

As telas do sistema, feitas com HTML, [Bootstrap 5.3](https://getbootstrap.com/docs/5.3/) e JavaScript. O Flask serve esta pasta em `/front-end/...` e o cardápio em `/`.

| Página | Login | O que tem |
|---|---|---|
| `index.html` | Sim | Cardápio: categorias, filtros, combos mais pedidos e os produtos. Tocar num produto abre os detalhes. O carrinho abre num painel lateral |
| `login.html` | | Entrar |
| `cadastro.html` | | Criar conta |
| `pedidos.html` | Sim | Meus pedidos: "Em andamento" (com o código de retirada) e "Histórico" (com "Pedir de novo" e "Avaliar") |
| `carteira.html` | Sim | Saldo e recarga |
| `conta.html` | Sim | Perfil: dados, atalhos, editar dados, sair e excluir a conta |
| `admin.html` | Admin ou mestre | Pedidos em duas colunas ("Em preparo" e "Prontos para retirar"), que se atualizam a cada 15 s, e o histórico. O mestre vê também Produtos e Alunos |

| Pasta / arquivo | O que tem |
|---|---|
| [`js/`](js/README.md) | Um JavaScript por página e o `comum.js` |
| `css/style.css` | Só as cores da cantina por cima do Bootstrap |
| `assets/` | Logo |

## Layout

- **Celular e tablet** (até 991px): barra de navegação embaixo, como num app.
- **Computador** (a partir de 992px): os mesmos links ficam na barra de cima. O admin tem menu lateral e tudo um pouco maior, para usar no balcão.
- O que é só de admin ou mestre usa as classes `so-admin` e `so-mestre` e começa escondido. O `comum.js` mostra conforme o perfil. Quem bloqueia de verdade é o back-end.

## Bootstrap e ícones

- O Bootstrap 5.3.8 vem do CDN jsDelivr. Antes de escrever CSS, use as classes prontas dele (`mb-3`, `row`, `d-flex`...).
- Os ícones são SVGs do [Google Fonts](https://fonts.google.com/icons) colados direto no HTML, com `class="icone"` e `fill="currentColor"`. Não há fonte de ícones para carregar.

## Cuidados

- Abra o site pelo Flask (`http://127.0.0.1:5000`), não com duplo clique no arquivo. Senão o login não funciona.
- Use caminhos absolutos (`/front-end/css/style.css`), porque o cardápio é aberto em `/`.
- Os `id` dos elementos são usados pelo JS. Ao renomear um `id` no HTML, troque também no `.js` da página.
