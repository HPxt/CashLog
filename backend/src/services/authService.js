const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/supabase');

/**
 * 🔐 SERVICE DE AUTENTICAÇÃO
 * Todas as operações de login, cadastro e segurança
 */

class AuthService {
  
  /**
   * Registrar novo usuário
   */
  async register(userData) {
    const { nome, email, senha } = userData;
    
    try {
      // Verificar se email já existe
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();
      
      if (existingUser) {
        throw new Error('Email já está em uso');
      }
      
      // Hash da senha
      const saltRounds = 12;
      const senhaHash = await bcrypt.hash(senha, saltRounds);
      
      // Token de verificação de email
      const tokenVerificacao = crypto.randomBytes(32).toString('hex');
      
      // Criar usuário
      const { data: novoUsuario, error } = await supabase
        .from('usuarios')
        .insert([{
          nome: nome.trim(),
          email: email.toLowerCase().trim(),
          senha_hash: senhaHash,
          token_verificacao: tokenVerificacao,
          criado_em: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        throw new Error(`Erro ao criar usuário: ${error.message}`);
      }
      
      // Log da ação
      await this.logAuthAction('register', true, novoUsuario.id, email, {
        nome: nome.trim()
      });
      
      return {
        usuario: this.sanitizeUser(novoUsuario),
        tokenVerificacao: tokenVerificacao
      };
      
    } catch (error) {
      // Log da falha
      await this.logAuthAction('register', false, null, email, {
        erro: error.message
      });
      throw error;
    }
  }
  
  /**
   * Login de usuário
   */
  async login(credentials, clientInfo = {}) {
    const { email, senha } = credentials;
    const { ip, userAgent } = clientInfo;
    
    try {
      // Buscar usuário por email
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('ativo', true)
        .single();
      
      if (error || !usuario) {
        await this.logAuthAction('login', false, null, email, {
          erro: 'Usuário não encontrado',
          ip,
          userAgent
        });
        throw new Error('Credenciais inválidas');
      }
      
      // Verificar se usuário está bloqueado
      if (usuario.bloqueado_ate && new Date(usuario.bloqueado_ate) > new Date()) {
        await this.logAuthAction('login', false, usuario.id, email, {
          erro: 'Usuário bloqueado',
          ip,
          userAgent
        });
        throw new Error('Conta temporariamente bloqueada. Tente novamente mais tarde.');
      }
      
      // Verificar senha
      const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
      
      if (!senhaValida) {
        // Incrementar tentativas de login
        await this.incrementarTentativasLogin(usuario.id);
        
        await this.logAuthAction('login', false, usuario.id, email, {
          erro: 'Senha incorreta',
          tentativas: usuario.tentativas_login + 1,
          ip,
          userAgent
        });
        throw new Error('Credenciais inválidas');
      }
      
      // Reset tentativas de login em caso de sucesso
      await this.resetarTentativasLogin(usuario.id, ip, userAgent);
      
      // Gerar token JWT
      const token = this.generateJWT(usuario);
      
      // Criar sessão
      await this.criarSessao(usuario.id, token, clientInfo);
      
      // Log do sucesso
      await this.logAuthAction('login', true, usuario.id, email, {
        ip,
        userAgent,
        ultimo_login: new Date().toISOString()
      });
      
      return {
        usuario: this.sanitizeUser(usuario),
        token,
        expiresIn: '24h'
      };
      
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Logout (invalidar sessão)
   */
  async logout(token, usuarioId) {
    try {
      // Desativar sessão
      const { error } = await supabase
        .from('sessoes')
        .update({ ativo: false })
        .eq('token_sessao', token)
        .eq('usuario_id', usuarioId);
      
      if (error) {
        throw new Error(`Erro ao fazer logout: ${error.message}`);
      }
      
      // Log da ação
      await this.logAuthAction('logout', true, usuarioId, null, {
        token_invalidado: token.substring(0, 10) + '...'
      });
      
      return { message: 'Logout realizado com sucesso' };
      
    } catch (error) {
      await this.logAuthAction('logout', false, usuarioId, null, {
        erro: error.message
      });
      throw error;
    }
  }
  
  /**
   * Solicitar reset de senha
   */
  async solicitarResetSenha(email) {
    try {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('id, nome, email')
        .eq('email', email.toLowerCase())
        .eq('ativo', true)
        .single();
      
      if (!usuario) {
        // Não revelar se email existe ou não
        return { message: 'Se o email existir, você receberá instruções para reset' };
      }
      
      // Gerar token de reset
      const tokenReset = crypto.randomBytes(32).toString('hex');
      const expiraEm = new Date(Date.now() + 3600000); // 1 hora
      
      // Salvar token no banco
      const { error } = await supabase
        .from('usuarios')
        .update({
          token_reset_senha: tokenReset,
          token_reset_expira: expiraEm.toISOString()
        })
        .eq('id', usuario.id);
      
      if (error) {
        throw new Error(`Erro ao gerar token de reset: ${error.message}`);
      }
      
      // Log da ação
      await this.logAuthAction('reset_password_request', true, usuario.id, email, {
        token_gerado: tokenReset.substring(0, 10) + '...',
        expira_em: expiraEm.toISOString()
      });
      
      return {
        message: 'Se o email existir, você receberá instruções para reset',
        tokenReset: tokenReset // Para desenvolvimento/teste
      };
      
    } catch (error) {
      await this.logAuthAction('reset_password_request', false, null, email, {
        erro: error.message
      });
      throw error;
    }
  }
  
  /**
   * Confirmar reset de senha
   */
  async confirmarResetSenha(token, novaSenha) {
    try {
      // Buscar usuário pelo token
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('*')
        .eq('token_reset_senha', token)
        .eq('ativo', true)
        .single();
      
      if (!usuario) {
        throw new Error('Token de reset inválido');
      }
      
      // Verificar se token não expirou
      if (new Date(usuario.token_reset_expira) < new Date()) {
        throw new Error('Token de reset expirado');
      }
      
      // Hash da nova senha
      const saltRounds = 12;
      const novaSenhaHash = await bcrypt.hash(novaSenha, saltRounds);
      
      // Atualizar senha e limpar token
      const { error } = await supabase
        .from('usuarios')
        .update({
          senha_hash: novaSenhaHash,
          token_reset_senha: null,
          token_reset_expira: null,
          tentativas_login: 0,
          bloqueado_ate: null
        })
        .eq('id', usuario.id);
      
      if (error) {
        throw new Error(`Erro ao atualizar senha: ${error.message}`);
      }
      
      // Invalidar todas as sessões do usuário
      await supabase
        .from('sessoes')
        .update({ ativo: false })
        .eq('usuario_id', usuario.id);
      
      // Log da ação
      await this.logAuthAction('reset_password_confirm', true, usuario.id, usuario.email, {
        token_usado: token.substring(0, 10) + '...',
        sessoes_invalidadas: true
      });
      
      return { message: 'Senha alterada com sucesso' };
      
    } catch (error) {
      await this.logAuthAction('reset_password_confirm', false, null, null, {
        erro: error.message,
        token: token ? token.substring(0, 10) + '...' : null
      });
      throw error;
    }
  }
  
  /**
   * Verificar email
   */
  async verificarEmail(token) {
    try {
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .update({
          email_verificado: true,
          token_verificacao: null
        })
        .eq('token_verificacao', token)
        .eq('ativo', true)
        .select()
        .single();
      
      if (error || !usuario) {
        throw new Error('Token de verificação inválido');
      }
      
      // Log da ação
      await this.logAuthAction('verify_email', true, usuario.id, usuario.email, {
        token_usado: token.substring(0, 10) + '...'
      });
      
      return {
        message: 'Email verificado com sucesso',
        usuario: this.sanitizeUser(usuario)
      };
      
    } catch (error) {
      await this.logAuthAction('verify_email', false, null, null, {
        erro: error.message,
        token: token ? token.substring(0, 10) + '...' : null
      });
      throw error;
    }
  }
  
  /**
   * Validar token JWT
   */
  async validarToken(token) {
    try {
      // Verificar token JWT
      const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
      
      // Verificar se sessão está ativa
      const { data: sessao } = await supabase
        .from('sessoes')
        .select('*')
        .eq('token_sessao', token)
        .eq('ativo', true)
        .single();
      
      if (!sessao) {
        throw new Error('Sessão inválida');
      }
      
      // Verificar se não expirou
      if (new Date(sessao.expira_em) < new Date()) {
        throw new Error('Sessão expirada');
      }
      
      // Buscar dados atualizados do usuário
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', decoded.sub)
        .eq('ativo', true)
        .single();
      
      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }
      
      return {
        usuario: this.sanitizeUser(usuario),
        sessao: sessao
      };
      
    } catch (error) {
      throw new Error('Token inválido');
    }
  }
  
  /**
   * Helpers privados
   */
  
  generateJWT(usuario) {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      email_verificado: usuario.email_verificado,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    };
    
    return jwt.sign(payload, process.env.SUPABASE_JWT_SECRET);
  }
  
  async criarSessao(usuarioId, token, clientInfo = {}) {
    const { ip, userAgent, dispositivo = 'web' } = clientInfo;
    
    const sessao = {
      usuario_id: usuarioId,
      token_sessao: token,
      ip_address: ip || null,
      user_agent: userAgent || null,
      dispositivo: dispositivo,
      expira_em: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
    };
    
    const { error } = await supabase
      .from('sessoes')
      .insert([sessao]);
    
    if (error) {
      throw new Error(`Erro ao criar sessão: ${error.message}`);
    }
  }
  
  async incrementarTentativasLogin(usuarioId) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('tentativas_login')
      .eq('id', usuarioId)
      .single();
    
    const novasTentativas = (usuario?.tentativas_login || 0) + 1;
    const updates = { tentativas_login: novasTentativas };
    
    // Bloquear após 5 tentativas por 15 minutos
    if (novasTentativas >= 5) {
      updates.bloqueado_ate = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    }
    
    await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', usuarioId);
  }
  
  async resetarTentativasLogin(usuarioId, ip, userAgent) {
    await supabase
      .from('usuarios')
      .update({
        tentativas_login: 0,
        bloqueado_ate: null,
        ultimo_login: new Date().toISOString(),
        ip_ultimo_login: ip || null,
        user_agent_ultimo_login: userAgent || null
      })
      .eq('id', usuarioId);
  }
  
  async logAuthAction(acao, sucesso, usuarioId = null, email = null, detalhes = {}) {
    try {
      await supabase
        .from('logs_auth')
        .insert([{
          usuario_id: usuarioId,
          email: email,
          acao: acao,
          sucesso: sucesso,
          ip_address: detalhes.ip || null,
          user_agent: detalhes.userAgent || null,
          detalhes: detalhes
        }]);
    } catch (error) {
      console.error('Erro ao salvar log de auth:', error);
    }
  }
  
  sanitizeUser(usuario) {
    const { senha_hash, token_verificacao, token_reset_senha, token_reset_expira, dois_fatores_secret, ...usuarioLimpo } = usuario;
    return usuarioLimpo;
  }
}

module.exports = new AuthService(); 