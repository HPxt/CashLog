# 🔐 CashLog Backend - Sistema Completo com Autenticação

Sistema backend completo para controle de gastos pessoais com **autenticação segura** e **monitoramento avançado**.

## 🚀 **RECURSOS IMPLEMENTADOS**

### **💰 Sistema Financeiro:**
- ✅ Gestão de gastos
- ✅ Categorias personalizáveis
- ✅ Metas financeiras
- ✅ Relatórios e estatísticas
- ✅ Dashboard completo

### **🔐 Sistema de Autenticação:**
- ✅ Cadastro e login seguros
- ✅ Hash de senhas com bcrypt
- ✅ Tokens JWT com sessões
- ✅ Reset de senha
- ✅ Verificação de email
- ✅ Gestão de perfil
- ✅ Controle de sessões múltiplas
- ✅ Bloqueio por tentativas (5 tentativas = 15min)

### **🛡️ Segurança Avançada:**
- ✅ Rate limiting inteligente
- ✅ Detecção de ataques (XSS, SQL Injection)
- ✅ Headers de segurança (Helmet)
- ✅ CORS configurado
- ✅ Sanitização de dados
- ✅ Logs de auditoria
- ✅ Monitoramento de performance
- ✅ Compliance OWASP/NIST/ISO

## 📦 **INSTALAÇÃO**

### **1. Clonar Repositório:**
```bash
git clone https://github.com/seu-usuario/CashLog.git
cd CashLog/backend
```

### **2. Instalar Dependências:**
```bash
npm install
```

### **3. Configurar Banco de Dados:**
1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Crie um novo projeto
3. Execute o script SQL: `src/config/auth_database.sql`

### **4. Configurar Variáveis de Ambiente:**
```env
# .env
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
SUPABASE_JWT_SECRET=seu_jwt_secret

NODE_ENV=development
PORT=3001
```

### **5. Iniciar Servidor:**
```bash
npm start
```

## 🧪 **TESTES**

### **Testar Sistema Completo:**
```bash
# Iniciar servidor em um terminal
npm start

# Em outro terminal, executar testes
node test_auth.js
```

### **Endpoints Principais:**
```bash
# Health Check
GET http://localhost:3001/api/health

# Autenticação
POST http://localhost:3001/api/auth/register
POST http://localhost:3001/api/auth/login
GET http://localhost:3001/api/auth/me

# Gastos
GET http://localhost:3001/api/gastos
POST http://localhost:3001/api/gastos

# Segurança
GET http://localhost:3001/api/security/health
GET http://localhost:3001/api/security/report
```

## 📊 **API ENDPOINTS**

### **🔐 Autenticação:**
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Cadastrar usuário | ❌ |
| POST | `/api/auth/login` | Login | ❌ |
| POST | `/api/auth/logout` | Logout | ✅ |
| GET | `/api/auth/me` | Dados do usuário | ✅ |
| POST | `/api/auth/forgot-password` | Solicitar reset | ❌ |
| POST | `/api/auth/reset-password` | Confirmar reset | ❌ |
| POST | `/api/auth/verify-email` | Verificar email | ❌ |
| GET | `/api/auth/sessions` | Listar sessões | ✅ |
| PUT | `/api/auth/profile` | Atualizar perfil | ✅ |
| POST | `/api/auth/change-password` | Alterar senha | ✅ |

### **💰 Financeiro:**
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/gastos` | Listar gastos | ✅ |
| POST | `/api/gastos` | Criar gasto | ✅ |
| PUT | `/api/gastos/:id` | Atualizar gasto | ✅ |
| DELETE | `/api/gastos/:id` | Deletar gasto | ✅ |
| GET | `/api/categorias` | Listar categorias | ✅ |
| GET | `/api/metas` | Listar metas | ✅ |

### **🛡️ Segurança:**
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/security/health` | Status segurança | ❌ |
| GET | `/api/security/report` | Relatório 24h | ✅ |
| GET | `/api/security/audit-logs` | Logs auditoria | ✅ |
| GET | `/api/security/events` | Eventos segurança | ✅ |

## 🔑 **USUÁRIO ADMINISTRADOR**

### **Credenciais Padrão:**
- **Email:** admin@cashlog.com
- **Senha:** admin123

⚠️ **ALTERE A SENHA EM PRODUÇÃO!**

## 🛡️ **RECURSOS DE SEGURANÇA**

### **Validações de Senha:**
- Mínimo 8 caracteres
- 1 letra minúscula
- 1 letra maiúscula
- 1 número
- 1 caractere especial
- Não permite senhas comuns

### **Rate Limiting:**
- Geral: 100 req/15min
- Auth: 5 req/15min
- Criação: 20 req/5min
- Consultas: 10 req/1min

### **Monitoramento:**
- Logs de auditoria
- Detecção de ataques
- Performance tracking
- Sessões ativas
- Tentativas de login

## 📁 **ESTRUTURA DO PROJETO**

```
backend/
├── src/
│   ├── config/
│   │   ├── supabase.js          # Configuração Supabase
│   │   └── auth_database.sql    # Script SQL completo
│   ├── controllers/
│   │   ├── authController.js    # Controller autenticação
│   │   ├── gastosController.js  # Controller gastos
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.js             # Middleware autenticação
│   │   ├── security.js         # Middleware segurança
│   │   ├── audit.js            # Middleware auditoria
│   │   └── advancedValidation.js
│   ├── routes/
│   │   ├── auth.js             # Rotas autenticação
│   │   ├── gastos.js           # Rotas gastos
│   │   └── ...
│   ├── services/
│   │   └── authService.js      # Service autenticação
│   ├── validations/
│   │   └── authValidation.js   # Validações auth
│   └── app.js                  # App principal
├── test_auth.js                # Script de testes
├── package.json
└── README.md
```

## 🚀 **DEPLOY**

### **Variáveis de Produção:**
```env
NODE_ENV=production
SUPABASE_URL=sua_url_producao
SUPABASE_SERVICE_ROLE_KEY=sua_chave_producao
SUPABASE_JWT_SECRET=jwt_secret_forte
```

### **Comandos de Deploy:**
```bash
# Build para produção
npm run build

# Iniciar em produção
npm run start:prod
```

## 📈 **MONITORAMENTO**

### **Logs Disponíveis:**
- `logs/security.log` - Eventos de segurança
- `logs/audit.log` - Auditoria de ações
- `logs/performance.log` - Performance
- `logs/auth.log` - Autenticação

### **Métricas:**
- Tentativas de login
- Sessões ativas
- Ataques detectados
- Performance de endpoints
- Uso de recursos

## 🤝 **CONTRIBUIÇÃO**

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'Add nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

## 📄 **LICENÇA**

Este projeto está sob a licença MIT.

## 🆘 **SUPORTE**

- 📧 Email: suporte@cashlog.com
- 📱 Issues: [GitHub Issues](https://github.com/seu-usuario/CashLog/issues)
- 📖 Docs: [Documentação Completa](https://docs.cashlog.com)

---

**🎉 Sistema CashLog - Controle Financeiro Seguro e Completo!**

Desenvolvido com ❤️ usando Node.js, Express, Supabase e as melhores práticas de segurança. 