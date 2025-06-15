const { body, param, query, validationResult } = require('express-validator');

/**
 * 🔍 VALIDAÇÃO AVANÇADA COM EXPRESS-VALIDATOR
 */

/**
 * Middleware para processar resultados de validação
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    return res.status(400).json({
      success: false,
      error: 'Dados de entrada inválidos',
      details: formattedErrors,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Validações para gastos
 */
const validateGasto = [
  body('descricao')
    .notEmpty()
    .withMessage('Descrição é obrigatória')
    .isLength({ min: 3, max: 255 })
    .withMessage('Descrição deve ter entre 3 e 255 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ0-9\s\-.,!?()]+$/)
    .withMessage('Descrição contém caracteres inválidos'),

  body('valor')
    .isFloat({ min: 0.01, max: 999999.99 })
    .withMessage('Valor deve ser um número positivo entre 0.01 e 999999.99')
    .custom(value => {
      // Validar máximo 2 casas decimais
      const decimalPlaces = (value.toString().split('.')[1] || '').length;
      if (decimalPlaces > 2) {
        throw new Error('Valor deve ter no máximo 2 casas decimais');
      }
      return true;
    }),

  body('data')
    .isISO8601()
    .withMessage('Data deve estar no formato ISO 8601 (YYYY-MM-DD)')
    .custom(value => {
      const date = new Date(value);
      const now = new Date();
      
      // Não permitir datas futuras (mais de 1 dia)
      if (date > new Date(now.getTime() + 24 * 60 * 60 * 1000)) {
        throw new Error('Data não pode ser mais de 1 dia no futuro');
      }
      
      // Não permitir datas muito antigas (mais de 10 anos)
      const tenYearsAgo = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
      if (date < tenYearsAgo) {
        throw new Error('Data não pode ser anterior a 10 anos');
      }
      
      return true;
    }),

  body('categoria_id')
    .isInt({ min: 1 })
    .withMessage('ID da categoria deve ser um número inteiro positivo'),

  body('observacoes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Observações devem ter no máximo 500 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ0-9\s\-.,!?()]*$/)
    .withMessage('Observações contêm caracteres inválidos'),

  handleValidationErrors
];

/**
 * Validações para metas
 */
const validateMeta = [
  body('nome')
    .notEmpty()
    .withMessage('Nome da meta é obrigatório')
    .isLength({ min: 3, max: 100 })
    .withMessage('Nome deve ter entre 3 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ0-9\s\-.,!?()]+$/)
    .withMessage('Nome contém caracteres inválidos'),

  body('valor_objetivo')
    .isFloat({ min: 1, max: 999999.99 })
    .withMessage('Valor objetivo deve ser um número positivo entre 1 e 999999.99'),

  body('data_inicio')
    .isISO8601()
    .withMessage('Data de início deve estar no formato ISO 8601'),

  body('data_fim')
    .isISO8601()
    .withMessage('Data de fim deve estar no formato ISO 8601')
    .custom((value, { req }) => {
      const dataInicio = new Date(req.body.data_inicio);
      const dataFim = new Date(value);
      
      if (dataFim <= dataInicio) {
        throw new Error('Data de fim deve ser posterior à data de início');
      }
      
      // Verificar se a meta não é muito longa (máximo 5 anos)
      const diffYears = (dataFim - dataInicio) / (365 * 24 * 60 * 60 * 1000);
      if (diffYears > 5) {
        throw new Error('Meta não pode durar mais de 5 anos');
      }
      
      return true;
    }),

  body('categoria_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID da categoria deve ser um número inteiro positivo'),

  body('descricao')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres'),

  handleValidationErrors
];

/**
 * Validações para categorias
 */
const validateCategoria = [
  body('nome')
    .notEmpty()
    .withMessage('Nome da categoria é obrigatório')
    .isLength({ min: 2, max: 50 })
    .withMessage('Nome deve ter entre 2 e 50 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ0-9\s\-&]+$/)
    .withMessage('Nome contém caracteres inválidos'),

  body('cor')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Cor deve estar no formato hexadecimal (#FFFFFF)'),

  body('icone')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Ícone deve ter entre 1 e 50 caracteres')
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage('Ícone contém caracteres inválidos'),

  handleValidationErrors
];

/**
 * Validação para parâmetros de ID
 */
const validateId = [
  param('id')
    .isInt({ min: 1, max: 2147483647 })
    .withMessage('ID deve ser um número inteiro positivo válido'),
  
  handleValidationErrors
];

/**
 * Validações para query parameters
 */
const validateQueryParams = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1, max: 10000 })
      .withMessage('Página deve ser um número entre 1 e 10000'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite deve ser um número entre 1 e 100'),
    
    handleValidationErrors
  ],

  dateRange: [
    query('data_inicio')
      .optional()
      .isISO8601()
      .withMessage('Data início deve estar no formato ISO 8601'),
    
    query('data_fim')
      .optional()
      .isISO8601()
      .withMessage('Data fim deve estar no formato ISO 8601')
      .custom((value, { req }) => {
        if (req.query.data_inicio) {
          const inicio = new Date(req.query.data_inicio);
          const fim = new Date(value);
          
          if (fim <= inicio) {
            throw new Error('Data fim deve ser posterior à data início');
          }
          
          // Máximo de 2 anos de range
          const diffYears = (fim - inicio) / (365 * 24 * 60 * 60 * 1000);
          if (diffYears > 2) {
            throw new Error('Período não pode ser superior a 2 anos');
          }
        }
        return true;
      }),
    
    handleValidationErrors
  ],

  search: [
    query('q')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Termo de busca deve ter entre 1 e 100 caracteres')
      .matches(/^[a-zA-ZÀ-ÿ0-9\s\-.,!?()]+$/)
      .withMessage('Termo de busca contém caracteres inválidos'),
    
    handleValidationErrors
  ]
};

/**
 * Validação específica para relatórios
 */
const validateReportParams = [
  query('tipo')
    .optional()
    .isIn(['mensal', 'semanal', 'anual', 'periodo'])
    .withMessage('Tipo deve ser: mensal, semanal, anual ou periodo'),

  query('categoria_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID da categoria deve ser um número positivo'),

  query('formato')
    .optional()
    .isIn(['json', 'csv', 'pdf'])
    .withMessage('Formato deve ser: json, csv ou pdf'),

  ...validateQueryParams.dateRange
];

/**
 * Sanitização adicional de dados
 */
const sanitizeData = (req, res, next) => {
  // Função de sanitização recursiva
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj
        .trim()
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove caracteres de controle
        .replace(/\s+/g, ' '); // Normaliza espaços
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  
  next();
};

/**
 * Validação de schema completo para diferentes operações
 */
const validateSchema = {
  createGasto: [...validateGasto],
  updateGasto: [
    ...validateGasto.slice(0, -1), // Remove handleValidationErrors
    body('id').optional().isInt({ min: 1 }),
    handleValidationErrors
  ],
  createMeta: [...validateMeta],
  updateMeta: [
    ...validateMeta.slice(0, -1),
    body('ativo').optional().isBoolean(),
    handleValidationErrors
  ],
  createCategoria: [...validateCategoria],
  updateCategoria: [...validateCategoria]
};

module.exports = {
  validateGasto,
  validateMeta,
  validateCategoria,
  validateId,
  validateQueryParams,
  validateReportParams,
  validateSchema,
  sanitizeData,
  handleValidationErrors
}; 