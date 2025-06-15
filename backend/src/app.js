const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares básicos
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware para confiar no proxy (para rate limiting por IP)
app.set('trust proxy', 1);

// Importar middlewares
const { apiRateLimiter } = require('./middleware/rateLimiter');

// Aplicar rate limiting global
app.use('/api', apiRateLimiter);

// Importar rotas
const gastosRoutes = require('./routes/gastos');
const categoriasRoutes = require('./routes/categorias');
const metasRoutes = require('./routes/metas');

// Rota de health check (sem rate limiting)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CashLog Backend está funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Usar rotas da API
app.use('/api/gastos', gastosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/metas', metasRoutes);

// Rota para documentação da API
app.get('/api', (req, res) => {
  res.json({
    name: 'CashLog API',
    version: '1.0.0',
    description: 'API para controle de gastos pessoais',
    endpoints: {
      health: '/api/health',
      gastos: '/api/gastos',
      categorias: '/api/categorias',
      metas: '/api/metas'
    },
    documentation: {
      gastos: {
        'GET /api/gastos': 'Listar todos os gastos (com filtros opcionais)',
        'GET /api/gastos/stats': 'Obter estatísticas dos gastos',
        'GET /api/gastos/:id': 'Buscar gasto por ID',
        'POST /api/gastos': 'Criar novo gasto',
        'PUT /api/gastos/:id': 'Atualizar gasto',
        'DELETE /api/gastos/:id': 'Deletar gasto'
      },
      categorias: {
        'GET /api/categorias': 'Listar todas as categorias',
        'GET /api/categorias/stats': 'Obter estatísticas das categorias',
        'GET /api/categorias/:id': 'Buscar categoria por ID',
        'POST /api/categorias': 'Criar nova categoria',
        'PUT /api/categorias/:id': 'Atualizar categoria',
        'DELETE /api/categorias/:id': 'Deletar categoria'
      },
      metas: {
        'GET /api/metas': 'Listar todas as metas',
        'GET /api/metas/progresso': 'Obter progresso das metas',
        'GET /api/metas/:id': 'Buscar meta por ID',
        'POST /api/metas': 'Criar nova meta',
        'PUT /api/metas/:id': 'Atualizar meta',
        'PUT /api/metas/:id/toggle': 'Ativar/Desativar meta',
        'DELETE /api/metas/:id': 'Deletar meta'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err.stack);
  
  // Erro de validação do JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'JSON inválido',
      message: 'Verifique a sintaxe do JSON enviado'
    });
  }
  
  res.status(500).json({ 
    success: false,
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado no servidor',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Rota não encontrada',
    message: `Endpoint ${req.method} ${req.originalUrl} não existe`,
    availableEndpoints: {
      health: 'GET /api/health',
      gastos: 'GET|POST /api/gastos',
      categorias: 'GET|POST /api/categorias', 
      metas: 'GET|POST /api/metas'
    }
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor CashLog rodando na porta ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 API Docs: http://localhost:${PORT}/api`);
  console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⚡ Timestamp: ${new Date().toISOString()}`);
}); 