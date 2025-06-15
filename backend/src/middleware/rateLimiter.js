/**
 * Rate Limiter simples usando Map para armazenar tentativas
 * Em produção, considere usar Redis para cache distribuído
 */

const attempts = new Map();

/**
 * Middleware de rate limiting
 * @param {number} maxAttempts - Máximo de tentativas
 * @param {number} windowMs - Janela de tempo em milissegundos
 */
const rateLimiter = (maxAttempts = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const currentTime = Date.now();
    
    // Limpar tentativas antigas
    for (const [ip, data] of attempts) {
      if (currentTime - data.firstAttempt > windowMs) {
        attempts.delete(ip);
      }
    }

    // Verificar tentativas do IP atual
    const clientAttempts = attempts.get(clientIp);
    
    if (!clientAttempts) {
      // Primeira tentativa
      attempts.set(clientIp, {
        count: 1,
        firstAttempt: currentTime
      });
      return next();
    }

    // Verificar se a janela de tempo expirou
    if (currentTime - clientAttempts.firstAttempt > windowMs) {
      // Reset do contador
      attempts.set(clientIp, {
        count: 1,
        firstAttempt: currentTime
      });
      return next();
    }

    // Incrementar contador
    clientAttempts.count++;

    // Verificar se excedeu o limite
    if (clientAttempts.count > maxAttempts) {
      const remainingTime = Math.ceil((windowMs - (currentTime - clientAttempts.firstAttempt)) / 1000);
      
      return res.status(429).json({
        error: 'Muitas tentativas',
        message: `Limite de ${maxAttempts} tentativas excedido. Tente novamente em ${remainingTime} segundos.`,
        retryAfter: remainingTime
      });
    }

    // Adicionar headers informativos
    res.set({
      'X-RateLimit-Limit': maxAttempts,
      'X-RateLimit-Remaining': Math.max(0, maxAttempts - clientAttempts.count),
      'X-RateLimit-Reset': new Date(clientAttempts.firstAttempt + windowMs).toISOString()
    });

    next();
  };
};

/**
 * Rate limiter específico para login (mais restritivo)
 */
const loginRateLimiter = rateLimiter(5, 15 * 60 * 1000); // 5 tentativas por 15 minutos

/**
 * Rate limiter geral para API
 */
const apiRateLimiter = rateLimiter(100, 15 * 60 * 1000); // 100 tentativas por 15 minutos

module.exports = {
  rateLimiter,
  loginRateLimiter,
  apiRateLimiter
}; 