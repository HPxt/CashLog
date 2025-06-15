const categoriasService = require('../services/categoriasService');

/**
 * Listar todas as categorias
 */
const getAllCategorias = async (req, res) => {
  try {
    const categorias = await categoriasService.getAllCategorias();
    
    res.json({
      success: true,
      data: categorias,
      count: categorias.length
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar as categorias'
    });
  }
};

/**
 * Buscar categoria por ID
 */
const getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await categoriasService.getCategoriaById(id);
    
    if (!categoria) {
      return res.status(404).json({
        success: false,
        error: 'Categoria não encontrada',
        message: `Categoria com ID ${id} não existe`
      });
    }
    
    res.json({
      success: true,
      data: categoria
    });
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar a categoria'
    });
  }
};

/**
 * Criar nova categoria
 */
const createCategoria = async (req, res) => {
  try {
    const { nome, cor, icone } = req.body;
    
    const novaCategoria = await categoriasService.createCategoria({
      nome: nome.trim(),
      cor: cor || '#6B7280',
      icone: icone || 'other'
    });
    
    res.status(201).json({
      success: true,
      data: novaCategoria,
      message: 'Categoria criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    
    if (error.message.includes('já existe')) {
      return res.status(400).json({
        success: false,
        error: 'Categoria já existe',
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível criar a categoria'
    });
  }
};

/**
 * Atualizar categoria
 */
const updateCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cor, icone } = req.body;
    
    const categoriaAtualizada = await categoriasService.updateCategoria(id, {
      nome: nome?.trim(),
      cor,
      icone
    });
    
    if (!categoriaAtualizada) {
      return res.status(404).json({
        success: false,
        error: 'Categoria não encontrada',
        message: `Categoria com ID ${id} não existe`
      });
    }
    
    res.json({
      success: true,
      data: categoriaAtualizada,
      message: 'Categoria atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    
    if (error.message.includes('já existe')) {
      return res.status(400).json({
        success: false,
        error: 'Nome já existe',
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível atualizar a categoria'
    });
  }
};

/**
 * Deletar categoria
 */
const deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    
    const resultado = await categoriasService.deleteCategoria(id);
    
    if (!resultado.success) {
      return res.status(400).json({
        success: false,
        error: resultado.error,
        message: resultado.message
      });
    }
    
    res.json({
      success: true,
      message: 'Categoria deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível deletar a categoria'
    });
  }
};

/**
 * Obter estatísticas das categorias
 */
const getCategoriaStats = async (req, res) => {
  try {
    const stats = await categoriasService.getCategoriaStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar as estatísticas'
    });
  }
};

module.exports = {
  getAllCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  getCategoriaStats
}; 