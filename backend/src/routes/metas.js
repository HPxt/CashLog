const express = require('express');
const router = express.Router();

const metasController = require('../controllers/metasController');
const { validateMeta, validateId } = require('../middleware/validation');
const { apiRateLimiter } = require('../middleware/rateLimiter');

// Aplicar rate limiting para todas as rotas de metas
router.use(apiRateLimiter);

/**
 * @route   GET /api/metas
 * @desc    Listar todas as metas
 * @access  Public
 */
router.get('/', metasController.getAllMetas);

/**
 * @route   GET /api/metas/progresso
 * @desc    Obter progresso das metas
 * @access  Public
 */
router.get('/progresso', metasController.getProgressoMetas);

/**
 * @route   GET /api/metas/:id
 * @desc    Buscar meta por ID
 * @access  Public
 */
router.get('/:id', validateId, metasController.getMetaById);

/**
 * @route   POST /api/metas
 * @desc    Criar nova meta
 * @access  Public
 */
router.post('/', validateMeta, metasController.createMeta);

/**
 * @route   PUT /api/metas/:id
 * @desc    Atualizar meta
 * @access  Public
 */
router.put('/:id', validateId, metasController.updateMeta);

/**
 * @route   PUT /api/metas/:id/toggle
 * @desc    Ativar/Desativar meta
 * @access  Public
 */
router.put('/:id/toggle', validateId, metasController.toggleMetaStatus);

/**
 * @route   DELETE /api/metas/:id
 * @desc    Deletar meta
 * @access  Public
 */
router.delete('/:id', validateId, metasController.deleteMeta);

module.exports = router; 