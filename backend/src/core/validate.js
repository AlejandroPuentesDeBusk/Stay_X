// backend/src/core/validate.js
import { AppError, ERR } from './errors.js';

/**
 * Middleware de validación con Zod
 * @param {ZodSchema} schema - Schema de Zod para validar
 * @param {string} source - Fuente de datos: 'body' | 'query' | 'params'
 * @returns {Function} Middleware de Express
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      const parsed = schema.parse(data);
      req[source] = parsed;
      next();
    } catch (error) {
      throw new AppError(
        'Validation failed',
        422,
        ERR.VALIDATION_FAILED,
        { issues: error.issues }
      );
    }
  };
};