// src/middlewares/auth.js
import { verifyRawJwt } from '../auth/jwt.js';
import { AppError, ERR } from '../core/errors.js';
import logger from '../core/logger.js';

function getAccessToken(req) {
  const authHeader = req.headers?.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  const token = req.cookies?.il_access;
  if (token) {
    return token;
  }

  return null;
}

export const authJwt = ({ optional = false } = {}) => {
  return (req, res, next) => {
    // Primero, nos aseguramos de que el contexto base exista.
    if (!req.ctx) {
        req.ctx = { requestId: req.id };
    }

    const token = getAccessToken(req);

    if (!token) {
      if (optional) return next();
      return next(new AppError('Token de acceso no encontrado. Por favor, inicia sesión.', 401, ERR.UNAUTHORIZED));
    }

    const payload = verifyRawJwt(token);

    if (!payload) {
      return next(new AppError('El token de acceso es inválido o ha expirado.', 401, ERR.UNAUTHORIZED));
    }

    const userId = payload.sub;

    if (!userId) {
      logger.error({ payload }, 'CRITICAL: Token is missing user ID (sub).');
      return next(new AppError('Tu sesión es inválida. Por favor, inicia sesión de nuevo.', 401, ERR.UNAUTHORIZED));
    }

    // Poblamos el contexto de la petición de forma segura
    req.ctx.userId = userId;
    // ELIMINADO: req.ctx.tenantId = tenantId;
    req.ctx.roles = payload.roles || [];

    // Para compatibilidad con otras partes del código
    req.user = {
      id: userId,
      // ELIMINADO: tenant_id: null,
      roles: payload.roles || [],
    };

    logger.info({ userId: req.ctx.userId, roles: req.ctx.roles }, 'JWT Payload Verified');
    return next();
  };
};

export const requireAuth = authJwt({ optional: false });

export function requireRole(role) {
  return (req, res, next) => {
    const roles = req.ctx?.roles || [];
    if (!roles.includes(role)) {
      return next(new AppError('Permisos insuficientes.', 403, ERR.FORBIDDEN));
    }
    next();
  };
}

export const authOptional = authJwt({ optional: true });