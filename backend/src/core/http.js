// backend/src/core/http.js
/**
 * Respuestas HTTP estándar unificadas
 * Formato: { success: true, data, meta?, timestamp, requestId }
 */

const getRequestId = (req) => req.req.id || req.req.headers['x-request-id'];

export const ok = (res, data, meta = null) => {
  const response = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId: getRequestId(res)
  };
  
  if (meta) {
    response.meta = meta;
  }
  
  res.status(200).json(response);
};

export const created = (res, data, meta = null) => {
  const response = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId: getRequestId(res)
  };
  
  if (meta) {
    response.meta = meta;
  }
  
  res.status(201).json(response);
};

export const noContent = (res) => {
  res.status(204).send();
};

/**
 * Envía una respuesta HTTP de fallo/error.
 * @param {object} res - Objeto de respuesta de Express.
 * @param {number} status - Código de estado HTTP (ej. 400, 403, 500).
 * @param {string} code - Código de error interno (ej. 'ERR.VALIDATION_FAILED').
 * @param {string} message - Mensaje legible del error.
 * @param {object} meta - Metadatos adicionales (ej. detalles de validación).
 */
export const fail = (res, status, code, message, meta = null) => {
  const errorResponse = {
    success: false,
    error: {
      code,
      message,
    },
    timestamp: new Date().toISOString(),
    requestId: getRequestId(res)
  };
  
  if (meta) {
    errorResponse.error.meta = meta;
  }
  
  res.status(status).json(errorResponse);
};