# 💰 CashLog - Sistema de Controle de Gastos Pessoais

Sistema completo para controle e monitoramento de gastos pessoais desenvolvido com React (frontend) e Node.js + Express (backend), utilizando Supabase como banco de dados.

## 🚀 Como Executar o Projeto

### 📋 Pré-requisitos
- Node.js (versão 18 ou superior)
- npm ou yarn
- Conta no Supabase

### ⚙️ Configuração

#### 1. Backend
```bash
# Navegar para o backend
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp env.example .env
# Editar .env com suas credenciais do Supabase

# Executar em desenvolvimento
npm run dev

# Executar em produção
npm start
```

#### 2. Frontend
```bash
# Navegar para o frontend
cd frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Criar arquivo .env com:
# VITE_SUPABASE_URL=sua_url_do_supabase
# VITE_SUPABASE_ANON_KEY=sua_chave_anonima

# Executar em desenvolvimento
npm run dev
```

### 🗄️ Configuração do Banco de Dados
Consulte o arquivo `SUPABASE_SETUP.md` para instruções detalhadas de configuração do Supabase.

## 📚 Documentação

- **[Planejamento.md](./Planejamento.md)** - Documentação completa do projeto, cronograma e funcionalidades
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Guia de configuração do Supabase
- **[Backend README](./backend/README.md)** - Documentação específica da API

## 🛠️ Stack Tecnológica

### Frontend
- React + Vite
- Tailwind CSS
- Chart.js (gráficos)
- React Router Dom

### Backend
- Node.js + Express
- Supabase (PostgreSQL)
- CORS + Dotenv

## 🎯 Funcionalidades

- ✅ Cadastro de gastos (valor, data, categoria, descrição)
- ✅ Visualização por mês
- ✅ Gráficos de despesas por categoria
- ✅ Metas de gasto por categoria
- ✅ Dashboard com resumo financeiro
- ✅ Exportação para CSV/PDF
- ✅ API REST completa

## 🤝 Desenvolvimento

Este projeto foi planejado para desenvolvimento em equipe:
- **Pessoa A**: Frontend/UI (React + Tailwind)
- **Pessoa B**: Backend/API (Node.js + Supabase)

## 📞 Suporte

Consulte a documentação nos arquivos de planejamento ou abra uma issue para dúvidas e sugestões.

---
**Desenvolvido com ❤️ para controle financeiro pessoal** 