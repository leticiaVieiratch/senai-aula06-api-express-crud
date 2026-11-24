/**
 * DevPulse Notes API - Servidor Express RESTful
 * 
 * Disciplina: Frameworks Front-End
 * Professor: Me. Deivison S. Takatu
 * Instituição: SENAI
 * Referência: Aula 05 - Criando APIs para o Front-End
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

// ==========================================
// 1. CONFIGURAÇÃO DE MIDDLEWARES
// ==========================================

// Middleware de CORS para permitir requisições de clientes front-end (Vite, React, Postman)
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para decodificação automática de JSON no corpo das requisições (Body-Parser)
app.use(express.json());

// Middleware para capturar erros de sintaxe em JSON inválido enviado pelo cliente
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      sucesso: false,
      erro: 'Payload JSON malformado. Verifique a sintaxe da requisição.',
      detalhes: err.message
    });
  }
  next();
});

// Middleware de Logging de requisições no console com timestamp e tempo de resposta
app.use((req, res, next) => {
  const inicio = Date.now();
  res.on('finish', () => {
    const duracao = Date.now() - inicio;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> Status: ${res.statusCode} (${duracao}ms)`);
  });
  next();
});

// ==========================================
// 2. FUNÇÕES AUXILIARES DE PERSISTÊNCIA (fs/promises)
// ==========================================

/**
 * Lê de forma assíncrona o arquivo data.json.
 * Se o arquivo não existir, cria-o com um array vazio.
 * @returns {Promise<Array>} Array de notas
 */
async function lerDados() {
  try {
    const conteudo = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(conteudo);
  } catch (erro) {
    if (erro.code === 'ENOENT') {
      const dadosIniciais = [];
      await fs.writeFile(DATA_FILE, JSON.stringify(dadosIniciais, null, 2), 'utf-8');
      return dadosIniciais;
    }
    throw erro;
  }
}

/**
 * Grava de forma assíncrona o array atualizado no data.json.
 * @param {Array} dados Array de notas para persistir
 * @returns {Promise<void>}
 */
async function salvarDados(dados) {
  await fs.writeFile(DATA_FILE, JSON.stringify(dados, null, 2), 'utf-8');
}

// ==========================================
// 3. ROTAS DE INFORMAÇÃO E HEALTH CHECK
// ==========================================

/**
 * Rota Raiz: Apresentação da API e documentação resumida dos endpoints
 * GET /
 */
app.get('/', (req, res) => {
  res.status(200).json({
    projeto: 'DevPulse Notes API',
    disciplina: 'Frameworks Front-End',
    professor: 'Me. Deivison S. Takatu',
    instituicao: 'SENAI',
    versao: '1.0.0',
    status: 'ONLINE',
    documentacao_endpoints: {
      'GET /api/notes': 'Lista todas as notas. Suporta query params ?categoria=... e ?busca=...',
      'GET /api/notes/:id': 'Recupera detalhes de uma nota específica pelo ID',
      'POST /api/notes': 'Cadastra uma nova nota. Requer { titulo, conteudo, categoria? }',
      'PUT /api/notes/:id': 'Atualiza uma nota existente. Requer { titulo?, conteudo?, categoria? }',
      'DELETE /api/notes/:id': 'Exclui uma nota existente pelo ID',
      'GET /api/health': 'Verificação de integridade e métricas do servidor'
    }
  });
});

/**
 * Rota de Health Check: Usada por ferramentas de monitoramento e serviços em nuvem (Render/Vercel)
 * GET /api/health
 */
app.get('/api/health', async (req, res) => {
  try {
    const notas = await lerDados();
    res.status(200).json({
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      totalNotasArmazenadas: notas.length,
      memoria: process.memoryUsage()
    });
  } catch (erro) {
    res.status(500).json({
      status: 'DOWN',
      erro: erro.message
    });
  }
});

// ==========================================
// 4. ENDPOINTS CRUD DA ENTIDADE NOTAS (/api/notes)
// ==========================================

/**
 * ROTA 1: Listar todas as notas (com suporte a filtros por busca e categoria)
 * GET /api/notes
 * Query params: ?categoria=... & ?busca=...
 */
app.get('/api/notes', async (req, res) => {
  try {
    const { categoria, busca } = req.query;
    let notas = await lerDados();

    // Filtro por categoria exata se informado
    if (categoria && categoria.trim() !== '') {
      notas = notas.filter(n => n.categoria.toLowerCase() === categoria.trim().toLowerCase());
    }

    // Filtro por termo de busca no título ou no conteúdo
    if (busca && busca.trim() !== '') {
      const termo = busca.trim().toLowerCase();
      notas = notas.filter(n => 
        n.titulo.toLowerCase().includes(termo) || 
        n.conteudo.toLowerCase().includes(termo)
      );
    }

    res.status(200).json({
      sucesso: true,
      total: notas.length,
      dados: notas
    });
  } catch (erro) {
    console.error('Erro ao ler notas:', erro);
    res.status(500).json({
      sucesso: false,
      erro: 'Falha interna do servidor ao carregar notas.',
      detalhes: erro.message
    });
  }
});

/**
 * ROTA 2: Obter nota por ID
 * GET /api/notes/:id
 */
app.get('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const notas = await lerDados();
    const nota = notas.find(n => n.id === id);

    if (!nota) {
      return res.status(404).json({
        sucesso: false,
        erro: `Nota com identificador '${id}' não encontrada.`
      });
    }

    res.status(200).json({
      sucesso: true,
      dados: nota
    });
  } catch (erro) {
    res.status(500).json({
      sucesso: false,
      erro: 'Falha interna ao buscar nota por ID.',
      detalhes: erro.message
    });
  }
});

/**
 * ROTA 3: Criar nova nota
 * POST /api/notes
 * Payload esperado: { titulo: string, conteudo: string, categoria?: string }
 */
app.post('/api/notes', async (req, res) => {
  try {
    const { titulo, conteudo, categoria } = req.body;

    // Validações de entrada de dados
    if (!titulo || typeof titulo !== 'string' || titulo.trim().length < 3) {
      return res.status(400).json({
        sucesso: false,
        erro: 'O campo "titulo" é obrigatório e deve conter no mínimo 3 caracteres.'
      });
    }

    if (!conteudo || typeof conteudo !== 'string' || conteudo.trim().length < 3) {
      return res.status(400).json({
        sucesso: false,
        erro: 'O campo "conteudo" é obrigatório e deve conter no mínimo 3 caracteres.'
      });
    }

    const notas = await lerDados();
    const novaNota = {
      id: Date.now().toString(),
      titulo: titulo.trim(),
      conteudo: conteudo.trim(),
      categoria: (categoria && typeof categoria === 'string' && categoria.trim() !== '') 
        ? categoria.trim() 
        : 'Geral',
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString()
    };

    notas.unshift(novaNota);
    await salvarDados(notas);

    // Retorna HTTP 201 Created conforme a especificação REST
    res.status(201).json({
      sucesso: true,
      mensagem: 'Nota criada com sucesso!',
      dados: novaNota
    });
  } catch (erro) {
    res.status(500).json({
      sucesso: false,
      erro: 'Falha interna ao criar nota.',
      detalhes: erro.message
    });
  }
});

/**
 * ROTA 4: Atualizar nota existente
 * PUT /api/notes/:id
 * Payload esperado: { titulo?: string, conteudo?: string, categoria?: string }
 */
app.put('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, conteudo, categoria } = req.body;

    const notas = await lerDados();
    const indice = notas.findIndex(n => n.id === id);

    if (indice === -1) {
      return res.status(404).json({
        sucesso: false,
        erro: `Não foi possível atualizar: nota com ID '${id}' inexistente.`
      });
    }

    // Se fornecidos, valida os dados
    if (titulo !== undefined && (typeof titulo !== 'string' || titulo.trim().length < 3)) {
      return res.status(400).json({
        sucesso: false,
        erro: 'O campo "titulo", se fornecido, deve conter pelo menos 3 caracteres.'
      });
    }

    if (conteudo !== undefined && (typeof conteudo !== 'string' || conteudo.trim().length < 3)) {
      return res.status(400).json({
        sucesso: false,
        erro: 'O campo "conteudo", se fornecido, deve conter pelo menos 3 caracteres.'
      });
    }

    // Atualização parcial/total mantendo integridade
    const notaAtual = notas[indice];
    const notaAtualizada = {
      ...notaAtual,
      titulo: titulo !== undefined ? titulo.trim() : notaAtual.titulo,
      conteudo: conteudo !== undefined ? conteudo.trim() : notaAtual.conteudo,
      categoria: categoria !== undefined && categoria.trim() !== '' ? categoria.trim() : notaAtual.categoria,
      dataAtualizacao: new Date().toISOString()
    };

    notas[indice] = notaAtualizada;
    await salvarDados(notas);

    res.status(200).json({
      sucesso: true,
      mensagem: 'Nota atualizada com sucesso!',
      dados: notaAtualizada
    });
  } catch (erro) {
    res.status(500).json({
      sucesso: false,
      erro: 'Falha interna ao atualizar nota.',
      detalhes: erro.message
    });
  }
});

/**
 * ROTA 5: Excluir nota por ID
 * DELETE /api/notes/:id
 */
app.delete('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const notas = await lerDados();
    const indice = notas.findIndex(n => n.id === id);

    if (indice === -1) {
      return res.status(404).json({
        sucesso: false,
        erro: `Não foi possível excluir: nota com identificador '${id}' não existe.`
      });
    }

    const [notaExcluida] = notas.splice(indice, 1);
    await salvarDados(notas);

    res.status(200).json({
      sucesso: true,
      mensagem: `Nota '${notaExcluida.titulo}' (ID: ${id}) excluída com sucesso!`,
      idExcluido: id
    });
  } catch (erro) {
    res.status(500).json({
      sucesso: false,
      erro: 'Falha interna ao excluir nota.',
      detalhes: erro.message
    });
  }
});

// ==========================================
// 5. TRATAMENTO DE ROTAS NÃO ENCONTRADAS (404)
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    sucesso: false,
    erro: `A rota solicitada [${req.method} ${req.originalUrl}] não existe nesta API.`,
    dica: 'Consulte a rota raiz GET / para ver a lista de rotas disponíveis.'
  });
});

// ==========================================
// 6. INICIALIZAÇÃO DO SERVIDOR
// ==========================================
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 DevPulse Notes API rodando com sucesso!`);
    console.log(`📍 URL Local: http://localhost:${PORT}`);
    console.log(`📚 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📝 Endpoints CRUD: http://localhost:${PORT}/api/notes`);
    console.log(`====================================================`);
  });
}

module.exports = app;
