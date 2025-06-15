const express = require('express');
const router = express.Router();
const gastosController = require('../controllers/gastosController');

// GET /api/gastos/estatisticas - deve vir antes de /:id
router.get('/estatisticas', gastosController.obterEstatisticas);

// GET /api/gastos - Listar gastos com filtros opcionais
router.get('/', gastosController.listarGastos);

// GET /api/gastos/:id - Buscar gasto específico
router.get('/:id', gastosController.buscarGasto);

// POST /api/gastos - Criar novo gasto
router.post('/', gastosController.criarGasto);

// PUT /api/gastos/:id - Atualizar gasto
router.put('/:id', gastosController.atualizarGasto);

// DELETE /api/gastos/:id - Deletar gasto
router.delete('/:id', gastosController.deletarGasto);

module.exports = router; 