# 🚀 Setup Rápido do Supabase para CashLog

## 📋 Passo 1: Criar Projeto no Supabase

1. **Acesse**: [supabase.com](https://supabase.com)
2. **Clique em**: "Start your project" 
3. **Faça login** com GitHub, Google ou email
4. **Clique**: "New Project"
5. **Configure**:
   - **Name**: `cashlog`
   - **Database Password**: Crie uma senha forte (anote!)
   - **Region**: Escolha a mais próxima do Brasil

## 📋 Passo 2: Configurar o Banco de Dados

1. **Acesse**: SQL Editor no painel do Supabase
2. **Copie todo o conteúdo** do arquivo `backend/src/config/database.sql`
3. **Cole no editor** e clique em **"RUN"**
4. ✅ **Sucesso!** Todas as tabelas, índices e categorias foram criadas

## 📋 Passo 3: Obter Credenciais

1. **Vá para**: Settings → API
2. **Copie**:
   - **Project URL**
   - **anon/public key** 
   - **service_role key** (clicar em "Reveal")

## 📋 Passo 4: Configurar Backend

1. **No backend**, copie o arquivo de exemplo:
   ```bash
   cd backend
   cp env.example .env
   ```

2. **Edite o `.env`** com suas credenciais:
   ```env
   PORT=3001
   NODE_ENV=development
   
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_ANON_KEY=sua_chave_anonima_aqui
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
   ```

## 📋 Passo 5: Testar a API

1. **Iniciar o servidor**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Testar endpoints**:
   ```bash
   # Health check
   curl http://localhost:3001/api/health
   
   # Listar categorias (deve mostrar as 8 categorias padrão)
   curl http://localhost:3001/api/gastos
   
   # Criar um gasto de teste
   curl -X POST http://localhost:3001/api/gastos \
     -H "Content-Type: application/json" \
     -d '{
       "valor": 50.00,
       "descricao": "Almoço no restaurante",
       "categoria_id": 1,
       "data": "2025-01-15"
     }'
   ```

## 🎯 Endpoints Disponíveis

### Gastos
- `GET /api/gastos` - Listar gastos (com filtros)
- `GET /api/gastos/:id` - Buscar gasto específico  
- `POST /api/gastos` - Criar gasto
- `PUT /api/gastos/:id` - Atualizar gasto
- `DELETE /api/gastos/:id` - Deletar gasto
- `GET /api/gastos/estatisticas` - Estatísticas

### Filtros de Gastos
```
GET /api/gastos?categoria_id=1
GET /api/gastos?mes=1&ano=2025
GET /api/gastos?data_inicio=2025-01-01&data_fim=2025-01-31
```

## 🗄️ Estrutura do Banco

### Tabelas Criadas:
- **categorias** - Categorias de gastos (8 padrão)
- **gastos** - Registro de gastos
- **metas** - Metas por categoria/período

### Categorias Padrão:
- 🍔 Alimentação
- 🚗 Transporte  
- 🏠 Moradia
- ⚕️ Saúde
- 📚 Educação
- 🎮 Lazer
- 👕 Roupas
- 📦 Outros

## ✅ Próximos Passos

1. ✅ **Backend funcionando** com Supabase
2. 🔄 **Implementar rotas de metas**
3. 🔄 **Implementar rotas de categorias**
4. 🔄 **Adicionar validações avançadas**
5. 🔄 **Implementar exportação CSV/PDF**

## 🐛 Solução de Problemas

### Erro de conexão:
- Verifique se as credenciais estão corretas no `.env`
- Confirme se o projeto Supabase está ativo

### Erro nas tabelas:
- Execute novamente o script SQL
- Verifique se não há erros no console do Supabase

### Erro de CORS:
- O CORS já está configurado no backend
- Verifique se o frontend está usando a URL correta

---
**✨ Pronto! Sua API está funcionando e integrada com o Supabase!** 