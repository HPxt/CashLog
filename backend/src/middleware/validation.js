/**
 * Middleware de validação para gastos
 */
const validateGasto = (req, res, next) => {
  const { valor, descricao, categoria_id } = req.body;
  const errors = [];

  // Validar valor
  if (!valor) {
    errors.push('Valor é obrigatório');
  } else if (isNaN(valor) || parseFloat(valor) <= 0) {
    errors.push('Valor deve ser um número positivo');
  }

  // Validar descrição
  if (!descricao || descricao.trim().length === 0) {
    errors.push('Descrição é obrigatória');
  } else if (descricao.trim().length > 255) {
    errors.push('Descrição deve ter no máximo 255 caracteres');
  }

  // Validar categoria_id
  if (!categoria_id) {
    errors.push('Categoria é obrigatória');
  } else if (isNaN(categoria_id) || parseInt(categoria_id) <= 0) {
    errors.push('ID da categoria deve ser um número positivo');
  }

  // Validar data (opcional)
  if (req.body.data) {
    const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dataRegex.test(req.body.data)) {
      errors.push('Data deve estar no formato YYYY-MM-DD');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Dados de entrada inválidos',
      messages: errors
    });
  }

  next();
};

/**
 * Middleware de validação para metas
 */
const validateMeta = (req, res, next) => {
  const { nome, valor_objetivo, categoria_id } = req.body;
  const errors = [];

  // Validar nome
  if (!nome || nome.trim().length === 0) {
    errors.push('Nome da meta é obrigatório');
  } else if (nome.trim().length > 100) {
    errors.push('Nome deve ter no máximo 100 caracteres');
  }

  // Validar valor_objetivo
  if (!valor_objetivo) {
    errors.push('Valor objetivo é obrigatório');
  } else if (isNaN(valor_objetivo) || parseFloat(valor_objetivo) <= 0) {
    errors.push('Valor objetivo deve ser um número positivo');
  }

  // Validar categoria_id (opcional)
  if (categoria_id && (isNaN(categoria_id) || parseInt(categoria_id) <= 0)) {
    errors.push('ID da categoria deve ser um número positivo');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Dados de entrada inválidos',
      messages: errors
    });
  }

  next();
};

/**
 * Middleware de validação para categoria
 */
const validateCategoria = (req, res, next) => {
  const { nome } = req.body;
  const errors = [];

  // Validar nome
  if (!nome || nome.trim().length === 0) {
    errors.push('Nome da categoria é obrigatório');
  } else if (nome.trim().length > 50) {
    errors.push('Nome deve ter no máximo 50 caracteres');
  }

  // Validar cor (opcional)
  if (req.body.cor) {
    const corRegex = /^#[0-9A-F]{6}$/i;
    if (!corRegex.test(req.body.cor)) {
      errors.push('Cor deve estar no formato hexadecimal (#FFFFFF)');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Dados de entrada inválidos',
      messages: errors
    });
  }

  next();
};

/**
 * Middleware para validar parâmetros de ID
 */
const validateId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || isNaN(id) || parseInt(id) <= 0) {
    return res.status(400).json({
      error: 'ID inválido',
      message: 'ID deve ser um número positivo'
    });
  }

  req.params.id = parseInt(id);
  next();
};

module.exports = {
  validateGasto,
  validateMeta,
  validateCategoria,
  validateId
}; 