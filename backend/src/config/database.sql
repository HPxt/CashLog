-- Criação das tabelas do CashLog
-- Execute este script no Editor SQL do Supabase

-- ===================================
-- 1. TABELA DE CATEGORIAS
-- ===================================

CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    cor VARCHAR(7) NOT NULL DEFAULT '#808080', -- Código hexadecimal da cor
    icone VARCHAR(10) DEFAULT '📦', -- Emoji para representar a categoria
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 2. TABELA DE GASTOS
-- ===================================

CREATE TABLE IF NOT EXISTS gastos (
    id SERIAL PRIMARY KEY,
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    descricao TEXT,
    categoria_id INTEGER NOT NULL REFERENCES categorias(id),
    data DATE NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 3. TABELA DE METAS
-- ===================================

CREATE TABLE IF NOT EXISTS metas (
    id SERIAL PRIMARY KEY,
    categoria_id INTEGER REFERENCES categorias(id), -- NULL = meta geral
    valor_meta DECIMAL(10,2) NOT NULL CHECK (valor_meta > 0),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    ano INTEGER NOT NULL CHECK (ano >= 2020),
    descricao TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar metas duplicadas
    UNIQUE(categoria_id, mes, ano)
);

-- ===================================
-- 4. INSERIR CATEGORIAS PADRÃO
-- ===================================

INSERT INTO categorias (nome, cor, icone) VALUES
    ('Alimentação', '#FF6B6B', '🍔'),
    ('Transporte', '#4ECDC4', '🚗'),
    ('Moradia', '#45B7D1', '🏠'),
    ('Saúde', '#96CEB4', '⚕️'),
    ('Educação', '#FFEAA7', '📚'),
    ('Lazer', '#DDA0DD', '🎮'),
    ('Roupas', '#FFB6C1', '👕'),
    ('Outros', '#D3D3D3', '📦')
ON CONFLICT (nome) DO NOTHING; -- Não inserir se já existir

-- ===================================
-- 5. ÍNDICES PARA PERFORMANCE
-- ===================================

-- Índice para buscar gastos por categoria
CREATE INDEX IF NOT EXISTS idx_gastos_categoria 
ON gastos(categoria_id);

-- Índice para buscar gastos por data
CREATE INDEX IF NOT EXISTS idx_gastos_data 
ON gastos(data);

-- Índice para buscar gastos por mês/ano
CREATE INDEX IF NOT EXISTS idx_gastos_mes_ano 
ON gastos(EXTRACT(YEAR FROM data), EXTRACT(MONTH FROM data));

-- Índice para metas por período
CREATE INDEX IF NOT EXISTS idx_metas_periodo 
ON metas(ano, mes);

-- ===================================
-- 6. TRIGGERS PARA ATUALIZAR TIMESTAMPS
-- ===================================

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para categorias
DROP TRIGGER IF EXISTS trigger_categorias_atualizado ON categorias;
CREATE TRIGGER trigger_categorias_atualizado
    BEFORE UPDATE ON categorias
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

-- Triggers para gastos
DROP TRIGGER IF EXISTS trigger_gastos_atualizado ON gastos;
CREATE TRIGGER trigger_gastos_atualizado
    BEFORE UPDATE ON gastos
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

-- Triggers para metas
DROP TRIGGER IF EXISTS trigger_metas_atualizado ON metas;
CREATE TRIGGER trigger_metas_atualizado
    BEFORE UPDATE ON metas
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

-- ===================================
-- 7. VIEWS PARA RELATÓRIOS
-- ===================================

-- View para gastos com informações de categoria
CREATE OR REPLACE VIEW vw_gastos_completos AS
SELECT 
    g.id,
    g.valor,
    g.descricao,
    g.data,
    g.criado_em,
    g.atualizado_em,
    c.id as categoria_id,
    c.nome as categoria_nome,
    c.cor as categoria_cor,
    c.icone as categoria_icone,
    EXTRACT(YEAR FROM g.data) as ano,
    EXTRACT(MONTH FROM g.data) as mes
FROM gastos g
LEFT JOIN categorias c ON g.categoria_id = c.id
ORDER BY g.data DESC;

-- View para estatísticas mensais
CREATE OR REPLACE VIEW vw_estatisticas_mensais AS
SELECT 
    EXTRACT(YEAR FROM data) as ano,
    EXTRACT(MONTH FROM data) as mes,
    c.nome as categoria,
    c.cor,
    COUNT(*) as quantidade_gastos,
    SUM(valor) as total_gasto,
    AVG(valor) as media_gasto,
    MIN(valor) as menor_gasto,
    MAX(valor) as maior_gasto
FROM gastos g
LEFT JOIN categorias c ON g.categoria_id = c.id
GROUP BY ano, mes, c.id, c.nome, c.cor
ORDER BY ano DESC, mes DESC, total_gasto DESC;

-- ===================================
-- 8. COMENTÁRIOS NAS TABELAS
-- ===================================

COMMENT ON TABLE categorias IS 'Categorias para classificação dos gastos';
COMMENT ON TABLE gastos IS 'Registro de todos os gastos realizados';
COMMENT ON TABLE metas IS 'Metas de gasto por categoria e período';

COMMENT ON COLUMN gastos.valor IS 'Valor do gasto em reais';
COMMENT ON COLUMN gastos.data IS 'Data em que o gasto foi realizado';
COMMENT ON COLUMN metas.valor_meta IS 'Valor máximo permitido para a categoria no período';

-- ===================================
-- SCRIPT EXECUTADO COM SUCESSO! 
-- ===================================

-- Para verificar se tudo foi criado corretamente, execute:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'; 