# 💰 CashLog - Sistema de Controle de Gastos Pessoais

Sistema completo para controle e monitoramento de gastos pessoais com dashboard interativo, gráficos e exportação de dados.

## 🎯 Funcionalidades Principais

| Funcionalidade | Descrição |
|---|---|
| **Cadastrar gasto** | Formulário com valor, data, categoria, descrição |
| **Listar gastos** | Tabela filtrável por data/categoria |
| **Visualizar gráfico** | Gráfico de pizza ou barra com porcentagem por categoria |
| **Estabelecer metas** | Meta mensal por categoria |
| **Exportar dados** | Exportação para CSV/PDF |
| **Dashboard** | Resumo de total gasto, meta e restante disponível |

## 🛠️ Stack Tecnológica

- **Frontend**: React + Vite
- **Estilização**: Tailwind CSS
- **Backend**: Node.js + Express
- **Banco de Dados**: Supabase (PostgreSQL)
- **Gráficos**: Chart.js / Recharts
- **Exportação**: jsPDF + json2csv
- **Roteamento**: React Router DOM

## 📋 Cronograma de Desenvolvimento

### 📅 Semana 1 – Planejamento e Base Técnica

#### 1. Definir Requisitos e Funcionalidades
- [x] Cadastro de gastos (data, valor, categoria, descrição)
- [x] Visualização por mês
- [x] Gráfico de despesas por categoria
- [x] Metas de gasto por categoria ou geral
- [x] Exportação para CSV ou PDF

#### 2. Setup do Ambiente
- [ ] Configurar projeto React com Vite
- [ ] Configurar Supabase
- [ ] Instalar dependências
- [ ] Configurar Tailwind CSS

### 📅 Semana 2 – Desenvolvimento do CRUD e UI

#### 3. Estrutura Inicial do Projeto
```bash
npx create-vite cashlog --template react
cd cashlog
npm install
```

#### 4. Dependências Necessárias
```bash
# UI e Navegação
npm install react-router-dom tailwindcss

# Banco de dados
npm install @supabase/supabase-js

# Gráficos
npm install chart.js react-chartjs-2

# Exportação
npm install jspdf json2csv

# Utilitários
npm install date-fns lucide-react
```

#### 5. Componentes Principais
- [ ] Formulário de cadastro de gasto
- [ ] Tabela/listagem de gastos
- [ ] Filtros por mês/categoria
- [ ] Página ou modal para meta de gasto
- [ ] Gráfico de pizza ou barras
- [ ] Dashboard principal

### 📅 Semana 3 – Exportação e Refinamento

#### 6. Funcionalidades Avançadas
- [ ] Exportação para CSV
- [ ] Exportação para PDF
- [ ] Validação de formulários
- [ ] Feedbacks visuais
- [ ] Responsividade

#### 7. Testes e Ajustes Finais
- [ ] Testes de CRUD
- [ ] Otimização de performance
- [ ] Refatoração do código

## 🗄️ Modelagem do Banco de Dados (Supabase)

### Tabela: `gastos`
```sql
CREATE TABLE gastos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  valor DECIMAL(10,2) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  descricao TEXT,
  data DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `metas`
```sql
CREATE TABLE metas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria VARCHAR(50) NOT NULL UNIQUE,
  valor_mensal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `categorias`
```sql
CREATE TABLE categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(50) NOT NULL UNIQUE,
  cor VARCHAR(7) DEFAULT '#3B82F6',
  icone VARCHAR(50) DEFAULT 'shopping-cart',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Configuração do Supabase

### 1. Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta e um novo projeto
3. Anote a `URL` e `anon key` do projeto

### 2. Configurar Variáveis de Ambiente
Crie o arquivo `.env`:
```env
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 3. Configurar Cliente Supabase
```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### 4. Políticas de Segurança (RLS)
```sql
-- Habilitar RLS nas tabelas
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- Permitir operações básicas (ajustar conforme necessário)
CREATE POLICY "Permitir tudo em gastos" ON gastos FOR ALL USING (true);
CREATE POLICY "Permitir tudo em metas" ON metas FOR ALL USING (true);
CREATE POLICY "Permitir tudo em categorias" ON categorias FOR ALL USING (true);
```

## 🔄 CRUD com Supabase

### Operações de Gastos
```javascript
// src/services/gastos.js
import { supabase } from '../lib/supabase'

export const gastosService = {
  // Listar gastos
  async listar() {
    const { data, error } = await supabase
      .from('gastos')
      .select('*')
      .order('data', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Criar gasto
  async criar(gasto) {
    const { data, error } = await supabase
      .from('gastos')
      .insert([gasto])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Atualizar gasto
  async atualizar(id, gasto) {
    const { data, error } = await supabase
      .from('gastos')
      .update(gasto)
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Deletar gasto
  async deletar(id) {
    const { error } = await supabase
      .from('gastos')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Filtrar por período
  async filtrarPorPeriodo(dataInicio, dataFim) {
    const { data, error } = await supabase
      .from('gastos')
      .select('*')
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .order('data', { ascending: false })
    
    if (error) throw error
    return data
  }
}
```

## 👥 Divisão de Tarefas (2 Pessoas)

### 👤 Pessoa A (Frontend/UI)
- [ ] Setup inicial do projeto React
- [ ] Configuração do Tailwind CSS
- [ ] Criação do layout principal
- [ ] Componentes de formulário
- [ ] Componentes de visualização (tabelas, cards)
- [ ] Implementação de gráficos
- [ ] Responsividade

### 👤 Pessoa B (Backend/Lógica)
- [ ] Configuração do Supabase
- [ ] Criação das tabelas no banco
- [ ] Implementação dos services (CRUD)
- [ ] Lógica de cálculos (totais, metas)
- [ ] Funcionalidades de exportação
- [ ] Validações e tratamento de erros

## 📁 Estrutura de Pastas

```
src/
├── components/
│   ├── ui/              # Componentes reutilizáveis
│   ├── gastos/          # Componentes específicos de gastos
│   ├── metas/           # Componentes de metas
│   └── graficos/        # Componentes de gráficos
├── pages/               # Páginas principais
├── services/            # Serviços de API
├── lib/                 # Configurações (Supabase, etc)
├── utils/               # Funções utilitárias
├── hooks/               # Custom hooks
└── styles/              # Arquivos de estilo
```

## 🚀 Como Executar o Projeto

### 1. Clonar e Instalar
```bash
git clone <seu-repositorio>
cd cashlog
npm install
```

### 2. Configurar Ambiente
```bash
cp .env.example .env
# Editar .env com suas credenciais do Supabase
```

### 3. Executar
```bash
npm run dev
```

## 📊 Extras Opcionais

- [ ] **Tema claro/escuro**
- [ ] **Autenticação com Supabase Auth**
- [ ] **Notificações push**
- [ ] **Backup automático**
- [ ] **Dashboard avançado com mais métricas**
- [ ] **Categorias personalizáveis**
- [ ] **Importação de dados via CSV/OFX**

## 🔗 Links Úteis

- [Documentação Supabase](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Chart.js](https://www.chartjs.org/docs/)
- [React Router](https://reactrouter.com/)

---

**Desenvolvido com ❤️ para controle financeiro pessoal**
