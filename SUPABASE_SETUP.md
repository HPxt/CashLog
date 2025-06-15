# 🗄️ Guia Completo: Integração Supabase no CashLog

Este guia te ajudará a configurar e integrar o Supabase como banco de dados do projeto CashLog.

## 📋 O que é o Supabase?

O Supabase é uma alternativa open-source ao Firebase, oferecendo:
- **PostgreSQL** como banco de dados
- **API REST** automática
- **Realtime subscriptions**
- **Autenticação** integrada
- **Storage** para arquivos
- **Edge Functions**

## 🚀 Passo 1: Criando o Projeto no Supabase

### 1.1 Criar Conta e Projeto
1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Faça login com GitHub, Google ou email
4. Clique em "New Project"
5. Escolha sua organização
6. Configure o projeto:
   - **Name**: `cashlog`
   - **Database Password**: Crie uma senha forte (anote!)
   - **Region**: Escolha a mais próxima (Brazil East)
7. Clique em "Create new project"
8. Aguarde ~2 minutos para o projeto ser criado

### 1.2 Obter Credenciais
Após a criação, vá para:
1. **Settings** → **API**
2. Copie e guarde:
   - **Project URL** (ex: `https://xxxxxxxxxxx.supabase.co`)
   - **anon public** key (chave pública)

## 🏗️ Passo 2: Modelagem do Banco de Dados

### 2.1 Criar Tabelas via SQL Editor

No painel do Supabase:
1. Vá para **SQL Editor**
2. Clique em "New query"
3. Cole e execute cada script abaixo:

#### Tabela: Categorias
```sql
-- Criar tabela de categorias
CREATE TABLE categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(50) NOT NULL UNIQUE,
  cor VARCHAR(7) DEFAULT '#3B82F6',
  icone VARCHAR(50) DEFAULT 'shopping-cart',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inserir categorias padrão
INSERT INTO categorias (nome, cor, icone) VALUES
('Alimentação', '#EF4444', 'utensils'),
('Transporte', '#3B82F6', 'car'),
('Moradia', '#10B981', 'home'),
('Saúde', '#F59E0B', 'heart'),
('Educação', '#8B5CF6', 'book'),
('Lazer', '#EC4899', 'gamepad-2'),
('Roupas', '#6366F1', 'shirt'),
('Outros', '#6B7280', 'more-horizontal');
```

#### Tabela: Gastos
```sql
-- Criar tabela de gastos
CREATE TABLE gastos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  valor DECIMAL(10,2) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  descricao TEXT,
  data DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraint para garantir valor positivo
  CONSTRAINT gastos_valor_positivo CHECK (valor > 0),
  
  -- Foreign key para categorias
  CONSTRAINT fk_categoria 
    FOREIGN KEY (categoria) 
    REFERENCES categorias(nome) 
    ON UPDATE CASCADE
);

-- Criar índices para performance
CREATE INDEX idx_gastos_data ON gastos(data);
CREATE INDEX idx_gastos_categoria ON gastos(categoria);
CREATE INDEX idx_gastos_created_at ON gastos(created_at);
```

#### Tabela: Metas
```sql
-- Criar tabela de metas
CREATE TABLE metas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria VARCHAR(50) NOT NULL UNIQUE,
  valor_mensal DECIMAL(10,2) NOT NULL,
  mes_referencia DATE NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraint para garantir valor positivo
  CONSTRAINT metas_valor_positivo CHECK (valor_mensal > 0),
  
  -- Foreign key para categorias
  CONSTRAINT fk_meta_categoria 
    FOREIGN KEY (categoria) 
    REFERENCES categorias(nome) 
    ON UPDATE CASCADE
);

-- Criar índice
CREATE INDEX idx_metas_categoria ON metas(categoria);
```

### 2.2 Configurar Políticas de Segurança (RLS)

```sql
-- Habilitar Row Level Security
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;

-- Para desenvolvimento, permitir tudo (ajustar em produção)
CREATE POLICY "Permitir leitura categorias" ON categorias FOR SELECT USING (true);
CREATE POLICY "Permitir todas operações gastos" ON gastos FOR ALL USING (true);
CREATE POLICY "Permitir todas operações metas" ON metas FOR ALL USING (true);
```

## ⚙️ Passo 3: Configuração no Frontend

### 3.1 Instalar Dependências
```bash
npm install @supabase/supabase-js
```

### 3.2 Configurar Variáveis de Ambiente
Crie o arquivo `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

### 3.3 Configurar Cliente Supabase
```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Credenciais do Supabase não encontradas')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
```

## 🔄 Passo 4: Implementar CRUD Operations

### 4.1 Service para Gastos
```javascript
// src/services/gastosService.js
import { supabase } from '../lib/supabase'

export const gastosService = {
  // Listar todos os gastos
  async listar() {
    try {
      const { data, error } = await supabase
        .from('gastos')
        .select(`
          id,
          valor,
          categoria,
          descricao,
          data,
          created_at
        `)
        .order('data', { ascending: false })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao listar gastos:', error.message)
      throw error
    }
  },

  // Criar novo gasto
  async criar(gasto) {
    try {
      const { data, error } = await supabase
        .from('gastos')
        .insert([{
          valor: parseFloat(gasto.valor),
          categoria: gasto.categoria,
          descricao: gasto.descricao || null,
          data: gasto.data
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao criar gasto:', error.message)
      throw error
    }
  },

  // Atualizar gasto
  async atualizar(id, gasto) {
    try {
      const { data, error } = await supabase
        .from('gastos')
        .update({
          valor: parseFloat(gasto.valor),
          categoria: gasto.categoria,
          descricao: gasto.descricao || null,
          data: gasto.data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao atualizar gasto:', error.message)
      throw error
    }
  },

  // Deletar gasto
  async deletar(id) {
    try {
      const { error } = await supabase
        .from('gastos')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao deletar gasto:', error.message)
      throw error
    }
  },

  // Filtrar gastos por período
  async filtrarPorPeriodo(dataInicio, dataFim) {
    try {
      const { data, error } = await supabase
        .from('gastos')
        .select('*')
        .gte('data', dataInicio)
        .lte('data', dataFim)
        .order('data', { ascending: false })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao filtrar gastos:', error.message)
      throw error
    }
  },

  // Obter total por categoria
  async totalPorCategoria(mesAno) {
    try {
      const inicioMes = `${mesAno}-01`
      const fimMes = `${mesAno}-31`

      const { data, error } = await supabase
        .from('gastos')
        .select('categoria, valor')
        .gte('data', inicioMes)
        .lte('data', fimMes)
      
      if (error) throw error
      
      // Agrupar e somar por categoria
      const totais = data.reduce((acc, gasto) => {
        acc[gasto.categoria] = (acc[gasto.categoria] || 0) + parseFloat(gasto.valor)
        return acc
      }, {})
      
      return totais
    } catch (error) {
      console.error('Erro ao calcular total por categoria:', error.message)
      throw error
    }
  }
}
```

### 4.2 Service para Categorias
```javascript
// src/services/categoriasService.js
import { supabase } from '../lib/supabase'

export const categoriasService = {
  // Listar todas as categorias
  async listar() {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome')
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao listar categorias:', error.message)
      throw error
    }
  },

  // Criar nova categoria
  async criar(categoria) {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .insert([categoria])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao criar categoria:', error.message)
      throw error
    }
  }
}
```

### 4.3 Service para Metas
```javascript
// src/services/metasService.js
import { supabase } from '../lib/supabase'

export const metasService = {
  // Listar metas
  async listar() {
    try {
      const { data, error } = await supabase
        .from('metas')
        .select('*')
        .order('categoria')
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao listar metas:', error.message)
      throw error
    }
  },

  // Criar ou atualizar meta
  async salvar(meta) {
    try {
      const { data, error } = await supabase
        .from('metas')
        .upsert([{
          categoria: meta.categoria,
          valor_mensal: parseFloat(meta.valor_mensal),
          mes_referencia: meta.mes_referencia || new Date().toISOString().slice(0, 7) + '-01'
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao salvar meta:', error.message)
      throw error
    }
  },

  // Deletar meta
  async deletar(categoria) {
    try {
      const { error } = await supabase
        .from('metas')
        .delete()
        .eq('categoria', categoria)
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao deletar meta:', error.message)
      throw error
    }
  }
}
```

## 🎣 Passo 5: Hooks Personalizados

### 5.1 Hook para Gastos
```javascript
// src/hooks/useGastos.js
import { useState, useEffect } from 'react'
import { gastosService } from '../services/gastosService'

export const useGastos = () => {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const carregarGastos = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await gastosService.listar()
      setGastos(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const adicionarGasto = async (gasto) => {
    try {
      const novoGasto = await gastosService.criar(gasto)
      setGastos(prev => [novoGasto, ...prev])
      return novoGasto
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const atualizarGasto = async (id, gasto) => {
    try {
      const gastoAtualizado = await gastosService.atualizar(id, gasto)
      setGastos(prev => prev.map(g => g.id === id ? gastoAtualizado : g))
      return gastoAtualizado
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const removerGasto = async (id) => {
    try {
      await gastosService.deletar(id)
      setGastos(prev => prev.filter(g => g.id !== id))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  useEffect(() => {
    carregarGastos()
  }, [])

  return {
    gastos,
    loading,
    error,
    carregarGastos,
    adicionarGasto,
    atualizarGasto,
    removerGasto
  }
}
```

## 🔍 Passo 6: Testando a Integração

### 6.1 Componente de Teste
```javascript
// src/components/TesteSupabase.jsx
import React, { useState } from 'react'
import { gastosService } from '../services/gastosService'

export const TesteSupabase = () => {
  const [resultado, setResultado] = useState('')

  const testarConexao = async () => {
    try {
      const gastos = await gastosService.listar()
      setResultado(`✅ Conexão OK! Encontrados ${gastos.length} gastos`)
    } catch (error) {
      setResultado(`❌ Erro: ${error.message}`)
    }
  }

  const criarGastoTeste = async () => {
    try {
      const gastoTeste = {
        valor: 25.50,
        categoria: 'Alimentação',
        descricao: 'Teste de integração',
        data: new Date().toISOString().split('T')[0]
      }
      
      const novoGasto = await gastosService.criar(gastoTeste)
      setResultado(`✅ Gasto criado! ID: ${novoGasto.id}`)
    } catch (error) {
      setResultado(`❌ Erro ao criar: ${error.message}`)
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Teste Supabase</h2>
      
      <div className="space-y-2">
        <button 
          onClick={testarConexao}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Testar Conexão
        </button>
        
        <button 
          onClick={criarGastoTeste}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Criar Gasto Teste
        </button>
      </div>
      
      {resultado && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <pre className="text-sm">{resultado}</pre>
        </div>
      )}
    </div>
  )
}
```

## 🛡️ Passo 7: Configurações de Segurança

### 7.1 Políticas RLS Mais Restritivas (Produção)
```sql
-- Remover políticas permissivas
DROP POLICY IF EXISTS "Permitir todas operações gastos" ON gastos;
DROP POLICY IF EXISTS "Permitir todas operações metas" ON metas;

-- Para uso com autenticação (futuro)
CREATE POLICY "Users can view own gastos" ON gastos FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own gastos" ON gastos FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own gastos" ON gastos FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own gastos" ON gastos FOR DELETE USING (auth.uid()::text = user_id);
```

### 7.2 Variáveis de Ambiente Seguras
```env
# Desenvolvimento
VITE_SUPABASE_URL=https://projeto.supabase.co
VITE_SUPABASE_ANON_KEY=chave-publica

# Produção (não commitar)
SUPABASE_SERVICE_ROLE_KEY=chave-privada-admin
```

## 🚨 Troubleshooting

### Erro: "Invalid API key"
- Verifique se as variáveis de ambiente estão corretas
- Confirme se o arquivo `.env` está na raiz do projeto
- Reinicie o servidor de desenvolvimento

### Erro: "relation does not exist"
- Verifique se as tabelas foram criadas no SQL Editor
- Confirme se está conectando ao projeto correto

### Erro: "Row Level Security"
- Verifique se as políticas RLS estão configuradas
- Para desenvolvimento, use políticas mais permissivas

### Erro de CORS
- O Supabase já configura CORS automaticamente
- Se persistir, verifique a URL do projeto

## 📚 Recursos Adicionais

### Documentação Oficial
- [Supabase Docs](https://supabase.com/docs)
- [JavaScript Client](https://supabase.com/docs/reference/javascript)
- [PostgreSQL](https://supabase.com/docs/guides/database)

### Ferramentas Úteis
- **Supabase Studio**: Interface visual para gerenciar dados
- **Database.design**: Para modelar banco de dados
- **Supabase CLI**: Para deploy e migrations

### Próximos Passos
1. **Implementar autenticação** com Supabase Auth
2. **Configurar realtime** para updates em tempo real
3. **Otimizar queries** com índices e views
4. **Implementar backup** automático
5. **Monitorar performance** no dashboard

---

🎉 **Parabéns!** Agora você tem o Supabase totalmente integrado ao seu projeto CashLog. A partir daqui, você pode focar no desenvolvimento dos componentes React sabendo que o backend está sólido e escalável. 