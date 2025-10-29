// backend/src/auth/rbac.js
import { AppError, ERR } from '../core/errors.js';

/**
 * Middleware RBAC - requiere al menos uno de los roles especificados
 * @param {...string} roles - Roles requeridos
 * @returns {Function} Middleware de Express
 */
export const requireRoles = (...roles) => {
  return (req, res, next) => {
    const userRoles = req.ctx?.roles || [];
    
    const hasRequiredRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      throw new AppError(
        'Insufficient permissions',
        403,
        ERR.FORBIDDEN
      );
    }
    
    next();
  };
};