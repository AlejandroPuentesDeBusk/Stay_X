// backend/src/core/errors.js
/**
 * Errores AppError y códigos ERR compatibles con el errorHandler existente
 */

// Reexportar AppError del middleware existente para compatibilidad
export { AppError } from '../middlewares/error.js';

// Códigos de error estándar
export const ERR = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN', 
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
};