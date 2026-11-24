/**
 * Script de Teste Automatizado de Integração da API Express
 * Executa testes end-to-end nos endpoints CRUD sem depender de bibliotecas externas (Node 18+ fetch)
 */

const app = require('./server');

const PORT = 3099; // Porta isolada para testes

async function rodarTestes() {
  console.log('🧪 Iniciando Testes Automatizados da API DevPulse Notes...');
  const server = app.listen(PORT);

  const baseUrl = `http://localhost:${PORT}`;
  let idCriado = null;
  let totalPassados = 0;
  let totalFalhados = 0;

  function assert(condicao, descricao) {
    if (condicao) {
      console.log(`  ✅ [PASSOU] ${descricao}`);
      totalPassados++;
    } else {
      console.error(`  ❌ [FALHOU] ${descricao}`);
      totalFalhados++;
    }
  }

  try {
    // Teste 1: GET / (Raiz)
    const resRaiz = await fetch(`${baseUrl}/`);
    const jsonRaiz = await resRaiz.json();
    assert(resRaiz.status === 200, 'GET / deve retornar HTTP 200');
    assert(jsonRaiz.status === 'ONLINE', 'GET / deve conter status ONLINE');

    // Teste 2: GET /api/health
    const resHealth = await fetch(`${baseUrl}/api/health`);
    const jsonHealth = await resHealth.json();
    assert(resHealth.status === 200, 'GET /api/health deve retornar HTTP 200');
    assert(jsonHealth.status === 'UP', 'GET /api/health deve indicar status UP');

    // Teste 3: GET /api/notes (Listar todas)
    const resListar = await fetch(`${baseUrl}/api/notes`);
    const jsonListar = await resListar.json();
    assert(resListar.status === 200, 'GET /api/notes deve retornar HTTP 200');
    assert(Array.isArray(jsonListar.dados), 'GET /api/notes dados deve ser um Array');

    // Teste 4: POST /api/notes (Criação com sucesso)
    const payloadCriacao = {
      titulo: 'Nota de Teste Automatizado',
      conteudo: 'Conteúdo validando persistência assíncrona com fs/promises.',
      categoria: 'Prática'
    };
    const resCriar = await fetch(`${baseUrl}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadCriacao)
    });
    const jsonCriar = await resCriar.json();
    assert(resCriar.status === 201, 'POST /api/notes deve retornar HTTP 201 Created');
    assert(jsonCriar.sucesso === true, 'POST /api/notes deve conter sucesso=true');
    assert(jsonCriar.dados && jsonCriar.dados.id, 'POST /api/notes deve gerar um ID único');
    idCriado = jsonCriar.dados.id;

    // Teste 5: POST /api/notes (Validação de erro 400 com título curto)
    const resCriarInvalido = await fetch(`${baseUrl}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Oi', conteudo: 'Teste' })
    });
    assert(resCriarInvalido.status === 400, 'POST /api/notes com dados inválidos deve retornar HTTP 400');

    // Teste 6: GET /api/notes/:id (Buscar nota criada)
    const resBuscar = await fetch(`${baseUrl}/api/notes/${idCriado}`);
    const jsonBuscar = await resBuscar.json();
    assert(resBuscar.status === 200, `GET /api/notes/${idCriado} deve retornar HTTP 200`);
    assert(jsonBuscar.dados.titulo === payloadCriacao.titulo, 'GET /api/notes/:id deve conter os dados corretos');

    // Teste 7: PUT /api/notes/:id (Atualização com sucesso)
    const resAtualizar = await fetch(`${baseUrl}/api/notes/${idCriado}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Nota de Teste Atualizada' })
    });
    const jsonAtualizar = await resAtualizar.json();
    assert(resAtualizar.status === 200, 'PUT /api/notes/:id deve retornar HTTP 200');
    assert(jsonAtualizar.dados.titulo === 'Nota de Teste Atualizada', 'PUT deve atualizar o título');

    // Teste 8: DELETE /api/notes/:id (Exclusão com sucesso)
    const resDeletar = await fetch(`${baseUrl}/api/notes/${idCriado}`, {
      method: 'DELETE'
    });
    assert(resDeletar.status === 200, 'DELETE /api/notes/:id deve retornar HTTP 200');

    // Teste 9: GET /api/notes/:id (Validar 404 após exclusão)
    const resBuscarDeletado = await fetch(`${baseUrl}/api/notes/${idCriado}`);
    assert(resBuscarDeletado.status === 404, 'GET em nota excluída deve retornar HTTP 404 Not Found');

    // Teste 10: Rota inexistente deve retornar 404
    const resInexistente = await fetch(`${baseUrl}/api/rota-que-nao-existe`);
    assert(resInexistente.status === 404, 'Rota inexistente deve retornar HTTP 404');

    console.log(`\n📊 Resultado dos Testes: ${totalPassados} passaram, ${totalFalhados} falharam.`);
  } catch (err) {
    console.error('Erro na execução da suíte de testes:', err);
  } finally {
    server.close();
  }
}

rodarTestes();
