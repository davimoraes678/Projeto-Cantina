// Requer o Flask em http://127.0.0.1:5000 com banco exclusivo de testes.
// Execução: node tests/frontend.cjs (Playwright instalado).
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({headless:true});
 const page = await browser.newPage({viewport:{width:390,height:844}});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 const base='http://127.0.0.1:5000';
 async function post(path,data){const r=await page.request.post(base+'/api/'+path,{data});assert.equal(r.status(),201);return r.json();}
 const aluno=await post('alunos',{nome:'Aluno teste',email:`teste${Date.now()}@example.com`,senha:'teste123'});
 const produto=await post('produtos',{nome:'Coxinha',preco_atual:7.5,quantidade_estoque:3,categoria:'Lanche'});
 await post('produtos',{nome:'Sem estoque',preco_atual:4,quantidade_estoque:0,categoria:'Doce'});
 await page.goto(base);
 await page.getByRole('button',{name:'Adicionar Coxinha',exact:true}).click();
 await page.getByRole('button',{name:'Doces',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'Adicionar Sem estoque'}).isDisabled(),true);
 await page.goto(base+'/cart.html');
 await page.locator('#aluno').selectOption(String(aluno.id_aluno));
 await page.getByRole('button',{name:'Aumentar quantidade'}).click();
 assert.match(await page.locator('#totalCarrinho').textContent(),/15,00/);
 await page.locator('#horario').fill('2027-01-10T12:00');
 await page.getByRole('button',{name:'Confirmar Pedido'}).click();
 await page.waitForURL('**/order-status.html?id=*');
 await page.locator('.kitchen-codigo').waitFor();
 const id=new URL(page.url()).searchParams.get('id');
 const pedido=await (await page.request.get(base+'/api/pedidos/'+id)).json();
 assert.equal(pedido.id_aluno,aluno.id_aluno); assert.equal(pedido.valor_total,15);
 assert.equal(pedido.itens[0].id_produto,produto.id_produto); assert.equal(pedido.itens[0].quantidade,2);
 assert.equal(pedido.horario_agendado_retirada,'2027-01-10T12:00:00');
 assert.equal(await page.evaluate(()=>localStorage.getItem('projeto-cantina:carrinho:v1')),'[]');
 await page.goto(base+'/orders.html'); await page.locator('#aluno').selectOption(String(aluno.id_aluno));
 await page.getByText('Pedido #'+id,{exact:true}).waitFor();
 await page.goto(base+'/gestao.html'); await page.locator('#tabela-alunos tr').first().waitFor();
 await page.goto(base); await page.locator('.food-card').first().waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
 await page.setViewportSize({width:1280,height:900});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
 assert.deepEqual(errors,[]); await browser.close(); console.log('PASS: cardápio, filtros, estoque, carrinho, pedido, retirada, listagem, gestão e responsividade.');
})().catch(e=>{console.error(e);process.exit(1)});
