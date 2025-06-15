const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const { rateLimiters } = require('../middleware/security');
const { 
  generateSecurityReport, 
  getAuditLogs, 
  securityEvents, 
  performanceLogs 
} = require('../middleware/audit');
const { validateQueryParams } = require('../middleware/advancedValidation');
const { securityHealthCheck } = require('../middleware/security');

/**
 * 🛡️ ROTAS DE SEGURANÇA E MONITORAMENTO
 */

// Rate limiting específico para rotas de segurança
router.use(rateLimiters.heavyQuery);

/**
 * GET /api/security/health
 * Health check de segurança
 */
router.get('/health', (req, res) => {
  try {
    const healthData = securityHealthCheck();
    
    res.json({
      success: true,
      data: healthData,
      message: 'Sistema de segurança operacional'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar saúde do sistema',
      message: error.message
    });
  }
});

/**
 * GET /api/security/report
 * Relatório de segurança das últimas 24h
 * Requer autenticação
 */
router.get('/report', authenticateToken, (req, res) => {
  try {
    const report = generateSecurityReport();
    
    res.json({
      success: true,
      data: report,
      message: 'Relatório de segurança gerado'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar relatório',
      message: error.message
    });
  }
});

/**
 * GET /api/security/audit-logs
 * Logs de auditoria com filtros
 * Requer autenticação
 */
router.get('/audit-logs', 
  authenticateToken,
  ...validateQueryParams.pagination,
  (req, res) => {
    try {
      const { page = 1, limit = 50, method, status_code, time_from } = req.query;
      
      const filters = {};
      if (method) filters.method = method.toUpperCase();
      if (status_code) filters.statusCode = parseInt(status_code);
      if (time_from) filters.timeFrom = time_from;
      
      const logs = getAuditLogs(limit, filters);
      
      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: logs.length
          }
        },
        message: 'Logs de auditoria recuperados'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao recuperar logs',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/security/events
 * Eventos de segurança
 * Requer autenticação
 */
router.get('/events', 
  authenticateToken,
  ...validateQueryParams.pagination,
  (req, res) => {
    try {
      const { page = 1, limit = 50, severity, type } = req.query;
      
      let events = [...securityEvents];
      
      // Filtrar por severidade
      if (severity) {
        events = events.filter(event => event.severity === severity);
      }
      
      // Filtrar por tipo
      if (type) {
        events = events.filter(event => event.type === type);
      }
      
      // Ordenar por timestamp (mais recente primeiro)
      events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Paginação
      const startIndex = (page - 1) * limit;
      const paginatedEvents = events.slice(startIndex, startIndex + limit);
      
      res.json({
        success: true,
        data: {
          events: paginatedEvents,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: events.length,
            totalPages: Math.ceil(events.length / limit)
          }
        },
        message: 'Eventos de segurança recuperados'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao recuperar eventos',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/security/performance
 * Logs de performance
 * Requer autenticação
 */
router.get('/performance', 
  authenticateToken,
  ...validateQueryParams.pagination,
  (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      
      // Ordenar por tempo de resposta (mais lento primeiro)
      const sortedLogs = [...performanceLogs].sort((a, b) => b.responseTime - a.responseTime);
      
      // Paginação
      const startIndex = (page - 1) * limit;
      const paginatedLogs = sortedLogs.slice(startIndex, startIndex + limit);
      
      // Estatísticas
      const stats = {
        totalSlowRequests: performanceLogs.length,
        averageResponseTime: performanceLogs.reduce((sum, log) => sum + log.responseTime, 0) / performanceLogs.length || 0,
        slowestRequest: sortedLogs[0] || null
      };
      
      res.json({
        success: true,
        data: {
          logs: paginatedLogs,
          statistics: stats,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: sortedLogs.length,
            totalPages: Math.ceil(sortedLogs.length / limit)
          }
        },
        message: 'Logs de performance recuperados'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro ao recuperar logs de performance',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/security/stats
 * Estatísticas gerais de segurança
 * Requer autenticação
 */
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Contar eventos por severidade
    const eventsBySeverity = securityEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {});
    
    // Eventos recentes
    const recentEvents = securityEvents.filter(event => 
      new Date(event.timestamp) > last24h
    );
    
    // Performance stats
    const slowRequests = performanceLogs.length;
    const avgResponseTime = performanceLogs.length > 0 
      ? performanceLogs.reduce((sum, log) => sum + log.responseTime, 0) / performanceLogs.length 
      : 0;
    
    const stats = {
      timestamp: now.toISOString(),
      security: {
        totalEvents: securityEvents.length,
        recentEvents: recentEvents.length,
        eventsBySeverity,
        criticalEvents: securityEvents.filter(e => e.severity === 'critical').length
      },
      performance: {
        slowRequests,
        averageResponseTime: Math.round(avgResponseTime * 100) / 100,
        requestsOverThreshold: performanceLogs.filter(log => log.responseTime > 2000).length
      },
      audit: {
        totalLogs: getAuditLogs(99999).length,
        errorsCount: getAuditLogs(99999).filter(log => log.response.statusCode >= 400).length
      }
    };
    
    res.json({
      success: true,
      data: stats,
      message: 'Estatísticas de segurança recuperadas'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao recuperar estatísticas',
      message: error.message
    });
  }
});

/**
 * POST /api/security/clear-logs
 * Limpar logs antigos (apenas desenvolvimento)
 * Requer autenticação
 */
router.post('/clear-logs', authenticateToken, (req, res) => {
  try {
    // Apenas em desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Operação não permitida em produção',
        message: 'Limpeza de logs não é permitida em ambiente de produção'
      });
    }
    
    // Limpar arrays
    securityEvents.length = 0;
    performanceLogs.length = 0;
    
    res.json({
      success: true,
      message: 'Logs limpos com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao limpar logs',
      message: error.message
    });
  }
});

module.exports = router; 