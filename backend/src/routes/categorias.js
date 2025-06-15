const express = require('express');
const router = express.Router();

const categoriasController = require('../controllers/categoriasController');
const { validateCategoria, validateId } = require('../middleware/validation');
const { apiRateLimiter } = require('../middleware/rateLimiter');

// Aplicar rate limiting para todas as rotas de categorias
router.use(apiRateLimiter);

/**
 * @route   GET /api/categorias
 * @desc    Listar todas as categorias
 * @access  Public
 */
router.get('/', categoriasController.getAllCategorias);

/**
 * @route   GET /api/categorias/stats
 * @desc    Obter estatísticas das categorias
 * @access  Public
 */
router.get('/stats', categoriasController.getCategoriaStats);

/**
 * @route   GET /api/categorias/:id
 * @desc    Buscar categoria por ID
 * @access  Public
 */
router.get('/:id', validateId, categoriasController.getCategoriaById);

/**
 * @route   POST /api/categorias
 * @desc    Criar nova categoria
 * @access  Public
 */
router.post('/', validateCategoria, categoriasController.createCategoria);

/**
 * @route   PUT /api/categorias/:id
 * @desc    Atualizar categoria
 * @access  Public
 */
router.put('/:id', validateId, validateCategoria, categoriasController.updateCategoria);

/**
 * @route   DELETE /api/categorias/:id
 * @desc    Deletar categoria
 * @access  Public
 */
router.delete('/:id', validateId, categoriasController.deleteCategoria);

module.exports = router; 