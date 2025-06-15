const fs = require('fs').promises;
const path = require('path');

/**
 * 📊 SISTEMA DE AUDITORIA E MONITORAMENTO
 */

// Armazenar logs em memória (em produção, usar banco de dados)
const auditLogs = [];
const securityEvents = [];
const performanceLogs = [];

/**
 * Garantir que o diretório de logs existe
 */
const ensureLogDirectory = async () => {
  const logDir = path.join(__dirname, '../../logs');
  try {
    await fs.access(logDir);
  } catch {
    await fs.mkdir(logDir, { recursive: true });
  }
  return logDir;
};

/**
 * Salvar log em arquivo
 */
const saveLogToFile = async (filename, data) => {
  try {
    const logDir = await ensureLogDirectory();
    const filePath = path.join(logDir, `${filename}_${new Date().toISOString().split('T')[0]}.log`);
    
    await fs.appendFile(filePath, JSON.stringify(data) + '\n');
  } catch (error) {
    console.error('Erro ao salvar log:', error);
  }
};

/**
 * Middleware de auditoria para todas as operações
 */
const auditMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;
  
  // Interceptar a resposta
  res.send = function(body) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const auditLog = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      request: {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        headers: filterSensitiveHeaders(req.headers),
        body: filterSensitiveData(req.body),
        query: req.query,
        params: req.params
      },
      response: {
        statusCode: res.statusCode,
        responseTime: responseTime,
        size: Buffer.byteLength(body, 'utf8')
      },
      user: req.user ? { id: req.user.sub, email: req.user.email } : null,
      session: req.sessionID || 'anonymous'
    };

    // Adicionar à lista de logs
    auditLogs.push(auditLog);
    
    // Manter apenas os últimos 1000 logs em memória
    if (auditLogs.length > 1000) {
      auditLogs.shift();
    }

    // Salvar em arquivo para logs importantes
    if (res.statusCode >= 400 || req.method !== 'GET') {
      saveLogToFile('audit', auditLog);
    }

    // Log de performance (requisições lentas)
    if (responseTime > 1000) {
      const perfLog = {
        timestamp: new Date().toISOString(),
        url: req.originalUrl,
        method: req.method,
        responseTime,
        ip: req.ip,
        slow: true
      };
      
      performanceLogs.push(perfLog);
      saveLogToFile('performance', perfLog);
      
      console.warn(`⚠️ REQUISIÇÃO LENTA (${responseTime}ms):`, req.method, req.originalUrl);
    }

    originalSend.call(this, body);
  };

  next();
};

/**
 * Middleware para eventos de segurança
 */
const securityEventLogger = (eventType, details) => {
  const securityEvent = {
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    type: eventType,
    severity: getSeverity(eventType),
    details,
    ip: details.ip || 'unknown'
  };

  securityEvents.push(securityEvent);
  
  // Manter apenas os últimos 500 eventos
  if (securityEvents.length > 500) {
    securityEvents.shift();
  }

  // Salvar eventos críticos
  if (securityEvent.severity === 'high' || securityEvent.severity === 'critical') {
    saveLogToFile('security', securityEvent);
    console.error(`🚨 EVENTO DE SEGURANÇA ${securityEvent.severity.toUpperCase()}:`, securityEvent);
  }

  return securityEvent.id;
};

/**
 * Filtrar dados sensíveis dos logs
 */
const filterSensitiveData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const filtered = { ...data };
  const sensitiveKeys = ['password', 'senha', 'token', 'secret', 'key', 'authorization'];
  
  for (const key of Object.keys(filtered)) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      filtered[key] = '[REDACTED]';
    }
  }
  
  return filtered;
};

/**
 * Filtrar headers sensíveis
 */
const filterSensitiveHeaders = (headers) => {
  const filtered = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  
  for (const header of sensitiveHeaders) {
    if (filtered[header]) {
      filtered[header] = '[REDACTED]';
    }
  }
  
  return filtered;
};

/**
 * Determinar severidade do evento
 */
const getSeverity = (eventType) => {
  const severityMap = {
    'login_failed': 'medium',
    'login_success': 'low',
    'sql_injection_attempt': 'critical',
    'xss_attempt': 'high',
    'rate_limit_exceeded': 'medium',
    'unauthorized_access': 'high',
    'data_breach_attempt': 'critical',
    'suspicious_activity': 'medium'
  };
  
  return severityMap[eventType] || 'low';
};

/**
 * Middleware para detectar tentativas de login
 */
const loginAttemptLogger = (req, res, next) => {
  if (req.path.includes('login') || req.path.includes('auth')) {
    const originalSend = res.send;
    
    res.send = function(body) {
      const isSuccess = res.statusCode === 200;
      const eventType = isSuccess ? 'login_success' : 'login_failed';
      
      securityEventLogger(eventType, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        email: req.body?.email || 'unknown',
        success: isSuccess,
        timestamp: new Date().toISOString()
      });
      
      originalSend.call(this, body);
    };
  }
  
  next();
};

/**
 * Gerar relatório de segurança
 */
const generateSecurityReport = () => {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const recentEvents = securityEvents.filter(event => 
    new Date(event.timestamp) > last24h
  );
  
  const eventsByType = recentEvents.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {});
  
  const eventsBySeverity = recentEvents.reduce((acc, event) => {
    acc[event.severity] = (acc[event.severity] || 0) + 1;
    return acc;
  }, {});
  
  return {
    timestamp: now.toISOString(),
    period: 'last_24_hours',
    totalEvents: recentEvents.length,
    eventsByType,
    eventsBySeverity,
    topIPs: getTopIPs(recentEvents),
    recommendations: generateRecommendations(recentEvents)
  };
};

/**
 * Obter IPs com mais eventos
 */
const getTopIPs = (events) => {
  const ipCounts = events.reduce((acc, event) => {
    const ip = event.ip || 'unknown';
    acc[ip] = (acc[ip] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(ipCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([ip, count]) => ({ ip, count }));
};

/**
 * Gerar recomendações baseadas nos eventos
 */
const generateRecommendations = (events) => {
  const recommendations = [];
  
  const criticalEvents = events.filter(e => e.severity === 'critical');
  if (criticalEvents.length > 0) {
    recommendations.push('Investigar imediatamente eventos críticos detectados');
  }
  
  const failedLogins = events.filter(e => e.type === 'login_failed');
  if (failedLogins.length > 10) {
    recommendations.push('Considerar implementar bloqueio temporário por IP após múltiplas tentativas');
  }
  
  const suspiciousActivity = events.filter(e => e.type === 'suspicious_activity');
  if (suspiciousActivity.length > 5) {
    recommendations.push('Revisar e melhorar detecção de atividades suspeitas');
  }
  
  return recommendations;
};

/**
 * Endpoint para obter logs de auditoria
 */
const getAuditLogs = (limit = 100, filter = {}) => {
  let logs = [...auditLogs];
  
  // Aplicar filtros
  if (filter.method) {
    logs = logs.filter(log => log.request.method === filter.method);
  }
  
  if (filter.statusCode) {
    logs = logs.filter(log => log.response.statusCode === filter.statusCode);
  }
  
  if (filter.timeFrom) {
    logs = logs.filter(log => new Date(log.timestamp) >= new Date(filter.timeFrom));
  }
  
  // Ordenar por timestamp (mais recente primeiro)
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return logs.slice(0, limit);
};

module.exports = {
  auditMiddleware,
  securityEventLogger,
  loginAttemptLogger,
  generateSecurityReport,
  getAuditLogs,
  securityEvents,
  performanceLogs
}; 