const express = require('express');
const router = express.Router();

// Controllers e Services
const authController = require('../controllers/authController');

// Middlewares
const { authenticateToken: authMiddleware } = require('../middleware/auth');
const { rateLimiters } = require('../middleware/security');

// Validações
const {
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
} = require('../validations/authValidation');

/**
 * 🔐 ROTAS DE AUTENTICAÇÃO
 * Todas as rotas para login, cadastro e gestão de senhas
 */

// ==========================================
// ROTAS PÚBLICAS (SEM AUTENTICAÇÃO)
// ==========================================

/**
 * @route   POST /api/auth/register
 * @desc    Cadastrar novo usuário
 * @access  Public
 */
router.post('/register',
  rateLimiters.auth, // Rate limit específico para auth
  authRateLimit, // Validador de rate limit
  sanitizeAuthData, // Sanitizar dados
  validateRegister, // Validar dados de registro
  validatePasswordStrength, // Validar força da senha
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login de usuário
 * @access  Public
 */
router.post('/login',
  rateLimiters.auth, // Rate limit específico para auth
  authRateLimit,
  sanitizeAuthData,
  validateLogin,
  authController.login
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar reset de senha
 * @access  Public
 */
router.post('/forgot-password',
  rateLimiters.auth,
  authRateLimit,
  sanitizeAuthData,
  validateForgotPassword,
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Confirmar reset de senha
 * @access  Public
 */
router.post('/reset-password',
  rateLimiters.auth,
  authRateLimit,
  sanitizeAuthData,
  validateResetPassword,
  validatePasswordStrength,
  authController.resetPassword
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verificar email do usuário
 * @access  Public
 */
router.post('/verify-email',
  rateLimiters.general,
  sanitizeAuthData,
  validateVerifyEmail,
  authController.verifyEmail
);

/**
 * @route   POST /api/auth/validate-token
 * @desc    Validar token JWT
 * @access  Public
 */
router.post('/validate-token',
  rateLimiters.general,
  validateToken,
  authController.validateToken
);

// ==========================================
// ROTAS PROTEGIDAS (COM AUTENTICAÇÃO)
// ==========================================

/**
 * @route   POST /api/auth/logout
 * @desc    Logout de usuário
 * @access  Private
 */
router.post('/logout',
  authMiddleware, // Verificar autenticação
  authController.logout
);

/**
 * @route   GET /api/auth/me
 * @desc    Obter dados do usuário logado
 * @access  Private
 */
router.get('/me',
  authMiddleware,
  authController.getProfile
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Renovar token JWT
 * @access  Private
 */
router.post('/refresh-token',
  authMiddleware,
  authController.refreshToken
);

/**
 * @route   GET /api/auth/sessions
 * @desc    Listar sessões ativas do usuário
 * @access  Private
 */
router.get('/sessions',
  authMiddleware,
  authController.getSessions
);

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Encerrar sessão específica
 * @access  Private
 */
router.delete('/sessions/:sessionId',
  authMiddleware,
  validateSessionId,
  authController.terminateSession
);

// ==========================================
// ROTAS DE GESTÃO DE PERFIL
// ==========================================

/**
 * @route   PUT /api/auth/profile
 * @desc    Atualizar perfil do usuário
 * @access  Private
 */
router.put('/profile',
  authMiddleware,
  rateLimiters.general,
  sanitizeAuthData,
  validateUpdateProfile,
  async (req, res) => {
    try {
      const usuarioId = req.user.id;
      const { nome, telefone, data_nascimento, avatar_url } = req.body;
      
      const { supabase } = require('../config/supabase');
      
      // Atualizar dados do usuário
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .update({
          nome: nome || req.user.nome,
          telefone: telefone || req.user.telefone,
          data_nascimento: data_nascimento || req.user.data_nascimento,
          avatar_url: avatar_url || req.user.avatar_url,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', usuarioId)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Erro ao atualizar perfil: ${error.message}`);
      }
      
      // Sanitizar dados antes de retornar
      const { senha_hash, token_verificacao, token_reset_senha, token_reset_expira, dois_fatores_secret, ...usuarioLimpo } = usuario;
      
      res.status(200).json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: {
          usuario: usuarioLimpo
        }
      });
      
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao atualizar perfil'
      });
    }
  }
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Alterar senha do usuário
 * @access  Private
 */
router.post('/change-password',
  authMiddleware,
  rateLimiters.auth,
  sanitizeAuthData,
  validateChangePassword,
  validatePasswordStrength,
  async (req, res) => {
    try {
      const usuarioId = req.user.id;
      const { senhaAtual, novaSenha } = req.body;
      
      const bcrypt = require('bcryptjs');
      const { supabase } = require('../config/supabase');
      
      // Buscar dados atuais do usuário
      const { data: usuario, error: userError } = await supabase
        .from('usuarios')
        .select('senha_hash')
        .eq('id', usuarioId)
        .single();
      
      if (userError || !usuario) {
        throw new Error('Usuário não encontrado');
      }
      
      // Verificar senha atual
      const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha_hash);
      
      if (!senhaValida) {
        return res.status(400).json({
          success: false,
          message: 'Senha atual incorreta'
        });
      }
      
      // Hash da nova senha
      const saltRounds = 12;
      const novaSenhaHash = await bcrypt.hash(novaSenha, saltRounds);
      
      // Atualizar senha
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          senha_hash: novaSenhaHash,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', usuarioId);
      
      if (updateError) {
        throw new Error(`Erro ao atualizar senha: ${updateError.message}`);
      }
      
      // Invalidar todas as outras sessões
      await supabase
        .from('sessoes')
        .update({ ativo: false })
        .eq('usuario_id', usuarioId)
        .neq('token_sessao', req.headers.authorization?.replace('Bearer ', ''));
      
      res.status(200).json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao alterar senha'
      });
    }
  }
);

/**
 * @route   DELETE /api/auth/account
 * @desc    Desativar conta do usuário
 * @access  Private
 */
router.delete('/account',
  authMiddleware,
  rateLimiters.auth,
  async (req, res) => {
    try {
      const usuarioId = req.user.id;
      const { confirmarExclusao } = req.body;
      
      if (confirmarExclusao !== 'CONFIRMO_EXCLUSAO') {
        return res.status(400).json({
          success: false,
          message: 'Confirmação de exclusão é obrigatória'
        });
      }
      
      const { supabase } = require('../config/supabase');
      
      // Desativar conta (soft delete)
      const { error } = await supabase
        .from('usuarios')
        .update({
          ativo: false,
          email: `deleted_${Date.now()}_${req.user.email}`,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', usuarioId);
      
      if (error) {
        throw new Error(`Erro ao desativar conta: ${error.message}`);
      }
      
      // Invalidar todas as sessões
      await supabase
        .from('sessoes')
        .update({ ativo: false })
        .eq('usuario_id', usuarioId);
      
      res.status(200).json({
        success: true,
        message: 'Conta desativada com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao desativar conta:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao desativar conta'
      });
    }
  }
);

// ==========================================
// ROTAS DE STATUS E SAÚDE
// ==========================================

/**
 * @route   GET /api/auth/health
 * @desc    Verificar saúde do sistema de autenticação
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    const { supabase } = require('../config/supabase');
    
    // Testar conexão com banco
    const { data, error } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1);
    
    if (error) {
      throw new Error('Falha na conexão com banco de dados');
    }
    
    res.status(200).json({
      success: true,
      message: 'Sistema de autenticação funcionando',
      timestamp: new Date().toISOString(),
      status: {
        database: 'connected',
        auth: 'active'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sistema de autenticação com problemas',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 