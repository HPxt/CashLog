const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const morgan = require('morgan');

/**
 * 🛡️ MIDDLEWARE DE SEGURANÇA AVANÇADO
 */

/**
 * Configuração do Helmet para headers de segurança
 */
const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // Outras configurações de segurança
  crossOriginEmbedderPolicy: false, // Para compatibilidade com Supabase
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

/**
 * Rate limiting mais robusto para diferentes endpoints
 */
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Rate limit excedido',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Função para gerar chave única por IP
    keyGenerator: (req) => {
      return req.ip || req.connection.remoteAddress || 'unknown';
    }
  });
};

/**
 * Rate limiters específicos
 */
const rateLimiters = {
  // API geral: 100 req/15min
  general: createRateLimit(15 * 60 * 1000, 100, 'Muitas requisições. Tente novamente em 15 minutos.'),
  
  // Login: 5 tentativas/15min
  auth: createRateLimit(15 * 60 * 1000, 5, 'Muitas tentativas de login. Tente novamente em 15 minutos.'),
  
  // Criação de dados: 20 req/5min
  creation: createRateLimit(5 * 60 * 1000, 20, 'Muitas criações. Tente novamente em 5 minutos.'),
  
  // Queries pesadas: 10 req/1min
  heavyQuery: createRateLimit(60 * 1000, 10, 'Muitas consultas pesadas. Tente novamente em 1 minuto.')
};

/**
 * Slow down para reduzir velocidade de requisições suspeitas
 */
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutos
  delayAfter: 50, // Começar a atrasar após 50 requisições
  delayMs: () => 500, // Atrasar 500ms por requisição extra (nova sintaxe)
  maxDelayMs: 20000, // Máximo de 20 segundos de atraso
  validate: { delayMs: false } // Desabilitar warning
});

/**
 * Logging de segurança personalizado
 */
const securityLogger = morgan((tokens, req, res) => {
  const log = {
    timestamp: new Date().toISOString(),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: tokens['response-time'](req, res),
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    suspicious: false
  };

  // Detectar atividade suspeita
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /etc\/passwd/,  // File access attempts
    /admin|administrator/i,  // Admin probing
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(req.url) || pattern.test(req.get('User-Agent') || '')
  );

  if (isSuspicious || res.statusCode >= 400) {
    log.suspicious = true;
    console.warn('🚨 ATIVIDADE SUSPEITA DETECTADA:', JSON.stringify(log, null, 2));
  }

  return JSON.stringify(log);
});

/**
 * Middleware para sanitizar entradas
 */
const sanitizeInput = (req, res, next) => {
  // Função para sanitizar strings
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
        .replace(/javascript:/gi, '') // Remove javascript:
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitizar body, query e params
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

/**
 * Middleware para detectar e bloquear ataques
 */
const attackDetection = (req, res, next) => {
  const suspiciousRequests = new Map();
  const clientIp = req.ip || req.connection.remoteAddress;
  
  // Padrões de ataque
  const attackPatterns = {
    sqlInjection: /(\bunion\b|\bselect\b|\binsert\b|\bdelete\b|\bdrop\b|\btable\b)/i,
    xss: /<script|javascript:|onload=|onerror=/i,
    pathTraversal: /\.\.\//,
    commandInjection: /[;&|`$]/
  };

  let isAttack = false;
  const url = req.url.toLowerCase();
  const userAgent = (req.get('User-Agent') || '').toLowerCase();
  const bodyStr = JSON.stringify(req.body || {}).toLowerCase();

  // Verificar padrões de ataque
  for (const [type, pattern] of Object.entries(attackPatterns)) {
    if (pattern.test(url) || pattern.test(userAgent) || pattern.test(bodyStr)) {
      console.error(`🚨 ATAQUE ${type.toUpperCase()} DETECTADO:`, {
        ip: clientIp,
        url: req.url,
        userAgent: req.get('User-Agent'),
        body: req.body,
        timestamp: new Date().toISOString()
      });
      isAttack = true;
      break;
    }
  }

  if (isAttack) {
    return res.status(403).json({
      error: 'Acesso negado',
      message: 'Atividade suspeita detectada',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Middleware para CORS seguro
 */
const secureCors = (req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://cashlog.vercel.app', // Produção
  ];

  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
};

/**
 * Health check de segurança
 */
const securityHealthCheck = () => {
  return {
    timestamp: new Date().toISOString(),
    security: {
      helmet: 'active',
      rateLimit: 'active',
      sanitization: 'active',
      attackDetection: 'active',
      cors: 'configured'
    },
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  };
};

module.exports = {
  helmetConfig,
  rateLimiters,
  speedLimiter,
  securityLogger,
  sanitizeInput,
  attackDetection,
  secureCors,
  securityHealthCheck
}; 