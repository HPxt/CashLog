const authService = require('../services/authService');
const { validationResult } = require('express-validator');

/**
 * 🔐 CONTROLLER DE AUTENTICAÇÃO
 * Todos os endpoints de login, cadastro e segurança
 */

class AuthController {
  
  /**
   * POST /api/auth/register
   * Cadastrar novo usuário
   */
  async register(req, res) {
    try {
      // Validar dados de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }
      
      const { nome, email, senha } = req.body;
      
      // Registrar usuário
      const resultado = await authService.register({
        nome,
        email,
        senha
      });
      
      res.status(201).json({
        success: true,
        message: 'Usuário cadastrado com sucesso',
        data: {
          usuario: resultado.usuario,
          tokenVerificacao: resultado.tokenVerificacao
        }
      });
      
    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao cadastrar usuário'
      });
    }
  }
  
  /**
   * POST /api/auth/login
   * Login de usuário
   */
  async login(req, res) {
    try {
      // Validar dados de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }
      
      const { email, senha } = req.body;
      
      // Informações do cliente
      const clientInfo = {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        dispositivo: req.get('X-Device-Type') || 'web'
      };
      
      // Fazer login
      const resultado = await authService.login({
        email,
        senha
      }, clientInfo);
      
      // Configurar cookie seguro (opcional)
      res.cookie('authToken', resultado.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
      });
      
      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          usuario: resultado.usuario,
          token: resultado.token,
          expiresIn: resultado.expiresIn
        }
      });
      
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Erro ao fazer login'
      });
    }
  }
  
  /**
   * POST /api/auth/logout
   * Logout de usuário
   */
  async logout(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.authToken;
      const usuarioId = req.user?.id;
      
      if (!token || !usuarioId) {
        return res.status(400).json({
          success: false,
          message: 'Token ou usuário não encontrado'
        });
      }
      
      // Fazer logout
      const resultado = await authService.logout(token, usuarioId);
      
      // Limpar cookie
      res.clearCookie('authToken');
      
      res.status(200).json({
        success: true,
        message: resultado.message
      });
      
    } catch (error) {
      console.error('Erro no logout:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao fazer logout'
      });
    }
  }
  
  /**
   * POST /api/auth/forgot-password
   * Solicitar reset de senha
   */
  async forgotPassword(req, res) {
    try {
      // Validar dados de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }
      
      const { email } = req.body;
      
      // Solicitar reset
      const resultado = await authService.solicitarResetSenha(email);
      
      res.status(200).json({
        success: true,
        message: resultado.message,
        // Em desenvolvimento, incluir o token para teste
        ...(process.env.NODE_ENV === 'development' && { tokenReset: resultado.tokenReset })
      });
      
    } catch (error) {
      console.error('Erro no forgot password:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao solicitar reset de senha'
      });
    }
  }
  
  /**
   * POST /api/auth/reset-password
   * Confirmar reset de senha
   */
  async resetPassword(req, res) {
    try {
      // Validar dados de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
      }
      
      const { token, novaSenha } = req.body;
      
      // Confirmar reset
      const resultado = await authService.confirmarResetSenha(token, novaSenha);
      
      res.status(200).json({
        success: true,
        message: resultado.message
      });
      
    } catch (error) {
      console.error('Erro no reset password:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao resetar senha'
      });
    }
  }
  
  /**
   * POST /api/auth/verify-email
   * Verificar email
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token de verificação é obrigatório'
        });
      }
      
      // Verificar email
      const resultado = await authService.verificarEmail(token);
      
      res.status(200).json({
        success: true,
        message: resultado.message,
        data: {
          usuario: resultado.usuario
        }
      });
      
    } catch (error) {
      console.error('Erro na verificação de email:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao verificar email'
      });
    }
  }
  
  /**
   * GET /api/auth/me
   * Obter dados do usuário logado
   */
  async getProfile(req, res) {
    try {
      const usuario = req.user;
      
      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Dados do usuário obtidos com sucesso',
        data: {
          usuario: usuario
        }
      });
      
    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao obter dados do usuário'
      });
    }
  }
  
  /**
   * POST /api/auth/validate-token
   * Validar token JWT
   */
  async validateToken(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token é obrigatório'
        });
      }
      
      // Validar token
      const resultado = await authService.validarToken(token);
      
      res.status(200).json({
        success: true,
        message: 'Token válido',
        data: {
          usuario: resultado.usuario,
          sessao: resultado.sessao
        }
      });
      
    } catch (error) {
      console.error('Erro na validação de token:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Token inválido'
      });
    }
  }
  
  /**
   * POST /api/auth/refresh-token
   * Renovar token JWT
   */
  async refreshToken(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.authToken;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token é obrigatório'
        });
      }
      
      // Validar token atual
      const validacao = await authService.validarToken(token);
      
      // Gerar novo token
      const novoToken = authService.generateJWT(validacao.usuario);
      
      // Atualizar sessão
      await authService.criarSessao(validacao.usuario.id, novoToken, {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        dispositivo: req.get('X-Device-Type') || 'web'
      });
      
      // Invalidar token antigo
      await authService.logout(token, validacao.usuario.id);
      
      // Configurar novo cookie
      res.cookie('authToken', novoToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
      });
      
      res.status(200).json({
        success: true,
        message: 'Token renovado com sucesso',
        data: {
          token: novoToken,
          expiresIn: '24h'
        }
      });
      
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Erro ao renovar token'
      });
    }
  }
  
  /**
   * GET /api/auth/sessions
   * Listar sessões ativas do usuário
   */
  async getSessions(req, res) {
    try {
      const usuarioId = req.user?.id;
      
      if (!usuarioId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }
      
      const { supabase } = require('../config/supabase');
      
      const { data: sessoes, error } = await supabase
        .from('sessoes')
        .select('*')
        .eq('usuario_id', usuarioId)
        .eq('ativo', true)
        .order('criado_em', { ascending: false });
      
      if (error) {
        throw new Error(`Erro ao buscar sessões: ${error.message}`);
      }
      
      res.status(200).json({
        success: true,
        message: 'Sessões obtidas com sucesso',
        data: {
          sessoes: sessoes || []
        }
      });
      
    } catch (error) {
      console.error('Erro ao obter sessões:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao obter sessões'
      });
    }
  }
  
  /**
   * DELETE /api/auth/sessions/:sessionId
   * Encerrar sessão específica
   */
  async terminateSession(req, res) {
    try {
      const { sessionId } = req.params;
      const usuarioId = req.user?.id;
      
      if (!usuarioId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }
      
      const { supabase } = require('../config/supabase');
      
      const { error } = await supabase
        .from('sessoes')
        .update({ ativo: false })
        .eq('id', sessionId)
        .eq('usuario_id', usuarioId);
      
      if (error) {
        throw new Error(`Erro ao encerrar sessão: ${error.message}`);
      }
      
      res.status(200).json({
        success: true,
        message: 'Sessão encerrada com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao encerrar sessão'
      });
    }
  }
}

module.exports = new AuthController(); 