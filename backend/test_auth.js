/**
 * 🧪 SCRIPT DE TESTE - SISTEMA DE AUTENTICAÇÃO
 * Execute este arquivo para testar todos os endpoints de auth
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers,
      ...(data && { data })
    };
    
    const response = await axios(config);
    log(`✅ ${method} ${endpoint} - Status: ${response.status}`, 'green');
    return response.data;
  } catch (error) {
    const status = error.response?.status || 'ERRO';
    const message = error.response?.data?.message || error.message;
    log(`❌ ${method} ${endpoint} - Status: ${status} - ${message}`, 'red');
    return null;
  }
}

async function runTests() {
  log('\n🔐 INICIANDO TESTES DO SISTEMA DE AUTENTICAÇÃO\n', 'blue');
  
  // 1. Health Check
  log('1. Testando Health Check...', 'yellow');
  await testEndpoint('GET', '/auth/health');
  
  // 2. Registro de usuário
  log('\n2. Testando Registro de Usuário...', 'yellow');
  const userData = {
    nome: 'Usuário Teste',
    email: 'teste@cashlog.com',
    senha: 'MinhaSenh@123',
    confirmarSenha: 'MinhaSenh@123'
  };
  const registerResult = await testEndpoint('POST', '/auth/register', userData);
  
  // 3. Login
  log('\n3. Testando Login...', 'yellow');
  const loginData = {
    email: 'teste@cashlog.com',
    senha: 'MinhaSenh@123'
  };
  const loginResult = await testEndpoint('POST', '/auth/login', loginData);
  
  let token = null;
  if (loginResult && loginResult.data && loginResult.data.token) {
    token = loginResult.data.token;
    log(`Token obtido: ${token.substring(0, 20)}...`, 'green');
  }
  
  // 4. Validar Token
  if (token) {
    log('\n4. Testando Validação de Token...', 'yellow');
    await testEndpoint('POST', '/auth/validate-token', { token });
    
    // 5. Obter Perfil
    log('\n5. Testando Obter Perfil...', 'yellow');
    const headers = { Authorization: `Bearer ${token}` };
    await testEndpoint('GET', '/auth/me', null, headers);
    
    // 6. Listar Sessões
    log('\n6. Testando Listar Sessões...', 'yellow');
    await testEndpoint('GET', '/auth/sessions', null, headers);
    
    // 7. Logout
    log('\n7. Testando Logout...', 'yellow');
    await testEndpoint('POST', '/auth/logout', null, headers);
  }
  
  // 8. Login com usuário admin
  log('\n8. Testando Login com Admin...', 'yellow');
  const adminLogin = {
    email: 'admin@cashlog.com',
    senha: 'admin123'
  };
  await testEndpoint('POST', '/auth/login', adminLogin);
  
  // 9. Forgot Password
  log('\n9. Testando Forgot Password...', 'yellow');
  await testEndpoint('POST', '/auth/forgot-password', { email: 'teste@cashlog.com' });
  
  log('\n🎉 TESTES CONCLUÍDOS!', 'blue');
  log('\nSe todos os endpoints retornaram status 200/201, o sistema está funcionando!', 'green');
}

// Executar testes
runTests().catch(error => {
  log(`\n💥 Erro durante os testes: ${error.message}`, 'red');
  process.exit(1);
}); 