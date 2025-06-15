const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticação para validar tokens JWT do Supabase
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Token de acesso necessário',
      message: 'Faça login para continuar'
    });
  }

  try {
    // Verificar token usando o JWT secret do Supabase
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ 
      error: 'Token inválido',
      message: 'Token expirado ou inválido'
    });
  }
};

/**
 * Middleware opcional de autenticação (não bloqueia se não houver token)
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Ignora erro e continua sem usuário
      req.user = null;
    }
  }
  
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth
}; 