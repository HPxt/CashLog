const metasService = require('../services/metasService');

/**
 * Listar todas as metas
 */
const getAllMetas = async (req, res) => {
  try {
    const metas = await metasService.getAllMetas();
    
    res.json({
      success: true,
      data: metas,
      count: metas.length
    });
  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar as metas'
    });
  }
};

/**
 * Buscar meta por ID
 */
const getMetaById = async (req, res) => {
  try {
    const { id } = req.params;
    const meta = await metasService.getMetaById(id);
    
    if (!meta) {
      return res.status(404).json({
        success: false,
        error: 'Meta não encontrada',
        message: `Meta com ID ${id} não existe`
      });
    }
    
    res.json({
      success: true,
      data: meta
    });
  } catch (error) {
    console.error('Erro ao buscar meta:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar a meta'
    });
  }
};

/**
 * Criar nova meta
 */
const createMeta = async (req, res) => {
  try {
    const { nome, valor_objetivo, categoria_id, data_limite } = req.body;
    
    const novaMeta = await metasService.createMeta({
      nome: nome.trim(),
      valor_objetivo: parseFloat(valor_objetivo),
      categoria_id: categoria_id ? parseInt(categoria_id) : null,
      data_limite: data_limite || null
    });
    
    res.status(201).json({
      success: true,
      data: novaMeta,
      message: 'Meta criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar meta:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível criar a meta'
    });
  }
};

/**
 * Atualizar meta
 */
const updateMeta = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, valor_objetivo, categoria_id, data_limite, ativa } = req.body;
    
    const dadosAtualizacao = {};
    
    if (nome !== undefined) dadosAtualizacao.nome = nome.trim();
    if (valor_objetivo !== undefined) dadosAtualizacao.valor_objetivo = parseFloat(valor_objetivo);
    if (categoria_id !== undefined) dadosAtualizacao.categoria_id = categoria_id ? parseInt(categoria_id) : null;
    if (data_limite !== undefined) dadosAtualizacao.data_limite = data_limite;
    if (ativa !== undefined) dadosAtualizacao.ativa = ativa;
    
    const metaAtualizada = await metasService.updateMeta(id, dadosAtualizacao);
    
    if (!metaAtualizada) {
      return res.status(404).json({
        success: false,
        error: 'Meta não encontrada',
        message: `Meta com ID ${id} não existe`
      });
    }
    
    res.json({
      success: true,
      data: metaAtualizada,
      message: 'Meta atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar meta:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível atualizar a meta'
    });
  }
};

/**
 * Deletar meta
 */
const deleteMeta = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sucesso = await metasService.deleteMeta(id);
    
    if (!sucesso) {
      return res.status(404).json({
        success: false,
        error: 'Meta não encontrada',
        message: `Meta com ID ${id} não existe`
      });
    }
    
    res.json({
      success: true,
      message: 'Meta deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar meta:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível deletar a meta'
    });
  }
};

/**
 * Obter progresso das metas
 */
const getProgressoMetas = async (req, res) => {
  try {
    const { categoria_id, mes, ano } = req.query;
    
    const progresso = await metasService.getProgressoMetas({
      categoria_id: categoria_id ? parseInt(categoria_id) : null,
      mes: mes ? parseInt(mes) : null,
      ano: ano ? parseInt(ano) : null
    });
    
    res.json({
      success: true,
      data: progresso
    });
  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar o progresso das metas'
    });
  }
};

/**
 * Ativar/Desativar meta
 */
const toggleMetaStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const metaAtualizada = await metasService.toggleMetaStatus(id);
    
    if (!metaAtualizada) {
      return res.status(404).json({
        success: false,
        error: 'Meta não encontrada',
        message: `Meta com ID ${id} não existe`
      });
    }
    
    res.json({
      success: true,
      data: metaAtualizada,
      message: `Meta ${metaAtualizada.ativa ? 'ativada' : 'desativada'} com sucesso`
    });
  } catch (error) {
    console.error('Erro ao alterar status da meta:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível alterar o status da meta'
    });
  }
};

module.exports = {
  getAllMetas,
  getMetaById,
  createMeta,
  updateMeta,
  deleteMeta,
  getProgressoMetas,
  toggleMetaStatus
}; 