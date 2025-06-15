const express = require('express');
require('dotenv').config();

const app = express();

// Configurações de segurança
app.set('trust proxy', 1); // Para rate limiting e logs corretos
app.disable('x-powered-by'); // Remover header que expõe tecnologia

// Importar middlewares de segurança
const { 
  helmetConfig, 
  rateLimiters, 
  speedLimiter, 
  securityLogger, 
  sanitizeInput, 
  attackDetection,
  secureCors 
} = require('./middleware/security');
const { auditMiddleware, loginAttemptLogger } = require('./middleware/audit');
const { sanitizeData } = require('./middleware/advancedValidation');

// 🛡️ APLICAR MIDDLEWARES DE SEGURANÇA (ORDEM IMPORTANTE!)

// 1. Headers de segurança (Helmet)
app.use(helmetConfig);

// 2. CORS seguro
app.use(secureCors);

// 3. Logging de segurança
app.use(securityLogger);

// 4. Auditoria de requisições
app.use(auditMiddleware);

// 5. Rate limiting e slow down
app.use(speedLimiter);
app.use('/api', rateLimiters.general);

// 6. Parsing de dados com limites seguros
app.use(express.json({ 
  limit: '1mb', // Reduzido de 10mb para 1mb
  strict: true,
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '1mb',
  parameterLimit: 100 // Máximo de 100 parâmetros
}));

// 7. Sanitização de dados
app.use(sanitizeData);
app.use(sanitizeInput);

// 8. Detecção de ataques
app.use(attackDetection);

// 9. Login attempt logging
app.use(loginAttemptLogger);

// Importar rotas
const gastosRoutes = require('./routes/gastos');
const categoriasRoutes = require('./routes/categorias');
const metasRoutes = require('./routes/metas');
const securityRoutes = require('./routes/security');

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
app.use('/api/security', securityRoutes);

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
      metas: '/api/metas',
      security: '/api/security'
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
      },
      security: {
        'GET /api/security/health': 'Health check de segurança',
        'GET /api/security/report': 'Relatório de segurança (24h)',
        'GET /api/security/audit-logs': 'Logs de auditoria',
        'GET /api/security/events': 'Eventos de segurança',
        'GET /api/security/performance': 'Logs de performance',
        'GET /api/security/stats': 'Estatísticas de segurança',
        'POST /api/security/clear-logs': 'Limpar logs (dev only)'
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