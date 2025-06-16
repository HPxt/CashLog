const { body, param } = require('express-validator');

/**
 * 🔐 VALIDAÇÕES DE AUTENTICAÇÃO
 * Validações robustas para todos os endpoints de auth
 */

// Validação para registro
const validateRegister = [
  body('nome')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nome deve conter apenas letras e espaços'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email deve ter um formato válido')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email deve ter no máximo 255 caracteres'),
  
  body('senha')
    .isLength({ min: 8, max: 128 })
    .withMessage('Senha deve ter entre 8 e 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Senha deve conter: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'),
  
  body('confirmarSenha')
    .custom((value, { req }) => {
      if (value !== req.body.senha) {
        throw new Error('Confirmação de senha não confere');
      }
      return true;
    })
];

// Validação para login
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email deve ter um formato válido')
    .normalizeEmail(),
  
  body('senha')
    .notEmpty()
    .withMessage('Senha é obrigatória')
    .isLength({ min: 1, max: 128 })
    .withMessage('Senha inválida')
];

// Validação para forgot password
const validateForgotPassword = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email deve ter um formato válido')
    .normalizeEmail()
];

// Validação para reset password
const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Token é obrigatório')
    .isLength({ min: 32, max: 255 })
    .withMessage('Token inválido')
    .matches(/^[a-f0-9]+$/i)
    .withMessage('Token deve conter apenas caracteres hexadecimais'),
  
  body('novaSenha')
    .isLength({ min: 8, max: 128 })
    .withMessage('Nova senha deve ter entre 8 e 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Nova senha deve conter: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'),
  
  body('confirmarNovaSenha')
    .custom((value, { req }) => {
      if (value !== req.body.novaSenha) {
        throw new Error('Confirmação de nova senha não confere');
      }
      return true;
    })
];

// Validação para verify email
const validateVerifyEmail = [
  body('token')
    .notEmpty()
    .withMessage('Token de verificação é obrigatório')
    .isLength({ min: 32, max: 255 })
    .withMessage('Token de verificação inválido')
    .matches(/^[a-f0-9]+$/i)
    .withMessage('Token deve conter apenas caracteres hexadecimais')
];

// Validação para sessão
const validateSessionId = [
  param('sessionId')
    .isUUID()
    .withMessage('ID da sessão deve ser um UUID válido')
];

// Validação para token
const validateToken = [
  body('token')
    .notEmpty()
    .withMessage('Token é obrigatório')
    .isJWT()
    .withMessage('Token deve ser um JWT válido')
];

// Validação para atualizar perfil
const validateUpdateProfile = [
  body('nome')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nome deve conter apenas letras e espaços'),
  
  body('telefone')
    .optional()
    .trim()
    .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
    .withMessage('Telefone deve estar no formato (XX) XXXXX-XXXX'),
  
  body('data_nascimento')
    .optional()
    .isISO8601()
    .withMessage('Data de nascimento deve estar no formato ISO 8601')
    .custom((value) => {
      const hoje = new Date();
      const nascimento = new Date(value);
      const idade = hoje.getFullYear() - nascimento.getFullYear();
      
      if (idade < 13 || idade > 120) {
        throw new Error('Idade deve estar entre 13 e 120 anos');
      }
      return true;
    })
];

// Validação para alterar senha
const validateChangePassword = [
  body('senhaAtual')
    .notEmpty()
    .withMessage('Senha atual é obrigatória'),
  
  body('novaSenha')
    .isLength({ min: 8, max: 128 })
    .withMessage('Nova senha deve ter entre 8 e 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Nova senha deve conter: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial'),
  
  body('confirmarNovaSenha')
    .custom((value, { req }) => {
      if (value !== req.body.novaSenha) {
        throw new Error('Confirmação de nova senha não confere');
      }
      return true;
    })
];

// Validação sanitizada para dados sensíveis
const sanitizeAuthData = [
  body('*').escape(), // Escapa caracteres HTML
  body('email').normalizeEmail(), // Normaliza email
  body('nome').trim(), // Remove espaços extras
];

// Middleware de validação personalizado
const validatePasswordStrength = (req, res, next) => {
  const { senha } = req.body;
  
  if (!senha) {
    return next();
  }
  
  // Verificar senhas comuns
  const senhasComuns = [
    '12345678', 'password', '123456789', 'qwerty123',
    'admin123', 'senha123', 'password123', '12345678',
    'abcd1234', '1234567890'
  ];
  
  if (senhasComuns.includes(senha.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: 'Senha muito comum. Escolha uma senha mais segura.'
    });
  }
  
  // Verificar sequências
  const sequencias = ['123456', 'abcdef', 'qwerty', '654321'];
  const senhaLower = senha.toLowerCase();
  
  for (const seq of sequencias) {
    if (senhaLower.includes(seq)) {
      return res.status(400).json({
        success: false,
        message: 'Senha não pode conter sequências comuns.'
      });
    }
  }
  
  next();
};

// Middleware de verificação de rate limit específico para auth
const authRateLimit = (req, res, next) => {
  // Implementar rate limiting específico para endpoints sensíveis
  const sensitiveEndpoints = ['/login', '/register', '/forgot-password'];
  const currentPath = req.path;
  
  if (sensitiveEndpoints.some(endpoint => currentPath.includes(endpoint))) {
    // Rate limit já implementado no middleware de segurança
    // Aqui podemos adicionar logs específicos
    console.log(`[AUTH] Tentativa de acesso a endpoint sensível: ${currentPath} - IP: ${req.ip}`);
  }
  
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyEmail,
  validateSessionId,
  validateToken,
  validateUpdateProfile,
  validateChangePassword,
  sanitizeAuthData,
  validatePasswordStrength,
  authRateLimit
}; 