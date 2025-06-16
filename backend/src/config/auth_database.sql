-- 🔐 SISTEMA DE AUTENTICAÇÃO - CASHLOG
-- Criação de tabelas para usuários e autenticação

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  email_verificado BOOLEAN DEFAULT FALSE,
  token_verificacao VARCHAR(255),
  token_reset_senha VARCHAR(255),
  token_reset_expira TIMESTAMP,
  tentativas_login INTEGER DEFAULT 0,
  bloqueado_ate TIMESTAMP,
  ultimo_login TIMESTAMP,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ativo BOOLEAN DEFAULT TRUE,
  
  -- Campos de perfil
  telefone VARCHAR(20),
  data_nascimento DATE,
  avatar_url TEXT,
  
  -- Campos de segurança
  ip_ultimo_login INET,
  user_agent_ultimo_login TEXT,
  dois_fatores_ativo BOOLEAN DEFAULT FALSE,
  dois_fatores_secret VARCHAR(32)
);

-- Índices para performance e segurança
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_token_verificacao ON usuarios(token_verificacao);
CREATE INDEX IF NOT EXISTS idx_usuarios_token_reset ON usuarios(token_reset_senha);
CREATE INDEX IF NOT EXISTS idx_usuarios_criado_em ON usuarios(criado_em);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);

-- Criar tabela de sessões
CREATE TABLE IF NOT EXISTS sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_sessao VARCHAR(255) UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expira_em TIMESTAMP NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  dispositivo VARCHAR(100),
  localizacao VARCHAR(100)
);

-- Índices para sessões
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario_id ON sessoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_token ON sessoes(token_sessao);
CREATE INDEX IF NOT EXISTS idx_sessoes_expira_em ON sessoes(expira_em);
CREATE INDEX IF NOT EXISTS idx_sessoes_ativo ON sessoes(ativo);

-- Criar tabela de logs de autenticação
CREATE TABLE IF NOT EXISTS logs_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  email VARCHAR(255),
  acao VARCHAR(50) NOT NULL, -- 'login', 'register', 'logout', 'reset_password', etc.
  sucesso BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  detalhes JSONB,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_logs_auth_usuario_id ON logs_auth(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_auth_email ON logs_auth(email);
CREATE INDEX IF NOT EXISTS idx_logs_auth_acao ON logs_auth(acao);
CREATE INDEX IF NOT EXISTS idx_logs_auth_criado_em ON logs_auth(criado_em);
CREATE INDEX IF NOT EXISTS idx_logs_auth_ip ON logs_auth(ip_address);

-- Trigger para atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at 
  BEFORE UPDATE ON usuarios 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Função para limpar tokens expirados
CREATE OR REPLACE FUNCTION limpar_tokens_expirados()
RETURNS void AS $$
BEGIN
  -- Limpar tokens de reset de senha expirados
  UPDATE usuarios 
  SET token_reset_senha = NULL, token_reset_expira = NULL
  WHERE token_reset_expira < CURRENT_TIMESTAMP;
  
  -- Limpar sessões expiradas
  DELETE FROM sessoes WHERE expira_em < CURRENT_TIMESTAMP;
  
  -- Limpar logs antigos (manter apenas 90 dias)
  DELETE FROM logs_auth WHERE criado_em < CURRENT_TIMESTAMP - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Criar usuário administrador padrão (opcional)
-- Senha: admin123 (hash gerado pelo bcrypt)
INSERT INTO usuarios (nome, email, senha_hash, email_verificado, ativo) 
VALUES (
  'Administrador',
  'admin@cashlog.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfcHE6K.PK7VdSa', -- admin123
  TRUE,
  TRUE
) ON CONFLICT (email) DO NOTHING;

-- Row Level Security (RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_auth ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Usuários podem ver próprios dados" ON usuarios
  FOR SELECT USING (id = auth.uid()::uuid);

CREATE POLICY "Usuários podem atualizar próprios dados" ON usuarios
  FOR UPDATE USING (id = auth.uid()::uuid);

CREATE POLICY "Usuários podem ver próprias sessões" ON sessoes
  FOR SELECT USING (usuario_id = auth.uid()::uuid);

-- Comentários para documentação
COMMENT ON TABLE usuarios IS 'Tabela de usuários do sistema CashLog';
COMMENT ON TABLE sessoes IS 'Tabela de sessões ativas dos usuários';
COMMENT ON TABLE logs_auth IS 'Tabela de logs de autenticação e segurança';

COMMENT ON COLUMN usuarios.senha_hash IS 'Hash da senha usando bcrypt';
COMMENT ON COLUMN usuarios.tentativas_login IS 'Contador de tentativas de login falhadas';
COMMENT ON COLUMN usuarios.bloqueado_ate IS 'Timestamp até quando o usuário está bloqueado';
COMMENT ON COLUMN sessoes.token_sessao IS 'Token JWT da sessão';
COMMENT ON COLUMN logs_auth.detalhes IS 'Detalhes adicionais em formato JSON';

-- Executar limpeza de tokens expirados
SELECT limpar_tokens_expirados(); 