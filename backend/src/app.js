const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CashLog Backend está funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Importar rotas quando criadas
// const gastosRoutes = require('./routes/gastos');
// const metasRoutes = require('./routes/metas');
// const categoriasRoutes = require('./routes/categorias');

// Usar rotas
// app.use('/api/gastos', gastosRoutes);
// app.use('/api/metas', metasRoutes);
// app.use('/api/categorias', categoriasRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Algo deu errado!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno do servidor'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
}); 