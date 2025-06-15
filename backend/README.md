# 🔥 CashLog Backend

API REST para o sistema de controle de gastos pessoais CashLog.

## 🚀 Tecnologias

- **Node.js** + **Express.js**
- **Supabase** (PostgreSQL)
- **CORS** para requisições cross-origin
- **Dotenv** para variáveis de ambiente

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── app.js              # Servidor principal
│   ├── routes/             # Rotas da API
│   ├── controllers/        # Lógica dos controllers
│   ├── services/           # Serviços e lógica de negócio
│   ├── middleware/         # Middlewares customizados
│   ├── config/             # Configurações
│   └── utils/              # Funções utilitárias
├── package.json
└── env.example             # Exemplo de variáveis de ambiente
```

## ⚙️ Configuração

1. **Instalar dependências:**
```bash
npm install
```

2. **Configurar variáveis de ambiente:**
```bash
cp env.example .env
# Editar .env com suas credenciais do Supabase
```

3. **Executar em desenvolvimento:**
```bash
npm run dev
```

4. **Executar em produção:**
```bash
npm start
```

## 🔗 Endpoints da API

### Health Check
- `GET /api/health` - Verifica se a API está funcionando

### Gastos (em desenvolvimento)
- `GET /api/gastos` - Listar gastos
- `POST /api/gastos` - Criar gasto
- `PUT /api/gastos/:id` - Atualizar gasto
- `DELETE /api/gastos/:id` - Deletar gasto

### Metas (em desenvolvimento)
- `GET /api/metas` - Listar metas
- `POST /api/metas` - Criar meta
- `PUT /api/metas/:id` - Atualizar meta
- `DELETE /api/metas/:id` - Deletar meta

### Categorias (em desenvolvimento)
- `GET /api/categorias` - Listar categorias
- `POST /api/categorias` - Criar categoria

## 🧪 Testando a API

```bash
# Verificar se está funcionando
curl http://localhost:3001/api/health
```

## 🔧 Desenvolvimento

O servidor roda na porta **3001** por padrão e possui hot-reload com nodemon durante o desenvolvimento. 